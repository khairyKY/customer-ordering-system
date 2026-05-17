from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
import re

class TicketPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

def sanitize_html(text: str) -> str:
    # Strip script tags and their content
    text = re.sub(r'<script\b[^>]*>([\s\S]*?)</script>', '', text, flags=re.IGNORECASE)
    # Strip all other HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    return text.strip()

class TicketBase(BaseModel):
    subject: str = Field(..., min_length=5, max_length=120)
    body: str = Field(..., min_length=10, max_length=2000)

    @field_validator("subject", "body")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        return sanitize_html(v)

class TicketCreate(TicketBase):
    pass

class TicketUpdateStatus(BaseModel):
    status: TicketStatus

class PaginationInfo(BaseModel):
    totalTickets: int
    totalPages: int
    currentPage: int
    limit: int

class Ticket(TicketBase):
    id: str
    userId: str
    subject: str
    body: str
    priority: TicketPriority
    status: TicketStatus
    sentiment_source: str
    created_at: str
    updated_at: Optional[str] = None

class TicketListResponse(BaseModel):
    tickets: List[Ticket]
    pagination: PaginationInfo
