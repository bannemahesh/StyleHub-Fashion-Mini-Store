from pydantic import BaseModel, Field, ConfigDict


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str
    image_url: str | None = None
    stock: int

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length=1)
    price: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=100)
    image_url: str | None = None
    stock: int = Field(ge=0)