import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API = "http://127.0.0.1:5000";
const COLORS = { Champions: "#1a56db", Loyal: "#166534", "At-Risk": "#b45309", Lost: "#c0392b" };
const SEG_CLASS = { Champions: "seg-champions", Loyal: "seg-loyal", "At-Risk": "seg-atrisk", Lost: "seg-lost" };

export default function CustomerSegments() {
  const [data,    setData]    = useState(null);
  const [active,  setActive]  = useState("Champions");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/customer-segments`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <p className="loading">Running RFM segmentation...</p>;
  if (error)   return <p className="error">Could not connect to Flask server.</p>;

  const total    = data.total_customers;
  const segments = Object.entries(data.counts).map(([name, value]) => ({ name, value }));
  const topCustomers = data.top_per_segment[active] || [];

  const segmentInfo = {
    Champions: "Bought recently, buy often, spend the most. Reward and retain these customers.",
    Loyal:     "Buy regularly and spend well. Upsell opportunities are strong here.",
    "At-Risk": "Used to buy but haven't recently. Target with win-back campaigns.",
    Lost:      "Haven't bought in a long time and low engagement. Hard to recover.",
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customer Segments</h1>
        <p className="page-sub">RFM model — Recency, Frequency, Monetary segmentation</p>
      </div>

      <div className="segment-grid">
        {Object.entries(data.counts).map(([name, count]) => (
          <div
            key={name}
            className={`segment-card ${SEG_CLASS[name]} ${active === name ? "active-seg" : ""}`}
            style={{ cursor: "pointer", opacity: active === name ? 1 : 0.7 }}
            onClick={() => setActive(name)}
          >
            <div className="segment-name">{name}</div>
            <div className="segment-count" style={{ color: COLORS[name] }}>{count}</div>
            <div className="segment-pct">{Math.round(count / total * 100)}% of customers</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
        <div className="chart-wrap">
          <div className="table-title" style={{ marginBottom: "1rem" }}>Segment distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={segments}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                labelLine={false}
              >
                {segments.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v + " customers"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrap">
          <div className="table-title" style={{ marginBottom: "8px" }}>{active}</div>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "1rem", lineHeight: 1.6 }}>
            {segmentInfo[active]}
          </p>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Top spenders in this segment</div>
          {topCustomers.map((c, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", borderBottom: "1px solid #f0f0ea",
              fontSize: "13px"
            }}>
              <span>{c.name}</span>
              <span style={{ color: "#166534", fontWeight: 500 }}>
                ₹{c.monetary.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Top customers — {active}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Days Since Purchase</th>
              <th>Total Orders</th>
              <th>Total Spend (₹)</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>{c.city}</td>
                <td>{c.recency} days</td>
                <td>{c.frequency}</td>
                <td>{c.monetary.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
