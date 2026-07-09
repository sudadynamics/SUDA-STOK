import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding/Onboarding';
import Dashboard from './components/Dashboard/Dashboard';
import { getSetting, setSetting, initDB } from './utils/db';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState(null);

  // Initialize DB and load profile
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Initialize the DB structure first
        await initDB();
        
        // Retrieve business profile setting
        let profile = await getSetting('business_profile');
        if (profile) {
          setBusinessInfo(profile);
        }
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
    try {
      await setSetting('business_profile', profileData);
      setBusinessInfo(profileData);
    } catch (e) {
      console.error('Failed to save onboarding configuration:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = (updatedProfile) => {
    setBusinessInfo(updatedProfile);
  };

  const handleReset = () => {
    if (confirm('DİKKAT! Tüm verileriniz (ürünler, reçeteler, loglar ve ayarlar) kalıcı olarak silinecektir. Devam etmek istiyor musunuz?')) {
      setLoading(true);
      const req = indexedDB.deleteDatabase('SudaStokDB');
      req.onsuccess = () => {
        setBusinessInfo(null);
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
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>SUDA DYNAMICS | Stok Takip Sistemi Yükleniyor...</p>
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

// Inline loading styles
const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#0B1B3D', // Suda Navy
  color: '#FFFFFF',
  fontFamily: '"Outfit", sans-serif'
};

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid rgba(255, 255, 255, 0.1)',
  borderTopColor: '#7C3AED', // Suda Purple
  borderRadius: '50%',
  animation: 'spin 1s infinite linear',
  marginBottom: '20px'
};

const loadingTextStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  letterSpacing: '1px',
  color: '#ECFDF5' // Teal light
};

// Injection of keyframes logic dynamically
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
