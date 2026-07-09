import React, { useState } from 'react';
import { Search, Plus, Minus, Edit, Trash2, X, PlusCircle, Filter } from 'lucide-react';
import './StockList.css';

const UNITS = ['Adet', 'g', 'kg', 'L', 'ml', 'Paket', 'Çuval', 'Kutu'];
const DEFAULT_CATEGORIES = ['Hammaddeler', 'Süt & Şarküteri', 'Un & Maya', 'Kahve & İçecek', 'Meyve & Sebze', 'Ambalaj & Paket'];

export default function StockList({ products, currency, onAddProduct, onUpdateProduct, onDeleteProduct, onQuickAdjust }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('Adet');
  const [stockAmount, setStockAmount] = useState('');
  const [criticalLevel, setCriticalLevel] = useState('');
  const [price, setPrice] = useState('');

  const openAddDrawer = () => {
    setEditingProduct(null);
    setName('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setUnit('Adet');
    setStockAmount('');
    setCriticalLevel('');
    setPrice('');
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
      price: parseFloat(price) || 0
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...productData });
    } else {
      onAddProduct(productData);
    }
    
    closeDrawer();
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

          <button className="btn-add-product" onClick={openAddDrawer} id="btn-open-add-drawer">
            <Plus size={18} /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="table-responsive-wrapper">
        {filteredProducts.length === 0 ? (
          <div className="no-products-found animate-pop-in">
            <p>Aramanıza veya filtrenize uygun ürün bulunamadı.</p>
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
                <th>Kritik Seviye</th>
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
                    <td className="product-name-cell">
                      <strong>{product.name}</strong>
                      {isCritical && (
                        <span className={`badge ${isEmpty ? 'badge-danger' : 'badge-warning'}`}>
                          {isEmpty ? 'Tükendi' : 'Kritik Stok'}
                        </span>
                      )}
                    </td>
                    <td><span className="badge badge-purple">{product.category}</span></td>
                    <td><strong>{product.price.toFixed(2)} {currency}</strong></td>
                    <td className="stock-amount-cell">
                      <span className={`stock-number ${isCritical ? 'text-warn' : 'text-normal'}`}>
                        {product.stockAmount}
                      </span>{' '}
                      <span className="stock-unit">{product.unit}</span>
                    </td>
                    <td>{product.criticalLevel} {product.unit}</td>
                    
                    {/* Quick Adjustments */}
                    <td>
                      <div className="quick-adjust-group">
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
                    <td className="text-right">
                      <div className="actions-group">
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
                  <label htmlFor="drawer-stock">Başlangıç Stoğu</label>
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
    </div>
  );
}
