import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Upload, FileText, CheckCircle, TrendingUp, 
  BrainCircuit, Loader2, Info, AlertCircle, RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [insight, setInsight] = useState(null);
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const [refreshingMeals, setRefreshingMeals] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('users/me');
      setUser(resp.data);
      
      // ALERJİ KONTROLÜ
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload and Parse
      const uploadResp = await api.post('blood-tests/upload', formData);
      const testId = uploadResp.data.blood_test_id;
      
      // 2. Fetch full test results
      const testResp = await api.get(`blood-tests/${testId}`);
      const data = testResp.data;
      
      // 3. Calculate summary counts locally
      const counts = { normal: 0, high: 0, low: 0 };
      data.results.forEach(r => {
        const stat = (r.status || "").toLowerCase();
        if (counts[stat] !== undefined) counts[stat]++;
      });
      
      setResults({
        ...data,
        summary: counts
      });

      // 4. Fetch AI Insight
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
      setInsight(resp.data); // Stores the whole NutritionalInsight object
    } catch (err) {
      setInsight({ 
        summary: "AI analizi şu an yapılamıyor, lütfen daha sonra tekrar deneyin.",
        potential_deficiencies: [],
        daily_plans: [],
        foods_to_avoid: [],
        general_advice: []
      });
    } finally {
      setFetchingInsight(false);
    }
  };

  const handleRefreshMeal = async (meal, dayIndex, mealIndex) => {
    if (!results) return;
    const testId = results.id;
    const key = `${dayIndex}-${mealIndex}`;
    
    setRefreshingMeals(prev => ({ ...prev, [key]: true }));
    try {
      const resp = await api.post(`blood-tests/${testId}/insights/refresh`, {
        meal_type: meal.meal_type,
        rejected_food_name: meal.food_name
      });
      
      const newMeal = resp.data;
      
      // Update the specific meal in the state
      setInsight(prev => {
        const newPlans = [...prev.daily_plans];
        newPlans[dayIndex].meals[mealIndex] = newMeal;
        return { ...prev, daily_plans: newPlans };
      });
      
    } catch (err) {
      alert("Yemek yenilenirken bir hata oluştu.");
    } finally {
      setRefreshingMeals(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '100px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <h1 className="heading" style={{ fontSize: '2.5rem' }}>Merhaba, <span style={{ color: 'var(--primary)' }}>{user?.name}</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Biyolojik verilerini incelemeye hazır mısın?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px' }}>
        
        {/* Main Content: Upload & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Upload Card */}
          <div style={{ padding: '40px', textAlign: 'center', position: 'relative', background: 'var(--primary-bg)', border: '2px dashed var(--primary-light)', borderRadius: '20px', transition: 'all 0.25s ease' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileUpload}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
            />
            <div style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', boxShadow: 'var(--primary-shadow)' }}>
                {uploading ? <Loader2 className="animate-spin" size={32} color="#fff" /> : <Upload size={32} color="#fff" />}
              </div>
              <h3 className="heading" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                {uploading ? "PDF Çözümleniyor..." : "E-Nabız PDF'ini Yükle"}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tahlil sonuçlarını sürükle bırak veya buraya tıkla.
              </p>
            </div>
          </div>

          {/* Results Analytics Area */}
          {results && (
            <div className="fade-in">
              <h3 className="heading" style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Tahlil Özeti ({results.date_taken})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <StatCard icon={<CheckCircle color="var(--primary)" />} label="Normal" value={results.summary.normal} color="var(--primary)" />
                <StatCard icon={<TrendingUp color="var(--danger)" />} label="Yüksek" value={results.summary.high} color="var(--danger)" />
                <StatCard icon={<TrendingUp color="#F59E0B" style={{ transform: 'rotate(180deg)' }} />} label="Düşük" value={results.summary.low} color="#F59E0B" />
              </div>

              {/* Parameter Table Snippet */}
              <div style={{ marginTop: '30px', padding: '20px', overflow: 'hidden', background: '#fff', border: '1px solid var(--glass-border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 className="heading">Bulgular ({results.results.length})</h4>
                    <Info size={18} color="var(--text-secondary)" />
                 </div>
                 <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                   {results.results.map((r, i) => {
                       const stat = (r.status || "").toLowerCase();
                       let color = 'var(--text-primary)';
                       let bgColor = 'transparent';
                       let text = 'Bilinmiyor';
                       
                       if (stat === 'normal') { color = 'var(--primary)'; bgColor = 'var(--primary-glow)'; text = 'Normal'; }
                       else if (stat === 'high') { color = 'var(--danger)'; bgColor = 'rgba(239, 68, 68, 0.1)'; text = 'Yüksek'; }
                       else if (stat === 'low') { color = '#F59E0B'; bgColor = 'rgba(245, 158, 11, 0.1)'; text = 'Düşük'; }

                       return (
                         <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', padding: '12px 0', borderBottom: '1px solid var(--divider)', alignItems: 'center' }}>
                           <span style={{ fontWeight: '500' }}>{r.parameter_name}</span>
                           <span style={{ color: color }}>{r.original_value}</span>
                           <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', textAlign: 'center', background: bgColor, color: color, fontWeight: '600' }}>
                             {text}
                           </span>
                         </div>
                       );
                   })}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: AI Insights */}
        <div>
          <div style={{ padding: '30px', position: 'sticky', top: '120px', minHeight: '400px', background: '#fff', border: '1.5px solid var(--primary-light)', borderRadius: '20px', boxShadow: '0 4px 20px rgba(93,187,99,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <BrainCircuit size={24} color="var(--primary)" />
              <h3 className="heading" style={{ fontSize: '1.2rem' }}>AI Beslenme Rehberi</h3>
            </div>
            
            {fetchingInsight ? (
              <div style={{ textAlign: 'center', paddingTop: '50px' }}>
                 <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto 15px' }} />
                 <p style={{ color: 'var(--text-secondary)' }}>Gemini tahlillerini yorumluyor...</p>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>Bu işlem birkaç saniye sürebilir.</p>
              </div>
            ) : insight ? (
              <div className="fade-in" style={{ lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                 <p style={{ marginBottom: '25px', fontWeight: '500', fontSize: '1.05rem' }}>{insight.summary}</p>
                 
                 {insight.potential_deficiencies?.length > 0 && (
                   <div style={{ marginBottom: '20px' }}>
                     <p className="heading" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '5px' }}>TESPİT EDİLEN EKSİKLİKLER</p>
                     <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{insight.potential_deficiencies.join(', ')}</p>
                   </div>
                 )}

                 {insight.foods_to_avoid?.length > 0 && (
                   <div style={{ marginBottom: '20px' }}>
                     <p className="heading" style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '5px' }}>KAÇINILMASI GEREKENLER</p>
                     <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{insight.foods_to_avoid.join(', ')}</p>
                   </div>
                 )}

                 {insight.general_advice?.length > 0 && (
                   <div style={{ marginBottom: '25px' }}>
                     <p className="heading" style={{ color: '#F59E0B', fontSize: '0.9rem', marginBottom: '5px' }}>GENEL TAVSİYELER</p>
                     <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                       {insight.general_advice.map((advice, i) => (
                         <li key={i} style={{ marginBottom: '5px' }}>{advice}</li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {insight.daily_plans?.length > 0 && (
                   <div>
                     <p className="heading" style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Örnek Beslenme Planı</p>
                     {insight.daily_plans[0].meals.map((meal, i) => {
                        const isRefreshing = refreshingMeals[`0-${i}`];
                        return (
                        <div key={i} style={{ background: 'var(--primary-bg)', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--primary-light)', position: 'relative' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{meal.meal_type}</span>
                           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{meal.prep_time}</span>
                             <button 
                               onClick={() => handleRefreshMeal(meal, 0, i)}
                               disabled={isRefreshing}
                               style={{ 
                                 background: 'none', border: 'none', cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                 color: 'var(--primary)', display: 'flex', alignItems: 'center', padding: '4px',
                                 borderRadius: '50%', transition: 'background 0.2s'
                               }}
                               title="Farklı bir tarif öner"
                             >
                               <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                             </button>
                           </div>
                         </div>
                         <div style={{ fontWeight: '500', marginBottom: '5px', opacity: isRefreshing ? 0.5 : 1 }}>{meal.food_name}</div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: isRefreshing ? 0.5 : 1 }}>{meal.reason}</div>
                       </div>
                     )})}
                   </div>
                 )}

                  <div style={{ marginTop: '30px', padding: '15px', background: 'var(--secondary-bg)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start', border: '1px solid rgba(245,158,11,0.2)' }}>
                     <AlertCircle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Bu bilgiler yapay zeka tarafından üretilmiştir. Kesin tanı ve tedavi için mutlak surette doktorunuza danışınız.
                    </p>
                 </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-secondary)' }}>
                 <FileText size={48} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                 <p>Tahlil yüklediğinde kişisel tavsiyelerin burada görünecek.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-hover" style={{ padding: '20px', textAlign: 'center', background: '#fff', border: '1px solid var(--glass-border)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
     <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
     <div style={{ fontSize: '1.8rem', fontWeight: '700', color: color }}>{value}</div>
     <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</div>
  </div>
);

export default Dashboard;
