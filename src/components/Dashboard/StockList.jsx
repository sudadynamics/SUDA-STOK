import React, { useState } from 'react';
import { Search, Plus, Minus, Edit, Trash2, X, Filter, AlertTriangle, MessageCircle, Printer, Calendar } from 'lucide-react';
import './StockList.css';

const UNITS = ['Adet', 'g', 'kg', 'L', 'ml', 'Paket', 'Çuval', 'Kutu'];
const DEFAULT_CATEGORIES = ['Hammaddeler', 'Süt & Şarküteri', 'Un & Maya', 'Kahve & İçecek', 'Meyve & Sebze', 'Ambalaj & Paket'];
const WASTE_REASONS = ['Bozulma', 'Dökülme/Kayıp', 'Son Tüketim Tarihi Geçti', 'Hasarlı Teslimat'];

export default function StockList({ 
  products, 
  suppliers, 
  currency, 
  businessInfo,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onQuickAdjust,
  onReportWaste 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Zayiat modal states
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteProductId, setWasteProductId] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState(WASTE_REASONS[0]);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('Adet');
  const [stockAmount, setStockAmount] = useState('');
  const [criticalLevel, setCriticalLevel] = useState('');
  const [price, setPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const openAddDrawer = () => {
    setEditingProduct(null);
    setName('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setUnit('Adet');
    setStockAmount('');
    setCriticalLevel('');
    setPrice('');
    setExpiryDate('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product) => {
    setEditingProduct(product);
    setName(product.name);
    
    if (DEFAULT_CATEGORIES.includes(product.category)) {
      setCategory(product.category);
      setCustomCategory('');
    } else {
      setCategory('custom');
      setCustomCategory(product.category);
    }
    
    setUnit(product.unit);
    setStockAmount(product.stockAmount);
    setCriticalLevel(product.criticalLevel);
    setPrice(product.price);
    setExpiryDate(product.expiryDate || '');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = category === 'custom' ? customCategory : category;
    
    if (!name.trim() || !finalCategory.trim()) return;

    const productData = {
      name,
      category: finalCategory,
      unit,
      stockAmount: parseFloat(stockAmount) || 0,
      criticalLevel: parseFloat(criticalLevel) || 0,
      price: parseFloat(price) || 0,
      expiryDate
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...productData });
    } else {
      onAddProduct(productData);
    }
    
    closeDrawer();
  };

  // Helper for text highlighting in search results
  const highlightText = (text, search) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="search-highlight">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  // Category specific CSS class names
  const getCategoryClass = (categoryName) => {
    const cat = categoryName.toLowerCase();
    if (cat.includes('un') || cat.includes('maya')) return 'cat-un-maya';
    if (cat.includes('süt') || cat.includes('şarküteri') || cat.includes('peynir')) return 'cat-sut';
    if (cat.includes('kahve') || cat.includes('içecek') || cat.includes('su')) return 'cat-icecek';
    if (cat.includes('meyve') || cat.includes('sebze') || cat.includes('çilek')) return 'cat-meyve';
    if (cat.includes('ambalaj') || cat.includes('paket') || cat.includes('kutu')) return 'cat-ambalaj';
    return 'cat-default';
  };

  // Expiration Days Calculator and Badge Renderer
  const getExpiryBadge = (dateStr) => {
    if (!dateStr) return <span className="skt-none" style={{ color: '#94A3B8' }}>Tanımsız</span>;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(dateStr);
    exp.setHours(0,0,0,0);
    
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="badge badge-danger skt-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⚠️ Geçti ({Math.abs(diffDays)} gün)</span>;
    } else if (diffDays === 0) {
      return <span className="badge badge-danger skt-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⚠️ BUGÜN!</span>;
    } else if (diffDays <= 7) {
      return <span className="badge badge-warning skt-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⚠️ Yaklaştı ({diffDays} gün)</span>;
    } else {
      return <span className="badge badge-success skt-badge">Taze ({diffDays} gün)</span>;
    }
  };

  // Get distinct categories present in active products
  const activeCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...products.map(p => p.category)
  ]));

  // Filtering products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle WhatsApp sipariş taslağı
  const handleWhatsAppOrder = (product) => {
    const supplier = suppliers[0] || { name: 'Tedarikçi', phone: '', company: 'Tedarikçi Firmamız' };
    const phone = supplier.phone ? supplier.phone.replace(/\s+/g, '') : '';
    const message = `Merhaba ${supplier.company || supplier.name},\n\n${businessInfo.businessName} olarak kritik seviyenin altına düşen şu envanter kalemimiz için sipariş oluşturmak istiyoruz:\n\n- ${product.name} (Gerekli Birim Fiyat: ${product.price.toFixed(2)} ${currency})\n\nDesteklerinizi rica ederiz, iyi çalışmalar.`;
    
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Handle Zayiat/Fire Submission
  const handleWasteSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === parseInt(wasteProductId));
    const qty = parseFloat(wasteQty);
    
    if (!product || !qty || qty <= 0) return;

    if (qty > product.stockAmount) {
      alert('Zayiat miktarı mevcut stok miktarından fazla olamaz!');
      return;
    }

    onReportWaste(product, qty, wasteReason);
    setIsWasteModalOpen(false);
    setWasteProductId('');
    setWasteQty('');
    setWasteReason(WASTE_REASONS[0]);
  };

  const openWasteModal = (productId = '') => {
    setWasteProductId(productId);
    setWasteQty('');
    setIsWasteModalOpen(true);
  };

  // Print Inventory Report
  const handlePrintInventory = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const totalInventoryValue = filteredProducts.reduce((acc, p) => acc + (p.stockAmount * p.price), 0);
    const criticalCount = filteredProducts.filter(p => p.stockAmount <= p.criticalLevel).length;

    const tableRows = filteredProducts.map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${p.price.toFixed(2)} ${currency}</td>
        <td>${p.stockAmount} ${p.unit}</td>
        <td>${p.criticalLevel} ${p.unit}</td>
        <td>${p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>SUDA DYNAMICS - Envanter Raporu</title>
          <style>
            body { font-family: 'Outfit', sans-serif; color: #0B1B3D; padding: 30px; line-height: 1.4; }
            .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B1B3D; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0B1B3D; }
            .logo-title p { margin: 4px 0 0 0; font-size: 12px; color: #64748B; letter-spacing: 2px; }
            .meta-box { font-size: 13px; text-align: right; }
            .kpis-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .kpi-card { background-color: #F8FAFB; border: 1px solid #E5E9F0; border-radius: 8px; padding: 15px; text-align: center; }
            .kpi-card span { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; }
            .kpi-card strong { display: block; font-size: 18px; margin-top: 5px; color: #0B1B3D; }
            .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
            .inv-table th { padding: 12px; background-color: #F1F5F9; border-bottom: 2px solid #E2E8F0; text-align: left; }
            .inv-table td { padding: 12px; border-bottom: 1px solid #E5E9F0; }
            .inv-table tr:nth-child(even) { background-color: #FAFCFE; }
            .footer { text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px dashed #E5E9F0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <div class="logo-title">
              <h1>SUDA DYNAMICS</h1>
              <p>ENVANTER SAYIM RAPORU</p>
            </div>
            <div class="meta-box">
              <strong>İşletme:</strong> ${businessInfo.businessName}<br>
              <strong>Yetkili:</strong> ${businessInfo.ownerName}<br>
              <strong>Tarih:</strong> ${new Date().toLocaleDateString()}<br>
            </div>
          </div>

          <div class="kpis-row">
            <div class="kpi-card">
              <span>Toplam Ürün Kalemi</span>
              <strong>${filteredProducts.length} Çeşit</strong>
            </div>
            <div class="kpi-card">
              <span>Kritik Limit Altında</span>
              <strong>${criticalCount} Ürün</strong>
            </div>
            <div class="kpi-card">
              <span>Toplam Envanter Değeri</span>
              <strong>${totalInventoryValue.toFixed(2)} ${currency}</strong>
            </div>
          </div>

          <table class="inv-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Birim Fiyat</th>
                <th>Mevcut Stok</th>
                <th>Kritik Limit</th>
                <th>Son Tüketim (SKT)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            SUDA Dynamics Envanter ve Sayım Kontrol Modülü tarafından otomatik üretilmiştir.
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

  return (
    <div className="stock-list-container animate-fade-in" id="stock-list-section">
      {/* Search and Filters bar */}
      <div className="stock-controls-row">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Ürün adı veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="stock-search-input"
          />
        </div>

        <div className="filters-actions-wrapper">
          <div className="filter-wrapper">
            <Filter size={16} className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              id="stock-category-filter"
            >
              <option value="">Tüm Kategoriler</option>
              {activeCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button className="btn-print-inv-trigger" onClick={handlePrintInventory} title="Envanter PDF/Döküm Raporu Al" id="btn-print-inventory">
            <Printer size={16} /> Rapor Al
          </button>

          <button className="btn-report-waste-trigger" onClick={() => openWasteModal()} id="btn-open-waste-modal">
            <AlertTriangle size={16} /> Fire Bildir
          </button>

          <button className="btn-add-product" onClick={openAddDrawer} id="btn-open-add-drawer">
            <Plus size={18} /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="table-responsive-wrapper">
        {filteredProducts.length === 0 ? (
          <div className="no-products-found animate-pop-in">
            <p>Envanterde aramanıza veya filtrenize uygun ürün bulunamadı.</p>
            {products.length === 0 && (
              <button className="btn-primary" style={{ width: 'auto', marginTop: 12 }} onClick={openAddDrawer} id="btn-add-first-product">
                İlk Ürünü Hemen Ekle
              </button>
            )}
          </div>
        ) : (
          <table className="stock-table" id="main-stock-table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Mevcut Stok</th>
                <th>Kritik Limit</th>
                <th>Son Tüketim (SKT)</th>
                <th className="text-center">Hızlı Stok Ayarı</th>
                <th className="text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isCritical = product.stockAmount <= product.criticalLevel;
                const isEmpty = product.stockAmount === 0;
                
                return (
                  <tr key={product.id} className={isCritical ? 'row-warning' : ''} id={`product-row-${product.id}`}>
                    <td data-label="Ürün Adı" className="product-name-cell">
                      <strong className="prod-title">{highlightText(product.name, searchTerm)}</strong>
                      {isCritical && (
                        <span className={`badge ${isEmpty ? 'badge-danger' : 'badge-warning'}`}>
                          {isEmpty ? 'Tükendi' : 'Kritik Stok'}
                        </span>
                      )}
                    </td>
                    <td data-label="Kategori">
                      <span className={`badge ${getCategoryClass(product.category)}`}>
                        {highlightText(product.category, searchTerm)}
                      </span>
                    </td>
                    <td data-label="Fiyat">
                      <strong>{product.price.toFixed(2)} {currency}</strong>
                    </td>
                    <td data-label="Mevcut Stok" className="stock-amount-cell">
                      <span className={`stock-number ${isCritical ? 'text-warn' : 'text-normal'}`}>
                        {product.stockAmount}
                      </span>{' '}
                      <span className="stock-unit">{product.unit}</span>
                    </td>
                    <td data-label="Kritik Limit" style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span>{product.criticalLevel} {product.unit}</span>
                        {isCritical && (
                          <button
                            className="btn-whatsapp-order-icon"
                            onClick={() => handleWhatsAppOrder(product)}
                            title="Tedarikçiye WhatsApp Sipariş Taslağı Gönder"
                            style={waBtnStyle}
                            id={`btn-wa-order-${product.id}`}
                          >
                            <MessageCircle size={11} fill="#1EAF8A" stroke="none" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td data-label="Son Tüketim (SKT)">
                      {getExpiryBadge(product.expiryDate)}
                    </td>
                    
                    {/* Quick Adjustments */}
                    <td data-label="Hızlı Stok Ayarı" className="text-center">
                      <div className="quick-adjust-group" style={{ display: 'inline-flex' }}>
                        <button
                          className="btn-quick-minus"
                          onClick={() => onQuickAdjust(product.id, -1)}
                          title="1 Adet Eksilt"
                          disabled={product.stockAmount <= 0}
                          id={`btn-quick-minus-${product.id}`}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="btn-quick-plus"
                          onClick={() => onQuickAdjust(product.id, 1)}
                          title="1 Adet Arttır"
                          id={`btn-quick-plus-${product.id}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td data-label="İşlemler" className="text-right">
                      <div className="actions-group" style={{ display: 'inline-flex' }}>
                        <button
                          className="btn-fire-report"
                          onClick={() => openWasteModal(product.id.toString())}
                          title="Fire Bildir"
                          style={{ color: '#F98D2E', padding: 6, display: 'flex', alignItems: 'center' }}
                          id={`btn-fire-action-${product.id}`}
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => openEditDrawer(product)}
                          title="Düzenle"
                          id={`btn-edit-${product.id}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => onDeleteProduct(product.id)}
                          title="Sil"
                          id={`btn-delete-${product.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer Overlay & Panel */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="drawer-panel animate-slide-in-right" onClick={(e) => e.stopPropagation()} id="stock-editor-drawer">
            <div className="drawer-header">
              <h3>{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button className="btn-close-drawer" onClick={closeDrawer} id="btn-close-drawer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="drawer-form" id="stock-product-form">
              <div className="input-group">
                <label htmlFor="drawer-name">Ürün Adı *</label>
                <input
                  type="text"
                  id="drawer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Un, Süt, Kruvasan"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="drawer-category">Kategori *</label>
                <select
                  id="drawer-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {DEFAULT_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                  <option value="custom">-- Yeni Kategori Ekle --</option>
                </select>
              </div>

              {category === 'custom' && (
                <div className="input-group animate-fade-in-up">
                  <label htmlFor="drawer-custom-category">Yeni Kategori Adı *</label>
                  <input
                    type="text"
                    id="drawer-custom-category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Örn: Özel Baharatlar"
                    required
                  />
                </div>
              )}

              <div className="form-row-2">
                <div className="input-group">
                  <label htmlFor="drawer-unit">Birim</label>
                  <select
                    id="drawer-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {UNITS.map((u, idx) => (
                      <option key={idx} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-price">Birim Fiyat ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="drawer-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label htmlFor="drawer-expiry">Son Kullanma Tarihi (SKT)</label>
                  <input
                    type="date"
                    id="drawer-expiry"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-critical">Kritik Limit</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    id="drawer-critical"
                    value={criticalLevel}
                    onChange={(e) => setCriticalLevel(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="drawer-stock">Mevcut Stok Miktarı</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  id="drawer-stock"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-cancel" onClick={closeDrawer} id="btn-drawer-cancel">
                  İptal
                </button>
                <button type="submit" className="btn-save" id="btn-drawer-save">
                  {editingProduct ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zayiat/Fire Bildirme Modalı */}
      {isWasteModalOpen && (
        <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="drawer-panel animate-pop-in" style={{ height: 'auto', maxHeight: '90vh', borderRadius: '12px', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()} id="waste-report-modal">
            <div className="drawer-header" style={{ padding: '18px 24px' }}>
              <h3>⚠️ Fire / Zayiat Bildir</h3>
              <button className="btn-close-drawer" onClick={() => setIsWasteModalOpen(false)} id="btn-close-waste-modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWasteSubmit} className="drawer-form" style={{ padding: '24px' }} id="waste-report-form">
              <div className="input-group">
                <label htmlFor="waste-product-select">Ürün Seçin</label>
                <select
                  id="waste-product-select"
                  value={wasteProductId}
                  onChange={(e) => setWasteProductId(e.target.value)}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Mevcut: {p.stockAmount} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="waste-qty-input">Fire Miktarı</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  id="waste-qty-input"
                  placeholder="0.00"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="waste-reason-select">Zayiat Nedeni</label>
                <select
                  id="waste-reason-select"
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                >
                  {WASTE_REASONS.map((reason, idx) => (
                    <option key={idx} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div className="drawer-footer" style={{ padding: 0, marginTop: 12 }}>
                <button type="button" className="btn-cancel" onClick={() => setIsWasteModalOpen(false)} id="btn-waste-cancel">
                  İptal
                </button>
                <button type="submit" className="btn-save" style={{ backgroundColor: '#F98D2E' }} id="btn-waste-submit">
                  Zayiatı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom style for WhatsApp button
const waBtnStyle = {
  background: '#E8FDF5',
  border: '1px solid rgba(30,175,138,0.2)',
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '3px 6px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease'
};
