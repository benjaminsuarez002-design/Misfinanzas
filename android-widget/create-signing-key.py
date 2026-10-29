"""Generate the permanent local APK signing identity (never overwrite one)."""
import datetime
import json
import os
import secrets
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

root = Path(os.environ['USERPROFILE']) / '.misfinanzas-signing'
if root.exists():
    raise SystemExit('Ya existe la carpeta de firma. No se sobrescribe ninguna clave.')
root.mkdir(mode=0o700)
backup = root / 'respaldo'
backup.mkdir(mode=0o700)
key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
now = datetime.datetime.now(datetime.timezone.utc)
name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Mis Finanzas Android'),
                  x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Mis Finanzas')])
cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name)
        .public_key(key.public_key()).serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=365 * 30))
        .sign(key, hashes.SHA256()))
password = secrets.token_urlsafe(36)
store = pkcs12.serialize_key_and_certificates(b'misfinanzas', key, cert, None,
             serialization.BestAvailableEncryption(password.encode()))
credentials = json.dumps({'alias': 'misfinanzas', 'password': password}, indent=2).encode()
public = cert.public_bytes(serialization.Encoding.PEM)
for folder in (root, backup):
    (folder / 'misfinanzas-release.p12').write_bytes(store)
    (folder / 'credenciales.json').write_bytes(credentials)
    (folder / 'certificado-publico.pem').write_bytes(public)
loaded_key, loaded_cert, _ = pkcs12.load_key_and_certificates(store, password.encode())
assert loaded_key and loaded_cert.fingerprint(hashes.SHA256()) == cert.fingerprint(hashes.SHA256())
assert (backup / 'misfinanzas-release.p12').read_bytes() == store
print('Firma creada y verificada en:', root)
print('SHA-256:', cert.fingerprint(hashes.SHA256()).hex(':').upper())
print('Válida hasta:', cert.not_valid_after_utc.date())
