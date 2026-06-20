import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const SavedRecipes = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'recipes'
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const resp = await api.get('recipes/');
      setSavedItems(resp.data);
    } catch (err) {
      console.error('Kayıtlı tarifler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    try {
      await api.delete(`recipes/${clientId}`);
      setSavedItems(prev => prev.filter(item => item.client_id !== clientId));
      if (selectedRecipe?.client_id === clientId) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      console.error('Tarif silinirken hata oluştu:', err);
      alert('Silme işlemi başarısız oldu.');
    }
  };

  // Filter items by type
  const filteredItems = savedItems.filter(item => {
    if (activeTab === 'plans') return item.recipe_type === 'plan';
    if (activeTab === 'recipes') return item.recipe_type === 'recipe';
    return false;
  });

  // Sort so newest are first
  filteredItems.sort((a, b) => {
    const timeA = parseFloat(a.client_id) || a.id;
    const timeB = parseFloat(b.client_id) || b.id;
    return timeB - timeA;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  const detailVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="bb-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}
      >
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: 28 }}>bookmarks</span>
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)', lineHeight: 1.2 }}>
            Kayıtlı Tarifler
          </h1>
          <p style={{ color: 'var(--secondary)', fontSize: '15px', marginTop: '4px' }}>
            {savedItems.length} kaydedilmiş öğeniz bulunuyor.
          </p>
        </div>
      </motion.div>

      {/* ── Tabs Selector ── */}
      <div className="bb-tabs" style={{ marginBottom: '24px' }}>
        <button 
          className={`bb-tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => { setActiveTab('plans'); setSelectedRecipe(null); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant_menu</span>
          3 Günlük Planlar
        </button>
        <button 
          className={`bb-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('recipes'); setSelectedRecipe(null); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
          Tekli Tarifler
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <span className="material-symbols-outlined bb-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>progress_activity</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface-container-lowest)', borderRadius: '24px', border: '1px dashed var(--outline-variant)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '80px', color: 'var(--outline-variant)', marginBottom: '24px', display: 'block' }}>menu_book</span>
          <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '12px' }}>
            {activeTab === 'plans' ? 'Henüz Bir Plan Kaydetmediniz' : 'Henüz Bir Tarif Kaydetmediniz'}
          </h3>
          <p style={{ fontSize: '16px', color: 'var(--secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {activeTab === 'plans' 
              ? 'Dashboard üzerinden yeni bir kan tahlili yükleyerek yapay zeka destekli 3 günlük diyet planlarınızı oluşturabilir ve buraya kaydedebilirsiniz.'
              : 'Mobil uygulama üzerinden tahlil sonrası menülerden beğendiğiniz tekli tarifleri kaydederek burada görebilirsiniz.'}
          </p>
        </motion.div>
      ) : (
        <div className="bb-grid-dash" style={{ alignItems: 'start' }}>

          {/* ── Sol Kolon: Liste ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '120px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}
          >
            {filteredItems.map(item => {
              const isActive = selectedRecipe?.client_id === item.client_id;
              const displayName = activeTab === 'plans' 
                ? item.recipe_data.pdfName 
                : item.recipe_data.food_name;
              const subText = activeTab === 'plans'
                ? item.recipe_data.date
                : (item.recipe_data.test_label || 'Kayıtlı Tarif');
              
              return (
                <motion.div
                  key={item.client_id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRecipe(item)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '16px',
                    border: isActive ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                    padding: '20px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: isActive ? 'var(--primary-glow)' : 'var(--surface-container-lowest)',
                    boxShadow: isActive ? '0 8px 24px rgba(0,109,47,0.15)' : 'var(--shadow-xs)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface)', marginBottom: '6px', lineHeight: 1.3 }}>
                        {displayName}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isActive ? 'var(--primary)' : 'var(--secondary)', fontSize: '13px', fontWeight: 500 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {activeTab === 'plans' ? 'calendar_today' : 'science'}
                        </span>
                        {subText}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.client_id); }}
                      style={{
                        padding: '8px',
                        color: 'var(--error)',
                        background: 'rgba(186,26,26,0.05)',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, transform 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(186,26,26,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(186,26,26,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      title="Sil"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Sağ Kolon: Detaylar ── */}
          <div style={{ minHeight: '600px' }}>
            <AnimatePresence mode="wait">
              {selectedRecipe ? (
                activeTab === 'plans' ? (
                  /* ── PLAN DETAY GÖRÜNÜMÜ ── */
                  <motion.div
                    key={selectedRecipe.client_id}
                    variants={detailVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bb-card"
                    style={{ padding: '32px', borderRadius: '24px', background: 'var(--surface-container-lowest)' }}
                  >
                    <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--outline-variant)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '999px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                        Yapay Zeka Onaylı Plan
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.2 }}>
                        {selectedRecipe.recipe_data.pdfName} Planı
                      </h2>
                      <p style={{ color: 'var(--secondary)', fontSize: '15px', marginTop: '8px' }}>
                        Kayıt Tarihi: {selectedRecipe.recipe_data.date}
                      </p>
                    </div>

                    {/* Dikkat Edilmesi Gerekenler vs */}
                    <div className="bb-grid-3" style={{ marginBottom: '40px' }}>
                      {selectedRecipe.recipe_data.insight.potential_deficiencies?.length > 0 && (
                        <div style={{ background: 'rgba(253,124,49,0.06)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(253,124,49,0.15)' }}>
                          <h4 style={{ color: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>warning</span>
                            Eksiklikler
                          </h4>
                          <ul style={{ paddingLeft: '0', listStyle: 'none', fontSize: '14px', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedRecipe.recipe_data.insight.potential_deficiencies.map((d, i) => (
                              <li key={i} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                                <span style={{ color: 'var(--tertiary-container)' }}>•</span> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedRecipe.recipe_data.insight.foods_to_avoid?.length > 0 && (
                        <div style={{ background: 'rgba(186,26,26,0.06)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(186,26,26,0.15)' }}>
                          <h4 style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>do_not_disturb_on</span>
                            Kaçınılması Gerekenler
                          </h4>
                          <ul style={{ paddingLeft: '0', listStyle: 'none', fontSize: '14px', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedRecipe.recipe_data.insight.foods_to_avoid.map((f, i) => (
                              <li key={i} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                                <span style={{ color: 'var(--error)' }}>•</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedRecipe.recipe_data.insight.general_advice?.length > 0 && (
                        <div style={{ background: 'var(--primary-bg)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,109,47,0.15)' }}>
                          <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>lightbulb</span>
                            Tavsiyeler
                          </h4>
                          <ul style={{ paddingLeft: '0', listStyle: 'none', fontSize: '14px', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedRecipe.recipe_data.insight.general_advice.map((a, i) => (
                              <li key={i} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                                <span style={{ color: 'var(--primary)' }}>•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Günlük Planlar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-symbols-outlined icon-filled" style={{ fontSize: 28, color: 'var(--primary)' }}>restaurant_menu</span>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)' }}>Önerilen Beslenme Planı</h3>
                      </div>

                      {selectedRecipe.recipe_data.insight.daily_plans?.map((dayPlan, dayIdx) => (
                        <div key={dayIdx} style={{ background: 'var(--surface)', borderRadius: '20px', padding: '24px', border: '1px solid var(--outline-variant)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,109,47,0.2)' }}>
                              {dayIdx + 1}. Gün
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--on-surface)' }}>
                              {dayPlan.day_name}
                            </h3>
                          </div>

                          <div className="bb-grid-3">
                            {dayPlan.meals.map((meal, i) => (
                              <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bb-meal-card"
                              >
                                {meal.image_url && (
                                  <div className="bb-meal-img-wrap">
                                    <img src={meal.image_url} alt={meal.food_name} />
                                    <div className="bb-meal-img-overlay" />
                                    <div className="bb-meal-time-badge">
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                                      {meal.prep_time || 'Belirtilmedi'}
                                    </div>
                                  </div>
                                )}
                                <div className="bb-meal-body">
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    {meal.meal_type}
                                  </h4>
                                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '8px', fontSize: '18px', color: 'var(--on-surface)', lineHeight: 1.3 }}>
                                    {meal.food_name}
                                  </p>
                                  <p style={{ fontSize: '14px', color: 'var(--secondary)', lineHeight: 1.6, flex: 1 }}>
                                    {meal.reason}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* ── TEKLİ TARİF GÖRÜNÜMÜ ── */
                  <motion.div
                    key={selectedRecipe.client_id}
                    variants={detailVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bb-card"
                    style={{ padding: '32px', borderRadius: '24px', background: 'var(--surface-container-lowest)' }}
                  >
                    <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--outline-variant)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '999px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu_book</span>
                        Tekli Tarif
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.2 }}>
                        {selectedRecipe.recipe_data.food_name}
                      </h2>
                      <p style={{ color: 'var(--secondary)', fontSize: '15px', marginTop: '8px' }}>
                        {selectedRecipe.recipe_data.test_label || 'Mobil Cihazdan Kaydedildi'}
                      </p>
                    </div>

                    {/* Image & Quick Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '40px' }}>
                      {selectedRecipe.recipe_data.image_url ? (
                        <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                          <img 
                            src={selectedRecipe.recipe_data.image_url} 
                            alt={selectedRecipe.recipe_data.food_name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '220px', borderRadius: '16px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 64 }}>restaurant</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="bb-grid-3">
                          <div style={{ background: 'var(--surface-container-low)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24, marginBottom: 8, display: 'block' }}>schedule</span>
                            <span style={{ fontSize: 15, fontWeight: 700, display: 'block', color: 'var(--on-surface)' }}>{selectedRecipe.recipe_data.prep_time || '20dk'}</span>
                            <span style={{ fontSize: 11, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Süre</span>
                          </div>
                          <div style={{ background: 'var(--surface-container-low)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--tertiary-container)', fontSize: 24, marginBottom: 8, display: 'block' }}>bolt</span>
                            <span style={{ fontSize: 15, fontWeight: 700, display: 'block', color: 'var(--on-surface)' }}>{selectedRecipe.recipe_data.difficulty || 'Kolay'}</span>
                            <span style={{ fontSize: 11, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zorluk</span>
                          </div>
                          <div style={{ background: 'var(--surface-container-low)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--secondary)', fontSize: 24, marginBottom: 8, display: 'block' }}>star</span>
                            <span style={{ fontSize: 15, fontWeight: 700, display: 'block', color: 'var(--on-surface)' }}>{selectedRecipe.recipe_data.rating || '5.0'}</span>
                            <span style={{ fontSize: 11, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Puan</span>
                          </div>
                        </div>
                        
                        {selectedRecipe.recipe_data.reason && (
                          <div style={{ background: 'var(--primary-bg)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--primary)', flex: 1 }}>
                            <h4 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Beslenme Uyumu</h4>
                            <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.6 }}>{selectedRecipe.recipe_data.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>shopping_basket</span>
                        Malzemeler
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {selectedRecipe.recipe_data.ingredients && selectedRecipe.recipe_data.ingredients.length > 0 ? (
                          selectedRecipe.recipe_data.ingredients.map((ing, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '10px' }}>
                              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{ing.name}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{ing.amount}</span>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: 'var(--secondary)', fontStyle: 'italic' }}>Malzeme listesi bulunamadı.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'var(--secondary)', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '1px dashed var(--outline-variant)' }}
                >
                  <motion.span
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="material-symbols-outlined"
                    style={{ fontSize: '72px', opacity: 0.2, marginBottom: '20px' }}
                  >
                    swipe_left
                  </motion.span>
                  <p style={{ fontSize: '18px', fontWeight: 500 }}>
                    {activeTab === 'plans' 
                      ? 'Detayları görmek için sol taraftan bir plan seçin.' 
                      : 'Detayları görmek için sol taraftan bir tarif seçin.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
