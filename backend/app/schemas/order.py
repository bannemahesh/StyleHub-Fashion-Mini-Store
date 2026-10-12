from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    unit_price: float
    quantity: int
    line_total: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    # The frontend sends no price or user ID.
    # The backend calculates the price and identifies
    # the user from their authentication token.
    confirm: bool = Field(default=True)