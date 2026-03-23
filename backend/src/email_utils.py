from email.message import EmailMessage
import aiosmtplib
from src.config import settings

async def send_email(
    to_email: str,
    subject: str,
    plain_text: str,
    html_content: str | None = None,
) -> None:
    message = EmailMessage()
    message["From"] = settings.MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(plain_text)

    if html_content:
        message.add_alternative(html_content, subtype="html")
    
    await aiosmtplib.send(
        message,
        hostname=settings.MAIL_SERVER,
        port=settings.MAIL_PORT,
        username=settings.MAIL_USERNAME if settings.MAIL_USERNAME else None,
        password=settings.MAIL_PASSWORD.get_secret_value() if settings.MAIL_PASSWORD.get_secret_value() else None,
        start_tls=settings.MAIL_USE_TLS,
    )

async def send_password_reset_email(to_email: str, username: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # Simple HTML template (you can create a proper template file later)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{ background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #777; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Reset Your Password</h2>
            <p>Hi {username},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p>Or copy this link: <a href="{reset_url}">{reset_url}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">
                <p>Best regards,<br>The Nepfluence Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_text = f"""Hi {username},

You requested to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
The Nepfluence Team
"""

    await send_email(
        to_email=to_email,
        subject="Reset Your Password - Nepfluence",
        plain_text=plain_text,
        html_content=html_content,
    )