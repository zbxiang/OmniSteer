"""产品请求 / 响应模型。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    brand: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=64)
    price: float = Field(gt=0)
    status: Literal["on", "off"] = "on"
    material: str | None = Field(default=None, max_length=128)
    diameter: int | None = Field(default=None, ge=1)
    weight: int | None = Field(default=None, ge=1)
    mount: str | None = Field(default=None, max_length=128)
    description: str | None = None
    images: list[str] = Field(default_factory=list, max_length=12)


class ProductUpdate(ProductCreate):
    pass


class ProductStatusUpdate(BaseModel):
    status: Literal["on", "off"]


class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    model: str
    price: float
    status: str
    material: str | None
    diameter: int | None
    weight: int | None
    mount: str | None
    description: str | None
    images: list[str]
    created_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int


class ProductImageSearchRequest(BaseModel):
    image: str = Field(min_length=16)
    limit: int = Field(default=8, ge=1, le=20)


class ProductImageSearchResponse(BaseModel):
    items: list[ProductResponse]
    total: int
