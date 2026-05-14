import React, { useState, useEffect } from 'react';
import api from '../api';

const GOALS = [
  { value: 'Kilo ver',      label: 'Kilo Ver',       icon: 'trending_down', color: '#ba1a1a' },
  { value: 'Kas kazan',     label: 'Kas Kazan',      icon: 'fitness_center', color: '#6366f1' },
  { value: 'Enerji artır',  label: 'Enerji Artır',   icon: 'bolt', color: '#fd7c31' },
  { value: 'Sağlıklı kal',  label: 'Sağlıklı Kal',  icon: 'favorite', color: '#006d2f' },
];

const DIETARY = ['Omnivore', 'Vejetaryen', 'Vegan', 'Keto', 'Glutensiz', 'Laktozsuz', 'Akdeniz Diyeti'];

const ProfilePage = () => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [form, setForm] = useState({
    name: '', age: '', weight_kg: '', height_cm: '', goal: '', dietary_preferences: [],
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('users/me');
      const u = resp.data;
      setUser(u);
      setForm({ name: u.name || '', age: u.age || '', weight_kg: u.weight_kg || '', height_cm: u.height_cm || '', goal: u.goal || '', dietary_preferences: u.dietary_preferences || [] });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const payload = {
        name:       form.name || undefined,
        age:        form.age ? parseInt(form.age) : undefined,
        weight_kg:  form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        height_cm:  form.height_cm ? parseFloat(form.height_cm) : undefined,
        goal:       form.goal || undefined,
        dietary_preferences: form.dietary_preferences,
      };
      const resp = await api.patch('users/me', payload);
      setUser(resp.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Kayıt sırasında hata oluştu.'); }
    finally { setSaving(false); }
  };

  const toggleDiet = (d) => setForm(p => ({
    ...p,
    dietary_preferences: p.dietary_preferences.includes(d)
      ? p.dietary_preferences.filter(x => x !== d)
      : [...p.dietary_preferences, d],
  }));

  const bmi = form.weight_kg && form.height_cm
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;

  const bmiLabel = bmi
    ? (bmi < 18.5 ? { text: 'Zayıf', color: '#fd7c31' }
    : bmi < 25   ? { text: 'Normal', color: '#006d2f' }
    : bmi < 30   ? { text: 'Fazla Kilolu', color: '#fd7c31' }
    : { text: 'Obez', color: '#ba1a1a' })
    : null;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="material-symbols-outlined bb-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>progress_activity</span>
    </div>
  );

  return (
    <div className="bb-container bb-fade" style={{ paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--primary)' }}>Profil</span> Bilgileri
        </h1>
        <p style={{ color: 'var(--secondary)', marginTop: 6, fontSize: 15 }}>
          Daha iyi beslenme önerileri için bilgilerini güncel tut.
        </p>
      </div>

      {/* Avatar + BMI */}
      <div className="bb-grid-2" style={{ marginBottom: 24 }}>
        <div className="bb-card" style={{ padding: '28px 24px', background: 'rgba(0,109,47,0.04)', border: '1.5px solid rgba(0,109,47,0.12)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-container), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--primary-shadow)' }}>
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: 36, color: '#fff' }}>person</span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: 'var(--secondary)', fontSize: 14, marginTop: 2 }}>{user?.email}</p>
            {form.goal && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 12px', borderRadius: 99, background: '#fff', border: '1.5px solid rgba(0,109,47,0.2)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                {form.goal}
              </span>
            )}
          </div>
        </div>

        <div className="bb-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--secondary)', fontSize: 13, marginBottom: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vücut Kitle İndeksi (BMI)</p>
          {bmi ? (
            <>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: bmiLabel.color, lineHeight: 1 }}>{bmi}</div>
              <div style={{ marginTop: 10, display: 'inline-block', padding: '5px 18px', borderRadius: 99, background: `${bmiLabel.color}18`, color: bmiLabel.color, fontWeight: 700, fontSize: 14 }}>{bmiLabel.text}</div>
            </>
          ) : (
            <div style={{ color: 'var(--outline)', paddingTop: 16 }}>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: 36, display: 'block', margin: '0 auto 8px', opacity: 0.4 }}>monitor_weight</span>
              <p style={{ fontSize: 13 }}>Boy ve kilo gir</p>
            </div>
          )}
        </div>
      </div>

      {/* Personal info */}
      <div className="bb-card" style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>edit</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600 }}>Kişisel Bilgiler</h3>
        </div>
        <div className="bb-grid-2">
          {[
            { label: 'Ad Soyad', key: 'name', type: 'text', placeholder: 'Adın' },
            { label: 'Yaş',       key: 'age',  type: 'number', placeholder: 'örn. 28', min: 10, max: 120 },
            { label: 'Kilo (kg)', key: 'weight_kg', type: 'number', placeholder: 'örn. 72', min: 20, max: 300 },
            { label: 'Boy (cm)',  key: 'height_cm', type: 'number', placeholder: 'örn. 175', min: 100, max: 250 },
          ].map(f => (
            <div key={f.key} className="bb-input-group">
              <label className="bb-label">{f.label}</label>
              <input
                type={f.type}
                className="bb-input"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                min={f.min} max={f.max}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="bb-card" style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>flag</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600 }}>Beslenme Hedefi</h3>
        </div>
        <div className="bb-grid-2">
          {GOALS.map(g => {
            const active = form.goal === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setForm(p => ({ ...p, goal: p.goal === g.value ? '' : g.value }))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 10, border: `2px solid ${active ? g.color : 'var(--outline-variant)'}`, background: active ? `${g.color}10` : 'transparent', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: g.color }}>{g.icon}</span>
                <span style={{ fontWeight: 600, color: active ? g.color : 'var(--on-surface)', flex: 1 }}>{g.label}</span>
                {active && <span className="material-symbols-outlined" style={{ fontSize: 18, color: g.color }}>check_circle</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary */}
      <div className="bb-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>favorite</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600 }}>Diyet Tarzı</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {DIETARY.map(d => {
            const active = form.dietary_preferences.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDiet(d)}
                style={{ padding: '10px 18px', borderRadius: 99, border: `1.5px solid ${active ? 'var(--primary)' : 'var(--outline-variant)'}`, background: active ? 'rgba(0,109,47,0.08)' : 'transparent', color: active ? 'var(--primary)' : 'var(--secondary)', fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {active && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bb-btn bb-btn-primary"
        style={{ width: '100%', fontSize: 16, padding: '16px' }}
      >
        {saving ? (
          <><span className="material-symbols-outlined bb-spin" style={{ fontSize: 18 }}>progress_activity</span> Kaydediliyor…</>
        ) : saved ? (
          <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> Kaydedildi!</>
        ) : (
          <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Profili Kaydet</>
        )}
      </button>
    </div>
  );
};

export default ProfilePage;
