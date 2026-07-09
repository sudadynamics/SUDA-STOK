import React, { useState } from 'react';
import { Coffee, Cake, ShoppingBag, Store, ArrowRight, User, Briefcase, DollarSign, Sparkles } from 'lucide-react';
import './Onboarding.css';

const BUSINESS_TYPES = [
  {
    id: 'pastane',
    title: 'Pastane',
    desc: 'Pasta, kurabiye, sütlü tatlılar ve reçete bazlı hammadde takibi.',
    icon: Cake,
    color: '#7C3AED', // Purple
    lightColor: '#F5F3FF',
    glow: 'rgba(124, 58, 237, 0.2)'
  },
  {
    id: 'cafe',
    title: 'Cafe',
    desc: 'Sıcak/soğuk içecekler, atıştırmalıklar ve masa sipariş entegrasyonu.',
    icon: Coffee,
    color: '#F98D2E', // Orange
    lightColor: '#FFF7ED',
    glow: 'rgba(249, 141, 46, 0.2)'
  },
  {
    id: 'firin',
    title: 'Fırın',
    desc: 'Sıcak unlu mamuller, ekmek çeşitleri, un ve maya çuval takipleri.',
    icon: Store,
    color: '#FBBF24', // Yellow/Gold
    lightColor: '#FEFCE8',
    glow: 'rgba(251, 191, 36, 0.2)'
  },
  {
    id: 'market',
    title: 'Market',
    desc: 'Hızlı tüketim malları, barkodlu ürünler ve raf-depo adet yönetimi.',
    icon: ShoppingBag,
    color: '#1EAF8A', // Teal
    lightColor: '#ECFDF5',
    glow: 'rgba(30, 175, 138, 0.2)'
  }
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [currency, setCurrency] = useState('₺');
  const [businessType, setBusinessType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (businessName.trim() && ownerName.trim()) {
      setStep(2);
    }
  };

  const handleSelectType = async (typeId) => {
    setBusinessType(typeId);
    setIsSubmitting(true);
    
    // Smooth delay for transitions and robot animation
    setTimeout(() => {
      onComplete({
        businessName,
        ownerName,
        currency,
        businessType: typeId,
        createdAt: new Date().toISOString()
      });
    }, 1500);
  };

  return (
    <div className="onboarding-container animate-fade-in" id="onboarding-setup">
      {/* Decorative Floating Shapes */}
      <div className="deco-dot dot-1"></div>
      <div className="deco-dot dot-2"></div>
      <div className="deco-dot dot-3"></div>
      <div className="deco-plane">✈️</div>

      <div className="onboarding-card animate-pop-in">
        {/* Brand Header */}
        <div className="brand-logo-container">
          <div className="brand-suda">
            <span>S</span>
            <span className="orange-letter">U</span>
            <span className="green-letter">D</span>
            <span className="purple-letter">A</span>
          </div>
          <div className="brand-dynamics">&lt; DYNAMICS &gt;</div>
        </div>

        {/* Mascot Robot Interaction */}
        <div className="robot-mascot-container">
          <div className={`robot-avatar ${isSubmitting ? 'robot-celebrate' : 'robot-idle'}`}>
            <svg viewBox="0 0 100 100" className="robot-svg">
              {/* Ears / Antennas */}
              <circle cx="50" cy="12" r="5" fill="#1EAF8A" className="antenna-light" />
              <line x1="50" y1="12" x2="50" y2="25" stroke="#7C3AED" strokeWidth="4" />
              {/* Body / Head */}
              <rect x="25" y="25" width="50" height="50" rx="20" fill="#7C3AED" />
              {/* Face screen */}
              <rect x="33" y="33" width="34" height="26" rx="10" fill="#0B1B3D" />
              {/* Smiling Eyes */}
              <path d="M 40 43 Q 43 40 46 43" stroke="#1EAF8A" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 54 43 Q 57 40 60 43" stroke="#1EAF8A" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Smile Mouth */}
              <path d="M 44 51 Q 50 56 56 51" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Waving Hand (animated in CSS) */}
              <g className="robot-hand">
                <path d="M 75 45 Q 85 35 90 40" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="90" cy="40" r="4" fill="#F98D2E" />
              </g>
            </svg>
          </div>
          <div className="speech-bubble">
            {step === 1 && (
              <p>Merhaba! Ben <strong>SudaBot</strong>. Harika bir stok takip sistemi kurmak için can atıyorum! Öncelikle seni ve işletmeni tanıyabilir miyim?</p>
            )}
            {step === 2 && !isSubmitting && (
              <p>Müthiş! Şimdi işletmenin türünü seçer misin? Sistemimizi senin sektörüne göre özelleştireceğim! ✨</p>
            )}
            {isSubmitting && (
              <p>Harika seçim! Şimdi veritabanını kuruyorum ve arayüzü senin için hazırlıyorum... Lütfen bekle! 🎉</p>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line-connector"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {step === 1 ? (
          /* Step 1: Form Details */
          <form onSubmit={handleNextStep} className="onboarding-form animate-fade-in-up" id="form-business-info">
            <h1 className="step-title">İşletmenizi Tanımlayın</h1>
            <p className="step-subtitle">Stok takip panelinizi kişiselleştirmek için temel bilgileri girin.</p>
            
            <div className="input-group">
              <label htmlFor="business-name-input">İşletme Adı</label>
              <div className="input-with-icon">
                <Briefcase size={20} className="input-icon" />
                <input
                  type="text"
                  id="business-name-input"
                  placeholder="Örn: Suda Pastanesi, Dynamics Cafe"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="owner-name-input">Yetkili / Yönetici Adı</label>
              <div className="input-with-icon">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  id="owner-name-input"
                  placeholder="Örn: Selahattin Sarıbay"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="currency-select">Para Birimi</label>
              <div className="input-with-icon">
                <DollarSign size={20} className="input-icon" />
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="₺">Türk Lirası (₺)</option>
                  <option value="$">Dolar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">Sterlin (£)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              id="btn-next-step"
              disabled={!businessName.trim() || !ownerName.trim()}
            >
              Devam Et <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          /* Step 2: Business Type Select */
          <div className="business-select-area animate-fade-in-up" id="business-type-selector">
            <h1 className="step-title">İşletme Türünü Seçin</h1>
            <p className="step-subtitle">İşletmenizin türü, kullanacağınız stok ve reçete araçlarını belirler.</p>

            <div className="business-grid">
              {BUSINESS_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    id={`btn-type-${type.id}`}
                    className={`business-type-card glow-card ${isSubmitting && businessType === type.id ? 'selected' : ''}`}
                    onClick={() => !isSubmitting && handleSelectType(type.id)}
                    style={{
                      '--card-glow-color': type.glow,
                      '--card-accent-color': type.color
                    }}
                    disabled={isSubmitting}
                  >
                    <div className="card-icon-wrapper" style={{ backgroundColor: type.lightColor, color: type.color }}>
                      <IconComponent size={28} />
                    </div>
                    <div className="card-content-wrapper">
                      <h3>{type.title}</h3>
                      <p>{type.desc}</p>
                    </div>
                    <div className="card-select-indicator"></div>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => !isSubmitting && setStep(1)}
              className="btn-back"
              disabled={isSubmitting}
              id="btn-back-step"
            >
              Geri Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
