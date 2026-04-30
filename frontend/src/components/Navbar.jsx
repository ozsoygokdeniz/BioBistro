import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{
      margin: '16px 20px',
      padding: '14px 28px',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.90)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '20px',
      boxShadow: '0 4px 20px rgba(93,187,99,0.10)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(93,187,99,0.30)',
        }}>
          <Activity size={22} color="#fff" />
        </div>
        <span className="heading" style={{ fontSize: '1.35rem' }}>
          Bio<span style={{ color: 'var(--primary)' }}>Bistro</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={17} />
              <span>Panel</span>
            </Link>
            <Link to="/onboarding" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={17} />
              <span>Profil / Alerjiler</span>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'var(--danger-bg)',
                border: '1.5px solid transparent',
                borderRadius: 10,
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '14px',
                padding: '8px 14px',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={16} />
              <span>Çıkış</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Giriş Yap</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: '14px' }}>
              Kaydol
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
