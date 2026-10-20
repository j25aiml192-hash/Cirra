import base64
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

ALGORITHM = "HS256"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.NEXTAUTH_SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.NEXTAUTH_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _get_key() -> bytes:
    raw = base64.b64decode(settings.ENCRYPTION_KEY)
    return (raw + b"0" * 32)[:32]


def encrypt_credentials(creds: Dict[str, Any]) -> str:
    aesgcm = AESGCM(_get_key())
    nonce = os.urandom(12)
    payload = json.dumps(creds).encode("utf-8")
    ct = aesgcm.encrypt(nonce, payload, None)
    return base64.b64encode(nonce + ct).decode("utf-8")


def decrypt_credentials(encrypted_b64: str) -> Dict[str, Any]:
    aesgcm = AESGCM(_get_key())
    raw = base64.b64decode(encrypted_b64)
    nonce = raw[:12]
    ct = raw[12:]
    decrypted = aesgcm.decrypt(nonce, ct, None)
    return json.loads(decrypted.decode("utf-8"))
