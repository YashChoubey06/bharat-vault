import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from sqlalchemy import inspect, text
from alembic import command
from alembic.config import Config
from . import store as db
from .testing import test_database


class MigrationTest(unittest.TestCase):
    def test_existing_schema_upgrade_preserves_data_and_audit(self):
        with tempfile.TemporaryDirectory(prefix='bharat-migration-') as directory:
            target, cleanup = test_database(Path(directory))
            try:
                with patch.dict(os.environ, {'BHARAT_DATABASE_URL':target}):
                    config=Config(str(db.ROOT.parent/'alembic.ini'))
                    with db.get_engine().begin() as con:
                        config.attributes['connection']=con
                        command.upgrade(config,'0001_existing_mvp')
                    with db.transaction() as con:
                        db.put(con,'parcel',dict(id='KEEP',owner='Original value'))
                        db.audit(con,'test','BEFORE_MIGRATION','KEEP','Preserve this exact audit event')
                        before=db.verify_audit(con)
                    db.initialize()
                    db.initialize()
                    with db.transaction() as con:
                        self.assertEqual(db.get(con,'parcel','KEEP')['owner'],'Original value')
                        self.assertEqual(db.verify_audit(con),before)
                        revision=con.execute('SELECT version_num FROM alembic_version').first()['version_num']
                        self.assertEqual(revision,'0002_evidence_resolution')
                    columns={c['name']:str(c['type']) for c in inspect(db.get_engine()).get_columns('source_records')}
                    self.assertIn(columns['raw_data'],('JSON','JSONB'))
                    if db.get_engine().dialect.name=='postgresql': self.assertEqual(columns['raw_data'],'JSONB')
            finally: cleanup()

if __name__=='__main__': unittest.main(verbosity=2)
