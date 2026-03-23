import { NavLink } from "react-router-dom";

export default function Sidebar({ title, items, activePath, onSignOut, footerText }) {
  return (
    <aside className="sidebar">
      <div className="brand">{title}</div>
      <nav>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={activePath === item.path ? "active" : ""}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="secondary-btn" onClick={onSignOut}>
          Logout
        </button>
      </nav>
      <div className="footer-card">{footerText}</div>
    </aside>
  );
}
