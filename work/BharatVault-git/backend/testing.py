"""Isolated database targets for the SQLite and PostgreSQL acceptance suites."""
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool


def test_database(directory):
    target = os.getenv('BHARAT_TEST_DATABASE_URL')
    if not target:
        return 'sqlite:///' + (directory / 'test.sqlite3').as_posix(), lambda: None
    url = make_url(target)
    if not url.database or not url.database.endswith('_test'):
        raise RuntimeError('PostgreSQL tests require a dedicated database whose name ends in _test.')
    schema = 'test_' + uuid.uuid4().hex
    engine = create_engine(url, poolclass=NullPool)
    with engine.begin() as con: con.execute(text(f'CREATE SCHEMA "{schema}"'))
    def cleanup():
        # This schema was generated and created by this invocation, in a test-only database.
        with engine.begin() as con: con.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        engine.dispose()
    test_url = url.update_query_dict({'options':'-csearch_path=' + schema})
    return test_url.render_as_string(hide_password=False), cleanup
