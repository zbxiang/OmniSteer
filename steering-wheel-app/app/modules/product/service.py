"""产品业务逻辑。"""

from __future__ import annotations

import json

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.pagination import PaginationParams, paginate_scalars
from app.models.product import Product
from app.modules.product.schemas import (
    ProductCreate,
    ProductImageSearchResponse,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)


def create_product(db: Session, body: ProductCreate) -> ProductResponse:
    row = Product(
        name=body.name.strip(),
        brand=body.brand.strip(),
        model=body.model.strip(),
        price=body.price,
        status=body.status,
        material=body.material.strip() if body.material else None,
        diameter=body.diameter,
        weight=body.weight,
        mount=body.mount.strip() if body.mount else None,
        description=body.description.strip() if body.description else None,
        images_json=json.dumps(body.images, ensure_ascii=False),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return product_to_response(row)


def product_to_response(product: Product) -> ProductResponse:
    try:
        raw = json.loads(product.images_json or "[]")
    except json.JSONDecodeError:
        raw = []
    images = raw if isinstance(raw, list) else []
    images = [str(x) for x in images]
    return ProductResponse(
        id=product.id,
        name=product.name,
        brand=product.brand,
        model=product.model,
        price=product.price,
        status=product.status,
        material=product.material,
        diameter=product.diameter,
        weight=product.weight,
        mount=product.mount,
        description=product.description,
        images=images,
        created_at=product.created_at,
    )


def list_products(
    db: Session,
    *,
    keyword: str | None,
    params: PaginationParams,
) -> ProductListResponse:
    kw = (keyword or "").strip()
    cond = None
    if kw:
        pattern = f"%{kw}%"
        cond = or_(
            Product.name.ilike(pattern),
            Product.brand.ilike(pattern),
            Product.model.ilike(pattern),
        )

    query_stmt = select(Product).order_by(Product.id.desc())
    count_stmt = select(func.count(Product.id))
    if cond is not None:
        query_stmt = query_stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    paged = paginate_scalars(
        db,
        item_stmt=query_stmt,
        count_stmt=count_stmt,
        params=params,
    )
    return ProductListResponse(
        items=[product_to_response(x) for x in paged.items],
        total=paged.total,
        page=paged.page,
        page_size=paged.page_size,
    )


def get_product_by_id(db: Session, product_id: int) -> ProductResponse | None:
    row = db.get(Product, product_id)
    if row is None:
        return None
    return product_to_response(row)


def update_product(
    db: Session,
    *,
    product_id: int,
    body: ProductUpdate,
) -> ProductResponse | None:
    row = db.get(Product, product_id)
    if row is None:
        return None
    row.name = body.name.strip()
    row.brand = body.brand.strip()
    row.model = body.model.strip()
    row.price = body.price
    row.status = body.status
    row.material = body.material.strip() if body.material else None
    row.diameter = body.diameter
    row.weight = body.weight
    row.mount = body.mount.strip() if body.mount else None
    row.description = body.description.strip() if body.description else None
    row.images_json = json.dumps(body.images, ensure_ascii=False)
    db.add(row)
    db.commit()
    db.refresh(row)
    return product_to_response(row)


def update_product_status(
    db: Session,
    *,
    product_id: int,
    status: str,
) -> ProductResponse | None:
    row = db.get(Product, product_id)
    if row is None:
        return None
    row.status = status
    db.add(row)
    db.commit()
    db.refresh(row)
    return product_to_response(row)


def search_products_by_image(
    db: Session,
    *,
    image: str,
    limit: int,
) -> ProductImageSearchResponse:
    keyword = image.strip()
    if not keyword:
        return ProductImageSearchResponse(items=[], total=0)
    # 以 dataURL 前缀作为轻量相似度特征（后续可替换为向量检索）
    prefix = keyword[:128]
    rows = db.scalars(select(Product).order_by(Product.id.desc()).limit(500)).all()
    matched: list[ProductResponse] = []
    for row in rows:
        item = product_to_response(row)
        if any(str(img).startswith(prefix) for img in item.images):
            matched.append(item)
            if len(matched) >= limit:
                break
    return ProductImageSearchResponse(items=matched, total=len(matched))
