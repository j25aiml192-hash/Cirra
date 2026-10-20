import pytest
from app.core.encryption import encrypt_credentials, decrypt_credentials


def test_encryption_roundtrip():
    payload = {
        "api_key": "sk-proj-test123456789",
        "client_secret": "very-secret-value-abcdef",
        "nested": {"account_id": "12345"}
    }
    encrypted = encrypt_credentials(payload)

    # 1. Plaintext secrets must not appear in the encrypted string
    assert "sk-proj-test123456789" not in encrypted
    assert "very-secret-value-abcdef" not in encrypted

    # 2. Nonce randomness: encrypting same payload twice must yield distinct outputs
    encrypted_second = encrypt_credentials(payload)
    assert encrypted != encrypted_second

    # 3. Decrypt must recover exact payload
    decrypted = decrypt_credentials(encrypted)
    assert decrypted == payload


def test_encryption_invalid_payload():
    with pytest.raises(Exception):
        decrypt_credentials("invalid_short_base64")
