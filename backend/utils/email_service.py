import os

import requests
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL")
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "Budget Flow")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_otp_email(to_email: str, otp_code: str) -> None:
    if not BREVO_API_KEY:
        raise RuntimeError("BREVO_API_KEY is not configured")

    if not BREVO_FROM_EMAIL:
        raise RuntimeError("BREVO_FROM_EMAIL is not configured")

    payload = {
        "sender": {
            "name": BREVO_FROM_NAME,
            "email": BREVO_FROM_EMAIL,
        },
        "to": [
            {
                "email": to_email,
            }
        ],
        "subject": "Your BudgetFlow OTP",
        "textContent": (
            f"Your BudgetFlow verification code is: {otp_code}\n\n"
            "This code expires in 10 minutes."
        ),
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )
    except requests.RequestException as exc:
        raise RuntimeError(
            "Unable to connect to the email service."
        ) from exc

    if not response.ok:
        try:
            error_data = response.json()
        except ValueError:
            error_data = response.text

        raise RuntimeError(
            f"Brevo email delivery failed: {error_data}"
        )