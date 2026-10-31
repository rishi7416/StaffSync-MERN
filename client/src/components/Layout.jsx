import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, ClipboardList, LogOut, Bell, Search, Menu, Megaphone, BookOpenCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/leaves', label: 'Leave requests', icon: ClipboardList },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/training', label: 'Training', icon: BookOpenCheck }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const page = navItems.find((item) => item.to === location.pathname)?.label || 'Overview';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Staff<span className="brand-light">Sync</span><small>PEOPLE OPERATIONS</small></span></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}</nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-dot">?</div><strong>Need a hand?</strong><p>Keep your people operations running smoothly.</p></div>
          <button className="nav-link logout-btn" onClick={logout}><LogOut size={18}/><span>Sign out</span></button>
          <div className="sidebar-foot">STAFFSYNC • CAPSTONE PROJECT</div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Menu"><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-right">
            <div className="search-chip"><Search size={16}/><span>People-first, always</span></div>
            <button className="icon-button" aria-label="Notifications"><Bell size={19}/><i/></button>
            <div className="profile-chip"><div className="avatar">{user?.name?.slice(0,1).toUpperCase() || 'A'}</div><div><strong>{user?.name || 'Admin'}</strong><small>{user?.role || 'admin'}</small></div></div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
