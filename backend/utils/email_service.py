import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")


def send_otp_email(to_email: str, otp_code: str) -> None:
    placeholder_values = {"your_gmail_username@gmail.com", "your_app_password_here"}
    values = [SMTP_HOST, str(SMTP_PORT), SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL]
    if not all(values) or any(value in placeholder_values for value in values if value):
        raise RuntimeError(
            "SMTP configuration is missing or not configured for real email delivery. "
            "Add valid Gmail SMTP credentials to the .env file before sending OTP emails."
        )

    message = EmailMessage()
    message["Subject"] = "Your BudgetFlow OTP"
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(
        f"Your BudgetFlow verification code is: {otp_code}\n\n"
        "This code expires in 10 minutes."
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)
