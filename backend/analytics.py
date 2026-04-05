import pandas as pd
from datetime import datetime
from database import get_connection


def get_poor_products():
    conn = get_connection()

    products_df = pd.read_sql_query("SELECT * FROM products", conn)
    txn_df      = pd.read_sql_query("SELECT * FROM transactions", conn)
    conn.close()

    if txn_df.empty:
        return []

    stats = txn_df.groupby("product_id").agg(
        total_revenue  = ("total_amount", "sum"),
        total_orders   = ("id",           "count"),
        total_returned = ("returned",     "sum"),
        avg_rating     = ("rating",       "mean"),
    ).reset_index()

    stats["return_rate"]  = stats["total_returned"] / stats["total_orders"]
    stats["avg_rating"]   = stats["avg_rating"].round(2)

    avg_revenue = stats["total_revenue"].mean()
    avg_return  = stats["return_rate"].mean()
    avg_rating  = stats["avg_rating"].mean()

    def score(row):
        s = 0
        if row["total_revenue"] < avg_revenue * 0.5:  s += 2
        elif row["total_revenue"] < avg_revenue * 0.8: s += 1
        if row["return_rate"]  > avg_return  * 2:     s += 2
        elif row["return_rate"] > avg_return  * 1.5:  s += 1
        if row["avg_rating"]   < 2.5:                 s += 2
        elif row["avg_rating"] < 3.2:                 s += 1
        return s

    stats["score"] = stats.apply(score, axis=1)

    def severity(s):
        if s >= 4: return "Critical"
        if s >= 2: return "Warning"
        return "Good"

    stats["severity"] = stats["score"].apply(severity)

    merged = stats.merge(products_df, left_on="product_id", right_on="id")

    result = merged[[
        "product_id", "name", "category", "price",
        "total_revenue", "total_orders", "return_rate",
        "avg_rating", "severity", "score"
    ]].sort_values("score", ascending=False)

    result["total_revenue"] = result["total_revenue"].round(2)
    result["return_rate"]   = (result["return_rate"] * 100).round(1)

    return result.to_dict(orient="records")


def get_customer_segments():
    conn = get_connection()
    txn_df = pd.read_sql_query("SELECT * FROM transactions", conn)
    cust_df = pd.read_sql_query("SELECT * FROM customers", conn)
    conn.close()

    if txn_df.empty:
        return {}

    today = pd.Timestamp(datetime.today().date())
    txn_df["date"] = pd.to_datetime(txn_df["date"])

    rfm = txn_df.groupby("customer_id").agg(
        recency   = ("date",         lambda x: (today - x.max()).days),
        frequency = ("id",           "count"),
        monetary  = ("total_amount", "sum"),
    ).reset_index()

    for col in ["recency", "frequency", "monetary"]:
        rfm[col + "_score"] = pd.qcut(
            rfm[col] if col != "recency" else -rfm[col],
            q=4, labels=[1, 2, 3, 4], duplicates="drop"
        ).astype(int)

    rfm["rfm_total"] = rfm["recency_score"] + rfm["frequency_score"] + rfm["monetary_score"]

    def segment(score):
        if score >= 10: return "Champions"
        if score >= 7:  return "Loyal"
        if score >= 5:  return "At-Risk"
        return "Lost"

    rfm["segment"] = rfm["rfm_total"].apply(segment)

    segment_counts = rfm["segment"].value_counts().to_dict()

    rfm = rfm.merge(cust_df[["id", "name", "email", "city"]], left_on="customer_id", right_on="id")
    rfm["monetary"] = rfm["monetary"].round(2)

    top_per_segment = (
        rfm.groupby("segment")
           .apply(lambda g: g.nlargest(5, "monetary")[["name", "email", "city", "recency", "frequency", "monetary"]].to_dict("records"))
           .to_dict()
    )

    return {
        "counts":           segment_counts,
        "top_per_segment":  top_per_segment,
        "total_customers":  len(rfm),
    }


def get_churn_predictions():
    conn = get_connection()
    txn_df  = pd.read_sql_query("SELECT * FROM transactions", conn)
    cust_df = pd.read_sql_query("SELECT * FROM customers", conn)
    conn.close()

    if txn_df.empty:
        return []

    today = pd.Timestamp(datetime.today().date())
    txn_df["date"] = pd.to_datetime(txn_df["date"])

    features = txn_df.groupby("customer_id").agg(
        days_since_last = ("date",         lambda x: (today - x.max()).days),
        total_orders    = ("id",           "count"),
        total_spend     = ("total_amount", "sum"),
        avg_rating      = ("rating",       "mean"),
        return_count    = ("returned",     "sum"),
    ).reset_index()

    max_days   = features["days_since_last"].max()
    max_orders = features["total_orders"].max()
    max_spend  = features["total_spend"].max()
    max_rating = 5.0

    def churn_score(row):
        recency_score  = (row["days_since_last"] / max_days) * 50
        order_score    = (1 - row["total_orders"] / max_orders) * 20
        spend_score    = (1 - row["total_spend"]  / max_spend)  * 15
        rating_score   = (1 - row["avg_rating"]   / max_rating) * 10
        return_rate    = row["return_count"] / row["total_orders"] if row["total_orders"] > 0 else 0
        return_score   = return_rate * 5
        total = recency_score + order_score + spend_score + rating_score + return_score
        return round(min(total, 99), 1)

    features["churn_prob"] = features.apply(churn_score, axis=1)

    def risk_label(p):
        if p >= 60: return "High"
        if p >= 35: return "Medium"
        return "Low"

    features["risk_level"] = features["churn_prob"].apply(risk_label)

    at_risk = features[features["churn_prob"] >= 35].copy()
    at_risk = at_risk.merge(cust_df[["id", "name", "email", "city"]], left_on="customer_id", right_on="id")
    at_risk["total_spend"] = at_risk["total_spend"].round(2)

    return (
        at_risk[["name", "email", "city", "days_since_last",
                 "total_orders", "total_spend", "churn_prob", "risk_level"]]
        .sort_values("churn_prob", ascending=False)
        .head(60)
        .to_dict(orient="records")
    )


def get_summary():
    conn = get_connection()
    txn_df  = pd.read_sql_query("SELECT * FROM transactions", conn)
    prod_df = pd.read_sql_query("SELECT * FROM products", conn)
    cust_df = pd.read_sql_query("SELECT * FROM customers", conn)
    conn.close()

    total_revenue    = round(txn_df["total_amount"].sum(), 2)
    total_orders     = len(txn_df)
    total_returned   = int(txn_df["returned"].sum())
    return_rate      = round(total_returned / total_orders * 100, 1) if total_orders else 0
    active_customers = txn_df["customer_id"].nunique()

    poor = get_poor_products()
    flagged_count = len([p for p in poor if p["severity"] in ("Critical", "Warning")])

    return {
        "total_revenue":    total_revenue,
        "total_orders":     total_orders,
        "return_rate":      return_rate,
        "active_customers": active_customers,
        "total_products":   len(prod_df),
        "total_customers":  len(cust_df),
        "flagged_products": flagged_count,
    }
