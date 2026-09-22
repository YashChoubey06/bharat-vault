"""Append-only source queries, raw responses, canonical claims and review decisions."""
from alembic import op
from backend.models import EVIDENCE, metadata, protect_append_only

revision = '0002_evidence_resolution'
down_revision = '0001_existing_mvp'
branch_labels = depends_on = None

def upgrade():
    connection = op.get_bind()
    metadata.create_all(connection, tables=EVIDENCE, checkfirst=True)
    for table in EVIDENCE:
        protect_append_only(connection, table.name)

def downgrade():
    raise RuntimeError('Evidence history must be retained. Restore a verified backup to roll back.')
