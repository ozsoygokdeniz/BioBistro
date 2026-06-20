import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ContainerScroll } from '../components/ContainerScroll';
import { FileUpload } from '../components/FileUpload';
import { DashboardHero, EmptyDashboardRight } from '../components/DashboardEmpty';

/* ── status helpers ─────────────────────────────── */
const statusPillClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'normal') return 'bb-pill bb-pill-normal';
  if (s === 'high') return 'bb-pill bb-pill-high';
  if (s === 'low') return 'bb-pill bb-pill-low';
  return 'bb-pill bb-pill-unknown';
};

const statusLabel = (s) => {
  const v = (s || '').toLowerCase();
  if (v === 'normal') return 'Normal';
  if (v === 'high') return 'Yüksek';
  if (v === 'low') return 'Düşük';
  return 'Bilinmiyor';
};

const statusValueColor = (s) => {
  const v = (s || '').toLowerCase();
  if (v === 'high') return 'var(--error)';
  if (v === 'low') return 'var(--tertiary-container)';
  return 'var(--on-surface)';
};

/* ── Dashboard ──────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [insight, setInsight] = useState(null);
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const [refreshingMeals, setRefreshingMeals] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('users/me');
      setUser(resp.data);
      if (!resp.data.dietary_preferences || resp.data.dietary_preferences.length === 0) {
        navigate('/onboarding');
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setPdfName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadResp = await api.post('blood-tests/upload', formData);
      const testId = uploadResp.data.blood_test_id;
      const testResp = await api.get(`blood-tests/${testId}`);
      const data = testResp.data;
      const counts = { normal: 0, high: 0, low: 0 };
      data.results.forEach(r => {
        const st = (r.status || '').toLowerCase();
        if (counts[st] !== undefined) counts[st]++;
      });
      setResults({ ...data, summary: counts });
      fetchAIInsight(testId);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      alert(`Yükleme Hatası: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const fetchAIInsight = async (testId) => {
    setFetchingInsight(true);
    try {
      const resp = await api.post(`blood-tests/${testId}/insights`);
      setInsight(resp.data);
    } catch {
      setInsight({
        summary: 'AI analizi şu an yapılamıyor, lütfen daha sonra tekrar deneyin.',
        potential_deficiencies: [], daily_plans: [], foods_to_avoid: [], general_advice: []
      });
    } finally {
      setFetchingInsight(false);
    }
  };

  const handleRefreshMeal = async (meal, dayIdx, mealIdx) => {
    if (!results) return;
    const key = `${dayIdx}-${mealIdx}`;
    setRefreshingMeals(p => ({ ...p, [key]: true }));
    try {
      const resp = await api.post(`blood-tests/${results.id}/insights/refresh`, {
        meal_type: meal.meal_type,
        rejected_food_name: meal.food_name,
      });
      setInsight(prev => {
        const newPlans = [...prev.daily_plans];
        newPlans[dayIdx].meals[mealIdx] = resp.data;
        return { ...prev, daily_plans: newPlans };
      });
    } catch {
      alert('Yemek yenilenirken bir hata oluştu.');
    } finally {
      setRefreshingMeals(p => ({ ...p, [key]: false }));
    }
  };

  const handleSaveRecipe = async () => {
    if (!insight) return;
    
    try {
      const client_id = Date.now().toString();
      const recipe_data = {
        pdfName: pdfName || results?.date_taken || 'Bilinmeyen PDF',
        date: new Date().toLocaleDateString('tr-TR'),
        insight: insight,
      };

      await api.post('recipes/', {
        client_id,
        recipe_type: 'plan',
        recipe_data
      });
      
      // Reset dashboard
      setResults(null);
      setInsight(null);
      setPdfName('');
      
      // Show toast instead of alert
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Tarif planı kaydedilirken bir hata oluştu.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="material-symbols-outlined bb-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>progress_activity</span>
    </div>
  );

  const displayedResults = results
    ? (showAll ? results.results : results.results.slice(0, 8))
    : [];

  return (
    <div className="bb-container bb-fade">

      {/* ── Welcome ────────────────────────── */}
      <section className="bb-section" style={{ paddingTop: 8 }}>
        {results ? (
          /* Sonraç var — kısa basit başlık */
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', lineHeight: 1.15 }}>
                Merhaba, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0] || 'Kullanıcı'}</span>
              </h1>
              <p style={{ color: 'var(--secondary)', fontSize: 15, marginTop: 6 }}>
                Tahlil Tarihi: {results.date_taken} — {results.results.length} parametre analiz edildi.
              </p>
            </div>
          </div>
        ) : (
          /* Boş durum — zengin animasyonlu hero */
          <DashboardHero userName={user?.name?.split(' ')[0]} />
        )}
      </section>

      {/* ── Main grid ─────────────────────────── */}
      <section className="bb-section">
        <div className="bb-grid-dash">

          {/* ─── Left column ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>

            {/* Upload card — FileUpload component */}
            <div className="bb-upload-wrapper">
              {uploading ? (
                <div className="bb-upload-loading">
                  <span className="material-symbols-outlined icon-filled bb-spin" style={{ fontSize: 36, color: 'var(--primary)' }}>progress_activity</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--on-surface)', marginTop: 12 }}>PDF Çözümleniyor…</p>
                  <p style={{ fontSize: 14, color: 'var(--secondary)', marginTop: 6 }}>Lütfen bekleyin…</p>
                </div>
              ) : (
                <FileUpload
                  onChange={(newFiles) => {
                    if (newFiles.length > 0) handleFileUpload(newFiles[0]);
                  }}
                  accept="application/pdf"
                  label="E-Nabız PDF'ini Yükle"
                  hint="PDF dosyanızı buraya sürükleyin veya tıklayın"
                />
              )}
            </div>

            {/* Summary stat cards */}
            {results && (
              <div className="bb-fade">
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, marginBottom: 14 }}>
                  Tahlil Özeti{' '}
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, color: 'var(--secondary)' }}>
                    ({results.date_taken})
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Normal */}
                  <div className="bb-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,109,47,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>check_circle</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>Normal</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>
                      {results.summary.normal}
                    </span>
                  </div>

                  {/* Yüksek */}
                  <div className="bb-stat-card" style={{ borderLeft: '4px solid var(--error)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(186,26,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--error)' }}>arrow_upward</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>Yüksek</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, color: 'var(--error)' }}>
                      {results.summary.high}
                    </span>
                  </div>

                  {/* Düşük */}
                  <div className="bb-stat-card" style={{ borderLeft: '4px solid var(--tertiary-container)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(253,124,49,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--tertiary-container)' }}>arrow_downward</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>Düşük</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, color: 'var(--tertiary-container)' }}>
                      {results.summary.low}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right column: results table ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>

            {results ? (
              <div className="bb-card bb-fade" style={{ borderRadius: 12, overflow: 'hidden', padding: 0 }}>
                {/* Table header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(188,202,186,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700 }}>
                    Bulgular <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 400, color: 'var(--secondary)' }}>({results.results.length})</span>
                  </h2>
                  <button
                    className="bb-btn-ghost"
                    onClick={() => setShowAll(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                  >
                    {showAll ? 'Daha Az' : 'Tümünü Gör'}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{showAll ? 'expand_less' : 'chevron_right'}</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="bb-table">
                    <thead>
                      <tr>
                        <th>Test Adı</th>
                        <th>Sonuç</th>
                        <th>Referans Aralığı</th>
                        <th style={{ textAlign: 'right' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.parameter_name}</td>
                          <td style={{ color: statusValueColor(r.status), fontWeight: (r.status || '').toLowerCase() !== 'normal' ? 600 : 400 }}>
                            {r.original_value}
                          </td>
                          <td style={{ color: 'var(--secondary)' }}>{r.reference_range || '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={statusPillClass(r.status)}>
                              {statusLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Zengin animasyonlu boş durum */
              <EmptyDashboardRight />
            )}
          </div>
        </div>
      </section>

      {/* ── AI Nutrition Guide ─────────────────── */}
      <section className="bb-section bb-ai-section" style={{ padding: 'var(--stack-md) var(--stack-lg)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginBottom: 'var(--stack-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: 30, color: 'var(--primary)' }}>auto_awesome</span>
          AI Beslenme Rehberi
        </h2>

        {fetchingInsight ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="material-symbols-outlined bb-spin" style={{ fontSize: 36, color: 'var(--primary)', display: 'block', margin: '0 auto 12px' }}>progress_activity</span>
            <p style={{ color: 'var(--secondary)', fontSize: 15 }}>Gemini tahlillerini yorumluyor…</p>
            <p style={{ color: 'var(--outline)', fontSize: 13, marginTop: 6 }}>Bu işlem birkaç saniye sürebilir.</p>
          </div>
        ) : insight ? (
          <div className="bb-fade">
            {/* Summary */}
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.7, marginBottom: 'var(--stack-md)', color: 'var(--on-surface)' }}>
              {insight.summary}
            </p>

            {/* 3-column insight cards */}
            <div className="bb-grid-3" style={{ marginBottom: 'var(--stack-md)' }}>

              {/* Deficiencies */}
              {insight.potential_deficiencies?.length > 0 && (
                <div className="bb-card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>warning</span>
                    Tespit Edilen Eksiklikler
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insight.potential_deficiencies.map((d, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 15, color: 'var(--on-surface)' }}>
                        <span style={{ color: 'var(--tertiary-container)', marginTop: 1, flexShrink: 0 }}>•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Foods to avoid */}
              {insight.foods_to_avoid?.length > 0 && (
                <div className="bb-card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>do_not_disturb</span>
                    Kaçınılması Gerekenler
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insight.foods_to_avoid.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 15, color: 'var(--on-surface)' }}>
                        <span style={{ color: 'var(--error)', marginTop: 1, flexShrink: 0 }}>•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* General advice */}
              {insight.general_advice?.length > 0 && (
                <div className="bb-card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lightbulb</span>
                    Genel Tavsiyeler
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insight.general_advice.map((a, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 15, color: 'var(--on-surface)' }}>
                        <span style={{ color: 'var(--primary)', marginTop: 1, flexShrink: 0 }}>•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bb-alert bb-alert-warning" style={{ marginTop: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>info</span>
              <p style={{ fontSize: 13, lineHeight: 1.55 }}>
                Bu bilgiler yapay zeka tarafından üretilmiştir. Kesin tanı ve tedavi için mutlaka doktorunuza danışınız.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--secondary)' }}>
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: 52, color: 'var(--outline-variant)', display: 'block', margin: '0 auto 12px' }}>nutrition</span>
            <p style={{ fontSize: 15 }}>Tahlil yüklediğinde kişisel beslenme tavsiyelerin burada görünecek.</p>
          </div>
        )}
      </section>

      {/* ── Meal Plans ────────────────────────── */}
      {insight?.daily_plans?.length > 0 && (
        <section className="bb-section bb-fade bb-meal-plans-section">
          <ContainerScroll
            titleComponent={
              <div className="bb-meal-plans-header">
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: 30, color: 'var(--primary)' }}>restaurant_menu</span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700 }}>
                  Örnek Beslenme Planı
                </h2>
              </div>
            }
          >
            {/* All days inside one single parallax card */}
            <div className="bb-scroll-inner">
              {insight.daily_plans.map((dayPlan, dayIdx) => (
                <div key={dayIdx} className="bb-day-block">
                  {/* Day header */}
                  <div className="bb-day-title-block">
                    <span className="bb-day-badge">{dayIdx + 1}. Gün</span>
                    <h3 className="bb-day-name">{dayPlan.day_name}</h3>
                  </div>

                  {/* 3-column meal grid */}
                  <div className="bb-grid-3">
                    {dayPlan.meals.map((meal, i) => {
                      const isRefreshing = refreshingMeals[`${dayIdx}-${i}`];
                      return (
                        <div key={i} className="bb-meal-card">
                          {meal.image_url && (
                            <div className="bb-meal-img-wrap">
                              <img src={meal.image_url} alt={meal.food_name} />
                              <div className="bb-meal-img-overlay" />
                              <div className="bb-meal-time-badge">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                                {meal.prep_time}
                              </div>
                            </div>
                          )}
                          <div className="bb-meal-body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600 }}>{meal.meal_type}</h3>
                              <button
                                onClick={() => handleRefreshMeal(meal, dayIdx, i)}
                                disabled={isRefreshing}
                                title="Farklı bir tarif öner"
                                style={{ background: 'none', border: 'none', cursor: isRefreshing ? 'not-allowed' : 'pointer', color: 'var(--secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 4, borderRadius: 6 }}
                                onMouseOver={e => !isRefreshing && (e.currentTarget.style.color = 'var(--primary)')}
                                onMouseOut={e => (e.currentTarget.style.color = 'var(--secondary)')}
                              >
                                <span className={`material-symbols-outlined${isRefreshing ? ' bb-spin' : ''}`} style={{ fontSize: 20 }}>refresh</span>
                              </button>
                            </div>
                            <p style={{ fontWeight: 600, marginBottom: 4, opacity: isRefreshing ? 0.4 : 1 }}>{meal.food_name}</p>
                            <p style={{ fontSize: 13, color: 'var(--secondary)', lineHeight: 1.55, opacity: isRefreshing ? 0.4 : 1, marginBottom: 14 }}>{meal.reason}</p>
                            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span className="bb-tag" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>AI Öneri</span>
                              <span className="bb-tag" style={{ background: 'rgba(253,124,49,0.10)', color: 'var(--tertiary-container)' }}>{meal.meal_type}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ContainerScroll>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
            <button 
              onClick={handleSaveRecipe} 
              className="bb-btn bb-btn-primary" 
              style={{ 
                padding: '14px 40px', 
                fontSize: '18px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                borderRadius: '50px',
                boxShadow: '0 8px 16px rgba(0, 109, 47, 0.2)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>save</span>
              Tarifi Kaydet
            </button>
          </div>
        </section>
      )}

      {/* ── Toast Notification ── */}
      {showToast && (
        <div className="bb-toast">
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: 24, color: 'white' }}>check_circle</span>
          Tarif başarıyla kaydedildi!
        </div>
      )}

    </div>
  );
};

export default Dashboard;
