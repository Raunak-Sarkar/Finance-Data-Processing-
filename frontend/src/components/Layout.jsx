import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Layout() {
  const { user, logout, isAnalyst, isAdmin } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>Finance Hub</strong>
            <span className="muted small">Dashboard</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Overview
          </NavLink>
          {isAnalyst && (
            <NavLink to="/records" className={({ isActive }) => (isActive ? "active" : "")}>
              Records
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
              Users
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar" aria-hidden>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div>
              <div className="user-name">{user?.name}</div>
              <span className={`role-pill role-${user?.role?.toLowerCase()}`}>{user?.role}</span>
            </div>
          </div>
          <button type="button" className="btn ghost full" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
