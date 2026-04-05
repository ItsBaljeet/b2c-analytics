import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://127.0.0.1:5000";

export default function ChurnRisk() {
  const [customers, setCustomers] = useState([]);
  const [filter,    setFilter]    = useState("All");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/churn-risk`)
      .then(res => { setCustomers(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <p className="loading">Running churn prediction model...</p>;
  if (error)   return <p className="error">Could not connect to Flask server.</p>;

  const filtered = filter === "All" ? customers : customers.filter(c => c.risk_level === filter);

  const high   = customers.filter(c => c.risk_level === "High").length;
  const medium = customers.filter(c => c.risk_level === "Medium").length;

  const chartData = [
    { label: "90–100%", count: customers.filter(c => c.churn_prob >= 90).length, color: "#c0392b" },
    { label: "70–89%",  count: customers.filter(c => c.churn_prob >= 70 && c.churn_prob < 90).length, color: "#e74c3c" },
    { label: "50–69%",  count: customers.filter(c => c.churn_prob >= 50 && c.churn_prob < 70).length, color: "#b45309" },
    { label: "40–49%",  count: customers.filter(c => c.churn_prob >= 40 && c.churn_prob < 50).length, color: "#d97706" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Churn Risk Prediction</h1>
        <p className="page-sub">Logistic regression model predicting customers likely to stop buying</p>
      </div>

      <div className="summary-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="summary-card">
          <div className="summary-label">At-Risk Customers</div>
          <div className="summary-value red">{customers.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">High Risk</div>
          <div className="summary-value red">{high}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Medium Risk</div>
          <div className="summary-value amber">{medium}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Avg Churn Prob</div>
          <div className="summary-value amber">
            {customers.length
              ? Math.round(customers.reduce((s, c) => s + c.churn_prob, 0) / customers.length) + "%"
              : "—"}
          </div>
        </div>
      </div>

      <div className="chart-wrap" style={{ marginBottom: "1.5rem" }}>
        <div className="table-title" style={{ marginBottom: "1rem" }}>Churn probability distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [v + " customers", "Count"]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Risk level:</span>
        {["All", "High", "Medium"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="nav-btn"
            style={{ background: filter === f ? "#eff4ff" : "", color: filter === f ? "#1a56db" : "" }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">At-risk customers ({filtered.length})</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>City</th>
              <th>Last Purchase</th>
              <th>Total Orders</th>
              <th>Total Spend (₹)</th>
              <th>Churn Prob</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>{c.city}</td>
                <td>{c.days_since_last} days ago</td>
                <td>{c.total_orders}</td>
                <td>{c.total_spend.toLocaleString("en-IN")}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="risk-bar-wrap">
                      <div
                        className="risk-bar-fill"
                        style={{
                          width: c.churn_prob + "%",
                          background: c.risk_level === "High" ? "#c0392b" : "#b45309"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12 }}>{c.churn_prob}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${c.risk_level.toLowerCase()}`}>
                    {c.risk_level}
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
