import React, { useState, useEffect } from 'react';
import { 
  Boxes, Layers, Settings, LogOut, Download, Upload, Trash2, 
  User, Briefcase, DollarSign, Key, Bell, RefreshCw, Sparkles, Bot, 
  Truck, Printer, Receipt, ShoppingCart, AlertTriangle, TrendingUp 
} from 'lucide-react';
import StockList from './StockList';
import RecipeManager from './RecipeManager';
import StockCharts from './StockCharts';
import SupplierManager from './SupplierManager';
import PosTerminal from './PosTerminal';
import FinancialReport from './FinancialReport';
import SudaBot from './SudaBot';
import GuidedTour from './GuidedTour';
import { 
  getAllProducts, addProduct, updateProduct, deleteProduct, 
  getAllRecipes, addRecipe, deleteRecipe, 
  getAllLogs, addLog, exportBackup, importBackup, setSetting,
  getAllSuppliers, addSupplier, updateSupplier, deleteSupplier 
} from '../../utils/db';
import { getSudaBotStockAnalysis } from '../../utils/gemini';
import './Dashboard.css';

export default function Dashboard({ businessInfo, onReset, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Settings form states
  const [editName, setEditName] = useState(businessInfo.businessName);
  const [editOwner, setEditOwner] = useState(businessInfo.ownerName);
  const [editCurrency, setEditCurrency] = useState(businessInfo.currency);
  const [editApiKey, setEditApiKey] = useState(businessInfo.geminiApiKey || '');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Load database tables
  const loadData = async () => {
    try {
      const prodList = await getAllProducts();
      setProducts(prodList);
      
      const recList = await getAllRecipes();
      setRecipes(recList);

      const supList = await getAllSuppliers();
      setSuppliers(supList);
      
      const logList = await getAllLogs();
      setLogs(logList);

      // Check for notifications (critical levels & Expiry dates)
      const criticals = prodList.filter(p => p.stockAmount <= p.criticalLevel);
      const notifs = criticals.map(p => ({
        id: `critical-${p.id}`,
        message: `${p.name} stoğu kritik seviyede! (${p.stockAmount} ${p.unit} kaldı)`,
        type: p.stockAmount === 0 ? 'empty' : 'warning'
      }));

      // Check Expiration Dates
      const today = new Date();
      today.setHours(0,0,0,0);
      prodList.forEach(p => {
        if (p.expiryDate) {
          const exp = new Date(p.expiryDate);
          exp.setHours(0,0,0,0);
          const diffTime = exp - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            notifs.push({
              id: `expired-${p.id}`,
              message: `⚠️ ${p.name} Son Kullanma Tarihi GEÇTİ! (${Math.abs(diffDays)} gün önce)`,
              type: 'empty'
            });
          } else if (diffDays <= 7) {
            notifs.push({
              id: `expiring-${p.id}`,
              message: `⏰ ${p.name} Son Kullanma Tarihi yaklaşıyor! (${diffDays} gün kaldı)`,
              type: 'warning'
            });
          }
        }
      });

      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load data from IndexedDB:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stock CRUD actions
  const handleAddProduct = async (product) => {
    await addProduct(product);
    await addLog('add', `Yeni ürün eklendi: ${product.name}`, `${product.stockAmount} ${product.unit} başlangıç stoğu.`);
    await loadData();
  };

  const handleUpdateProduct = async (product) => {
    await updateProduct(product);
    await addLog('system', `Ürün güncellendi: ${product.name}`, `Fiyat: ${product.price}, Limit: ${product.criticalLevel}`);
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    if (confirm(`"${prod.name}" ürününü silmek istediğinize emin misiniz?`)) {
      await deleteProduct(id);
      await addLog('reduce', `Ürün silindi: ${prod.name}`, '');
      await loadData();
    }
  };

  const handleQuickAdjust = async (id, delta) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const newAmount = Math.max(0, prod.stockAmount + delta);
    const updated = { ...prod, stockAmount: newAmount };
    await updateProduct(updated);
    
    const type = delta > 0 ? 'add' : 'reduce';
    const msg = delta > 0 
      ? `${prod.name} stoğu arttırıldı (+${Math.abs(delta)})`
      : `${prod.name} stoğu azaltıldı (-${Math.abs(delta)})`;
    
    await addLog(type, msg, `Mevcut stok: ${newAmount} ${prod.unit}`);
    await loadData();
  };

  // POS Sales item reduction helper
  const handleSellProduct = async (id, qty) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newAmount = Math.max(0, product.stockAmount - qty);
    await updateProduct({ ...product, stockAmount: newAmount });
  };

  // Zayiat / Fire Callback helper
  const handleReportWaste = async (product, qty, reason) => {
    const newAmount = Math.max(0, product.stockAmount - qty);
    await updateProduct({ ...product, stockAmount: newAmount });
    
    const lossCost = qty * product.price;
    await addLog('reduce', `Zayiat/Fire: ${qty} ${product.unit} ${product.name}`, `Neden: ${reason}, Zarar: -${lossCost.toFixed(2)} ${businessInfo.currency}`);
    await loadData();
  };

  // Recipe CRUD actions
  const handleAddRecipe = async (recipe) => {
    await addRecipe(recipe);
    await addLog('system', `Yeni reçete oluşturuldu: ${recipe.name}`, `${recipe.ingredients.length} malzeme tanımlandı.`);
    await loadData();
  };

  const handleDeleteRecipe = async (id) => {
    const rec = recipes.find(r => r.id === id);
    if (!rec) return;
    if (confirm(`"${rec.name}" reçetesini silmek istiyor musunuz?`)) {
      await deleteRecipe(id);
      await addLog('system', `Reçete silindi: ${rec.name}`, '');
      await loadData();
    }
  };

  const handleProduceRecipe = async (recipe, qty) => {
    for (const ing of recipe.ingredients) {
      const product = products.find(p => p.id === ing.productId);
      if (product) {
        const newAmount = Math.max(0, product.stockAmount - (ing.amount * qty));
        await updateProduct({ ...product, stockAmount: newAmount });
      }
    }

    await addLog('sell', `Üretim Yapıldı: ${qty} Adet "${recipe.name}"`, `Malzemeler stoktan düşüldü.`);
    await loadData();
  };

  // Supplier / Cari Actions
  const handleAddSupplier = async (supplier) => {
    await addSupplier(supplier);
    await addLog('system', `Yeni tedarikçi eklendi: ${supplier.company}`, `Yetkili: ${supplier.name}, Borç: ${supplier.balance}`);
    await loadData();
  };

  const handleDeleteSupplier = async (id) => {
    const sup = suppliers.find(s => s.id === id);
    if (!sup) return;
    if (confirm(`"${sup.company}" tedarikçi kartını silmek istediğinize emin misiniz?`)) {
      await deleteSupplier(id);
      await addLog('system', `Tedarikçi silindi: ${sup.company}`, '');
      await loadData();
    }
  };

  const handleBuyStock = async (supplier, product, qty, unitPrice) => {
    const totalCost = qty * unitPrice;
    
    // 1. Update product stock
    const updatedProduct = {
      ...product,
      stockAmount: product.stockAmount + qty,
      price: unitPrice
    };
    await updateProduct(updatedProduct);

    // 2. Update supplier debt balance
    const updatedSupplier = {
      ...supplier,
      balance: supplier.balance + totalCost
    };
    await updateSupplier(updatedSupplier);

    // 3. Log transaction
    await addLog('add', `Stok Alımı: ${qty} ${product.unit} ${product.name}`, `Tedarikçi: ${supplier.company}, Borç: +${totalCost.toFixed(2)} ${businessInfo.currency}`);
    await loadData();
  };

  const handleMakePayment = async (supplier, amount) => {
    // 1. Update supplier balance
    const updatedSupplier = {
      ...supplier,
      balance: Math.max(0, supplier.balance - amount)
    };
    await updateSupplier(updatedSupplier);

    // 2. Log transaction
    await addLog('reduce', `Ödeme Yapıldı: ${supplier.company}`, `Tutar: -${amount.toFixed(2)} ${businessInfo.currency}`);
    await loadData();
  };

  // AI analysis trigger
  const generateAIReport = async () => {
    if (!businessInfo.geminiApiKey) return;
    setIsAiLoading(true);
    setAiReport('');
    try {
      const report = await getSudaBotStockAnalysis(
        businessInfo.geminiApiKey,
        products,
        logs,
        businessInfo.businessType,
        businessInfo.businessName
      );
      setAiReport(report);
    } catch (e) {
      setAiReport('Rapor üretilirken bir hata oluştu: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      generateAIReport();
    }
  }, [activeTab]);

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const updated = {
      ...businessInfo,
      businessName: editName,
      ownerName: editOwner,
      currency: editCurrency,
      geminiApiKey: editApiKey
    };
    
    await setSetting('business_profile', updated);
    onUpdateSettings(updated);
    
    setSettingsSuccess('Ayarlar başarıyla kaydedildi!');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  // Export JSON backup
  const handleExport = async () => {
    const dataStr = await exportBackup();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `suda_dynamics_stok_${businessInfo.businessName.toLowerCase().replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import JSON backup
  const handleImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const backupData = event.target.result;
        await importBackup(backupData);
        alert('Yedekleme dosyası başarıyla yüklendi! Veritabanı güncellendi.');
        window.location.reload();
      } catch (err) {
        alert('Hata! Geçersiz yedekleme dosyası.');
      }
    };
  };

  // Printing Logs / Fiş
  const handlePrintLog = (log) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    
    const htmlContent = `
      <html>
        <head>
          <title>SUDA Dynamics - Stok Fişi</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 30px; color: #1F2E4D; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #0B1B3D; padding-bottom: 15px; margin-bottom: 20px; }
            .header h2 { margin: 0; color: #0B1B3D; font-size: 20px; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #64748B; text-transform: uppercase; }
            .details-box { background-color: #F8FAFB; border-radius: 8px; padding: 15px; margin-bottom: 20px; border: 1px solid #E5E9F0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .row:last-child { margin-bottom: 0; }
            .row strong { color: #0B1B3D; }
            .receipt-desc { font-size: 14px; font-weight: 600; padding: 10px 0; border-bottom: 1px solid #E5E9F0; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94A3B8; border-top: 1px dashed #E5E9F0; padding-top: 15px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SUDA DYNAMICS</h2>
            <p>STOK HAREKET FİŞİ</p>
          </div>
          
          <div class="details-box">
            <div class="row">
              <span>İşletme:</span>
              <strong>${businessInfo.businessName}</strong>
            </div>
            <div class="row">
              <span>İşlem Tarihi:</span>
              <strong>${new Date(log.date).toLocaleString()}</strong>
            </div>
            <div class="row">
              <span>İşlem Türü:</span>
              <strong>${log.type.toUpperCase()}</strong>
            </div>
          </div>
          
          <div class="receipt-desc">
            ${log.message}
          </div>
          <div class="row" style="font-size: 13px; margin-top: 5px; color: #64748B;">
            <span>Açıklama:</span>
            <span>${log.details || '-'}</span>
          </div>

          <div class="footer">
            SUDA Dynamics Stok Takip Sistemi tarafından üretilmiştir.<br>Takipte kalın, büyük şeyler geliyor!
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Calculations
  const totalStockValue = products.reduce((acc, p) => acc + (p.stockAmount * p.price), 0);
  const totalDebt = suppliers.reduce((acc, s) => acc + s.balance, 0);
  const criticalCount = products.filter(p => p.stockAmount <= p.criticalLevel).length;

  // Calculate Cumulative Waste Costs dynamically from logs
  const totalWasteLoss = logs.reduce((acc, log) => {
    if (log.message && log.message.includes('Zayiat/Fire:')) {
      const match = log.details ? log.details.match(/Zarar:\s*-\s*([\d.]+)/) : null;
      if (match && match[1]) {
        return acc + parseFloat(match[1]);
      }
    }
    return acc;
  }, 0);

  const getBusinessTypeLabel = (type) => {
    const labels = { pastane: '🧁 Pastane', cafe: '☕ Cafe', firin: '🥖 Fırın', market: '🛒 Market' };
    return labels[type] || '💼 Genel';
  };

  return (
    <div className="dashboard-layout animate-fade-in" id="dashboard-wrapper">
      
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-suda">
            <span>S</span>
            <span className="orange-letter">U</span>
            <span className="green-letter">D</span>
            <span className="purple-letter">A</span>
          </div>
          <span className="sidebar-dynamics">&lt; DYNAMICS &gt;</span>
        </div>

        <div className="business-tag">
          <span className="business-tag-type">{getBusinessTypeLabel(businessInfo.businessType)}</span>
          <span className="business-tag-name">{businessInfo.businessName}</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
            id="tab-btn-stock"
          >
            <Boxes size={20} />
            <span>Stok Listesi</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pos')}
            id="tab-btn-pos"
          >
            <ShoppingCart size={20} />
            <span>Hızlı Satış (POS)</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
            id="tab-btn-finance"
          >
            <TrendingUp size={20} />
            <span>Finansal Rapor</span>
          </button>
          
          {/* Render recipes tab only for recipes-based business types */}
          {['pastane', 'cafe', 'firin'].includes(businessInfo.businessType) && (
            <button 
              className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
              id="tab-btn-recipes"
            >
              <Layers size={20} />
              <span>Reçeteler & Üretim</span>
            </button>
          )}

          <button 
            className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
            id="tab-btn-suppliers"
          >
            <Truck size={20} />
            <span>Tedarikçi & Cari</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
            id="tab-btn-ai"
          >
            <Sparkles size={20} className="sparkle-icon" />
            <span>Suda AI Rapor</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            id="tab-btn-settings"
          >
            <Settings size={20} />
            <span>Ayarlar & Yedek</span>
          </button>
        </nav>

        <button className="btn-logout" onClick={onReset} id="btn-reset-project">
          <LogOut size={18} />
          <span>Sistemi Sıfırla</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Topbar navigation panel */}
        <header className="topbar">
          <div className="topbar-welcome">
            <h1>Merhaba, {businessInfo.ownerName} 👋</h1>
            <p>Bugün işletmenizin stok durumu oldukça iyi görünüyor.</p>
          </div>

          <div className="topbar-actions">
            {/* Guided Tour Launcher */}
            <button 
              className="btn-backup-export" 
              onClick={() => setIsTourOpen(true)} 
              id="btn-topbar-tour"
              style={{ marginRight: 8, backgroundColor: 'var(--color-purple-light)', color: 'var(--color-purple)', border: '1px solid rgba(124,58,237,0.15)' }}
            >
              ✨ Rehberli Tur
            </button>

            <div className="notification-bell-wrapper" id="bell-dropdown-trigger">
              <button className="btn-bell" aria-label="Bildirimler">
                <Bell size={20} />
                {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
              </button>
              
              {notifications.length > 0 && (
                <div className="notifications-dropdown">
                  <div className="notif-header">Uyarılar & Bildirimler</div>
                  <div className="notif-list">
                    {notifications.map((notif, idx) => (
                      <div key={idx} className={`notif-item ${notif.type}`}>
                        <span>{notif.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="btn-backup-export" onClick={handleExport} id="btn-topbar-export">
              <Download size={16} /> Yedek İndir
            </button>
          </div>
        </header>

        {/* Dynamic Analytics Summary Grid with 4 Metrics */}
        <section className="analytics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="analytic-card glow-card border-purple">
            <div className="card-desc">Toplam Ürün Çeşidi</div>
            <div className="card-value text-purple">{products.length}</div>
            <span className="badge badge-purple">Aktif Envanter</span>
          </div>

          <div className="analytic-card glow-card border-orange">
            <div className="card-desc">Kritik Stok Uyarısı</div>
            <div className="card-value text-orange">{criticalCount}</div>
            <span className={`badge ${criticalCount > 0 ? 'badge-danger' : 'badge-success'}`}>
              {criticalCount > 0 ? 'Hemen İncele!' : 'Her şey Yolunda'}
            </span>
          </div>

          <div className="analytic-card glow-card border-teal">
            <div className="card-desc">Toplam Stok Değeri</div>
            <div className="card-value text-teal">{totalStockValue.toFixed(2)} {businessInfo.currency}</div>
            <span className="badge badge-success">Mevcut Varlık</span>
          </div>

          <div className="analytic-card glow-card border-red" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <div className="card-desc">Toplam Fire/Zayiat Kaybı</div>
            <div className="card-value text-red" style={{ color: 'var(--color-red)' }}>{totalWasteLoss.toFixed(2)} {businessInfo.currency}</div>
            <span className="badge badge-danger" style={{ backgroundColor: 'var(--color-red-light)', color: 'var(--color-red)' }}>Net Zarar Bilgisi</span>
          </div>
        </section>

        {/* Dynamic Screen Area */}
        <section className="content-card-box">
          {activeTab === 'stock' && (
            <>
              {/* Show dashboard charts directly on top of the stock view */}
              <StockCharts products={products} currency={businessInfo.currency} />
              
              <StockList
                products={products}
                suppliers={suppliers}
                currency={businessInfo.currency}
                businessInfo={businessInfo}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickAdjust={handleQuickAdjust}
                onReportWaste={handleReportWaste}
              />
            </>
          )}

          {activeTab === 'pos' && (
            <PosTerminal
              products={products}
              suppliers={suppliers}
              currency={businessInfo.currency}
              onSellProduct={handleSellProduct}
              onAddLog={async (type, msg, details) => {
                await addLog(type, msg, details);
                await loadData();
              }}
            />
          )}

          {activeTab === 'finance' && (
            <FinancialReport
              logs={logs}
              products={products}
              currency={businessInfo.currency}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeManager
              products={products}
              recipes={recipes}
              onAddRecipe={handleAddRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onProduceRecipe={handleProduceRecipe}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierManager
              products={products}
              suppliers={suppliers}
              currency={businessInfo.currency}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onBuyStock={handleBuyStock}
              onMakePayment={handleMakePayment}
            />
          )}

          {activeTab === 'ai' && (
            <div className="ai-report-container animate-fade-in" id="ai-report-tab">
              <div className="ai-report-header">
                <div className="ai-title">
                  <Bot size={28} className="ai-bot-icon" />
                  <div>
                    <h3>SudaBot AI Akıllı Stok Analiz Raporu</h3>
                    <p>Yapay Zeka ile stoklarınızın geleceğini görün.</p>
                  </div>
                </div>
                {businessInfo.geminiApiKey && (
                  <button className="btn-refresh-ai" onClick={generateAIReport} disabled={isAiLoading} id="btn-refresh-ai-report">
                    <RefreshCw size={16} className={isAiLoading ? 'spin' : ''} /> Raporu Yenile
                  </button>
                )}
              </div>

              {!businessInfo.geminiApiKey ? (
                <div className="ai-no-key animate-pop-in">
                  <Key size={48} className="key-icon animate-float" />
                  <h4>Gemini API Anahtarı Gerekli</h4>
                  <p>Yapay zeka asistanının stok durumunuzu ve loglarınızı analiz edip, size özel talep tahminleri ve tarif önerileri sunabilmesi için bir API anahtarına ihtiyacı var.</p>
                  <button className="btn-primary" style={{ width: 'auto', marginTop: 16 }} onClick={() => setActiveTab('settings')} id="btn-go-settings-for-key">
                    Hemen API Key Ekle
                  </button>
                </div>
              ) : isAiLoading ? (
                <div className="ai-loading-box">
                  <div className="ai-loading-spinner"></div>
                  <p>SudaBot veritabanınızı analiz ediyor, yapay zeka raporu hazırlanıyor...</p>
                </div>
              ) : (
                <div className="ai-report-content animate-pop-in">
                  <div className="ai-sparkle-badge">
                    <Sparkles size={16} /> <span>SudaBot AI Raporu</span>
                  </div>
                  <div className="ai-text-block">
                    {aiReport.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-container animate-fade-in" id="settings-section">
              <h2>⚙️ Ayarlar & Veri Yönetimi</h2>
              <p className="settings-subtitle">İşletme bilgilerinizi güncelleyin ve verilerinizi yedekleyin.</p>

              {settingsSuccess && (
                <div className="recipe-alert success animate-pop-in">
                  <CheckCircle size={20} />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <div className="settings-grid">
                <form onSubmit={handleSaveSettings} className="settings-form" id="business-settings-form">
                  <h3>Profil Güncelleme</h3>
                  
                  <div className="input-group">
                    <label htmlFor="settings-name">İşletme Adı</label>
                    <input
                      type="text"
                      id="settings-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="settings-owner">Yetkili / Yönetici</label>
                    <input
                      type="text"
                      id="settings-owner"
                      value={editOwner}
                      onChange={(e) => setEditOwner(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="settings-currency">Para Birimi</label>
                    <select
                      id="settings-currency"
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                    >
                      <option value="₺">Türk Lirası (₺)</option>
                      <option value="$">Dolar ($)</option>
                      <option value="€">Euro (€)</option>
                      <option value="£">Sterlin (£)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="settings-apikey" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Google Gemini API Key</span>
                      <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="api-help-link">
                        (API Key Al)
                      </a>
                    </label>
                    <input
                      type="password"
                      id="settings-apikey"
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="AI Raporu ve Chat için API Key yapıştırın"
                    />
                  </div>

                  <button type="submit" className="btn-save-settings" id="btn-save-settings-submit">
                    Ayarları Kaydet
                  </button>
                </form>

                <div className="settings-backup-panel">
                  <h3>Veri Yönetimi</h3>
                  <p>Verilerinizi güvende tutmak için bilgisayarınıza yedek alabilir veya mevcut bir yedeği sisteme yükleyebilirsiniz.</p>

                  <div className="backup-actions">
                    <button className="btn-backup-download" onClick={handleExport} id="btn-settings-export">
                      <Download size={18} /> Veritabanını Yedekle (.JSON)
                    </button>

                    <div className="backup-upload-wrapper">
                      <label htmlFor="backup-file-input" className="btn-backup-upload" id="lbl-settings-import">
                        <Upload size={18} /> Yedekten Geri Yükle (.JSON)
                      </label>
                      <input
                        type="file"
                        id="backup-file-input"
                        accept=".json"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="settings-log-box">
                    <h4>Son Stok Hareketleri</h4>
                    <div className="logs-list">
                      {logs.length === 0 ? (
                        <p className="no-logs">Henüz hareket kaydı bulunmuyor.</p>
                      ) : (
                        logs.slice(0, 8).map((log, idx) => (
                          <div key={idx} className={`log-item log-${log.type}`}>
                            <div className="log-msg-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="log-msg">{log.message}</span>
                              <button 
                                className="btn-print-receipt-log" 
                                onClick={() => handlePrintLog(log)}
                                title="İşlem Fişi Yazdır"
                                style={printBtnStyle}
                                id={`btn-print-log-${log.id || idx}`}
                              >
                                <Printer size={12} /> Fiş Yazdır
                              </button>
                            </div>
                            <div className="log-meta">
                              <span>{log.details}</span>
                              <span>{new Date(log.date).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating SudaBot Assistant */}
      <SudaBot
        products={products}
        logs={logs}
        businessInfo={businessInfo}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Interactive Guided Tour Walkthrough */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        businessType={businessInfo.businessType}
      />
    </div>
  );
}

// Inline styling for tiny print logs button
const printBtnStyle = {
  background: '#F1F5F9',
  border: '1px solid #CBD5E1',
  borderRadius: '4px',
  color: '#475569',
  fontSize: '10px',
  fontWeight: '600',
  padding: '3px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.15s ease'
};
