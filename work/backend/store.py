"""Durable local MVP storage. One transaction includes every change and its audit event."""
import hashlib
import json
import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.pool import NullPool

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env')
DATA = Path(os.getenv('BHARAT_DATA_DIR', str(ROOT / 'data'))).resolve()
_engines = {}


def database_url():
    return os.getenv('BHARAT_DATABASE_URL') or 'sqlite:///' + (DATA / 'bharat.sqlite3').as_posix()


def get_engine():
    url = database_url()
    if url not in _engines:
        if url.startswith('sqlite:'):
            DATA.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, pool_pre_ping=True, poolclass=NullPool,
                               connect_args={'timeout': 30} if url.startswith('sqlite:') else {})
        if engine.dialect.name == 'sqlite':
            @event.listens_for(engine, 'connect')
            def sqlite_settings(connection, _):
                connection.execute('PRAGMA foreign_keys=ON')
                connection.execute('PRAGMA journal_mode=WAL')
        _engines[url] = engine
    return _engines[url]


class Connection:
    """Keep the existing parameterized repository calls while using either SQL dialect."""
    def __init__(self, raw):
        self.raw = raw

    def execute(self, statement, args=()):
        if isinstance(statement, str):
            if isinstance(args, dict):
                result = self.raw.execute(text(statement), args)
            else:
                pieces = statement.split('?')
                if len(pieces) != len(args) + 1:
                    raise ValueError('SQL parameter count mismatch')
                sql = ''.join(piece + (f':p{i}' if i < len(args) else '') for i, piece in enumerate(pieces))
                result = self.raw.execute(text(sql), {f'p{i}': value for i, value in enumerate(args)})
        else:
            result = self.raw.execute(statement, args or {})
        return result.mappings() if result.returns_rows else result


def now():
    return datetime.now(timezone.utc).isoformat()


def uid(prefix):
    return prefix + '-' + uuid.uuid4().hex[:12].upper()


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


@contextmanager
def transaction():
    with get_engine().begin() as connection:
        # The MVP already serializes writes. Preserve that guarantee for audit-chain,
        # field-version and OCR queue updates while moving to PostgreSQL.
        if connection.dialect.name == 'postgresql':
            connection.execute(text('SELECT pg_advisory_xact_lock(26018)'))
        else:
            connection.exec_driver_sql('BEGIN IMMEDIATE')
        yield Connection(connection)


def initialize():
    from alembic import command
    from alembic.config import Config
    config = Config(str(ROOT.parent / 'alembic.ini'))
    with get_engine().begin() as connection:
        config.attributes['connection'] = connection
        command.upgrade(config, 'head')


def get(con, kind, key):
    row = con.execute('SELECT data FROM entities WHERE kind=? AND id=?', (kind, key)).fetchone()
    return json.loads(row['data']) if row else None


def all_entities(con, kind):
    return [json.loads(r['data']) for r in con.execute('SELECT data FROM entities WHERE kind=? ORDER BY id', (kind,))]


def put(con, kind, obj):
    con.execute('INSERT INTO entities VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data', (kind, obj['id'], encode(obj)))


def document(con, key):
    row = con.execute('SELECT data FROM documents WHERE id=?', (key,)).fetchone()
    return json.loads(row['data']) if row else None


def documents(con, parcel_id=None, include_archived=False):
    sql, args = ('SELECT data FROM documents', ()) if parcel_id is None else ('SELECT data FROM documents WHERE parcel_id=?', (parcel_id,))
    items = [json.loads(r['data']) for r in con.execute(sql, args)]
    items.sort(key=lambda d: (d.get('uploadedAt', ''), d['id']), reverse=True)
    return items if include_archived else [item for item in items if not item.get('archivedAt')]


def save_document(con, doc):
    con.execute('INSERT INTO documents VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,parcel_id=excluded.parcel_id', (doc['id'], doc['parcelId'], encode(doc)))


def fields(con, parcel_id=None, document_id=None):
    if document_id:
        rows = con.execute('SELECT data FROM fields WHERE document_id=? ORDER BY id', (document_id,))
    else:
        rows = con.execute('SELECT data FROM fields WHERE parcel_id=? ORDER BY id', (parcel_id,))
    items = [json.loads(r['data']) for r in rows]
    items.sort(key=lambda f: (f.get('extractedAt', ''), f.get('documentId', ''), f.get('page', 0), f['id']))
    active_document_ids = {item['id'] for item in documents(con)}
    return [item for item in items if item['documentId'] in active_document_ids]


def save_field(con, field):
    con.execute('INSERT INTO fields VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data', (field['id'], field['documentId'], field['parcelId'], encode(field)))


def audit(con, actor, action, entity, description, metadata=None):
    last = con.execute('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').fetchone()
    previous = last['hash'] if last else '0' * 64
    event = dict(id=uid('AUD'), user=actor, action=action, entityId=entity, timestamp=now(), description=description, metadata=metadata or {})
    body = encode(event)
    digest = hashlib.sha256((previous + body).encode()).hexdigest()
    con.execute('INSERT INTO audit(id,data,previous_hash,hash) VALUES(?,?,?,?)', (event['id'], body, previous, digest))
    return event['id']


def audit_events(con):
    return [dict(json.loads(r['data']), previousHash=r['previous_hash'], hash=r['hash']) for r in con.execute('SELECT * FROM audit ORDER BY seq DESC')]


def verify_audit(con):
    previous, count = '0' * 64, 0
    for row in con.execute('SELECT * FROM audit ORDER BY seq'):
        expected = hashlib.sha256((previous + row['data']).encode()).hexdigest()
        if row['previous_hash'] != previous or row['hash'] != expected:
            return {'valid': False, 'checked': count, 'failedEvent': row['id']}
        previous, count = row['hash'], count + 1
    return {'valid': True, 'checked': count, 'headHash': previous}
