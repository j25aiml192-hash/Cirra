import base64
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from src.core.config import settings


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT access token containing tenant and user claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.NEXTAUTH_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def _get_aes_key() -> bytes:
    """Decode the 32-byte AES-256 base64 key from configuration."""
    raw_key = base64.b64decode(settings.ENCRYPTION_KEY)
    if len(raw_key) != 32:
        # Pad or slice for exact 32 bytes if dev placeholder
        raw_key = (raw_key + b"0" * 32)[:32]
    return raw_key


def encrypt_credentials(credentials: Dict[str, Any]) -> str:
    """
    Encrypt sensitive credentials dictionary using AES-256-GCM.
    Returns base64 encoded string: nonce (12 bytes) + ciphertext + tag.
    """
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    payload = json.dumps(credentials).encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, payload, None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_credentials(encrypted_payload: str) -> Dict[str, Any]:
    """
    Decrypt base64 encoded AES-256-GCM credentials payload.
    """
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    raw_bytes = base64.b64decode(encrypted_payload)
    nonce = raw_bytes[:12]
    ciphertext = raw_bytes[12:]
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(decrypted.decode("utf-8"))
