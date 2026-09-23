from alembic import context
from backend.models import metadata
from backend.store import get_engine

config = context.config

def migrate(connection):
    context.configure(connection=connection, target_metadata=metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    raise RuntimeError('Use an online database connection to verify the existing MVP schema.')
elif config.attributes.get('connection') is not None:
    migrate(config.attributes['connection'])
else:
    with get_engine().connect() as connection:
        migrate(connection)
