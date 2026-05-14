import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── helpers ─────────────────────────────────────── */
const statusColor = (s) => {
  if (s === 'normal') return '#006d2f';
  if (s === 'high')   return '#ba1a1a';
  if (s === 'low')    return '#fd7c31';
  return '#6d7b6c';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e2e5', borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a1c1e' }}>{label}</p>
      <p style={{ color: statusColor(p.payload?.status) }}>
        {p.value} <span style={{ color: '#6d7b6c' }}>{p.payload?.unit}</span>
      </p>
    </div>
  );
};

/* ── Trend Card ───────────────────────────────────── */
const TrendCard = ({ trend }) => {
  const [open, setOpen] = useState(false);
  const { points } = trend;
  if (!points.length) return null;

  const last   = points[points.length - 1];
  const prev   = points[points.length - 2];
  const change = prev ? ((last.value - prev.value) / Math.abs(prev.value || 1)) * 100 : null;
  const color  = statusColor(last.status);

  const chartData = points.map(p => ({ date: p.date, value: p.value, status: p.status, unit: trend.unit }));

  return (
    <div className="bb-card" style={{ padding: '18px 20px', marginBottom: 10, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px ${color}33`, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{trend.parameter_name}</span>
          <span style={{ color: 'var(--secondary)', fontSize: 13 }}>{trend.unit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, color, fontSize: 16 }}>{last.value}</span>
          {change !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: change >= 0 ? 'rgba(186,26,26,0.10)' : 'rgba(0,109,47,0.10)', color: change >= 0 ? '#ba1a1a' : '#006d2f', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{change >= 0 ? 'trending_up' : 'trending_down'}</span>
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          <span style={{ color: 'var(--outline)', fontSize: 12 }}>{points.length} ölçüm</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>{open ? 'expand_less' : 'expand_more'}</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 20 }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6d7b6c' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6d7b6c' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return <circle key={`d-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={statusColor(payload.status)} stroke="#fff" strokeWidth={2} />;
                }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {points.map((p, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: `${statusColor(p.status)}18`, color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}44`, fontWeight: 600 }}>
                {p.date}: {p.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── History Card ─────────────────────────────────── */
const HistoryCard = ({ item }) => {
  const total     = item.result_count || 1;
  const normalPct = Math.round((item.normal_count / total) * 100);
  const pctColor  = normalPct >= 80 ? '#006d2f' : normalPct >= 60 ? '#fd7c31' : '#ba1a1a';

  return (
    <div className="bb-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,109,47,0.08)', border: '1.5px solid rgba(0,109,47,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: 22, color: 'var(--primary)' }}>biotech</span>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{item.date_taken}</p>
          <p style={{ color: 'var(--secondary)', fontSize: 13 }}>{item.result_count} parametre</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {[['Normal', item.normal_count, '#006d2f'], ['Yüksek', item.high_count, '#ba1a1a'], ['Düşük', item.low_count, '#fd7c31']].map(([label, count, color]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color, fontSize: 15 }}>{count}</div>
            <div style={{ fontSize: 11, color: 'var(--outline)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', minWidth: 64 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>{normalPct}%</div>
        <div style={{ fontSize: 11, color: 'var(--outline)', marginTop: 2 }}>normal</div>
      </div>
    </div>
  );
};

/* ── Summary mini card ────────────────────────────── */
const SummaryCard = ({ label, value, color }) => (
  <div className="bb-card" style={{ padding: '20px 24px' }}>
    <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ color: 'var(--secondary)', fontSize: 13, marginTop: 6 }}>{label}</div>
  </div>
);

/* ── Main Page ────────────────────────────────────── */
const HistoryPage = () => {
  const [tab, setTab]         = useState('history');
  const [history, setHistory] = useState([]);
  const [trends, setTrends]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [hRes, tRes] = await Promise.all([
        api.get('blood-tests/history'),
        api.get('blood-tests/trends'),
      ]);
      setHistory(hRes.data);
      setTrends(tRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = trends.filter(t => t.parameter_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="material-symbols-outlined bb-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>progress_activity</span>
    </div>
  );

  return (
    <div className="bb-container bb-fade" style={{ paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--primary)' }}>Tahlil</span> Geçmişi
        </h1>
        <p style={{ color: 'var(--secondary)', marginTop: 6, fontSize: 15 }}>
          Tüm kan tahlillerinizi ve parametre trendlerinizi inceleyin.
        </p>
      </div>

      {/* Tabs */}
      <div className="bb-tabs" style={{ marginBottom: 28 }}>
        {[
          { key: 'history', label: 'Tahlil Listesi',  icon: 'history' },
          { key: 'trends',  label: 'Trend Grafikleri', icon: 'trending_up' },
        ].map(t => (
          <button key={t.key} className={`bb-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── History Tab ─── */}
      {tab === 'history' && (
        history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--outline)' }}>
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: 56, marginBottom: 16, display: 'block', opacity: 0.4 }}>history</span>
            <p style={{ fontSize: 16, marginBottom: 20 }}>Henüz tahlil yüklemediniz.</p>
            <button className="bb-btn bb-btn-primary" onClick={() => navigate('/dashboard')}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
              PDF Yükle
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mini stats */}
            <div className="bb-grid-3" style={{ marginBottom: 8 }}>
              <SummaryCard label="Toplam Tahlil" value={history.length} color="var(--primary)" />
              <SummaryCard label="Toplam Parametre" value={history.reduce((s, h) => s + h.result_count, 0)} color="#6366f1" />
              <SummaryCard label="Ort. Normal %" color="#10b981" value={
                Math.round(history.reduce((s, h) => s + (h.normal_count / (h.result_count || 1)) * 100, 0) / history.length) + '%'
              } />
            </div>
            {history.map(item => <HistoryCard key={item.id} item={item} />)}
          </div>
        )
      )}

      {/* ─── Trends Tab ─── */}
      {tab === 'trends' && (
        <div>
          <div className="bb-input-icon-wrap" style={{ maxWidth: 400, marginBottom: 24 }}>
            <span className="material-symbols-outlined bb-input-icon">search</span>
            <input
              className="bb-input"
              placeholder="Parametre ara… (Ferritin, B12…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--outline)' }}>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: 56, marginBottom: 16, display: 'block', opacity: 0.4 }}>bar_chart</span>
              <p style={{ fontSize: 16 }}>{search ? `"${search}" için sonuç bulunamadı.` : 'Trend verisi için en az 1 tahlil yükleyin.'}</p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--secondary)', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>check_circle</span>
                {filtered.length} parametre — bir parametreye tıklayarak grafiği açın
              </p>
              {filtered.map(t => <TrendCard key={t.parameter_name} trend={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
