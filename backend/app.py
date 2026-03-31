from flask import Flask, jsonify
from flask_cors import CORS
from database import init_db
from analytics import (
    get_poor_products,
    get_customer_segments,
    get_churn_predictions,
    get_summary,
)

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({"message": "B2C Analytics API is running!", "version": "1.0"})


@app.route("/api/summary")
def summary():
    data = get_summary()
    return jsonify(data)


@app.route("/api/poor-products")
def poor_products():
    data = get_poor_products()
    return jsonify(data)


@app.route("/api/customer-segments")
def customer_segments():
    data = get_customer_segments()
    return jsonify(data)


@app.route("/api/churn-risk")
def churn_risk():
    data = get_churn_predictions()
    return jsonify(data)


@app.route("/api/products")
def all_products():
    from database import get_connection
    import pandas as pd
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM products", conn)
    conn.close()
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/customers")
def all_customers():
    from database import get_connection
    import pandas as pd
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM customers LIMIT 100", conn)
    conn.close()
    return jsonify(df.to_dict(orient="records"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
