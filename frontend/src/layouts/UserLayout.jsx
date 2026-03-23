import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HeaderBar from "../components/HeaderBar.jsx";

const navItems = [
  { label: "Dashboard", path: "/user" },
  { label: "Submit Complaint", path: "/user/submit" },
  { label: "My Complaints", path: "/user/complaints" },
  { label: "Status Tracker", path: "/user/status" },
  { label: "Feedback", path: "/user/feedback" },
  { label: "Settings", path: "/user/settings" }
];

export default function UserLayout() {
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
        title="ResolveAI"
        items={navItems}
        activePath={location.pathname}
        onSignOut={handleLogout}
        footerText="Enterprise complaint resolution suite"
      />
      <main className="content">
        <HeaderBar
          title="Customer Workspace"
          subtitle="AI-backed complaint support"
        />
        <Outlet />
      </main>
    </div>
  );
}
