import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.yandex.ru')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', '')

async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via Yandex SMTP"""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("Email not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"Speed Date <{SMTP_FROM}>"
        message["To"] = to_email
        
        # Add HTML content
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect and send
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, message.as_string())
        
        print(f"Email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_registration_email(to_email: str, name: str, confirmation_code: str) -> bool:
    """Send registration confirmation email"""
    subject = "Подтверждение регистрации на Speed Date"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF5757;">Speed Date</h1>
        </div>
        <p>Привет, {name}!</p>
        <p>Спасибо за регистрацию на Speed Date.</p>
        <p>Ваш код подтверждения:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            {confirmation_code}
        </div>
        <p>Код действителен в течение 24 часов.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Если вы не регистрировались на Speed Date, просто проигнорируйте это письмо.
        </p>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html)

async def send_password_reset_email(to_email: str, name: str, reset_code: str) -> bool:
    """Send password reset email"""
    subject = "Восстановление пароля на Speed Date"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF5757;">Speed Date</h1>
        </div>
        <p>Привет, {name}!</p>
        <p>Вы запросили восстановление пароля.</p>
        <p>Ваш код для сброса пароля:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            {reset_code}
        </div>
        <p>Код действителен в течение 1 часа.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        </p>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html)
