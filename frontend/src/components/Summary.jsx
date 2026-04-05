import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

export default function Summary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/summary`)
      .then(res => setData(res.data))
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="error">Could not connect to Flask server. Make sure it is running on port 5000.</p>;
  if (!data)  return <p className="loading">Loading summary...</p>;

  const cards = [
    { label: "Total Revenue",     value: "₹" + data.total_revenue.toLocaleString("en-IN"), color: "blue"  },
    { label: "Total Orders",      value: data.total_orders.toLocaleString(),                color: ""      },
    { label: "Return Rate",       value: data.return_rate + "%",                            color: data.return_rate > 15 ? "red" : "green" },
    { label: "Active Customers",  value: data.active_customers,                             color: "blue"  },
    { label: "Total Products",    value: data.total_products,                               color: ""      },
    { label: "Flagged Products",  value: data.flagged_products,                             color: data.flagged_products > 0 ? "red" : "green" },
  ];

  return (
    <div className="summary-grid">
      {cards.map(c => (
        <div key={c.label} className="summary-card">
          <div className="summary-label">{c.label}</div>
          <div className={`summary-value ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
