"""
LeadForge AI — Email Service
Sends emails via Resend API (HTTPS — works on Hugging Face which blocks SMTP ports).
Falls back to SMTP if Resend is not configured.
"""
import os
import logging

logger = logging.getLogger(__name__)

# SMTP settings (fallback)
SMTP_SERVER = os.environ.get("SMTP_SERVER", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

# Resend settings (HTTPS API — bypasses Hugging Face port blocks)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

# IMPORTANT: On Resend free tier, FROM_EMAIL must be "onboarding@resend.dev"
# and emails can ONLY be delivered to the Resend account owner's email.
# To send to any email, verify a custom domain in your Resend dashboard.
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")

# Resend free tier: can only deliver to the account owner's email.
# Set RESEND_OWNER_EMAIL to override the recipient for all emails during testing.
RESEND_OWNER_EMAIL = os.environ.get("RESEND_OWNER_EMAIL", "")


def _send_email(to_email: str, subject: str, body: str):
    """Send an email. Tries Resend API first, then SMTP."""

    # If no provider is configured at all, log the email content for debugging
    if not SMTP_SERVER and not RESEND_API_KEY:
        logger.warning(f"\n{'='*60}")
        logger.warning(f"[EMAIL MOCK] No provider configured. Would have sent:")
        logger.warning(f"[EMAIL MOCK]   To: {to_email}")
        logger.warning(f"[EMAIL MOCK]   Subject: {subject}")
        logger.warning(f"[EMAIL MOCK]   Body preview: {body[:200]}...")
        logger.warning(f"{'='*60}")
        return

    # Resend free tier requires 'onboarding@resend.dev' unless a custom domain is verified.
    # Free providers like gmail can never be verified on Resend.
    resend_from_email = FROM_EMAIL
    free_providers = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@icloud.com"]
    if RESEND_API_KEY and any(FROM_EMAIL.lower().endswith(p) for p in free_providers):
        resend_from_email = "LeadForge AI <onboarding@resend.dev>"

    # On Resend free tier, you can only send to the account owner's email.
    # If RESEND_OWNER_EMAIL is set, redirect there and log a warning.
    effective_recipient = to_email
    if RESEND_API_KEY and ("onboarding@resend.dev" in resend_from_email) and RESEND_OWNER_EMAIL:
        effective_recipient = RESEND_OWNER_EMAIL
        logger.warning(
            f"[EMAIL] Resend free tier restriction: redirecting email for {to_email} "
            f"to Resend account owner: {RESEND_OWNER_EMAIL}"
        )

    # 1. Try Resend API (HTTPS) — works on Hugging Face which blocks SMTP ports
    if RESEND_API_KEY:
        try:
            import requests as req
            payload = {
                "from": resend_from_email,
                "to": [effective_recipient],
                "subject": subject,
                "html": body,
            }
            logger.info(f"[EMAIL] Sending via Resend to {effective_recipient}...")
            response = req.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            logger.info(f"[EMAIL] Resend HTTP status: {response.status_code}")
            logger.info(f"[EMAIL] Resend response body: {response.text[:500]}")

            if response.status_code in (200, 201):
                logger.info(f"[EMAIL] ✅ Email sent successfully via Resend to {effective_recipient}")
                return
            else:
                logger.error(
                    f"[EMAIL] ❌ Resend returned non-success status {response.status_code}: {response.text}"
                )
        except Exception as e:
            logger.error(f"[EMAIL] ❌ Resend request exception: {type(e).__name__}: {str(e)}")
        # Fall through to SMTP if Resend failed

    # 2. Try SMTP (usually blocked on Hugging Face, but works locally)
    if SMTP_SERVER and SMTP_USERNAME:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg["From"] = FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            logger.info(f"[EMAIL] Sending via SMTP ({SMTP_SERVER}:{SMTP_PORT}) to {to_email}...")
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"[EMAIL] ✅ Email sent successfully via SMTP to {to_email}")
        except Exception as e:
            logger.error(f"[EMAIL] ❌ SMTP failed: {type(e).__name__}: {str(e)}")


def send_verification_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "https://lead-forge-ai-six.vercel.app")
    link = f"{frontend_url}/verify-email?token={token}"

    logger.info(f"[EMAIL] Sending verification email to {to_email}")
    logger.info(f"[EMAIL] Verification link: {link}")

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #cbd5e1; padding: 40px;">
        <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 16px; line-height: 64px; font-size: 28px; margin-bottom: 16px;">⚡</div>
            <h1 style="color: #f1f5f9; font-size: 24px; margin: 0;">Welcome to LeadForge AI!</h1>
          </div>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Thank you for signing up. Please verify your email address to activate your account and start finding leads.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{link}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; 
                      padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
              ✅ Verify My Email
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
            If the button doesn't work, paste this link into your browser:<br/>
            <a href="{link}" style="color: #6366f1; word-break: break-all;">{link}</a>
          </p>
          <hr style="border-color: rgba(255,255,255,0.08); margin: 24px 0;" />
          <p style="color: #475569; font-size: 11px; text-align: center;">
            This link expires in 7 days. If you did not create a LeadForge AI account, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    _send_email(to_email, "Verify your LeadForge AI Account", body)


def send_password_reset_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "https://lead-forge-ai-six.vercel.app")
    link = f"{frontend_url}/reset-password?token={token}"

    logger.info(f"[EMAIL] Sending password reset email to {to_email}")
    logger.info(f"[EMAIL] Reset link: {link}")

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #cbd5e1; padding: 40px;">
        <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 16px; line-height: 64px; font-size: 28px; margin-bottom: 16px;">🔑</div>
            <h1 style="color: #f1f5f9; font-size: 24px; margin: 0;">Reset Your Password</h1>
          </div>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            We received a request to reset the password for your LeadForge AI account. Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{link}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; 
                      padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
              🔐 Reset My Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
            If the button doesn't work, paste this link into your browser:<br/>
            <a href="{link}" style="color: #6366f1; word-break: break-all;">{link}</a>
          </p>
          <hr style="border-color: rgba(255,255,255,0.08); margin: 24px 0;" />
          <p style="color: #475569; font-size: 11px; text-align: center;">
            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    _send_email(to_email, "Reset your LeadForge AI Password", body)
