"""Engine acceptance cases. Use a temporary database; never touch local demonstration data."""
import asyncio
import hashlib
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from sqlalchemy import select
from . import store as db, models
from .resolution.engine import run
from .resolution.mock_sources import mock_adapters, MockRORAdapter, MockRegistrationAdapter
from .resolution.contracts import Capabilities
from .resolution.normalization import canonical
from .testing import test_database


class ResolutionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='bharat-resolution-')
        self.original_data = db.DATA
        db.DATA = Path(self.temp.name)
        target, self.cleanup_database = test_database(db.DATA)
        self.env = patch.dict(os.environ, {'BHARAT_DATABASE_URL':target, 'BHARAT_SOURCE_MODE':'disabled'})
        self.env.start()
        db.initialize()
        with db.transaction() as con:
            db.put(con, 'parcel', dict(id='P', surveyNumber='124/3', currentRecordedOwner='Suresh Kumar', recordedArea=2.5,
                village=dict(name='Rampura', tehsil='Ladpura', district='Kota', state='Rajasthan')))
            self.add_document(con, 'D1')

    def tearDown(self):
        self.env.stop()
        db.DATA = self.original_data
        self.cleanup_database()
        self.temp.cleanup()

    def add_document(self, con, doc_id, owner='Suresh Kumar', area='2.50 ha'):
        db.save_document(con, dict(id=doc_id, parcelId='P', fileName=doc_id+'.pdf', documentType='Current RoR',
            ocrStatus='COMPLETED', uploadedAt=db.now()))
        for name, value in [('owner_name',owner),('area',area),('survey_number','124/3')]:
            db.save_field(con, dict(id=doc_id+name, documentId=doc_id, parcelId='P', field=name, value=value,
                originalValue=value, source=doc_id+'.pdf', sourceType='Current RoR', page=1, bbox=[0,0,100,20],
                confidence=96, lowConfidence=False, reviewStatus='VERIFIED', version=1, extractedAt=db.now()))

    def execute(self, scenario='consistent', **kwargs):
        with db.transaction() as con: return run(con, 'P', mode='mock', scenario=scenario, timeout=.03, **kwargs)

    def check(self, result, field): return next(c for c in result['checks'] if c['field']==field)

    def test_all_sources_available(self):
        result = self.execute()
        self.assertEqual(result['externalResolution']['status'], 'RESOLVED')
        self.assertEqual(result['externalResolution']['externalVerification'], 'SIMULATED')
        self.assertFalse(result['externalResolution']['documentModeActivated'])
        self.assertEqual(self.check(result,'current_holder')['status'],'MATCH')
        self.assertTrue(self.check(result,'current_holder')['corroborated'])
        self.assertEqual(next(s for s in result['sources'] if s['sourceType']=='COURT')['status'],'NOT_APPLICABLE')

    def test_one_failure_does_not_trigger_fallback(self):
        for scenario in ('ror_unavailable','mutation_unavailable'):
            with self.subTest(scenario=scenario):
                result=self.execute(scenario)
                self.assertTrue(self.check(result,'current_holder')['externalSufficient'])
                self.assertFalse(result['externalResolution']['documentModeActivated'])
                self.assertEqual(result['risk']['score'],0)

    def test_multiple_failures_keep_partial_evidence(self):
        result=self.execute('multiple_unavailable')
        self.assertEqual(result['externalResolution']['status'],'PARTIALLY_RESOLVED')
        self.assertFalse(self.check(result,'current_holder')['externalSufficient'])
        self.assertTrue(result['externalResolution']['documentModeActivated'])
        self.assertEqual(result['externalResolution']['acquisitionStatus'],'EXHAUSTED')
        self.assertLessEqual(result['risk']['score'],15)

    def test_missing_record_is_not_outage(self):
        result=self.execute('not_found')
        source=next(s for s in result['sources'] if s['sourceType']=='ROR')
        self.assertEqual(source['status'],'RECORD_NOT_FOUND')
        self.assertEqual(source['attempts'],1)
        self.assertFalse(result['externalResolution']['documentModeActivated'])

    def test_unverified_stale_and_malformed_preserve_raw(self):
        for scenario, state in [('unverified','UNVERIFIED'),('stale','STALE'),('malformed','INVALID_RESPONSE')]:
            with self.subTest(scenario=scenario):
                result=self.execute(scenario)
                self.assertEqual(next(s for s in result['sources'] if s['sourceType']=='ROR')['status'],state)
                with db.transaction() as con:
                    row=con.execute(select(models.source_records).where(models.source_records.c.run_id==result['runId'],models.source_records.c.source_type=='ROR')).first()
                    self.assertEqual(hashlib.sha256(db.encode(row['raw_data']).encode()).hexdigest(),row['data_hash'])
                    self.assertFalse(row['metadata']['usable'])

    def test_timeout_bounded_and_retried(self):
        result=self.execute('timeout')
        source=next(s for s in result['sources'] if s['sourceType']=='ROR')
        self.assertEqual(source['status'],'TIMEOUT')
        self.assertEqual(source['attempts'],2)
        self.assertFalse(result['externalResolution']['documentModeActivated'])

    def test_retry_success_retains_failed_attempt(self):
        result=self.execute('retry')
        with db.transaction() as con:
            rows=con.execute(select(models.source_queries).where(models.source_queries.c.run_id==result['runId'],models.source_queries.c.source_type=='ROR')).all()
        self.assertEqual([r['status'] for r in sorted(rows,key=lambda r:r['attempt'])],['TEMPORARILY_UNAVAILABLE','RECORD_FOUND'])

    def test_majority_does_not_hide_owner_conflict(self):
        result=self.execute('owner_conflict')
        self.assertEqual(self.check(result,'current_holder')['status'],'CONFLICT')
        conflict=next(c for c in result['conflicts'] if c['field']=='current_holder')
        self.assertEqual({s['normalizedValue'] for s in conflict['sources']},{'suresh kumar','shyam lal'})
        self.assertTrue(result['verification']['required'])

    def test_area_khasra_gis_conflicts(self):
        for scenario, kind in [('area_conflict','AREA_MISMATCH'),('khasra_conflict','KHASRA_MISMATCH'),('gis_conflict','GIS_TEXT_MISMATCH')]:
            with self.subTest(scenario=scenario):
                result=self.execute(scenario,requested=['mapped_area'])
                self.assertTrue(any(c['type']==kind for c in result['conflicts']))

    def test_document_only_consistent_is_not_verified(self):
        with db.transaction() as con: self.add_document(con,'D2')
        result=self.execute('exhausted')
        self.assertEqual(result['externalResolution']['status'],'EXHAUSTED')
        self.assertEqual(result['documentConsistency'],'CONSISTENT')
        self.assertNotEqual(result['externalResolution']['externalVerification'],'CORROBORATED')
        self.assertTrue(result['verification']['required'])
        self.assertLessEqual(result['validationConfidence'],.45)

    def test_document_only_conflict(self):
        with db.transaction() as con: self.add_document(con,'D2',owner='Another Owner')
        result=self.execute('exhausted')
        self.assertEqual(result['documentConsistency'],'CONFLICT')
        self.assertEqual(self.check(result,'current_holder')['status'],'CONFLICT')

    def test_identifier_insufficient_no_blind_search(self):
        with db.transaction() as con:
            p=db.get(con,'parcel','P'); p['village']['tehsil']=''; db.put(con,'parcel',p)
        result=self.execute()
        self.assertEqual(result['externalResolution']['sourcesAttempted'],0)
        self.assertTrue(any(s['status']=='IDENTIFIER_INSUFFICIENT' for s in result['sources']))
        self.assertEqual(result['externalResolution']['resolvedEvidenceCount'],0)

    def test_partial_record_other_sources_resolve(self):
        result=self.execute('partial')
        self.assertTrue(self.check(result,'area')['externalSufficient'])
        self.assertEqual(self.check(result,'area')['status'],'MATCH')

    def test_access_denied_no_retries(self):
        result=self.execute('access_denied')
        source=next(s for s in result['sources'] if s['sourceType']=='ROR')
        self.assertEqual(source['status'],'ACCESS_DENIED')
        self.assertEqual(source['attempts'],1)

    def test_buyer_is_not_automatically_current_owner(self):
        adapter=MockRegistrationAdapter()
        response=asyncio.run(adapter.search_record(dict(survey_number='124/3',village='Rampura',tehsil='Ladpura',district='Kota')))
        response.records[0]['values']['current_ownership_reference']=False
        self.assertFalse(any(c['fact']=='current_holder' for c in adapter.normalize_record(response.records[0])))

    def test_raw_canonical_and_audit_are_append_only(self):
        result=self.execute()
        with db.transaction() as con:
            self.assertTrue(db.verify_audit(con)['valid'])
            self.assertGreater(len(con.execute(select(models.canonical_claims).where(models.canonical_claims.c.run_id==result['runId'])).all()),3)
        for table in ['source_records','source_queries','canonical_claims','validation_runs','audit']:
            with self.subTest(table=table), self.assertRaises(Exception):
                with db.transaction() as con: con.execute('DELETE FROM '+table)

    def test_repeat_runs_keep_history(self):
        first=self.execute(); second=self.execute('owner_conflict')
        with db.transaction() as con:
            self.assertEqual(len(con.execute(select(models.validation_runs)).all()),2)
            old=con.execute(select(models.validation_runs).where(models.validation_runs.c.id==first['runId'])).first()
            self.assertEqual(old['snapshot']['conflicts'],[])
            self.assertNotEqual(first['runId'],second['runId'])

    def test_unrecognized_regional_units_and_identity(self):
        self.assertIsNone(canonical('area','2 bigha'))
        self.assertEqual(canonical('area','२५००० वर्ग मीटर'),2.5)
        self.assertNotEqual(canonical('parcel_identity','123/2'),canonical('parcel_identity','123/3'))

    def test_no_duplicate_provider_votes(self):
        class SameOrigin(MockRORAdapter):
            def get_capabilities(self):
                cap=super().get_capabilities()
                return Capabilities(cap.facts, independence_group='same-origin')
        one, two=SameOrigin(),SameOrigin(); two.source_system='mirror-ror'
        result=self.execute(adapters=[one,two])
        self.assertFalse(self.check(result,'current_holder')['externalSufficient'])

    def test_unresolved_sources_do_not_invent_external_records(self):
        result=self.execute('exhausted')
        with db.transaction() as con: self.assertEqual(con.execute(select(models.source_records)).all(),[])
        self.assertTrue(result['externalResolution']['documentModeActivated'])

    def test_review_recalculation_preserves_requested_source_context(self):
        first=self.execute('owner_conflict',requested=['case_status'])
        with db.transaction() as con: second=run(con,'P',timeout=.03)
        self.assertEqual(second['scenario'],'owner_conflict')
        self.assertIn('case_status',second['requestedFacts'])
        self.assertEqual(self.check(second,'current_holder')['status'],'CONFLICT')

    def test_incomplete_query_budget_never_activates_document_mode(self):
        with db.transaction() as con:
            for index in range(35):
                db.save_field(con,dict(id=f'VARIANT-{index}',documentId='D1',parcelId='P',field='survey_number',
                    value=f'900/{index}',originalValue=f'900/{index}',source='D1.pdf',sourceType='Current RoR',page=1,
                    confidence=90,lowConfidence=False,reviewStatus='PENDING',version=1))
        result=self.execute(adapters=[MockRORAdapter()])
        self.assertEqual(result['externalResolution']['acquisitionStatus'],'INCOMPLETE')
        self.assertFalse(result['externalResolution']['documentModeActivated'])

    def test_source_specific_reference_can_resolve_without_survey(self):
        adapter=MockRegistrationAdapter()
        result=asyncio.run(adapter.search_record(dict(registration_number='reg-124-3')))
        self.assertEqual(result.status,'RECORD_FOUND')
        self.assertEqual(result.records[0]['values']['property_khasra'],'124/3')

if __name__=='__main__': unittest.main(verbosity=2)
