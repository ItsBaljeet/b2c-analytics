import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

export default function PoorProducts() {
  const [products, setProducts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [category, setCategory]   = useState("All");
  const [severity,  setSeverity]  = useState("All");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/poor-products`)
      .then(res => { setProducts(res.data); setFiltered(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    let result = [...products];
    if (category !== "All") result = result.filter(p => p.category === category);
    if (severity  !== "All") result = result.filter(p => p.severity  === severity);
    setFiltered(result);
  }, [category, severity, products]);

  const categories = ["All", ...new Set(products.map(p => p.category))];

  function exportCSV() {
    const headers = ["Name","Category","Price","Revenue","Orders","Return Rate %","Avg Rating","Severity"];
    const rows = filtered.map(p => [
      p.name, p.category, p.price, p.total_revenue,
      p.total_orders, p.return_rate, p.avg_rating, p.severity
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "poor_products.csv"; a.click();
  }

  if (loading) return <p className="loading">Analysing products...</p>;
  if (error)   return <p className="error">Could not connect to Flask server.</p>;

  const critical = filtered.filter(p => p.severity === "Critical").length;
  const warning  = filtered.filter(p => p.severity === "Warning").length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Poor Product Detector</h1>
        <p className="page-sub">Products scored on revenue, return rate, and customer ratings</p>
      </div>

      <div className="summary-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="summary-card">
          <div className="summary-label">Total Products</div>
          <div className="summary-value">{products.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Critical</div>
          <div className="summary-value red">{critical}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Warning</div>
          <div className="summary-value amber">{warning}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Good</div>
          <div className="summary-value green">{products.length - critical - warning}</div>
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Filter by:</span>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option>All</option>
          <option>Critical</option>
          <option>Warning</option>
          <option>Good</option>
        </select>
        <button className="export-btn" onClick={exportCSV} style={{ marginLeft: "auto" }}>
          Export CSV
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Product Performance ({filtered.length} products)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price (₹)</th>
              <th>Revenue (₹)</th>
              <th>Orders</th>
              <th>Return %</th>
              <th>Avg Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.product_id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.price.toLocaleString("en-IN")}</td>
                <td>{p.total_revenue.toLocaleString("en-IN")}</td>
                <td>{p.total_orders}</td>
                <td style={{ color: p.return_rate > 30 ? "#c0392b" : "inherit" }}>
                  {p.return_rate}%
                </td>
                <td>{p.avg_rating} ★</td>
                <td>
                  <span className={`badge badge-${p.severity.toLowerCase()}`}>
                    {p.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
