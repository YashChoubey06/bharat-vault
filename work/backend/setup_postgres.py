"""Install an isolated, loopback-only PostgreSQL cluster for the local MVP."""
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import zipfile
import httpx
import psycopg
from dotenv import set_key

ROOT = Path(__file__).resolve().parent
BIN = ROOT / 'tools' / 'postgresql' / 'pgsql' / 'bin'
CLUSTER = ROOT / 'data' / 'postgresql'
CREDS = ROOT / 'data' / 'postgres-admin.json'
URL = 'https://get.enterprisedb.com/postgresql/postgresql-17.11-3-windows-x64-binaries.zip'


def command(*args):
    return subprocess.run([str(x) for x in args], check=True, creationflags=subprocess.CREATE_NO_WINDOW)


def setup():
    ROOT.joinpath('tools').mkdir(exist_ok=True)
    ROOT.joinpath('data').mkdir(exist_ok=True)
    if not (BIN / 'initdb.exe').exists():
        archive = ROOT / 'tools' / 'postgresql-17.zip'
        if not archive.exists() or not zipfile.is_zipfile(archive):
            print('Downloading official PostgreSQL 17 Windows binaries...', flush=True)
            with httpx.stream('GET', URL, timeout=120, follow_redirects=True) as response:
                response.raise_for_status()
                with archive.open('wb') as stream:
                    for block in response.iter_bytes(1024 * 1024): stream.write(block)
        destination = BIN.parent.parent.resolve()
        with zipfile.ZipFile(archive) as bundle:
            for item in bundle.infolist():
                if not item.filename.startswith(('pgsql/bin/', 'pgsql/lib/', 'pgsql/share/')): continue
                if not (destination / item.filename).resolve().is_relative_to(destination):
                    raise RuntimeError('Invalid archive path')
                bundle.extract(item, destination)
    if CREDS.exists():
        credentials = json.loads(CREDS.read_text())
    else:
        if (CLUSTER / 'PG_VERSION').exists():
            raise RuntimeError('Existing cluster lacks its local credentials; refusing to overwrite it.')
        credentials = {'admin': secrets.token_urlsafe(32), 'app': secrets.token_urlsafe(32), 'port': 5433}
        CREDS.write_text(json.dumps(credentials))
    if not (CLUSTER / 'PG_VERSION').exists():
        with tempfile.NamedTemporaryFile(mode='w', delete=False, dir=ROOT / 'data') as secret:
            secret.write(credentials['admin'])
            secret_path = Path(secret.name)
        try:
            command(BIN / 'initdb.exe', '-D', CLUSTER, '-U', 'bharat_admin', '--encoding=UTF8',
                    '--locale=C', '--auth=scram-sha-256', '--pwfile=' + str(secret_path))
        finally:
            secret_path.unlink(missing_ok=True)
    try:
        with psycopg.connect(host='127.0.0.1',port=credentials['port'],user='bharat_admin',
                             password=credentials['admin'],dbname='postgres',connect_timeout=2): pass
        running = True
    except psycopg.OperationalError:
        running = False
    if not running:
        with socket.socket() as probe:
            if probe.connect_ex(('127.0.0.1',credentials['port'])) == 0:
                raise RuntimeError('PostgreSQL port is occupied but authentication failed; no second server was started.')
        # pg_ctl's Windows restricted-token launcher is unavailable in some desktop
        # sandboxes. Directly launch the same postgres executable as the current user.
        with (ROOT / 'data' / 'postgresql.log').open('ab') as output:
            subprocess.Popen([str(BIN / 'postgres.exe'), '-D', str(CLUSTER), '-h', '127.0.0.1',
                              '-p', str(credentials['port'])], stdout=output, stderr=output,
                              creationflags=subprocess.CREATE_NO_WINDOW)
        for attempt in range(40):
            try:
                with psycopg.connect(host='127.0.0.1',port=credentials['port'],user='bharat_admin',
                                     password=credentials['admin'],dbname='postgres',connect_timeout=2): pass
                break
            except psycopg.OperationalError:
                if attempt == 39: raise RuntimeError('PostgreSQL did not start; inspect backend/data/postgresql.log') from None
                time.sleep(.25)
    with psycopg.connect(host='127.0.0.1', port=credentials['port'], user='bharat_admin',
                        password=credentials['admin'], dbname='postgres', autocommit=True) as con:
        if not con.execute("SELECT 1 FROM pg_roles WHERE rolname='bharatvault'").fetchone():
            from psycopg import sql
            con.execute(sql.SQL('CREATE ROLE bharatvault LOGIN PASSWORD {}').format(sql.Literal(credentials['app'])))
        for name in ('bharatvault', 'bharatvault_test'):
            if not con.execute('SELECT 1 FROM pg_database WHERE datname=%s', (name,)).fetchone():
                from psycopg import sql
                con.execute(sql.SQL('CREATE DATABASE {} OWNER bharatvault').format(sql.Identifier(name)))
    connection = f"postgresql+psycopg://bharatvault:{credentials['app']}@127.0.0.1:{credentials['port']}/bharatvault"
    set_key(ROOT / '.env', 'BHARAT_POSTGRES_URL', connection)
    print('PostgreSQL is ready on 127.0.0.1:5433. Target URL saved privately; active database is unchanged.', flush=True)


if __name__ == '__main__': setup()
