import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Dönen sağlık ipuçları (Gelişmiş) ── */
const HEALTH_TIPS = [
  {
    icon: 'water_drop',
    title: 'Hidrasyonun Gücü',
    text: 'Günde en az 8 bardak su içmek metabolizma hızını %30 artırır ve hücresel yenilenmeyi doğrudan destekler. Yeterli su tüketimi yorgunluğu azaltır.',
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.02))'
  },
  {
    icon: 'nutrition',
    title: 'B12 Vitamini ve Enerji',
    text: 'B12 eksikliği yorgunluk, halsizlik ve konsantrasyon sorunlarına yol açabilir. Sinir sistemi sağlığı için hayvansal gıdalar veya takviyelerle desteklenmelidir.',
    color: 'var(--primary)',
    bgGradient: 'linear-gradient(135deg, rgba(0,109,47,0.12), rgba(0,109,47,0.02))'
  },
  {
    icon: 'restaurant',
    title: 'Maksimum Demir Emilimi',
    text: 'Demir emilimini artırmak için, demir içeren besinleri her zaman C vitamini yüksek gıdalarla (limon, biber, portakal) birlikte tüketmeye özen gösterin.',
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.02))'
  },
  {
    icon: 'monitor_heart',
    title: 'Ferritin ve Saç Sağlığı',
    text: 'Ferritin (demir deposu) düşüklüğü, saç dökülmesinin ve tırnak kırılmalarının en sık gözden kaçan nedenidir. Rutin testlerde kontrol edilmesi önemlidir.',
    color: 'var(--error)',
    bgGradient: 'linear-gradient(135deg, rgba(186,26,26,0.12), rgba(186,26,26,0.02))'
  },
  {
    icon: 'eco',
    title: 'D Vitamini Sentezi',
    text: 'D vitamini doğrudan güneş ışığından sentezlenir. Kış aylarında veya kapalı ortamlarda çalışanların kan değerlerine göre takviye alması bağışıklığı güçlendirir.',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02))'
  },
  {
    icon: 'favorite',
    title: 'Omega-3 Yağ Asitleri',
    text: 'Kalp ve beyin sağlığı için kritik öneme sahip olan Omega-3, vücuttaki enflamasyonu azaltır, odaklanmayı artırır ve bilişsel fonksiyonları korur.',
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(236,72,153,0.02))'
  },
  {
    icon: 'local_florist',
    title: 'Magnezyumun Etkisi',
    text: 'Magnezyum eksikliği nedensiz kas krampları, yorgunluk ve uyku bozukluklarına neden olabilir. Yeşil yapraklı sebzeler, badem ve kabak çekirdeği tüketin.',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.02))'
  },
];

export const HealthTipTicker = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % HEALTH_TIPS.length), 7000);
    return () => clearInterval(timer);
  }, []);

  const tip = HEALTH_TIPS[idx];

  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      padding: '32px',
      borderRadius: 24,
      background: 'var(--surface-container-lowest)',
      border: `1px solid ${tip.color}40`,
      boxShadow: `0 24px 48px -12px ${tip.color}25, inset 0 2px 0 0 rgba(255,255,255,0.1)`,
      overflow: 'hidden',
      minHeight: 320,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* Dynamic Background Gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: tip.bgGradient,
        opacity: 1,
        zIndex: 0,
        transition: 'background 0.6s ease',
      }} />

      {/* Animated glowing orb behind icon */}
      <motion.div
        key={`glow-${idx}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute', right: -40, top: -40,
          width: 200, height: 200,
          background: `radial-gradient(circle, ${tip.color}40 0%, transparent 70%)`,
          filter: 'blur(30px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />

      {/* Decorative large icon with slow rotation */}
      <motion.div
        key={`bg-icon-${idx}`}
        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
        animate={{ opacity: 0.04, rotate: -10, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: 'absolute', right: -40, bottom: -40,
          zIndex: 0,
        }}
      >
        <span className="material-symbols-outlined icon-filled" style={{ fontSize: 260, color: tip.color }}>
          {tip.icon}
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          {/* Badge */}
          <div style={{ display: 'flex', marginBottom: 24 }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: `${tip.color}22`,
              border: `1px solid ${tip.color}40`,
              display: 'flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(8px)',
            }}>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: 14, color: tip.color }}>
                campaign
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: tip.color }}>
                Günün İpucu
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, flexShrink: 0,
              background: `linear-gradient(135deg, ${tip.color}22, ${tip.color}05)`,
              border: `1px solid ${tip.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${tip.color}20`,
            }}>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: 32, color: tip.color }}>
                {tip.icon}
              </span>
            </div>
            <div style={{ paddingTop: 4 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
                {tip.title}
              </h3>
            </div>
          </div>

          <p style={{ fontSize: 17, color: 'var(--on-surface)', lineHeight: 1.65, opacity: 0.9, flex: 1, fontWeight: 500 }}>
            {tip.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots at the bottom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32, zIndex: 1, position: 'relative' }}>
        {HEALTH_TIPS.map((_, i) => (
          <div key={i} style={{
            height: 6,
            width: i === idx ? 32 : 8,
            borderRadius: 6,
            background: i === idx ? tip.color : 'var(--outline-variant)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            opacity: i === idx ? 1 : 0.4,
            boxShadow: i === idx ? `0 0 12px ${tip.color}60` : 'none',
          }} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  );
};

/* ── Floating orbs (dekoratif arkaplan) ── */
const FloatingOrb = ({ size, color, x, y, duration, delay }) => (
  <motion.div
    style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      left: x, top: y,
      filter: 'blur(40px)',
      opacity: 0.18,
      pointerEvents: 'none',
      zIndex: 0,
    }}
    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.08, 1] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

export const DashboardHero = ({ userName }) => (
  <div style={{ position: 'relative', overflow: 'hidden', padding: '32px 0 24px', marginBottom: 0 }}>
    {/* floating orbs */}
    <FloatingOrb size={180} color="#006d2f" x="70%" y="-40px" duration={7} delay={0} />
    <FloatingOrb size={120} color="#fd7c31" x="85%" y="30px" duration={5} delay={1} />
    <FloatingOrb size={90} color="#7afc97" x="60%" y="10px" duration={9} delay={2} />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Greeting with animated underline */}
      <h1 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)',
        fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', lineHeight: 1.15, marginBottom: 8,
      }}>
        Merhaba,{' '}
        <span style={{ position: 'relative', display: 'inline-block', color: 'var(--primary)' }}>
          {userName || 'Kullanıcı'}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: -4, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, var(--primary), var(--tertiary-container))',
              borderRadius: 99, transformOrigin: 'left',
              display: 'block',
            }}
          />
        </span>{' '}👋
      </h1>

      <p style={{ color: 'var(--secondary)', fontSize: 17, lineHeight: 1.6, maxWidth: 560 }}>
        Kan tahlilini yükle, yapay zeka kişisel beslenme planını hazırlasın.
      </p>

      {/* stat preview pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}
      >
        {[
          { icon: 'science', label: '40+ Parametre', color: 'var(--primary)', bg: 'rgba(0,109,47,0.10)' },
          { icon: 'auto_awesome', label: 'Gemini AI', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
          { icon: 'restaurant_menu', label: '4 Günlük Plan', color: 'var(--tertiary-container)', bg: 'rgba(253,124,49,0.10)' },
        ].map((pill, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              background: pill.bg, color: pill.color,
              fontSize: 13, fontWeight: 600,
              border: `1px solid ${pill.color}22`,
            }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: 15 }}>
              {pill.icon}
            </span>
            {pill.label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  </div>
);

/* ── Zengin empty state: sağ kolon ── */
export const EmptyDashboardRight = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
  >
    {/* Sağlık Rehberi başlık */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--primary-glow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined icon-filled" style={{ fontSize: 20, color: 'var(--primary)' }}>
          psychology
        </span>
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--on-surface)' }}>
        Sağlık Rehberi
      </h2>
    </div>

    <HealthTipTicker />
  </motion.div>
);

export default EmptyDashboardRight;
