import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X, Bot, CheckCircle } from 'lucide-react';
import './GuidedTour.css';

export default function GuidedTour({ isOpen, onClose, activeTab, setActiveTab, businessType }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({ display: 'none' });

  // Tour steps definition
  const steps = [
    {
      title: '👋 Hoş Geldiniz!',
      message: 'Merhaba! Ben SudaBot. İşletmenizi büyütmek ve kolayca yönetmek için size stok takip ve kasa panelimizi gezdirmekten mutluluk duyacağım. Hadi başlayalım!',
      targetId: '', // Centered Welcome
      tab: 'stock'
    },
    {
      title: '📦 Stok Kontrolü',
      message: 'Burası Stok Listesi ekranı. Ürünlerinizi, birim fiyatlarını, kritik limitlerini ve en önemlisi Son Kullanma Tarihini (SKT) buradan görebilir, takip edebilirsiniz.',
      targetId: 'tab-btn-stock',
      tab: 'stock'
    },
    {
      title: '💵 Hızlı Satış (POS)',
      message: 'Burası POS terminaliniz! Tıpkı bir dokunmatik yazar kasa gibi ürünlerinizi sepete ekleyebilir, nakit para üstü hesaplayabilir veya carilere veresiye borç yazabilirsiniz.',
      targetId: 'tab-btn-pos',
      tab: 'pos'
    },
    {
      title: '📈 Finans ve Kar / Zarar',
      message: 'Burası Finansal Rapor ekranınız. POS cironuzdan, toptancı harcamalarınızdan ve fire kayıplarınızdan net karınızı ve kar marjınızı saniyeler içinde hesaplar.',
      targetId: 'tab-btn-finance',
      tab: 'finance'
    },
    // Only show recipes step for Cafe, Pastane, and Firin
    ...( ['pastane', 'cafe', 'firin'].includes(businessType) ? [{
      title: '🥞 Tarifler & Üretim',
      message: 'Burası Reçeteler alanı. Ürünlerinizin malzeme formüllerini tanımlayıp, tek tıkla hammaddeleri envanterden düşerek üretim kaydı oluşturabilirsiniz.',
      targetId: 'tab-btn-recipes',
      tab: 'recipes'
    }] : [] ),
    {
      title: '🤖 SudaBot Yapay Zeka Asistanı',
      message: 'Son olarak ben! Sağ alt köşedeki mor robot simgemi tıklayarak dilediğiniz an stok raporları ve akıllı öneriler talep edebilirsiniz. Gezimiz bitti, harika satışlar dilerim! ✨',
      targetId: 'btn-toggle-sudabot',
      tab: 'stock'
    }
  ];

  // Auto-switch tabs to focus target coordinates
  useEffect(() => {
    if (!isOpen) return;
    const currentStep = steps[stepIndex];
    if (currentStep && currentStep.tab && activeTab !== currentStep.tab) {
      setActiveTab(currentStep.tab);
    }
  }, [stepIndex, isOpen]);

  // Calculate and update spotlight coordinates
  useEffect(() => {
    if (!isOpen) return;
    const currentStep = steps[stepIndex];
    if (!currentStep || !currentStep.targetId) {
      setSpotlightStyle({ display: 'none' });
      return;
    }

    const updateSpotlight = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightStyle({
          top: `${rect.top - 8 + window.scrollY}px`,
          left: `${rect.left - 8 + window.scrollX}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          display: 'block'
        });
      } else {
        setSpotlightStyle({ display: 'none' });
      }
    };

    // Delay slightly to allow React panel transitions to complete before measuring coordinates
    const timer = setTimeout(updateSpotlight, 250);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [stepIndex, activeTab, isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleClose = () => {
    setStepIndex(0);
    onClose();
  };

  return (
    <div className="tour-overlay-container">
      {/* Background Masking Overlay */}
      <div className="tour-backdrop" onClick={handleClose}></div>

      {/* Spotlight Ring */}
      <div className="tour-spotlight-ring" style={spotlightStyle}></div>

      {/* Guided Tour Modal Card */}
      <div className={`tour-guide-card animate-pop-in ${!currentStep.targetId ? 'centered' : ''}`}>
        
        {/* SudaBot Head animation */}
        <div className="tour-robot-avatar">
          <svg viewBox="0 0 100 100" className="tour-robot-svg">
            <circle cx="50" cy="12" r="5" fill="#1EAF8A" className="antenna-light" />
            <line x1="50" y1="12" x2="50" y2="25" stroke="#ffffff" strokeWidth="4" />
            <rect x="25" y="25" width="50" height="50" rx="20" fill="#7C3AED" />
            <rect x="33" y="33" width="34" height="26" rx="10" fill="#0B1B3D" />
            <circle cx="43" cy="43" r="4" fill="#1EAF8A" className="eye-blink" />
            <circle cx="57" cy="43" r="4" fill="#1EAF8A" className="eye-blink" />
            <path d="M 44 52 Q 50 58 56 52" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <div className="tour-card-body">
          <div className="tour-card-header">
            <h4>{currentStep.title}</h4>
            <button className="btn-close-tour" onClick={handleClose} aria-label="Turu Kapat">
              <X size={16} />
            </button>
          </div>

          <p className="tour-message">{currentStep.message}</p>

          {/* Step dots */}
          <div className="tour-dots-indicator">
            {steps.map((_, i) => (
              <span key={i} className={`tour-dot ${i === stepIndex ? 'active' : ''}`}></span>
            ))}
          </div>

          <div className="tour-footer-buttons">
            <button 
              className="btn-tour-back" 
              onClick={handleBack} 
              disabled={stepIndex === 0}
            >
              <ArrowLeft size={14} /> Geri
            </button>
            
            <button className="btn-tour-next" onClick={handleNext}>
              {isLastStep ? (
                <>Tamamla <CheckCircle size={14} /></>
              ) : (
                <>İleri <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
