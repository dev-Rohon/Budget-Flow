from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class TransactionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    date: date
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    icon: str = Field(default="receipt_long", max_length=100)


class TransactionResponse(BaseModel):
    id: int
    name: str
    category: str
    date: date
    amount: Decimal
    status: str
    type: str
    icon: str

    model_config = ConfigDict(from_attributes=True)