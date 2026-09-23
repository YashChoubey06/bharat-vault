"""Synthetic source fixtures independent of uploaded values. Never a government connection."""
import asyncio
from copy import deepcopy
from .contracts import Capabilities, SourceAdapter, SourceResponse, SourceState
from .normalization import source_claims, timestamp

SCENARIOS = {
    'consistent': 'All simulated sources agree',
    'ror_unavailable': 'RoR unavailable; alternative sources remain available',
    'mutation_unavailable': 'Mutation unavailable; reference records corroborate',
    'multiple_unavailable': 'RoR and registration unavailable',
    'unverified': 'Retrieved RoR is unverified',
    'not_found': 'RoR service responds but finds no record',
    'owner_conflict': 'Mutation names a different current holder',
    'area_conflict': 'Deed area differs from RoR',
    'khasra_conflict': 'RoR returns a different khasra',
    'gis_conflict': 'Mapped area differs from textual area',
    'stale': 'RoR is outside its freshness window',
    'exhausted': 'All applicable simulated external sources unavailable',
    'timeout': 'RoR exceeds the query deadline',
    'retry': 'RoR succeeds on its second attempt',
    'malformed': 'RoR returns a malformed payload',
    'access_denied': 'RoR refuses access',
    'partial': 'RoR omits its area field',
    'court_dispute': 'A pending case requires review',
}

# Fixed fixtures keyed by jurisdiction and cadastral identifiers, never by OCR output.
PARCELS = {
    '124/3': ('Suresh Kumar', '2.50 hectare', 'KH-782'),
    '125/1': ('Mohan Kumar', '1.80 hectare', 'KH-783'),
    '126/2': ('Kavita Devi', '0.82 hectare', 'KH-784'),
    '127/4': ('Ramesh Chand', '3.10 hectare', 'KH-785'),
}


class MockSourceAdapter(SourceAdapter):
    simulated = True
    source_type = 'ROR'

    def __init__(self, scenario='consistent'):
        if scenario not in SCENARIOS:
            raise ValueError('Unknown mock scenario')
        self.scenario = scenario
        self.calls = 0
        self.source_system = 'mock-' + self.source_type.lower()

    def get_capabilities(self):
        facts = {
            'ROR': {'parcel_identity', 'current_holder', 'ownership_share', 'area', 'land_type', 'khata_number', 'village', 'tehsil', 'district', 'mutation_number', 'mutation_status'},
            'REGISTRATION': {'parcel_identity', 'current_holder', 'registered_buyer', 'transferor', 'area', 'registration_number', 'registration_date', 'mutation_number', 'mutation_status'},
            'MUTATION': {'parcel_identity', 'current_holder', 'previous_owner', 'new_owner', 'ownership_share', 'mutation_number', 'mutation_status', 'mutation_date'},
            'CADASTRAL': {'parcel_identity', 'mapped_area', 'parcel_geometry'},
            'COURT': {'parcel_identity', 'case_number', 'case_status', 'filing_date', 'dispute_type'},
            'TAX': {'parcel_identity', 'revenue_status', 'tax_reference'},
        }[self.source_type]
        identifiers = (('survey_number','village','tehsil','district'),)
        reference = {'REGISTRATION':'registration_number','MUTATION':'mutation_number','COURT':'case_number'}.get(self.source_type)
        if reference: identifiers += ((reference,),)
        return Capabilities(frozenset(facts), independence_group=self.source_system, identifier_sets=identifiers)

    async def search_record(self, query):
        self.calls += 1
        scenario, kind = self.scenario, self.source_type
        unavailable = scenario == 'exhausted' or (scenario == 'ror_unavailable' and kind == 'ROR') or (
            scenario == 'mutation_unavailable' and kind == 'MUTATION') or (
            scenario == 'multiple_unavailable' and kind in {'ROR', 'REGISTRATION'})
        if unavailable or (scenario == 'retry' and kind == 'ROR' and self.calls == 1):
            return SourceResponse(SourceState.TEMPORARILY_UNAVAILABLE, message='Simulated source outage')
        if kind == 'ROR' and scenario == 'timeout':
            await asyncio.sleep(30)
        if kind == 'ROR' and scenario == 'access_denied':
            return SourceResponse(SourceState.ACCESS_DENIED, message='Simulated access refusal')
        if kind == 'ROR' and scenario == 'not_found':
            return SourceResponse(SourceState.RECORD_NOT_FOUND, message='Simulated source returned no matching record')
        survey = query.get('survey_number', '')
        reference = {'REGISTRATION':('registration_number','REG-'),'MUTATION':('mutation_number','MUT-'),
                     'COURT':('case_number','CASE-DEMO-')}.get(kind)
        direct = reference and query.get(reference[0])
        if direct:
            matched = next((key for key in PARCELS if (reference[1]+key.replace('/','-')).casefold()==str(direct).casefold()), None)
            if not matched or (survey and survey!=matched):
                return SourceResponse(SourceState.RECORD_NOT_FOUND, message='No synthetic record matches the supplied source reference')
            survey = matched
        if survey not in PARCELS or (not direct and any(str(query.get(k, '')).casefold() != v for k, v in (
            ('village', 'rampura'), ('tehsil', 'ladpura'), ('district', 'kota')))):
            return SourceResponse(SourceState.RECORD_NOT_FOUND, message='No synthetic fixture matches these identifiers')
        owner, area, khata = PARCELS[survey]
        ref = survey.replace('/', '-')
        values = {
            'ROR': dict(holder_name=owner, khasra_no=survey, recorded_area=area, khata_no=khata,
                        ownership_share='1/1', land_category='Agricultural', mutation_ref='MUT-' + ref,
                        mutation_state='APPROVED', village='Rampura', tehsil='Ladpura', district='Kota'),
            'REGISTRATION': dict(purchaser_name=owner, vendor_name='Historical transferor', property_khasra=survey,
                                 deed_area=area, registration_no='REG-' + ref, registration_date='2024-01-15',
                                 mutation_ref='MUT-' + ref, mutation_state='APPROVED',
                                 current_ownership_reference=True, transfer_effective=True),
            'MUTATION': dict(new_owner_name=owner, previous_owner_name='Historical transferor', khasra_no=survey,
                             mutation_no='MUT-' + ref, status='APPROVED', mutation_date='2024-02-15',
                             current_ownership_reference=True, ownership_share='1/1'),
            'CADASTRAL': dict(survey_ref=survey, mapped_area=area,
                             geometry={'type': 'Polygon', 'coordinates': [[[75.8,25.18],[75.801,25.18],[75.801,25.181],[75.8,25.18]]]}),
            'COURT': dict(property_khasra=survey, case_number='CASE-DEMO-' + ref, case_status='PENDING',
                          filing_date='2024-03-01', dispute_type='Boundary dispute'),
            'TAX': dict(property_khasra=survey, tax_record='TAX-' + ref, revenue_status='PAID'),
        }[kind]
        if scenario == 'owner_conflict' and kind == 'MUTATION': values['new_owner_name'] = 'Shyam Lal'
        if scenario == 'area_conflict' and kind == 'REGISTRATION': values['deed_area'] = '2.20 hectare'
        if scenario == 'gis_conflict' and kind == 'CADASTRAL': values['mapped_area'] = '3.90 hectare'
        if scenario == 'khasra_conflict' and kind == 'ROR': values['khasra_no'] = '999/9'
        if scenario == 'partial' and kind == 'ROR': values.pop('recorded_area')
        record = dict(external_record_id=f'{kind}-{ref}', values=values, source_version='synthetic-v1',
                      # Fixture freshness is deliberate and disclosed, not a fabricated retrieval date.
                      updated_at='2026-09-01T00:00:00+00:00', verification_status='VERIFIED')
        if kind == 'ROR' and scenario == 'unverified': record['verification_status'] = 'UNVERIFIED'
        if kind == 'ROR' and scenario == 'stale': record['updated_at'] = '2001-01-01T00:00:00+00:00'
        if kind == 'ROR' and scenario == 'malformed': record['values'] = 'invalid simulated record'
        return SourceResponse(SourceState.RECORD_FOUND, [deepcopy(record)])

    async def fetch_record(self, identifier):
        for survey in PARCELS:
            if identifier == f"{self.source_type}-{survey.replace('/', '-')}":
                return await self.search_record(dict(survey_number=survey, village='Rampura', tehsil='Ladpura', district='Kota'))
        return SourceResponse(SourceState.RECORD_NOT_FOUND)

    def validate_response(self, record):
        if not isinstance(record, dict) or not isinstance(record.get('values'), dict) or not record.get('external_record_id'):
            raise ValueError('Malformed source record')
        if record.get('verification_status') not in {'VERIFIED', 'UNVERIFIED'} or timestamp(record.get('updated_at')) is None:
            raise ValueError('Missing source verification or freshness metadata')

    def normalize_record(self, record):
        return source_claims(self.source_type, record)


class MockRORAdapter(MockSourceAdapter): source_type = 'ROR'
class MockRegistrationAdapter(MockSourceAdapter): source_type = 'REGISTRATION'
class MockMutationAdapter(MockSourceAdapter): source_type = 'MUTATION'
class MockCadastralAdapter(MockSourceAdapter): source_type = 'CADASTRAL'
class MockCourtAdapter(MockSourceAdapter): source_type = 'COURT'
class MockTaxAdapter(MockSourceAdapter): source_type = 'TAX'


def mock_adapters(scenario):
    return [cls(scenario) for cls in (MockRORAdapter, MockRegistrationAdapter, MockMutationAdapter,
                                     MockCadastralAdapter, MockCourtAdapter, MockTaxAdapter)]
