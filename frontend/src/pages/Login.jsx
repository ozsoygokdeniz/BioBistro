import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuroraAuthPage } from '../components/AuroraBackground';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const response = await api.post('auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      localStorage.setItem('token', response.data.access_token);
      window.location.href = '/dashboard';
    } catch {
      setError('Geçersiz e-posta veya şifre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraAuthPage>
      <div className="bb-auth-card">

        {/* Accent bar — yeşilden turuncuya */}
        <div style={{ height: 4, borderRadius: 99, marginBottom: 32, background: 'linear-gradient(90deg, var(--primary), var(--tertiary-container))' }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--primary)' }}>BIOBISTRO</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>
            Tekrar Hoş Geldin
          </h2>
          <p style={{ color: 'var(--secondary)', fontSize: 15 }}>Sağlık yolculuğuna devam et.</p>
        </div>

        {error && (
          <div className="bb-alert bb-alert-error" style={{ marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="bb-input-icon-wrap">
            <span className="material-symbols-outlined bb-input-icon">mail</span>
            <input
              type="email"
              placeholder="E-posta adresi"
              className="bb-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bb-input-icon-wrap">
            <span className="material-symbols-outlined bb-input-icon">lock</span>
            <input
              type="password"
              placeholder="Şifre"
              className="bb-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bb-btn bb-btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '14px', fontSize: 15 }}
          >
            {loading
              ? <><span className="material-symbols-outlined bb-spin" style={{ fontSize: 18 }}>progress_activity</span> Giriş yapılıyor…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span> Giriş Yap</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--secondary)', fontSize: 14 }}>
          Hesabın yok mu?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Kaydol</Link>
        </p>
      </div>
    </AuroraAuthPage>
  );
};

export default Login;
