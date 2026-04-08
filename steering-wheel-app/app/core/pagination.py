"""通用分页模块。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from fastapi import Query
from sqlalchemy.sql import Select
from sqlalchemy.orm import Session

T = TypeVar("T")


@dataclass(frozen=True)
class PaginationParams:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


@dataclass(frozen=True)
class PaginationResult(Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


def get_pagination_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
) -> PaginationParams:
    """从查询参数中解析分页参数。"""
    return PaginationParams(page=page, page_size=page_size)


def paginate_scalars(
    db: Session,
    *,
    item_stmt: Select[tuple[T]],
    count_stmt: Select[tuple[int]],
    params: PaginationParams,
) -> PaginationResult[T]:
    """执行分页查询并返回统一结构。"""
    total = int(db.scalar(count_stmt) or 0)
    rows = db.scalars(item_stmt.offset(params.offset).limit(params.page_size)).all()
    return PaginationResult(
        items=list(rows),
        total=total,
        page=params.page,
        page_size=params.page_size,
    )
