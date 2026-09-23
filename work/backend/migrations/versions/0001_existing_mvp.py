"""Adopt the existing MVP schema without deleting or re-encoding data."""
from alembic import op
from backend.models import CORE, metadata, protect_append_only

revision = '0001_existing_mvp'
down_revision = None
branch_labels = depends_on = None

def upgrade():
    connection = op.get_bind()
    metadata.create_all(connection, tables=CORE, checkfirst=True)
    protect_append_only(connection, 'audit')

def downgrade():
    raise RuntimeError('Destructive downgrade is disabled. Restore a verified database backup instead.')
