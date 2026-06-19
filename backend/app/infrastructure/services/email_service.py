import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

# SMTP settings
SMTP_SERVER = os.environ.get("SMTP_SERVER", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

# Resend settings (HTTPS API - works on Hugging Face)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@leadforge.ai")

def _send_email(to_email: str, subject: str, body: str):
    if not SMTP_SERVER and not RESEND_API_KEY:
        logger.warning(f"\n[EMAIL MOCK] Would have sent to {to_email}")
        logger.warning(f"[EMAIL MOCK] Subject: {subject}")
        logger.warning(f"[EMAIL MOCK] Body:\n{body}\n")
        return

    # 1. Try Resend API (HTTPS) First - Bypasses Hugging Face Port Blocking
    if RESEND_API_KEY:
        try:
            import requests
            response = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "html": body
                },
                timeout=15
            )
            response.raise_for_status()
            logger.info(f"Email sent successfully via Resend API to {to_email}")
            return
        except Exception as e:
            logger.error(f"Failed to send email via Resend to {to_email}: {str(e)}")
            # Fall back to SMTP if it fails, assuming SMTP is configured

    # 2. Try SMTP
    if SMTP_SERVER and SMTP_USERNAME:
        try:
            msg = MIMEMultipart()
            msg["From"] = FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent successfully via SMTP to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {str(e)}")

def send_verification_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "https://lead-forge-ai-six.vercel.app")
    link = f"{frontend_url}/verify-email?token={token}"
    
    body = f"""
    <html>
      <body>
        <h2>Welcome to LeadForge AI!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="{link}">{link}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """
    _send_email(to_email, "Verify your LeadForge AI Account", body)

def send_password_reset_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "https://lead-forge-ai-six.vercel.app")
    link = f"{frontend_url}/reset-password?token={token}"
    
    body = f"""
    <html>
      <body>
        <h2>Reset your password</h2>
        <p>Click the link below to reset your LeadForge AI password:</p>
        <p><a href="{link}">{link}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """
    _send_email(to_email, "Reset your LeadForge AI Password", body)
