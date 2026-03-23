import { useAuth } from "../context/AuthContext.jsx";

export default function HeaderBar({ title, subtitle }) {
  const auth = useAuth();
  return (
    <header className="header-bar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">
        <button
          className="toggle"
          type="button"
          onClick={() => auth.setTheme(auth.theme === "light" ? "dark" : "light")}
        >
          {auth.theme === "light" ? "Dark" : "Light"} Mode
        </button>
        <div className="glass card">
          <div style={{ fontWeight: 600 }}>{auth.session?.name || "User"}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            {auth.session?.role === "admin" ? "Administrator" : "Customer"}
          </div>
        </div>
      </div>
    </header>
  );
}
