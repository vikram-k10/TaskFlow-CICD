import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The frame around every logged-in page: sidebar on desktop, slide-in menu on mobile.
export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="btn btn-secondary"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
        >
          Menu
        </button>
        <span className="brand-name">TaskFlow</span>
      </header>

      <aside id="sidebar" className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span className="brand-name">TaskFlow</span>
        </div>

        <nav className="nav" aria-label="Main">
          <NavLink to="/" end onClick={closeMenu}>Dashboard</NavLink>
          <NavLink to="/workspaces" onClick={closeMenu}>Workspaces</NavLink>
          <NavLink to="/tasks" onClick={closeMenu}>Tasks</NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="user-name">{user?.name}</div>
          <div className="user-email">{user?.email}</div>
          <button className="btn btn-secondary btn-block" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      {menuOpen && <div className="backdrop" onClick={closeMenu} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
