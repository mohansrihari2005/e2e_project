import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import UserLayout from "./layouts/UserLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import UserDashboard from "./pages/user/UserDashboard.jsx";
import SubmitComplaint from "./pages/user/SubmitComplaint.jsx";
import MyComplaints from "./pages/user/MyComplaints.jsx";
import StatusTrackerPage from "./pages/user/StatusTrackerPage.jsx";
import FeedbackPage from "./pages/user/FeedbackPage.jsx";
import UserSettings from "./pages/user/UserSettings.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AllComplaints from "./pages/admin/AllComplaints.jsx";
import Escalations from "./pages/admin/Escalations.jsx";
import RoutingMonitor from "./pages/admin/RoutingMonitor.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import Reports from "./pages/admin/Reports.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

const STORAGE_KEY = "complaint-platform-session";

const readSession = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const writeSession = (session) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
};

const ProtectedRoute = ({ session, role, children }) => {
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (role && session.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  const [session, setSession] = useState(() => readSession());
  const { theme, setTheme } = useTheme();

  const value = useMemo(
    () => ({
      session,
      theme,
      setTheme,
      signIn: (data) => {
        writeSession(data);
        setSession(data);
      },
      signOut: () => {
        clearSession();
        setSession(null);
      }
    }),
    [session, theme, setTheme]
  );

  return (
    <AuthProvider value={value}>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/user"
          element={
            <ProtectedRoute session={session} role="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="submit" element={<SubmitComplaint />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="status" element={<StatusTrackerPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="settings" element={<UserSettings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session} role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<AllComplaints />} />
          <Route path="escalations" element={<Escalations />} />
          <Route path="routing" element={<RoutingMonitor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
