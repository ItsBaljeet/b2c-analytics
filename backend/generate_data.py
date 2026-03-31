import random
import sqlite3
from datetime import datetime, timedelta
from faker import Faker
from database import get_connection, init_db

fake = Faker("en_IN")
random.seed(42)

CATEGORIES = ["Electronics", "Clothing", "Home & Kitchen", "Beauty", "Sports", "Books"]

PRODUCTS = [
    ("Wireless Earbuds Pro",    "Electronics", 2999, 900),
    ("Smart LED Bulb Pack",     "Electronics", 799,  220),
    ("USB-C Hub 7-in-1",        "Electronics", 1499, 500),
    ("Bluetooth Speaker Mini",  "Electronics", 1299, 400),
    ("Laptop Stand Adjustable", "Electronics", 999,  300),
    ("Men's Running Shoes",     "Clothing",    2499, 700),
    ("Women's Yoga Pants",      "Clothing",    1199, 350),
    ("Cotton Casual T-Shirt",   "Clothing",    399,  100),
    ("Waterproof Jacket",       "Clothing",    3499, 1100),
    ("Slim Fit Jeans",          "Clothing",    1799, 550),
    ("Non-stick Cookware Set",  "Home & Kitchen", 2999, 900),
    ("Air Purifier Compact",    "Home & Kitchen", 4999, 1800),
    ("Vacuum Cleaner Robot",    "Home & Kitchen", 8999, 3200),
    ("Knife Set Premium",       "Home & Kitchen", 1599, 500),
    ("Coffee Maker Drip",       "Home & Kitchen", 2499, 800),
    ("Vitamin C Serum 30ml",    "Beauty",       899,  180),
    ("Hair Dryer Professional", "Beauty",       1899, 600),
    ("Sunscreen SPF50",         "Beauty",       549,  120),
    ("Face Wash Gel",           "Beauty",       299,  70),
    ("Perfume Floral 50ml",     "Beauty",       1499, 400),
    ("Yoga Mat 6mm",            "Sports",       999,  250),
    ("Resistance Band Set",     "Sports",       599,  150),
    ("Dumbbell Set 10kg",       "Sports",       2499, 800),
    ("Cycling Helmet",          "Sports",       1299, 450),
    ("Badminton Racket Set",    "Sports",       799,  220),
    ("Python Programming",      "Books",        499,  120),
    ("Data Science Handbook",   "Books",        699,  180),
    ("Business Strategy",       "Books",        399,  90),
    ("Self Help: Atomic Habits","Books",        349,  80),
    ("Machine Learning Basics", "Books",        599,  140),
]

def generate_data(n_customers=200, n_transactions=800):
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM customers")
    cursor.execute("DELETE FROM products")
    cursor.execute("DELETE FROM sqlite_sequence")

    for name, category, price, cost in PRODUCTS:
        cursor.execute(
            "INSERT INTO products (name, category, price, cost) VALUES (?,?,?,?)",
            (name, category, price, cost)
        )

    customer_ids = []
    for _ in range(n_customers):
        joined = fake.date_between(start_date="-2y", end_date="-1m")
        cursor.execute(
            "INSERT INTO customers (name, email, city, joined_date) VALUES (?,?,?,?)",
            (fake.name(), fake.unique.email(), fake.city(), str(joined))
        )
        customer_ids.append(cursor.lastrowid)

    product_ids = list(range(1, len(PRODUCTS) + 1))

    poor_products    = [3, 8, 19, 26, 29]
    popular_products = [1, 11, 21, 6, 16]
    churned_customers = random.sample(customer_ids, k=30)

    end_date = datetime.today()
    start_date = end_date - timedelta(days=365)

    for _ in range(n_transactions):
        cust_id = random.choice(customer_ids)

        if cust_id in churned_customers:
            days_ago = random.randint(90, 365)
            txn_date = end_date - timedelta(days=days_ago)
        else:
            txn_date = fake.date_time_between(start_date=start_date, end_date=end_date)

        if random.random() < 0.3:
            prod_id = random.choice(popular_products)
        elif random.random() < 0.15:
            prod_id = random.choice(poor_products)
        else:
            prod_id = random.choice(product_ids)

        qty = random.randint(1, 3)
        price = PRODUCTS[prod_id - 1][2]
        total = price * qty

        if prod_id in poor_products:
            returned = 1 if random.random() < 0.45 else 0
            rating   = random.choices([1, 2, 3, 4, 5], weights=[30, 30, 20, 15, 5])[0]
        else:
            returned = 1 if random.random() < 0.08 else 0
            rating   = random.choices([1, 2, 3, 4, 5], weights=[3, 5, 15, 35, 42])[0]

        cursor.execute("""
            INSERT INTO transactions
                (customer_id, product_id, quantity, total_amount, returned, rating, date)
            VALUES (?,?,?,?,?,?,?)
        """, (cust_id, prod_id, qty, total, returned, rating, str(txn_date.date())))

    conn.commit()
    conn.close()

    print(f"Done! Inserted {len(PRODUCTS)} products, {n_customers} customers, {n_transactions} transactions.")
    print(f"Poor products seeded: {[PRODUCTS[i-1][0] for i in poor_products]}")


if __name__ == "__main__":
    generate_data()
