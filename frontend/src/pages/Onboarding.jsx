import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ALLERGY_CATEGORIES } from '../constants/allergies';
import { 
  Milk, Wheat, Nut, Fish, Egg, 
  Apple, Flame, Leaf, ChevronDown, Check
} from 'lucide-react';
import './Onboarding.css';

const ICON_MAP = {
  Milk: Milk,
  Wheat: Wheat,
  Nut: Nut,
  Fish: Fish,
  Egg: Egg,
  Apple: Apple,
  Flame: Flame,
  Leaf: Leaf
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing preferences
    const fetchPrefs = async () => {
      try {
        const resp = await api.get('users/me');
        if (resp.data.dietary_preferences && resp.data.dietary_preferences[0] !== "none") {
          setSelectedAllergies(resp.data.dietary_preferences);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCheckboxChange = (optionId) => {
    setSelectedAllergies(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Eğer hiçbir şey seçilmemişse "none" gönderiyoruz ki anketin doldurulduğu bilinsin
    const finalAllergies = selectedAllergies.length > 0 ? selectedAllergies : ["none"];
    
    try {
      await api.patch('users/me', { dietary_preferences: finalAllergies });
      navigate('/dashboard');
    } catch (err) {
      alert("Alerji bilgileri kaydedilirken bir hata oluştu.");
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '100px'}}>Yükleniyor...</div>;

  return (
    <div className="onboarding-page fade-in">
      <div className="onboarding-header">
        <h1 className="heading">Beslenme Profilin</h1>
        <p className="subtitle">Sana %100 güvenli tarifler üretebilmemiz için kaçınman gereken besinleri seç.</p>
      </div>

      <div className="accordion-container">
        {ALLERGY_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.icon];
          const isExpanded = expandedId === category.id;
          
          // Count how many options are selected in this category
          const selectedCount = category.options.filter(opt => selectedAllergies.includes(opt.id)).length;

          return (
            <div key={category.id} className={`glass glass-hover accordion-item ${isExpanded ? 'expanded' : ''}`}>
              <button 
                className="accordion-header"
                onClick={() => toggleAccordion(category.id)}
              >
                <div className="header-content">
                  <div className={`icon-box ${selectedCount > 0 ? 'active' : ''}`}>
                    <Icon size={24} />
                  </div>
                  <div className="header-text">
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>
                </div>
                <div className="header-actions">
                  {selectedCount > 0 && (
                    <span className="badge badge-success">{selectedCount} seçildi</span>
                  )}
                  <motion.div 
                    animate={{ rotate: isExpanded ? 180 : 0 }} 
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="chevron" size={24} />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="accordion-content"
                  >
                    <div className="options-grid">
                      {category.options.map(option => {
                        const isSelected = selectedAllergies.includes(option.id);
                        return (
                          <label 
                            key={option.id} 
                            className={`checkbox-card ${isSelected ? 'selected' : ''}`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(option.id)}
                              className="hidden-checkbox"
                            />
                            <div className="checkbox-indicator">
                              {isSelected && <Check size={16} strokeWidth={3} />}
                            </div>
                            <span className="checkbox-label">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="onboarding-footer glass">
        <div className="selected-summary">
          <strong>{selectedAllergies.length}</strong> alerjen seçildi
        </div>
        <button 
          className="btn btn-primary submit-btn" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
        </button>
      </div>
    </div>
  );
}
