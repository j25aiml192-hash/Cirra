import base64
import json
import os
from typing import Any, Dict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.fernet import Fernet
from app.core.config import settings


def _get_aes_key() -> bytes:
    key_bytes = base64.b64decode(settings.ENCRYPTION_KEY)
    if len(key_bytes) != 32:
        raise ValueError("ENCRYPTION_KEY must be exactly 32 bytes when base64-decoded.")
    return key_bytes


def _get_fernet() -> Fernet:
    raw_bytes = _get_aes_key()
    fernet_key = base64.urlsafe_b64encode(raw_bytes)
    return Fernet(fernet_key)


def encrypt_string(plaintext: str) -> str:
    """Encrypt a plaintext string using Fernet."""
    f = _get_fernet()
    return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_string(ciphertext: str) -> str:
    """Decrypt a Fernet encrypted string."""
    f = _get_fernet()
    return f.decrypt(ciphertext.encode("utf-8")).decode("utf-8")


def encrypt_credentials(data: Dict[str, Any]) -> str:
    """Encrypt a dictionary of credentials using AES-256-GCM with a 12-byte random nonce."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    payload = json.dumps(data).encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, payload, None)
    # Pack nonce + ciphertext together into base64
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode("utf-8")


def decrypt_credentials(encrypted_str: str) -> Dict[str, Any]:
    """Decrypt an encrypted credential string back into its original dictionary."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    combined = base64.b64decode(encrypted_str)
    if len(combined) < 12:
        raise ValueError("Invalid encrypted payload: too short for GCM nonce.")
    nonce = combined[:12]
    ciphertext = combined[12:]
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(decrypted_bytes.decode("utf-8"))
