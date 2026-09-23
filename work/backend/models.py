"""SQLAlchemy metadata; preserve MVP tables and add relational evidence provenance."""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

metadata = sa.MetaData()
payload = sa.JSON().with_variant(JSONB, 'postgresql')

users = sa.Table('users', metadata, sa.Column('id', sa.Text, primary_key=True),
                 sa.Column('email', sa.Text, nullable=False, unique=True), sa.Column('password', sa.Text, nullable=False),
                 sa.Column('data', sa.Text, nullable=False))
sessions = sa.Table('sessions', metadata, sa.Column('token', sa.Text, primary_key=True),
                    sa.Column('user_id', sa.Text, sa.ForeignKey('users.id'), nullable=False), sa.Column('expires', sa.Float, nullable=False))
entities = sa.Table('entities', metadata, sa.Column('kind', sa.Text, primary_key=True),
                    sa.Column('id', sa.Text, primary_key=True), sa.Column('data', sa.Text, nullable=False))
documents = sa.Table('documents', metadata, sa.Column('id', sa.Text, primary_key=True),
                     sa.Column('parcel_id', sa.Text, nullable=False), sa.Column('data', sa.Text, nullable=False))
fields = sa.Table('fields', metadata, sa.Column('id', sa.Text, primary_key=True),
                  sa.Column('document_id', sa.Text, sa.ForeignKey('documents.id'), nullable=False),
                  sa.Column('parcel_id', sa.Text, nullable=False, index=True), sa.Column('data', sa.Text, nullable=False))
jobs = sa.Table('jobs', metadata, sa.Column('id', sa.Text, primary_key=True),
                sa.Column('document_id', sa.Text, sa.ForeignKey('documents.id'), nullable=False),
                sa.Column('status', sa.Text, nullable=False), sa.Column('attempts', sa.Integer, nullable=False, server_default='0'),
                sa.Column('data', sa.Text, nullable=False))
audit = sa.Table('audit', metadata, sa.Column('seq', sa.Integer, primary_key=True, autoincrement=True),
                 sa.Column('id', sa.Text, unique=True, nullable=False), sa.Column('data', sa.Text, nullable=False),
                 sa.Column('previous_hash', sa.Text, nullable=False), sa.Column('hash', sa.Text, nullable=False))
login_attempts = sa.Table('login_attempts', metadata, sa.Column('identity', sa.Text, primary_key=True),
                          sa.Column('failures', sa.Integer, nullable=False), sa.Column('reset_at', sa.Float, nullable=False))

validation_runs = sa.Table('validation_runs', metadata,
    sa.Column('id', sa.Text, primary_key=True), sa.Column('parcel_id', sa.Text, nullable=False, index=True),
    sa.Column('created_at', sa.Text, nullable=False), sa.Column('actor', sa.Text, nullable=False),
    sa.Column('engine_version', sa.Text, nullable=False), sa.Column('input_hash', sa.Text, nullable=False),
    sa.Column('snapshot', payload, nullable=False))
source_queries = sa.Table('source_queries', metadata,
    sa.Column('id', sa.Text, primary_key=True), sa.Column('run_id', sa.Text, sa.ForeignKey('validation_runs.id'), nullable=False, index=True),
    sa.Column('source_system', sa.Text, nullable=False), sa.Column('source_type', sa.Text, nullable=False),
    sa.Column('attempt', sa.Integer, nullable=False), sa.Column('status', sa.Text, nullable=False),
    sa.Column('queried_at', sa.Text, nullable=False), sa.Column('duration_ms', sa.Integer, nullable=False),
    sa.Column('query', payload, nullable=False), sa.Column('details', payload, nullable=False))
source_records = sa.Table('source_records', metadata,
    sa.Column('id', sa.Text, primary_key=True), sa.Column('run_id', sa.Text, sa.ForeignKey('validation_runs.id'), nullable=False, index=True),
    sa.Column('query_id', sa.Text, sa.ForeignKey('source_queries.id'), nullable=False),
    sa.Column('parcel_identifier', sa.Text, nullable=False, index=True), sa.Column('source_type', sa.Text, nullable=False),
    sa.Column('source_system', sa.Text, nullable=False), sa.Column('external_record_id', sa.Text),
    sa.Column('availability_status', sa.Text, nullable=False), sa.Column('verification_status', sa.Text, nullable=False),
    sa.Column('freshness_status', sa.Text, nullable=False), sa.Column('retrieved_at', sa.Text, nullable=False),
    sa.Column('data_hash', sa.Text, nullable=False), sa.Column('source_version', sa.Text),
    sa.Column('simulated', sa.Boolean, nullable=False), sa.Column('raw_data', payload, nullable=False),
    sa.Column('metadata', payload, nullable=False))
canonical_claims = sa.Table('canonical_claims', metadata,
    sa.Column('id', sa.Text, primary_key=True), sa.Column('run_id', sa.Text, sa.ForeignKey('validation_runs.id'), nullable=False, index=True),
    sa.Column('parcel_id', sa.Text, nullable=False, index=True), sa.Column('fact', sa.Text, nullable=False, index=True),
    sa.Column('source_record_id', sa.Text, sa.ForeignKey('source_records.id')),
    sa.Column('document_id', sa.Text), sa.Column('extraction_id', sa.Text), sa.Column('page_number', sa.Integer),
    sa.Column('text_value', sa.Text), sa.Column('numeric_value', sa.Numeric(24, 8)),
    sa.Column('original_value', payload), sa.Column('provenance', payload, nullable=False))
review_resolutions = sa.Table('review_resolutions', metadata,
    sa.Column('id', sa.Text, primary_key=True), sa.Column('parcel_id', sa.Text, nullable=False, index=True),
    sa.Column('run_id', sa.Text, sa.ForeignKey('validation_runs.id'), nullable=False),
    sa.Column('conflict_fingerprint', sa.Text, nullable=False), sa.Column('reviewer', sa.Text, nullable=False),
    sa.Column('created_at', sa.Text, nullable=False), sa.Column('decision', payload, nullable=False))

CORE = [users, sessions, entities, documents, fields, jobs, audit, login_attempts]
EVIDENCE = [validation_runs, source_queries, source_records, canonical_claims, review_resolutions]


def protect_append_only(connection, table):
    if connection.dialect.name == 'postgresql':
        connection.exec_driver_sql("""CREATE OR REPLACE FUNCTION bharat_append_only() RETURNS trigger AS $$
          BEGIN RAISE EXCEPTION 'Evidence and audit history are append-only'; END; $$ LANGUAGE plpgsql""")
        connection.exec_driver_sql(f'DROP TRIGGER IF EXISTS {table}_append_only ON {table}')
        connection.exec_driver_sql(f'CREATE TRIGGER {table}_append_only BEFORE UPDATE OR DELETE ON {table} FOR EACH ROW EXECUTE FUNCTION bharat_append_only()')
    else:
        for action in ('UPDATE', 'DELETE'):
            connection.exec_driver_sql(f"CREATE TRIGGER IF NOT EXISTS {table}_no_{action.lower()} BEFORE {action} ON {table} BEGIN SELECT RAISE(ABORT,'Evidence and audit history are append-only'); END")
