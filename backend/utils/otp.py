import secrets
from datetime import datetime, timedelta

from pwdlib import PasswordHash

otp_hasher = PasswordHash.recommended()


def generate_otp_code() -> str:
    return str(secrets.randbelow(10**6)).zfill(6)


def hash_otp(otp: str) -> str:
    return otp_hasher.hash(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    try:
        return otp_hasher.verify(otp, otp_hash)
    except Exception:
        return False


def otp_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(minutes=10)
