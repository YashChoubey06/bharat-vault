"""Determine facts and usable query paths before acquiring any source evidence."""
from .contracts import Requirement
from .normalization import canonical, document_claims

BASE_FACTS = ('parcel_identity', 'current_holder', 'area')
SUPPORTED_FACTS = frozenset((*BASE_FACTS, 'registered_buyer', 'transferor', 'new_owner', 'previous_owner',
    'ownership_share', 'mapped_area', 'parcel_geometry', 'khata_number', 'land_type', 'village', 'tehsil', 'district',
    'mutation_number', 'mutation_status', 'mutation_date', 'registration_number', 'registration_date',
    'case_number', 'case_status', 'filing_date', 'dispute_type', 'revenue_status', 'tax_reference'))


def requirements(parcel, fields, requested=None):
    claims = document_claims(fields)
    facts = {c['fact'] for c in claims} & SUPPORTED_FACTS
    facts.update(BASE_FACTS)
    if any(c['fact'] == 'current_holder' for c in claims): facts.add('ownership_share')
    reasons = {fact: 'Validate an extracted claim or parcel identity.' for fact in facts}
    if parcel.get('gis') or 'mapped_area' in facts:
        facts.add('mapped_area')
        reasons['mapped_area'] = 'Compare applicable cadastral area with textual evidence.'
    if any('mutation' in f.get('sourceType', '').lower() for f in fields):
        facts.update(('mutation_number', 'mutation_status'))
    if any('registration' in f.get('sourceType', '').lower() for f in fields):
        facts.add('registration_number')
    if parcel.get('courtCase'):
        facts.add('case_status')
        reasons['case_status'] = 'A parcel dispute reference requires legal evidence.'
    for fact in requested or []:
        if fact not in SUPPORTED_FACTS:
            raise ValueError('Unsupported requested evidence: ' + fact)
        facts.add(fact)
        reasons[fact] = 'Explicitly requested verification.'
    return [Requirement(fact, reasons.get(fact, 'Document type requires this linkage.'), 2 if fact == 'current_holder' else 1)
            for fact in sorted(facts)]


def query_variants(parcel, fields):
    location = parcel.get('village') or {}
    base = {'survey_number': parcel.get('surveyNumber'), 'village': location.get('name'),
            'tehsil': location.get('tehsil'), 'district': location.get('district'), 'jurisdiction': location.get('state')}
    variants = [base]
    docs = {}
    keys = {'survey_number', 'village', 'tehsil', 'district', 'registration_number', 'mutation_number', 'case_number'}
    for f in fields:
        if f['field'] in keys:
            docs.setdefault(f['documentId'], {}).setdefault(f['field'], set()).add(f['value'])
    for values in docs.values():
        candidate = dict(base)
        candidate.update({key: next(iter(items)) for key, items in values.items() if len(items) == 1})
        variants.append(candidate)
        for key, items in values.items():
            if len(items) > 1:
                variants.extend(dict(candidate, **{key: item}) for item in sorted(items))
    unique = []
    for variant in variants:
        normalized = {k: canonical('parcel_identity' if k == 'survey_number' else k, v)
                      for k, v in variant.items() if v is not None and str(v).strip()}
        if normalized not in unique: unique.append(normalized)
    return unique


def plan(adapters, required, variants):
    result = []
    wanted = {r.fact for r in required}
    for adapter in adapters:
        capability = adapter.get_capabilities()
        facts = wanted & capability.facts
        relevant = bool(facts)
        if adapter.source_type == 'COURT': relevant = bool(wanted & {'case_number', 'case_status', 'filing_date', 'dispute_type'})
        if adapter.source_type == 'TAX': relevant = bool(wanted & {'revenue_status', 'tax_reference'})
        jurisdiction = [q for q in variants if q.get('jurisdiction') and
                        (not capability.jurisdictions or q['jurisdiction'] in {j.casefold() for j in capability.jurisdictions})]
        queries = [q for q in jurisdiction if any(all(q.get(key) for key in group) for group in capability.identifier_sets)]
        if not relevant:
            state, reason = 'NOT_APPLICABLE', 'No required fact calls for this source.'
        elif not any(q.get('jurisdiction') for q in variants):
            state, reason = 'IDENTIFIER_INSUFFICIENT', 'Jurisdiction is required to discover applicable source coverage.'
        elif not jurisdiction:
            state, reason = 'NOT_APPLICABLE', 'Jurisdiction is outside provider coverage.'
        elif not queries:
            state, reason = 'IDENTIFIER_INSUFFICIENT', 'No supported identifier combination is available.'
        else:
            state, reason = 'PLANNED', 'Query all distinct usable source identifiers.'
        result.append(dict(adapter=adapter, facts=sorted(facts), queries=queries[:32],
                           truncated=len(queries) > 32, status=state, reason=reason))
    # Source-specific references lead the plan; all other applicable sources remain.
    result.sort(key=lambda item: 0 if any(
        q.get('mutation_number') and item['adapter'].source_type=='MUTATION' or
        q.get('registration_number') and item['adapter'].source_type=='REGISTRATION'
        for q in item['queries']) else 1)
    return result
