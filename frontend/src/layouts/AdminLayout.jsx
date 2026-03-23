import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HeaderBar from "../components/HeaderBar.jsx";

const navItems = [
  { label: "Dashboard", path: "/admin" },
  { label: "All Complaints", path: "/admin/complaints" },
  { label: "Escalations", path: "/admin/escalations" },
  { label: "Routing Monitor", path: "/admin/routing" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Reports", path: "/admin/reports" },
  { label: "Settings", path: "/admin/settings" }
];

export default function AdminLayout() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <Sidebar
        title="ResolveAI Admin"
        items={navItems}
        activePath={location.pathname}
        onSignOut={handleLogout}
        footerText="Operational command and analytics"
      />
      <main className="content">
        <HeaderBar
          title="Admin Control Center"
          subtitle="Live routing, escalations, and analytics"
        />
        <Outlet />
      </main>
    </div>
  );
}
