import os
import sys
import pytest

# Add API to path to test cross-service compatibility
current_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
api_dir = os.path.join(repo_root, "services", "api")
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from app.core.encryption import encrypt_credentials as api_encrypt, decrypt_credentials as api_decrypt
from encryption import encrypt_credentials as ingest_encrypt, decrypt_credentials as ingest_decrypt


def test_encryption_modules_compatibility_and_divergence_guard():
    """
    Test that API encryption and Ingest encryption modules are 100% interoperable.
    Guards against algorithm, nonce size, or formatting divergence between API and Ingest.
    """
    credentials_sample = {
        "access_key_id": "AKIAIOSFODNN7EXAMPLE",
        "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "role_arn": "arn:aws:iam::123456789012:role/CirraCostRole",
        "external_id": "cirra-tenant-test-id",
    }

    # 1. API encrypt -> Ingest decrypt
    api_encrypted = api_encrypt(credentials_sample)
    decrypted_by_ingest = ingest_decrypt(api_encrypted)
    assert decrypted_by_ingest == credentials_sample

    # 2. Ingest encrypt -> API decrypt
    ingest_encrypted = ingest_encrypt(credentials_sample)
    decrypted_by_api = api_decrypt(ingest_encrypted)
    assert decrypted_by_api == credentials_sample
