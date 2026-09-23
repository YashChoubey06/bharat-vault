"""Lossless claims: original values and semantic roles survive normalization."""
import math
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from ..intelligence import normalize

DOCUMENT_FACTS = {
    'owner_name': 'current_holder', 'buyer': 'registered_buyer', 'seller': 'transferor',
    'survey_number': 'parcel_identity', 'gis_area': 'mapped_area',
    'land_classification': 'land_type',
}
AREA_FACTS = {'area', 'mapped_area'}
SOURCE_FIELDS = {
    'ROR': {'holder_name': 'current_holder', 'khasra_no': 'parcel_identity', 'recorded_area': 'area',
            'ownership_share': 'ownership_share', 'land_category': 'land_type', 'khata_no': 'khata_number',
            'mutation_ref': 'mutation_number', 'mutation_state': 'mutation_status'},
    'REGISTRATION': {'purchaser_name': 'registered_buyer', 'vendor_name': 'transferor',
                     'property_khasra': 'parcel_identity', 'deed_area': 'area', 'registration_no': 'registration_number',
                     'registration_date': 'registration_date', 'mutation_ref': 'mutation_number', 'mutation_state': 'mutation_status'},
    'MUTATION': {'new_owner_name': 'new_owner', 'previous_owner_name': 'previous_owner',
                 'khasra_no': 'parcel_identity', 'mutation_no': 'mutation_number', 'status': 'mutation_status',
                 'mutation_date': 'mutation_date', 'ownership_share': 'ownership_share'},
    'CADASTRAL': {'survey_ref': 'parcel_identity', 'mapped_area': 'mapped_area', 'geometry': 'parcel_geometry'},
    'COURT': {'case_number': 'case_number', 'case_status': 'case_status', 'filing_date': 'filing_date',
              'dispute_type': 'dispute_type', 'property_khasra': 'parcel_identity'},
    'TAX': {'revenue_status': 'revenue_status', 'tax_record': 'tax_reference', 'property_khasra': 'parcel_identity'},
}


def canonical(fact, value):
    if fact in AREA_FACTS:
        result = normalize('area', value)
        return result if result is not None and math.isfinite(result) and result > 0 else None
    if fact == 'parcel_geometry':
        if not isinstance(value, dict) or value.get('type') not in ('Polygon', 'MultiPolygon') or not value.get('coordinates'):
            return None
        return value
    if fact == 'ownership_share':
        try:
            parts = str(value).split('/')
            share = Decimal(parts[0]) / Decimal(parts[1]) if len(parts) == 2 else Decimal(str(value))
            return float(share) if share.is_finite() and 0 < share <= 1 else None
        except (InvalidOperation, ZeroDivisionError):
            return None
    if isinstance(value, (list, dict)) or isinstance(value, bool):
        return None
    return normalize('survey_number' if fact == 'parcel_identity' else fact, value) if str(value).strip() else None


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed
    except (ValueError, TypeError):
        return None


def source_claims(source_type, record):
    claims = []
    values = record['values']
    for key, fact in SOURCE_FIELDS[source_type].items():
        if key in values and values[key] is not None:
            claims.append(dict(fact=fact, value=values[key], normalizedValue=canonical(fact, values[key]), role=fact))
    for fact in ('village', 'tehsil', 'district'):
        if values.get(fact):
            claims.append(dict(fact=fact, value=values[fact], normalizedValue=canonical(fact, values[fact]), role='location'))
    # A buyer is not inherently the current holder. Only an explicitly effective,
    # current ownership reference can corroborate that separate proposition.
    owner_key = {'REGISTRATION': 'purchaser_name', 'MUTATION': 'new_owner_name'}.get(source_type)
    effective = (source_type == 'REGISTRATION' and values.get('transfer_effective') is True) or (
        source_type == 'MUTATION' and str(values.get('status', '')).upper() == 'APPROVED')
    if owner_key and values.get(owner_key) and values.get('current_ownership_reference') is True and effective:
        value = values[owner_key]
        claims.append(dict(fact='current_holder', value=value, normalizedValue=canonical('current_holder', value),
                           role='effective_current_ownership_reference'))
    return claims


def document_claims(fields):
    claims = []
    for f in fields:
        fact = DOCUMENT_FACTS.get(f['field'], f['field'])
        historical = 'historical' in f.get('sourceType', '').lower()
        if historical and fact == 'current_holder':
            fact = 'previous_owner'
        claims.append(dict(id=f['id'], fact=fact, value=f['value'], normalizedValue=canonical(fact, f['value']),
                           source=f['source'], sourceType='DOCUMENT', documentId=f['documentId'],
                           fieldId=f['id'], page=f['page'], bbox=f.get('bbox'), extractionId=f['id'],
                           extractedAt=f.get('extractedAt'), extractionConfidence=f.get('confidence', 0) / 100,
                           reviewed=f.get('reviewStatus') == 'VERIFIED', flagged=f.get('reviewStatus') == 'FLAGGED',
                           lowConfidence=f.get('lowConfidence', False), role=fact, originalValue=f.get('originalValue'),
                           version=f.get('version', 1), simulated=False))
    return claims
