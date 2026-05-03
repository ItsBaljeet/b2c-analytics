import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Summary from "./components/Summary";
import PoorProducts from "./pages/PoorProducts";
import CustomerSegments from "./pages/CustomerSegments";
import ChurnRisk from "./pages/ChurnRisk";
import "./App.css";

const NAV = [
  { to: "/",         label: "Dashboard"          },
  { to: "/products", label: "Poor Products"      },
  { to: "/segments", label: "Customer Segments"  },
  { to: "/churn",    label: "Churn Risk"         },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/logo.png" alt="Anabasis Logo" style={{ height: "60px", width: "60px", objectFit: "contain", borderRadius: "6px" }} />
            <span className="nav-title">Anabasis</span>
          </div>
          <div className="nav-links">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/"         element={<DashboardPage />} />
            <Route path="/products" element={<PoorProducts />} />
            <Route path="/segments" element={<CustomerSegments />} />
            <Route path="/churn"    element={<ChurnRisk />} />
          </Routes>
        </main>

        <footer className="footer">
          Data Analytics Software -          Tanzeel Imaad | B.Sc. | JMI
        </footer>
      </div>
    </BrowserRouter>
  );
}

function DashboardPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-sub">Real-time insights for your business</p>
      </div>
      <Summary />
      <div className="quick-nav">
        <h2 className="section-title">Explore Analytics</h2>
        <div className="quick-grid">
          <NavLink to="/products" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <div className="quick-icon red">!</div>
              <div className="quick-label">Poor Products</div>
              <div className="quick-desc">Identify underperforming products by revenue, returns and ratings</div>
              <div className="quick-link">View report →</div>
            </div>
          </NavLink>
          <NavLink to="/segments" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <div className="quick-icon blue">◈</div>
              <div className="quick-label">Customer Segments</div>
              <div className="quick-desc">RFM-based segmentation: Champions, Loyal, At-Risk, Lost</div>
              <div className="quick-link">View segments →</div>
            </div>
          </NavLink>
          <NavLink to="/churn" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <div className="quick-icon amber">▲</div>
              <div className="quick-label">Churn Risk</div>
              <div className="quick-desc">ML-powered prediction of customers likely to leave</div>
              <div className="quick-link">View predictions →</div>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
