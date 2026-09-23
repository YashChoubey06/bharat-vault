"""Copy the stopped MVP database into an empty PostgreSQL database, verify, then activate."""
import argparse
import json
import os
from pathlib import Path
import sqlite3
from datetime import datetime
from dotenv import set_key
from sqlalchemy import select, func, text
from . import store as db, models


def migrate(activate=False):
    target = os.getenv('BHARAT_POSTGRES_URL')
    if not target or not target.startswith('postgresql+psycopg://'):
        raise RuntimeError('Run backend.setup_postgres or configure BHARAT_POSTGRES_URL privately first.')
    source_path = db.DATA / 'bharat.sqlite3'
    if not source_path.exists(): raise RuntimeError('Existing SQLite database not found.')
    backup_dir = db.DATA / 'backups'
    backup_dir.mkdir(exist_ok=True)
    backup_path = backup_dir / ('before-postgres-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.sqlite3')
    with sqlite3.connect('file:' + source_path.as_posix() + '?mode=ro', uri=True) as source:
        with sqlite3.connect(backup_path) as backup: source.backup(backup)
    previous = os.environ.get('BHARAT_DATABASE_URL')
    os.environ['BHARAT_DATABASE_URL'] = target
    try:
        db.initialize()
        with sqlite3.connect('file:' + backup_path.as_posix() + '?mode=ro', uri=True) as source, db.transaction() as destination:
            source.row_factory = sqlite3.Row
            counts = {}
            available = {r[0] for r in source.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            for table in models.CORE + models.EVIDENCE:
                if destination.raw.execute(select(func.count()).select_from(table)).scalar():
                    raise RuntimeError('Target database is not empty; no data was overwritten.')
            for table in models.CORE + models.EVIDENCE:
                if table.name not in available: continue
                rows = [dict(row) for row in source.execute('SELECT * FROM ' + table.name)]
                for row in rows:
                    for column in table.columns:
                        if isinstance(column.type, models.sa.JSON) and isinstance(row.get(column.name), str):
                            row[column.name] = json.loads(row[column.name])
                if rows: destination.raw.execute(table.insert(), rows)
                actual = destination.raw.execute(select(func.count()).select_from(table)).scalar()
                if actual != len(rows): raise RuntimeError('Migration count mismatch for ' + table.name)
                counts[table.name] = actual
            integrity = db.verify_audit(destination)
            if not integrity['valid']: raise RuntimeError('Audit integrity check failed; migration rolled back.')
            destination.raw.execute(text("SELECT setval(pg_get_serial_sequence('audit','seq'), COALESCE(MAX(seq),1), COUNT(*)>0) FROM audit"))
        print('Copied and verified:', counts)
        print('Audit chain verified:', integrity['checked'], 'events. Original SQLite and backup retained.')
        if activate:
            set_key(db.ROOT / '.env', 'BHARAT_DATABASE_URL', target)
            set_key(db.ROOT / '.env', 'BHARAT_SOURCE_MODE', 'mock')
            print('Activated PostgreSQL and explicitly labeled synthetic source mode.')
    finally:
        if previous is None: os.environ.pop('BHARAT_DATABASE_URL',None)
        else: os.environ['BHARAT_DATABASE_URL'] = previous


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--activate',action='store_true')
    migrate(parser.parse_args().activate)
