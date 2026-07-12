"""
Seed the Postgres database with the same categories, products, demo users,
orders and reviews used in the original HTML prototype.

Run with:  python -m app.seed
"""
from .database import SessionLocal, engine, Base
from . import models
from .security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

CATEGORIES = [
    ("Electronics", "🔌"), ("Fashion", "👕"), ("Groceries", "🍎"),
    ("Beauty", "💄"), ("Home", "🏠"), ("Books", "📚"),
]

PRODUCTS = [
    # name, category, icon, price, old_price, stock, rating, reviews, deal, desc
    ("Wireless Earbuds Pro", "Electronics", "🎧", 59.99, 79.99, 34, 4.6, 128, True,
     "Noise-isolating true wireless earbuds with 30hr battery life and fast charging case."),
    ("Smart Watch Series X", "Electronics", "⌚", 129.00, None, 12, 4.4, 64, False,
     "Track workouts, heart rate, and notifications with a 10-day battery."),
    ("Portable Bluetooth Speaker", "Electronics", "🔊", 34.50, 45.00, 3, 4.2, 41, True,
     "Compact speaker with deep bass and IPX6 water resistance."),
    ("4K Action Camera", "Electronics", "📷", 89.00, None, 2, 4.2, 15, False,
     "Waterproof 4K action camera with stabilization."),
    ("Men's Denim Jacket", "Fashion", "🧥", 44.00, None, 20, 4.3, 22, False,
     "Classic fit denim jacket, stonewashed, all-season wear."),
    ("Running Sneakers", "Fashion", "👟", 52.99, 69.99, 15, 4.7, 96, True,
     "Lightweight cushioned sneakers built for daily runs."),
    ("Cotton Summer Dress", "Fashion", "👗", 28.00, None, 0, 4.1, 18, False,
     "Breathable cotton dress, perfect for warm days."),
    ("Organic Avocados (4pk)", "Groceries", "🥑", 4.99, None, 80, 4.5, 9, False,
     "Ripe and ready organic avocados, sourced locally."),
    ("Extra Virgin Olive Oil 1L", "Groceries", "🫒", 9.49, 11.99, 60, 4.8, 53, True,
     "Cold-pressed extra virgin olive oil, rich and smooth."),
    ("Whole Wheat Bread", "Groceries", "🍞", 2.99, None, 45, 4.0, 6, False,
     "Freshly baked whole wheat loaf, no preservatives."),
    ("Matte Lipstick Set", "Beauty", "💄", 18.99, 24.99, 26, 4.6, 71, True,
     "Long-wear matte lipstick set, 4 everyday shades."),
    ("Vitamin C Serum", "Beauty", "🧴", 15.50, None, 8, 4.5, 87, False,
     "Brightening facial serum with 15% vitamin C."),
    ("Ceramic Dinner Set (16pc)", "Home", "🍽️", 64.00, 79.00, 10, 4.4, 30, True,
     "16-piece ceramic dinnerware set for 4, dishwasher safe."),
    ("LED Desk Lamp", "Home", "💡", 22.00, None, 40, 4.3, 19, False,
     "Adjustable LED desk lamp with 3 brightness modes."),
    ("The Midnight Library", "Books", "📖", 12.99, None, 25, 4.7, 210, False,
     "A bestselling novel about infinite choices and second chances."),
    ("Atomic Habits", "Books", "📗", 14.50, 17.99, 33, 4.9, 340, True,
     "A proven framework for building good habits and breaking bad ones."),
]

REVIEWS = {
    "Wireless Earbuds Pro": [("Amaka O.", 5, "Battery life is incredible, sound is crisp."),
                              ("Tunde A.", 4, "Great fit, wish the case was smaller.")],
    "Running Sneakers": [("Grace M.", 5, "Super comfortable for daily 5k runs.")],
    "Atomic Habits": [("Chris N.", 5, "Changed how I think about routines."),
                       ("Deb K.", 5, "Recommend to everyone.")],
}


def run():
    if db.query(models.User).filter(models.User.email == "admin@store.com").first():
        print("Database already seeded — skipping.")
        return

    print("Seeding categories...")
    cat_map = {}
    for name, icon in CATEGORIES:
        c = models.Category(name=name, icon=icon)
        db.add(c)
        db.flush()
        cat_map[name] = c

    print("Seeding products...")
    prod_map = {}
    for name, cat_name, icon, price, old_price, stock, rating, reviews, deal, desc in PRODUCTS:
        p = models.Product(
            name=name, category_id=cat_map[cat_name].id, icon=icon, price=price,
            old_price=old_price, stock=stock, rating=rating, reviews_count=reviews,
            is_deal=deal, description=desc,
        )
        db.add(p)
        db.flush()
        prod_map[name] = p

    print("Seeding users...")
    admin = models.User(name="Admin User", email="admin@store.com",
                         password_hash=hash_password("admin123"), role="admin")
    jane = models.User(name="Jane Doe", email="jane@example.com",
                        password_hash=hash_password("password"), role="customer",
                        address="123 Market Street, Lagos", phone="+234 800 000 0000")
    db.add_all([admin, jane])
    db.flush()

    print("Seeding reviews...")
    for prod_name, revs in REVIEWS.items():
        for who, stars, text in revs:
            reviewer = models.User(name=who, email=f"{who.split()[0].lower()}@example.com",
                                    password_hash=hash_password("password"), role="customer")
            db.add(reviewer)
            db.flush()
            db.add(models.Review(product_id=prod_map[prod_name].id, user_id=reviewer.id,
                                  stars=stars, text=text))

    print("Seeding sample orders...")
    o1 = models.Order(id="ORD-10231", user_id=jane.id, status="delivered",
                       subtotal=12.99, shipping_fee=3.99, total=16.98,
                       address="123 Market Street, Lagos", phone=jane.phone)
    db.add(o1)
    db.flush()
    db.add(models.OrderItem(order_id=o1.id, product_id=prod_map["The Midnight Library"].id,
                             qty=1, price=12.99))
    db.add(models.Payment(order_id=o1.id, method="Card", amount=16.98, status="paid"))

    o2 = models.Order(id="ORD-10255", user_id=jane.id, status="shipped",
                       subtotal=78.97, shipping_fee=3.99, total=82.96,
                       address="123 Market Street, Lagos", phone=jane.phone)
    db.add(o2)
    db.flush()
    db.add(models.OrderItem(order_id=o2.id, product_id=prod_map["Wireless Earbuds Pro"].id,
                             qty=1, price=59.99))
    db.add(models.OrderItem(order_id=o2.id, product_id=prod_map["Extra Virgin Olive Oil 1L"].id,
                             qty=2, price=9.49))
    db.add(models.Payment(order_id=o2.id, method="Mobile Money", amount=82.96, status="paid"))

    print("Seeding notifications...")
    db.add_all([
        models.Notification(user_id=jane.id, title="Order shipped", body="ORD-10255 is on its way!",
                             icon="🚚", is_read=False),
        models.Notification(user_id=jane.id, title="Deal alert", body="Atomic Habits is 20% off today.",
                             icon="🔥", is_read=False),
        models.Notification(user_id=jane.id, title="Order delivered", body="ORD-10231 was delivered.",
                             icon="📦", is_read=True),
    ])

    db.commit()
    print("Done. Admin login: admin@store.com / admin123")
    print("Customer login: jane@example.com / password")


if __name__ == "__main__":
    run()
