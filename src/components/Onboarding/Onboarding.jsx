import React, { useState, useEffect } from 'react';
import { Coffee, Cake, ShoppingBag, Store, ArrowRight, User, Briefcase, DollarSign, Check } from 'lucide-react';
import { loadDemoData } from '../../utils/demoData';
import './Onboarding.css';

const BUSINESS_TYPES = [
  {
    id: 'pastane',
    title: 'Pastane',
    desc: 'Pasta, kurabiye, sütlü tatlılar ve reçete bazlı hammadde takibi.',
    icon: Cake,
    color: '#7C3AED',
    lightColor: '#F5F3FF',
    glow: 'rgba(124, 58, 237, 0.2)'
  },
  {
    id: 'cafe',
    title: 'Cafe',
    desc: 'Sıcak/soğuk içecekler, atıştırmalıklar ve masa sipariş entegrasyonu.',
    icon: Coffee,
    color: '#F98D2E',
    lightColor: '#FFF7ED',
    glow: 'rgba(249, 141, 46, 0.2)'
  },
  {
    id: 'firin',
    title: 'Fırın',
    desc: 'Sıcak unlu mamuller, ekmek çeşitleri, un ve maya çuval takipleri.',
    icon: Store,
    color: '#FBBF24',
    lightColor: '#FEFCE8',
    glow: 'rgba(251, 191, 36, 0.2)'
  },
  {
    id: 'market',
    title: 'Market',
    desc: 'Hızlı tüketim malları, barkodlu ürünler ve raf-depo adet yönetimi.',
    icon: ShoppingBag,
    color: '#1EAF8A',
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
  const [setupMode, setSetupMode] = useState('demo'); // 'demo' | 'empty'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guided speech states
  const [speechText, setSpeechText] = useState('Merhaba! Ben SudaBot. Harika bir stok takip sistemi kurmak için sabırsızlanıyorum! Öncelikle seni ve işletmeni tanıyabilir miyim?');
  const [isFading, setIsFading] = useState(false);
  const [robotAnimClass, setRobotAnimClass] = useState('robot-idle');

  // Trigger SudaBot visual gesture
  const triggerMascotAnimation = (animClass) => {
    setRobotAnimClass(animClass);
    // Return to idle after animation loops
    setTimeout(() => {
      setRobotAnimClass('robot-idle');
    }, 650);
  };

  // Change speech text smoothly with opacity transition
  const changeSpeech = (newText, animClass = '') => {
    setIsFading(true);
    if (animClass) {
      triggerMascotAnimation(animClass);
    }
    setTimeout(() => {
      setSpeechText(newText);
      setIsFading(false);
    }, 180);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (businessName.trim() && ownerName.trim()) {
      setStep(2);
      changeSpeech('Müthiş! Şimdi işletmenin türünü seçer misin? Sistemimizi senin sektörüne göre özelleştireceğim! ✨', 'robot-jump');
    }
  };

  const handleSelectType = (typeId) => {
    setBusinessType(typeId);
    setStep(3);
    changeSpeech('Harika seçim! Şimdi envanterini nasıl başlatmak istersin? İstersen senin için örnek ürünler ve reçeteler yükleyebilirim. Böylece sistemi hemen görebilirsin! 🚀', 'robot-wiggle');
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    setRobotAnimClass('robot-dance');
    changeSpeech('Harika! Şimdi veritabanını kuruyorum, cari hesapları bağlıyorum ve envanterini hazırlıyorum... Lütfen bekleyin! 🎉');

    if (setupMode === 'demo') {
      await loadDemoData(businessType);
    }

    setTimeout(() => {
      onComplete({
        businessName,
        ownerName,
        currency,
        businessType,
        createdAt: new Date().toISOString()
      });
    }, 2200);
  };

  // Input Focus explainers
  const handleInputFocus = (field) => {
    if (step !== 1) return;
    if (field === 'name') {
      changeSpeech('Harika bir isim seç! Fişlerde, faturalarda ve raporlarda dükkanının bu tabelası görünecek. 🏢', 'robot-jump');
    } else if (field === 'owner') {
      changeSpeech('Sana panelde isminle hitap etmek istiyorum. Kendi adını buraya yazabilirsin! 👋', 'robot-wiggle');
    } else if (field === 'currency') {
      changeSpeech('Kasa satışlarında, giderlerde ve zayiat maliyet hesaplarında hangi para birimini kullanalım? 💰', 'robot-jump');
    }
  };

  const handleInputBlur = () => {
    if (step !== 1) return;
    changeSpeech('Bilgileri girdikten sonra "Devam Et" butonuna basarak bir sonraki adıma geçebilirsin!', 'robot-idle');
  };

  // Card Hover explainers
  const handleCardHover = (typeId) => {
    if (step !== 2) return;
    const hoverTexts = {
      pastane: 'Pastane mi? Nefis! 🍰 Pasta, çilek, un ve reçete bazlı hammadde takibini senin için aktif edeceğim!',
      cafe: 'Cafe mi? Süper! ☕ Süt, şurup ve kahve çekirdeği takibi ile reçeteli üretimleri hazır edeceğim!',
      firin: 'Fırın mı? Bereketli olsun! 🥖 Un ve maya çuvalları, ekmek üretimi ve hamur reçetelerini kuracağım!',
      market: 'Market mi? Çok iyi! 📦 Raf ve depo takibi ile barkodlu satış terminalini panelinize ekleyeceğim!'
    };
    if (hoverTexts[typeId]) {
      changeSpeech(hoverTexts[typeId], 'robot-wiggle');
    }
  };

  const handleCardHoverLeave = () => {
    if (step !== 2) return;
    changeSpeech('Sistemimizi senin sektörüne göre özelleştireceğim! Hangi işletme türü sana uyuyor? ✨', 'robot-idle');
  };

  // Option Hover explainers
  const handleOptionHover = (mode) => {
    if (step !== 3) return;
    if (mode === 'demo') {
      changeSpeech('Bunu öneririm! Sektörünüze özel hazır ürünler, cari borçlar ve reçeteler yüklenir, paneli anında dolu görürsünüz. 📊', 'robot-jump');
    } else if (mode === 'empty') {
      changeSpeech('Sıfırdan, tertemiz bir sayfa açar. Kendi ürünlerinizi ve fiyatlarınızı baştan girmek için idealdir. 📁', 'robot-wiggle');
    }
  };

  const handleOptionHoverLeave = () => {
    if (step !== 3) return;
    changeSpeech('Envanterini nasıl başlatmak istersin? İstersen senin için örnek ürünler ve reçeteler yükleyebilirim. 🚀', 'robot-idle');
  };

  return (
    <div className="onboarding-container animate-fade-in" id="onboarding-setup">
      <div className="deco-dot dot-1"></div>
      <div className="deco-dot dot-2"></div>
      <div className="deco-dot dot-3"></div>
      <div className="deco-plane">✈️</div>

      <div className="onboarding-card animate-pop-in">
        
        {/* Brand Logo Header */}
        <div className="brand-logo-container">
          <div className="brand-suda">
            <span>S</span>
            <span className="orange-letter">U</span>
            <span className="green-letter">D</span>
            <span className="purple-letter">A</span>
          </div>
          <div className="brand-dynamics">&lt; DYNAMICS &gt;</div>
        </div>

        {/* Mascot Robot dialog box */}
        <div className="robot-mascot-container">
          <div className={`robot-avatar ${isSubmitting ? 'robot-celebrate' : robotAnimClass}`}>
            <svg viewBox="0 0 100 100" className="robot-svg">
              <circle cx="50" cy="12" r="5" fill="#1EAF8A" className="antenna-light-pulse" />
              <line x1="50" y1="12" x2="50" y2="25" stroke="#7C3AED" strokeWidth="4" />
              <rect x="25" y="25" width="50" height="50" rx="20" fill="#7C3AED" />
              <rect x="33" y="33" width="34" height="26" rx="10" fill="#0B1B3D" />
              <circle cx="43" cy="43" r="4" fill="#1EAF8A" className="eye-blink" />
              <circle cx="57" cy="43" r="4" fill="#1EAF8A" className="eye-blink" />
              <path d="M 44 51 Q 50 56 56 51" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
              <g className="robot-hand">
                <path d="M 75 45 Q 85 35 90 40" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="90" cy="40" r="4" fill="#F98D2E" />
              </g>
            </svg>
          </div>
          <div className={`speech-bubble ${isFading ? 'fade-out' : 'fade-in'}`}>
            <p>{speechText}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="step-indicator-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line-connector"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="step-line-connector"></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {step === 1 && (
          /* Step 1: Form details */
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
                  onFocus={() => handleInputFocus('name')}
                  onBlur={handleInputBlur}
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
                  onFocus={() => handleInputFocus('owner')}
                  onBlur={handleInputBlur}
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
                  onFocus={() => handleInputFocus('currency')}
                  onBlur={handleInputBlur}
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
        )}

        {step === 2 && (
          /* Step 2: Choose Business Type */
          <div className="business-select-area animate-fade-in-up" id="business-type-selector">
            <h1 className="step-title">İşletme Türünü Seçin</h1>
            <p className="step-subtitle">Sektörünüz, kullanacağınız stok ve reçete araçlarını belirler.</p>

            <div className="business-grid">
              {BUSINESS_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    id={`btn-type-${type.id}`}
                    className="business-type-card glow-card"
                    onClick={() => handleSelectType(type.id)}
                    onMouseEnter={() => handleCardHover(type.id)}
                    onMouseLeave={handleCardHoverLeave}
                    style={{
                      '--card-glow-color': type.glow,
                      '--card-accent-color': type.color
                    }}
                  >
                    <div className="card-icon-wrapper" style={{ backgroundColor: type.lightColor, color: type.color }}>
                      <IconComponent size={28} />
                    </div>
                    <div className="card-content-wrapper">
                      <h3>{type.title}</h3>
                      <p>{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <button onClick={() => { setStep(1); changeSpeech('Bilgilerinizi güncelleyebilirsiniz.', 'robot-jump'); }} className="btn-back" id="btn-back-step">
              Geri Dön
            </button>
          </div>
        )}

        {step === 3 && (
          /* Step 3: Database Initial Data Mode (Demo vs Empty) */
          <div className="setup-mode-area animate-fade-in-up" id="database-setup-mode-selector">
            <h1 className="step-title">Başlangıç Kurulum Modu</h1>
            <p className="step-subtitle">Sistemin nasıl doldurulacağını seçin.</p>

            <div className="setup-mode-choices">
              {/* Option A: Demo Mode */}
              <div 
                className={`setup-mode-option ${setupMode === 'demo' ? 'active' : ''}`}
                onClick={() => setSetupMode('demo')}
                onMouseEnter={() => handleOptionHover('demo')}
                onMouseLeave={handleOptionHoverLeave}
                id="btn-mode-demo"
              >
                <div className="option-indicator">
                  {setupMode === 'demo' && <Check size={16} />}
                </div>
                <div className="option-info">
                  <h4>Hazır Demo Verilerle Başla (Tavsiye Edilen)</h4>
                  <p>
                    Seçtiğiniz sektöre uygun hazır ürünler, örnek stok seviyeleri, reçeteler ve toptancı cari hesapları anında yüklenir. Sistemi hemen denemek için idealdir.
                  </p>
                </div>
              </div>

              {/* Option B: Empty Mode */}
              <div 
                className={`setup-mode-option ${setupMode === 'empty' ? 'active' : ''}`}
                onClick={() => setSetupMode('empty')}
                onMouseEnter={() => handleOptionHover('empty')}
                onMouseLeave={handleOptionHoverLeave}
                id="btn-mode-empty"
              >
                <div className="option-indicator">
                  {setupMode === 'empty' && <Check size={16} />}
                </div>
                <div className="option-info">
                  <h4>Boş Veritabanı ile Başla</h4>
                  <p>
                    Sıfır, temiz bir envanter oluşturur. Kendi ürünlerinizi, kategorilerinizi ve fiyatlarınızı baştan girmek istiyorsanız bu seçeneği kullanın.
                  </p>
                </div>
              </div>
            </div>

            <button 
              className="btn-primary" 
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              id="btn-finish-setup"
            >
              {isSubmitting ? 'Kuruluyor...' : 'Sistemi Kur ve Başlat'}
            </button>

            <button 
              onClick={() => { setStep(2); changeSpeech('Sektörünüzü yeniden seçebilirsiniz.', 'robot-jump'); }} 
              className="btn-back" 
              disabled={isSubmitting}
              id="btn-back-step-3"
            >
              Geri Dön
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
