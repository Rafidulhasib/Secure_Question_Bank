import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

function roleLabel(role) {
  const labels = {
    SuperAdmin: "Institution Admin",
    SubAdmin: "Campus Admin",
    User: "Teacher"
  };
  return labels[role] || role;
}

export default function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setGlobalSearch(params.get("search") || "");
  }, [location.search]);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/questions", label: "Exam Questions", icon: ClipboardList, show: true },
    { to: "/courses", label: "Subjects", icon: BookOpen, show: auth.isSuperAdmin },
    { to: "/users", label: "Teachers", icon: Users, show: auth.isSuperAdmin }
  ].filter((item) => item.show);

  function logout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  function toggleMenu() {
    if (window.matchMedia("(max-width: 860px)").matches) {
      setOpen(true);
      return;
    }
    setCollapsed((current) => !current);
  }

  function submitGlobalSearch(event) {
    event.preventDefault();
    const search = globalSearch.trim();
    navigate(search ? `/questions?search=${encodeURIComponent(search)}` : "/questions");
    setOpen(false);
  }

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <div>
            <strong>Campus Question</strong>
            <span>Vault</span>
          </div>
          <button className="sidebar-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setOpen(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-profile">
          <span className="avatar">{auth.user?.name?.slice(0, 1)?.toUpperCase()}</span>
          <div>
            <strong>{auth.user?.name}</strong>
            <span>{roleLabel(auth.user?.role)}</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Toggle menu" onClick={toggleMenu}>
            <Menu size={20} />
          </button>
          <form className="topbar-search" onSubmit={submitGlobalSearch}>
            <button className="topbar-search-submit" type="submit" aria-label="Search exam questions">
              <Search size={17} />
            </button>
            <input
              value={globalSearch}
              placeholder="Search secure exam questions"
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
          </form>
          <div className="topbar-actions">
            <span className="role-chip">
              <Shield size={15} />
              {roleLabel(auth.user?.role)}
            </span>
            <button className="button button-ghost" type="button" onClick={logout}>
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
