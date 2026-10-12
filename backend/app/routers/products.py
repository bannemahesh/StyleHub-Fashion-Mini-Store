from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


# Get all products
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

# Add multiple products without duplicating existing names
@router.post("/bulk", response_model=list[ProductResponse], status_code=201)
def create_multiple_products(
    products_data: list[ProductCreate],
    db: Session = Depends(get_db),
):
    added_products = []

    for item in products_data:
        # Check whether a product with the same name already exists
        existing_product = (
            db.query(Product)
            .filter(Product.name.ilike(item.name.strip()))
            .first()
        )

        if existing_product:
            continue

        new_product = Product(
            name=item.name.strip(),
            description=item.description,
            price=item.price,
            category=item.category,
            image_url=item.image_url,
            stock=item.stock,
        )

        db.add(new_product)
        added_products.append(new_product)

    db.commit()

    for product in added_products:
        db.refresh(product)

    return added_products


# Get one product by ID
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


# Create a new product
@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    new_product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        category=product_data.category,
        image_url=product_data.image_url,
        stock=product_data.stock,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# Edit an existing product
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.name = product_data.name
    product.description = product_data.description
    product.price = product_data.price
    product.category = product_data.category
    product.image_url = product_data.image_url
    product.stock = product_data.stock

    db.commit()
    db.refresh(product)

    return product

# Delete a product
@router.delete("/{product_id}", status_code=200)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
    }