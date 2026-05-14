import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = !!localStorage.getItem('token');

  // Giriş/Kayıt sayfalarında navbar gösterme
  const hideNav = ['/login', '/register'].includes(location.pathname);
  if (hideNav) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const NavLink = ({ to, label }) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className={`bb-nav-link${active ? ' active' : ''}`}>
        {label}
      </Link>
    );
  };

  return (
    <header className="bb-nav">
      <div className="bb-nav-inner">

        {/* Sol: Logo + Navigasyon */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="bb-logo">BIOBISTRO</Link>
          {isAuth && (
            <nav className="bb-nav-links">
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/history" label="Tahlil Sonuçları" />
              <NavLink to="/saved-recipes" label="Kayıtlı Tarifler" />
            </nav>
          )}
        </div>

        {/* Sağ: Profil + Çıkış */}
        <div className="bb-nav-actions">
          {isAuth ? (
            <>
              <Link
                to="/profile"
                className="bb-icon-btn"
                title="Profil"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--secondary)', textDecoration: 'none', transition: 'all 0.2s', width: 'auto' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'rgba(0,109,47,0.06)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--secondary)'; e.currentTarget.style.background = 'none'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_circle</span>
                Profil
              </Link>
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'none', color: 'var(--secondary)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(186,26,26,0.07)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--secondary)'; e.currentTarget.style.background = 'none'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="bb-btn bb-btn-ghost" style={{ padding: '8px 18px' }}>Giriş Yap</Link>
              <Link to="/register" className="bb-btn bb-btn-primary" style={{ padding: '9px 20px' }}>Kaydol</Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
