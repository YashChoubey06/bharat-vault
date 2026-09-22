"""Explainable extraction and reconciliation. Evidence is never inferred from parcel fixtures."""
import os
import re
import unicodedata
from . import store as db

CONFIDENCE_THRESHOLD = float(os.getenv('OCR_CONFIDENCE_THRESHOLD', '85'))
AREA_TOLERANCE_HA = float(os.getenv('AREA_TOLERANCE_HA', '0.02'))
LABELS = {
    'owner_name': r'(?:current\s+(?:primary\s+)?owner|owner(?:\s+name)?|landowner|khatedar|खातेदार|भूमिस्वामी)',
    'buyer': r'(?:registered\s+buyer|buyer|क्रेता)',
    'seller': r'(?:seller|विक्रेता)',
    'survey_number': r'(?:survey(?:\s+(?:number|no\.?))?|khasra(?:\s+(?:number|no\.?))?|खसरा(?:\s+नंबर)?)',
    'khata_number': r'(?:khata(?:\s+(?:number|no\.?))?|खाता(?:\s+नंबर)?)',
    'area': r'(?:total\s+(?:parcel\s+)?area|recorded\s+area|plot\s+area|area|रकबा|क्षेत्रफल)',
    'gis_area': r'(?:calculated\s+gis\s+area|gis\s+area)',
    'village': r'(?:village|ग्राम|गांव)',
    'tehsil': r'(?:tehsil|तहसील)',
    'district': r'(?:district|जिला)',
    'land_classification': r'(?:land\s+classification|land\s+type|भूमि\s+प्रकार)',
    'mutation_status': r'(?:mutation\s+(?:entry\s+)?status|नामांतरण\s+स्थिति)',
    'mutation_number': r'(?:mutation\s+(?:number|no\.?|entry)|नामांतरण\s+क्रमांक)',
    'registration_number': r'(?:registration\s+(?:number|no\.?)|पंजीकरण\s+क्रमांक)',
    'registration_date': r'(?:registration\s+date|पंजीकरण\s+दिनांक)',
    'mutation_date': r'(?:mutation\s+date|नामांतरण\s+दिनांक)',
    'ownership_share': r'(?:ownership\s+share|हिस्सा)',
    'case_number': r'(?:case\s+(?:number|no\.?)|वाद\s+क्रमांक)',
    'case_status': r'(?:case\s+status|वाद\s+स्थिति)',
    'revenue_status': r'(?:revenue\s+status|tax\s+status)',
}
LABEL_NAMES = {'owner_name': 'Current Primary Owner', 'buyer': 'Registered Buyer', 'area': 'Total Parcel Area', 'gis_area': 'Calculated GIS Area', 'survey_number': 'Khasra / Survey Number', 'mutation_status': 'Mutation Entry Status'}


def normalize(field, value):
    if field == 'ownership_share':
        from fractions import Fraction
        try:
            fraction = float(Fraction(str(value)))
            return fraction if 0 < fraction <= 1 else None
        except (ValueError, ZeroDivisionError):
            return None
    value = unicodedata.normalize('NFKC', str(value))
    value = ''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in value)
    value = re.sub(r'\s+', ' ', value).strip()
    if field in {'area', 'gis_area'}:
        m = re.search(r'-?\d+(?:\.\d+)?', value.replace(',', ''))
        if not m:
            return None
        amount = float(m[0])
        if re.search(r'acre|एकड़', value, re.I):
            amount *= 0.40468564224
        elif re.search(r'(?:sq\.?\s*m|m²|square\s+met|वर्ग\s*मीटर)', value, re.I):
            amount /= 10000
        elif not re.search(r'hectare|\bha\b|हेक्टेयर', value, re.I):
            return None  # Never guess a regional area unit.
        return round(amount, 6)
    if field.endswith('_date'):
        from datetime import datetime
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
            try:
                return datetime.strptime(value, fmt).date().isoformat()
            except ValueError:
                pass
        return None
    return value.casefold()


def extract(lines, doc):
    result = []
    patterns = {name: re.compile(r'^\s*' + label + r'\s*[:=\-]\s*(.+?)\s*$', re.I) for name, label in LABELS.items()}
    for line in lines:
        for name, pattern in patterns.items():
            match = pattern.match(line['text'])
            if not match:
                continue
            value = match[1].strip()
            confidence = round(float(line.get('confidence', 0)) * 100, 1)
            normalized = normalize(name, value)
            result.append(dict(id=db.uid('EXT'), documentId=doc['id'], parcelId=doc['parcelId'], field=name,
                label=LABEL_NAMES.get(name, name.replace('_', ' ').title()), value=value, originalValue=value,
                normalizedValue=normalized, confidence=confidence, confidenceType=line.get('method', 'ocr'),
                page=line['page'], bbox=line['bbox'], pageWidth=line['pageWidth'], pageHeight=line['pageHeight'],
                source=doc['fileName'], sourceType=doc['documentType'], extractedAt=db.now(),
                modelVersion=line.get('modelVersion', 'native-pdf+label-rules-v1'), version=1,
                state='warning', reviewStatus='PENDING', validation='Awaiting officer review.',
                lowConfidence=confidence < CONFIDENCE_THRESHOLD or normalized is None,
                entityType='PARCEL', entityId=doc['parcelId'], evidenceType='SOURCE_EXTRACTION'))
            break
    return result


def classify(text):
    for kind, expression in [('Mutation Record', 'mutation|नामांतरण'), ('Registration Deed', 'sale deed|registration deed|विक्रय'), ('GIS Extract', 'cadastral|gis area'), ('Current RoR', 'record of rights|jamabandi|जमाबंदी')]:
        if re.search(expression, text, re.I):
            return kind
    return 'Unknown — Manual Review Required'


def reconcile(con, parcel_id):
    # Existing upload/review/archive callers now enter the full acquisition pipeline.
    from .resolution.engine import run
    return run(con, parcel_id)
