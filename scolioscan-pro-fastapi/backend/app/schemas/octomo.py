from datetime import datetime

from pydantic import BaseModel, Field


class OctomoIssueCodeRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=10, max_length=20, description="휴대폰 번호")


class OctomoIssueCodeResponse(BaseModel):
    phoneNumber: str
    code: str
    recipientNumber: str
    messageText: str
    expiresAt: datetime
    expiresInSeconds: int


class OctomoVerifyRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=10, max_length=20, description="휴대폰 번호")


class OctomoVerifyResponse(BaseModel):
    verified: bool
