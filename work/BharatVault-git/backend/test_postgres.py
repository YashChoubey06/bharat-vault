"""Run the full acceptance suite against disposable schemas in bharatvault_test."""
import os
import unittest
from sqlalchemy.engine import make_url
from . import store


if __name__ == '__main__':
    target = os.getenv('BHARAT_TEST_DATABASE_URL') or os.getenv('BHARAT_POSTGRES_URL')
    if not target: raise SystemExit('Configure a local PostgreSQL target first.')
    url = make_url(target).set(database='bharatvault_test')
    os.environ['BHARAT_TEST_DATABASE_URL'] = url.render_as_string(hide_password=False)
    suite = unittest.defaultTestLoader.loadTestsFromNames([
        'backend.test_resolution', 'backend.test_resolution_api', 'backend.test_mvp', 'backend.test_migrations'])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
