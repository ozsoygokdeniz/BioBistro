import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // urlencoded formatı FastAPI ile daha iyi çalışır (OAuth2 Password Bearer)
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await api.post('auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      localStorage.setItem('token', response.data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Geçersiz e-posta veya şifre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '60px auto',
      padding: '44px',
      background: '#FFFFFF',
      border: '1px solid var(--glass-border)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(93,187,99,0.10)',
    }} className="fade-in">

      {/* Top green accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 99, marginBottom: 32 }} />

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 className="heading" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Tekrar <span style={{ color: 'var(--primary)' }}>Hoş Geldin</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sağlık yolculuğuna devam et.</p>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
          <input 
            type="email" 
            placeholder="E-posta adresi" 
            className="input-field" 
            style={{ paddingLeft: '45px' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
          <input 
            type="password" 
            placeholder="Şifre" 
            className="input-field" 
            style={{ paddingLeft: '45px' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          <LogIn size={20} />
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '15px' }}>
        Hesabın yok mu?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Kaydol</Link>
      </p>
    </div>
  );
};

export default Login;
