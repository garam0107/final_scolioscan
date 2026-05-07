import emails
from emails.template import JinjaTemplate
from ..config import settings
import random
import smtplib
import string
from email.message import EmailMessage
from typing import Optional, Sequence, TypedDict


class EmailAttachment(TypedDict):
    filename: str
    content_type: str
    content: bytes


def generate_random_password(length: int = 6) -> str:
    """랜덤 비밀번호 생성 (6자리)"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


def send_email(
    email_to: str,
    subject: str,
    html_content: str
) -> bool:
    """이메일 발송"""
    try:
        message = emails.Message(
            subject=subject,
            html=html_content,
            mail_from=(settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL)
        )

        smtp_options = {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "user": settings.SMTP_USER,
            "password": settings.SMTP_PASSWORD,
        }

        # 포트 465는 SSL, 포트 587은 TLS 사용
        if settings.SMTP_SSL or settings.SMTP_PORT == 465:
            smtp_options["ssl"] = True
        else:
            smtp_options["tls"] = True

        response = message.send(to=email_to, smtp=smtp_options)
        return response.status_code == 250
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_email_with_attachments(
    email_to: str,
    subject: str,
    html_content: str,
    attachments: Sequence[EmailAttachment],
) -> bool:
    """첨부파일이 있는 이메일 발송"""
    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = email_to
        message.set_content("HTML 이메일을 확인해주세요.")
        message.add_alternative(html_content, subtype="html")

        for attachment in attachments:
            maintype, subtype = attachment["content_type"].split("/", 1)
            message.add_attachment(
                attachment["content"],
                maintype=maintype,
                subtype=subtype,
                filename=attachment["filename"],
            )

        if settings.SMTP_SSL or settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(message)

        return True
    except Exception as e:
        print(f"Failed to send email with attachments: {e}")
        return False


def send_password_reset_email(email_to: str, name: str, new_password: str) -> bool:
    """비밀번호 재설정 이메일 발송"""
    subject = f"{settings.APP_NAME} - 비밀번호 재설정"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #22BCB7;">비밀번호가 재설정되었습니다</h2>
            <p>안녕하세요, {name}님</p>
            <p>요청하신 비밀번호가 재설정되었습니다.</p>
            <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                <strong>새 비밀번호:</strong> {new_password}
            </p>
            <p>로그인 후 반드시 비밀번호를 변경해주세요.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                이 이메일은 {settings.APP_NAME}에서 발송되었습니다.
            </p>
        </body>
    </html>
    """

    return send_email(email_to, subject, html_content)


def send_contact_email(
    user_email: str,
    inquiry_type: str,
    inquiry_content: str,
    attachments: Optional[Sequence[EmailAttachment]] = None,
) -> bool:
    """고객센터 문의 이메일 발송"""
    subject = f"{settings.APP_NAME} - 고객 문의: {inquiry_type}"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #22BCB7;">고객 문의</h2>
            <p><strong>문의자 이메일:</strong> {user_email}</p>
            <p><strong>문의 유형:</strong> {inquiry_type}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <h3>문의 내용</h3>
            <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
                {inquiry_content}
            </p>
        </body>
    </html>
    """

    if attachments:
        return send_email_with_attachments(settings.ADMIN_EMAIL, subject, html_content, attachments)

    return send_email(settings.ADMIN_EMAIL, subject, html_content)
