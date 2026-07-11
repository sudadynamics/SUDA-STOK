import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding/Onboarding';
import Dashboard from './components/Dashboard/Dashboard';
import { getSetting, setSetting, initDB } from './utils/db';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Veritabanı bağlantısı kuruluyor...');
  const [businessInfo, setBusinessInfo] = useState(null);

  // Initialize DB and load profile with timed premium loader text transitions
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Step 1
        await initDB();
        
        // Step 2
        setLoadingText('Sektörel stok modülleri ve cari depolar yükleniyor...');
        await new Promise(r => setTimeout(r, 1000));
        
        // Step 3
        setLoadingText('SudaBot AI asistanı hazırlanıyor...');
        await new Promise(r => setTimeout(r, 1000));

        let profile = await getSetting('business_profile');
        if (profile) {
          setBusinessInfo(profile);
        }

        // Step 4
        setLoadingText('Sistem hazır! SudaBot sizi karşılıyor...');
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.error('Error during setup validation:', e);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, []);

  const handleOnboardingComplete = async (profileData) => {
    setLoading(true);
    setLoadingText('İşletme profili kaydediliyor ve veritabanı kuruluyor...');
    try {
      await setSetting('business_profile', profileData);
      setBusinessInfo(profileData);
    } catch (e) {
      console.error('Failed to save onboarding configuration:', e);
    } finally {
      // Clear tour state in case of system reset so new onboarding triggers tutorial again!
      localStorage.removeItem('suda_tour_completed');
      setLoading(false);
    }
  };

  const handleUpdateSettings = (updatedProfile) => {
    setBusinessInfo(updatedProfile);
  };

  const handleReset = () => {
    if (confirm('DİKKAT! Tüm verileriniz (ürünler, reçeteler, loglar ve ayarlar) kalıcı olarak silinecektir. Devam etmek istiyor musunuz?')) {
      setLoading(true);
      setLoadingText('Tüm veritabanı siliniyor...');
      const req = indexedDB.deleteDatabase('SudaStokDB');
      req.onsuccess = () => {
        setBusinessInfo(null);
        localStorage.removeItem('suda_tour_completed');
        window.location.reload();
      };
      req.onerror = () => {
        alert('Veritabanı silinirken bir hata oluştu.');
        setLoading(false);
      };
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="loading-robot-wrapper">
          <svg viewBox="0 0 100 100" className="loading-robot-svg">
            <circle cx="50" cy="12" r="5" fill="#1EAF8A" className="antenna-light-pulse" />
            <line x1="50" y1="12" x2="50" y2="25" stroke="#ffffff" strokeWidth="4" />
            <rect x="25" y="25" width="50" height="50" rx="20" fill="#7C3AED" className="robot-body-pulse" />
            <rect x="33" y="33" width="34" height="26" rx="10" fill="#0B1B3D" />
            <circle cx="43" cy="43" r="4" fill="#1EAF8A" />
            <circle cx="57" cy="43" r="4" fill="#1EAF8A" />
            <path d="M 44 51 Q 50 56 56 51" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 75 45 Q 85 35 90 40" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" className="loading-hand-wave" />
          </svg>
        </div>
        <div className="loading-brand-suda">
          <span>S</span>
          <span className="orange-letter">U</span>
          <span className="green-letter">D</span>
          <span className="purple-letter">A</span>
        </div>
        <div className="loading-brand-dynamics">&lt; DYNAMICS &gt;</div>
        <div className="loading-progress-text">{loadingText}</div>
        <div className="loading-spinner-bar">
          <div className="loading-spinner-bar-fill"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {businessInfo ? (
        <Dashboard 
          businessInfo={businessInfo} 
          onReset={handleReset}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}

// Premium animated loading screen styles
const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#0B1B3D',
  color: '#FFFFFF',
  fontFamily: '"Outfit", sans-serif',
  overflow: 'hidden'
};

// Inject animations dynamically
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .loading-robot-wrapper {
      width: 130px;
      height: 130px;
      margin-bottom: 25px;
      animation: loading-float 2.5s ease-in-out infinite alternate;
    }
    .loading-robot-svg {
      width: 100%;
      height: 100%;
    }
    .loading-brand-suda {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -2px;
      display: flex;
      gap: 3px;
      line-height: 1;
      margin-bottom: 4px;
    }
    .loading-brand-suda span { display: inline-block; }
    .loading-brand-suda .orange-letter { color: #F98D2E; }
    .loading-brand-suda .green-letter { color: #1EAF8A; }
    .loading-brand-suda .purple-letter { color: #7C3AED; }
    .loading-brand-dynamics {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 6px;
      color: #94A3B8;
      text-indent: 6px;
      margin-bottom: 35px;
    }
    .loading-progress-text {
      font-size: 0.9rem;
      color: #ECFDF5;
      font-weight: 500;
      margin-bottom: 16px;
      height: 20px;
      text-align: center;
    }
    .loading-spinner-bar {
      width: 240px;
      height: 5px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    }
    .loading-spinner-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #7C3AED, #1EAF8A, #F98D2E);
      width: 45%;
      border-radius: 3px;
      animation: loading-bar-progress 1.8s ease-in-out infinite;
    }

    @keyframes loading-float {
      from { transform: translateY(0); }
      to { transform: translateY(-15px); }
    }
    @keyframes loading-bar-progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
    .antenna-light-pulse {
      animation: pulse-green 0.8s infinite alternate;
    }
    @keyframes pulse-green {
      from { fill: #1EAF8A; opacity: 0.6; }
      to { fill: #34D399; opacity: 1; filter: drop-shadow(0 0 6px #34D399); }
    }
    .loading-hand-wave {
      animation: loading-wave 1s ease-in-out infinite alternate;
      transform-origin: 75px 45px;
    }
    @keyframes loading-wave {
      from { transform: rotate(0deg); }
      to { transform: rotate(20deg); }
    }
  `;
  document.head.appendChild(style);
}
