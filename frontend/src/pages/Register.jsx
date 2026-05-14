import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuroraAuthPage } from '../components/AuroraBackground';

const Register = () => {
  const [name, setName]         = useState('');
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
      await api.post('auth/register', { name, email, password, dietary_preferences: [] });
      navigate('/login');
    } catch {
      setError('Kayıt sırasında bir hata oluştu. E-posta adresi kullanımda olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraAuthPage>
      <div className="bb-auth-card">

        {/* Accent bar — turuncudan yeşile */}
        <div style={{ height: 4, borderRadius: 99, marginBottom: 32, background: 'linear-gradient(90deg, var(--tertiary-container), var(--primary))' }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--primary)' }}>BIOBISTRO</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>
            Aramıza Katıl
          </h2>
          <p style={{ color: 'var(--secondary)', fontSize: 15 }}>Biyolojik verilerini lezzetli analizlere dönüştür.</p>
        </div>

        {error && (
          <div className="bb-alert bb-alert-error" style={{ marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="bb-input-icon-wrap">
            <span className="material-symbols-outlined bb-input-icon">person</span>
            <input
              type="text"
              placeholder="Ad Soyad"
              className="bb-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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
              ? <><span className="material-symbols-outlined bb-spin" style={{ fontSize: 18 }}>progress_activity</span> Kaydolunuyor…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Hesap Oluştur</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--secondary)', fontSize: 14 }}>
          Zaten hesabın var mı?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Giriş Yap</Link>
        </p>
      </div>
    </AuroraAuthPage>
  );
};

export default Register;
