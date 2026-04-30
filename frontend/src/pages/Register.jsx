import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
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
      await api.post('auth/register', {
        name,
        email,
        password,
        dietary_preferences: []
      });
      navigate('/login');
    } catch (err) {
      setError('Kayıt sırasında bir hata oluştu. E-posta adresi kullanımda olabilir.');
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
          Aramıza <span style={{ color: 'var(--primary)' }}>Katıl</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Biyolojik verilerini lezzetli analizlere dönüştür.</p>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
          <input 
            type="text" 
            placeholder="Ad Soyad" 
            className="input-field" 
            style={{ paddingLeft: '45px' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
          <UserPlus size={20} />
          {loading ? 'Kaydolunuyor...' : 'Hesap Oluştur'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '15px' }}>
        Zaten hesabın var mı?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Giriş Yap</Link>
      </p>
    </div>
  );
};

export default Register;

