import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

# Basic SMTP settings from environment
SMTP_SERVER = os.environ.get("SMTP_SERVER", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@leadforge.ai")

def _send_email(to_email: str, subject: str, body: str):
    if not SMTP_SERVER or not SMTP_USERNAME:
        logger.warning(f"\n[EMAIL MOCK] Would have sent to {to_email}")
        logger.warning(f"[EMAIL MOCK] Subject: {subject}")
        logger.warning(f"[EMAIL MOCK] Body:\n{body}\n")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

def send_verification_email(to_email: str, token: str):
    link = f"http://localhost:3000/verify-email?token={token}"
    # Change to actual domain in production
    
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
    link = f"http://localhost:3000/reset-password?token={token}"
    
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
