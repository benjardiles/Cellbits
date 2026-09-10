import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo-cellbits.png';

const navItems = [
  { to: '/', label: 'Panel', end: true },
  { to: '/inventario', label: 'Inventario', end: true },
  { to: '/movimientos', label: 'Movimientos', end: false },
  { to: '/servicios', label: 'Servicios', end: false },
];

function getQuickAction(pathname) {
  if (pathname.startsWith('/inventario') || pathname.startsWith('/productos')) {
    return { label: '+ Añadir producto', to: '/productos/nuevo' };
  }
  if (pathname.startsWith('/servicios')) {
    return { label: '+ Nuevo servicio', to: '/servicios/nuevo' };
  }
  return null;
}

function HamburgerIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const quickAction = getQuickAction(location.pathname);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function goTo(path) {
    setMobileOpen(false);
    navigate(path);
  }

  return (
    <div>
      <header
        style={{
          background: '#000000',
          color: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={logo} alt="Cellbits" style={{ width: 32, height: 32, borderRadius: '999px', display: 'block' }} />
              <strong className="brand-word" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '0.02em' }}>CellBits</strong>
            </div>
            <nav className="header-nav-desktop" style={{ gap: 4 }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    color: isActive ? '#f4cd79' : '#a1a1aa',
                    fontWeight: isActive ? 700 : 500,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: isActive ? 'rgba(203,164,78,0.16)' : 'transparent',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="header-actions-desktop" style={{ alignItems: 'center', gap: 16 }}>
            {quickAction && (
              <button type="button" onClick={() => navigate(quickAction.to)} className="btn btn-sm">
                {quickAction.label}
              </button>
            )}
            <span className="muted" style={{ color: '#a1a1aa', fontSize: 14 }}>
              {user?.username}
            </span>
            <button type="button" onClick={handleLogout} className="btn btn-sm btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}>
              Salir
            </button>
          </div>
          <button
            type="button"
            className="header-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>

        {mobileOpen && (
          <div style={{ background: '#fff', color: 'var(--text)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    padding: '14px 12px',
                    borderRadius: 8,
                    fontSize: 15,
                    color: isActive ? 'var(--primary)' : 'var(--text)',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? '#fbf1de' : 'transparent',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
              {quickAction && (
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 8, justifyContent: 'center' }}
                  onClick={() => goTo(quickAction.to)}
                >
                  {quickAction.label}
                </button>
              )}
            </nav>
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{user?.username}</span>
              <button type="button" onClick={handleLogout} className="btn btn-sm btn-secondary">
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Outlet />
      </main>
    </div>
  );
}
