from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    email: EmailStr
    inquiry_type: str
    inquiry_content: str
