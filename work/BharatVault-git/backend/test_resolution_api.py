"""Integration tests for authenticated resolution, officer decisions and provenance."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import select
from . import store as db, models
from .main import app
from .testing import test_database


class ResolutionAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix='bharat-api-')
        cls.old_data=db.DATA
        db.DATA=Path(cls.temp.name)
        target, cls.cleanup_database = test_database(db.DATA)
        cls.env=patch.dict(os.environ,{'BHARAT_DATABASE_URL':target,
            'BHARAT_SOURCE_MODE':'disabled','BHARAT_BOOTSTRAP_PASSWORD':'integration-password'})
        cls.env.start()
        cls.client=TestClient(app)
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None,None,None)
        cls.env.stop(); db.DATA=cls.old_data; cls.cleanup_database(); cls.temp.cleanup()

    def login(self, role='officer'):
        self.client.cookies.clear()
        r=self.client.post('/api/v1/auth/login',json=dict(email=role+'@bharatvault.gov',password='integration-password'))
        self.assertEqual(r.status_code,200,r.text)

    def resolve(self, scenario='consistent', parcel='PRC-001'):
        r=self.client.post('/api/v1/validation/run',json=dict(parcelId=parcel,sourceMode='mock',scenario=scenario))
        self.assertEqual(r.status_code,200,r.text)
        return r.json()

    def test_scope_and_role(self):
        self.client.cookies.clear()
        self.assertEqual(self.client.get('/api/v1/validation/PRC-001/sources').status_code,401)
        self.login('operator')
        self.assertEqual(self.client.post('/api/v1/validation/run',json=dict(parcelId='PRC-001')).status_code,403)
        self.login()
        with db.transaction() as con:
            p=db.get(con,'parcel','PRC-004'); p['village']['district']='Elsewhere'; db.put(con,'parcel',p)
        self.assertEqual(self.client.get('/api/v1/validation/PRC-004/evidence').status_code,403)

    def test_health_reports_a_database_outage(self):
        with patch('backend.store.transaction',side_effect=RuntimeError('database unavailable')):
            self.assertEqual(self.client.get('/api/v1/health').status_code,503)

    def test_assistant_explains_the_resolution_run(self):
        self.login()
        result=self.resolve('owner_conflict')
        response=self.client.post('/api/v1/assistant/query',json=dict(parcelId='PRC-001',question='Why is the owner in conflict?'))
        self.assertEqual(response.status_code,200,response.text)
        self.assertIn('Conflicting values',response.json()['answer'])
        self.assertTrue(all(s['runId']==result['runId'] for s in response.json()['sources']))

    def test_resolution_provenance_and_legacy_routes(self):
        self.login()
        result=self.resolve()
        self.assertEqual(self.client.get('/api/v1/parcels/PRC-001/validation').json()['runId'],result['runId'])
        evidence=self.client.get('/api/v1/validation/PRC-001/evidence').json()
        self.assertGreater(len(evidence['records']),2)
        self.assertTrue(all(r['simulated'] for r in evidence['records']))
        self.assertTrue(evidence['claims'])
        for section in ('sources','resolution','checks','conflicts','queries','history'):
            self.assertEqual(self.client.get('/api/v1/validation/PRC-001/'+section).status_code,200)
        snapshot=self.client.get('/api/v1/validation/PRC-001/runs/'+result['runId']).json()
        self.assertEqual(snapshot['runId'],result['runId'])
        self.assertEqual(self.client.post('/api/v1/validation/run',json=dict(parcelId='PRC-001',scenario='invented')).status_code,422)

    def test_officer_resolution_is_separate_and_versioned(self):
        self.login()
        result=self.resolve('owner_conflict')
        conflict=next(c for c in result['conflicts'] if c['type']=='OWNER_MISMATCH')
        chosen=conflict['sources'][0]['id']
        url=f"/api/v1/validation/PRC-001/conflicts/{conflict['id']}/resolve"
        body=dict(runId='old-run',selectedEvidenceId=chosen,notes='Reviewed all source documents.')
        self.assertEqual(self.client.post(url,json=body).status_code,409)
        body['runId']=result['runId']
        decision=self.client.post(url,json=body)
        self.assertEqual(decision.status_code,200,decision.text)
        self.assertEqual(decision.json()['status'],'RESOLVED_BY_OFFICER')
        original=self.client.get('/api/v1/validation/PRC-001/runs/'+result['runId']).json()
        self.assertEqual(next(c for c in original['conflicts'] if c['id']==conflict['id'])['status'],'OPEN')
        repeated=self.resolve('owner_conflict')
        self.assertEqual(next(c for c in repeated['conflicts'] if c['type']=='OWNER_MISMATCH')['status'],'RESOLVED_BY_OFFICER')
        with db.transaction() as con:
            self.assertTrue(db.verify_audit(con)['valid'])
            self.assertEqual(len(con.execute(select(models.review_resolutions)).all()),1)

    def test_document_approval_is_conditional(self):
        self.login()
        with db.transaction() as con:
            p=db.get(con,'parcel','PRC-003'); p.pop('gis',None); db.put(con,'parcel',p)
            db.save_document(con,dict(id='DECISION-DOC',parcelId='PRC-003',fileName='review.pdf',uploadedAt=db.now(),ocrStatus='COMPLETED'))
            for field,value in [('owner_name','Kavita Devi'),('survey_number','126/2'),('area','0.82 ha')]:
                db.save_field(con,dict(id='DECISION-'+field,documentId='DECISION-DOC',parcelId='PRC-003',field=field,
                    value=value,originalValue=value,normalizedValue=value,source='review.pdf',sourceType='Current RoR',page=1,
                    confidence=99,lowConfidence=False,reviewStatus='VERIFIED',version=1))
        self.resolve('exhausted',parcel='PRC-003')
        response=self.client.post('/api/v1/verification/CASE-PRC-003/decision',json=dict(decision='VERIFIED',notes='Sources reviewed; external evidence unavailable.'))
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(response.json()['status'],'CONDITIONAL_REVIEWED')
        self.assertNotEqual(response.json()['externalVerification'],'CORROBORATED')

if __name__=='__main__': unittest.main(verbosity=2)
