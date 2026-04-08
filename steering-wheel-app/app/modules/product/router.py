"""产品 HTTP 路由。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_username
from app.core.pagination import PaginationParams, get_pagination_params
from app.db.session import get_db
from app.modules.product.schemas import (
    ProductCreate,
    ProductImageSearchRequest,
    ProductImageSearchResponse,
    ProductListResponse,
    ProductResponse,
    ProductStatusUpdate,
    ProductUpdate,
)
from app.modules.product.service import (
    create_product,
    get_product_by_id,
    list_products,
    search_products_by_image,
    update_product,
    update_product_status,
)

router = APIRouter(tags=["products"])


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=201,
    dependencies=[Depends(get_current_username)],
)
def create_product_route(
    body: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """新增产品（需登录）。"""
    return create_product(db, body)


@router.get(
    "/products",
    response_model=ProductListResponse,
    dependencies=[Depends(get_current_username)],
)
def list_products_route(
    db: Session = Depends(get_db),
    keyword: str | None = Query(default=None),
    params: PaginationParams = Depends(get_pagination_params),
) -> ProductListResponse:
    """产品列表（需登录，支持关键词与分页）。"""
    return list_products(
        db,
        keyword=keyword,
        params=params,
    )


@router.get(
    "/products/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(get_current_username)],
)
def get_product_detail_route(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """产品详情（需登录）。"""
    item = get_product_by_id(db, product_id)
    if item is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    return item


@router.put(
    "/products/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(get_current_username)],
)
def update_product_route(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """更新产品（需登录）。"""
    item = update_product(
        db,
        product_id=product_id,
        body=body,
    )
    if item is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    return item


@router.patch(
    "/products/{product_id}/status",
    response_model=ProductResponse,
    dependencies=[Depends(get_current_username)],
)
def update_product_status_route(
    product_id: int,
    body: ProductStatusUpdate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """更新产品状态（需登录）。"""
    item = update_product_status(
        db,
        product_id=product_id,
        status=body.status,
    )
    if item is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    return item


@router.post(
    "/products/image-search",
    response_model=ProductImageSearchResponse,
    dependencies=[Depends(get_current_username)],
)
def image_search_route(
    body: ProductImageSearchRequest,
    db: Session = Depends(get_db),
) -> ProductImageSearchResponse:
    """以图搜图（需登录）。"""
    return search_products_by_image(
        db,
        image=body.image,
        limit=body.limit,
    )
