from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class BudgetCreate(BaseModel):
    name: str
    category: str
    total: Decimal
    icon: str
    color: str


class BudgetResponse(BaseModel):
    id: int
    name: str
    category: str
    total: Decimal
    icon: str
    color: str

    model_config = ConfigDict(from_attributes=True)