import React, { useState } from 'react';
import { Plus, User, Phone, Mail, Building, DollarSign, ArrowUpRight, ArrowDownLeft, Trash2, Edit, X, ShoppingCart, CheckCircle } from 'lucide-react';
import './SupplierManager.css';

export default function SupplierManager({ 
  products, suppliers, currency, 
  onAddSupplier, onUpdateSupplier, onDeleteSupplier, 
  onBuyStock, onMakePayment 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'pay' | 'buy'
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form states - Add Supplier
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  // Form states - Make Payment
  const [payAmount, setPayAmount] = useState('');

  // Form states - Buy Stock
  const [selectedProductId, setSelectedProductId] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [buyUnitPrice, setBuyUnitPrice] = useState('');

  const handleCreateSupplier = (e) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    onAddSupplier({
      name,
      company,
      phone,
      email,
      balance: parseFloat(initialBalance) || 0
    });

    // Reset
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setInitialBalance('');
    setIsAdding(false);
  };

  const openPayModal = (supplier) => {
    setSelectedSupplier(supplier);
    setPayAmount('');
    setActiveModal('pay');
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!selectedSupplier || isNaN(amt) || amt <= 0) return;

    onMakePayment(selectedSupplier, amt);
    setActiveModal(null);
  };

  const openBuyModal = (supplier) => {
    setSelectedSupplier(supplier);
    setSelectedProductId('');
    setBuyQty('');
    setBuyUnitPrice('');
    setActiveModal('buy');
  };

  const handleBuySubmit = (e) => {
    e.preventDefault();
    const prodId = parseInt(selectedProductId);
    const qty = parseFloat(buyQty);
    const price = parseFloat(buyUnitPrice);

    if (!selectedSupplier || isNaN(prodId) || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;

    const product = products.find(p => p.id === prodId);
    if (!product) return;

    onBuyStock(selectedSupplier, product, qty, price);
    setActiveModal(null);
  };

  return (
    <div className="supplier-manager-container animate-fade-in" id="supplier-manager-section">
      
      {/* Header section */}
      <div className="supplier-header">
        <div>
          <h2>🚚 Tedarikçi & Cari Hesap Takibi</h2>
          <p className="supplier-subtitle">Hammadde tedarikçilerinizi kaydedin, satın alımlarla stoklarınızı güncelleyin ve borçlarınızı takip edin.</p>
        </div>
        <button 
          className="btn-add-supplier-trigger" 
          onClick={() => setIsAdding(!isAdding)}
          id="btn-toggle-new-supplier"
        >
          {isAdding ? 'Cari Listesine Dön' : 'Yeni Tedarikçi Ekle'}
        </button>
      </div>

      {isAdding ? (
        /* Create Supplier Panel */
        <div className="create-supplier-card animate-fade-in-up" id="new-supplier-form-card">
          <h3>Yeni Tedarikçi Kartı</h3>
          <form onSubmit={handleCreateSupplier} className="supplier-form">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="sup-name">Yetkili Adı Soyadı *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="sup-name"
                    placeholder="Örn: Selahattin Sarıbay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="sup-company">Firma / Şirket Adı *</label>
                <div className="input-with-icon">
                  <Building size={18} className="input-icon" />
                  <input
                    type="text"
                    id="sup-company"
                    placeholder="Örn: Suda Un Fabrikaları A.Ş."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="sup-phone">Telefon Numarası</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    id="sup-phone"
                    placeholder="05xx xxx xx xx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="sup-email">E-posta Adresi</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="sup-email"
                    placeholder="ornek@firma.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="sup-balance">Başlangıç Borç Bakiyesi ({currency})</label>
                <div className="input-with-icon">
                  <DollarSign size={18} className="input-icon" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="sup-balance"
                    placeholder="0.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions-row">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setIsAdding(false)}
                id="btn-cancel-supplier"
              >
                İptal Et
              </button>
              <button type="submit" className="btn-save-supplier" id="btn-save-supplier-submit">
                Tedarikçiyi Kaydet
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Suppliers Listing */
        <div className="suppliers-grid-list">
          {suppliers.length === 0 ? (
            <div className="empty-suppliers animate-pop-in">
              <Building size={48} className="empty-icon animate-float" />
              <h3>Kayıtlı Cari Bulunmuyor</h3>
              <p>Tedarikçilerinizi ekleyerek stok alımlarını otomatikleştirebilir ve borç hesaplarınızı takip edebilirsiniz.</p>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 16 }} onClick={() => setIsAdding(true)} id="btn-create-first-supplier">
                İlk Tedarikçiyi Ekle
              </button>
            </div>
          ) : (
            <div className="suppliers-grid">
              {suppliers.map((sup) => {
                const hasDebt = sup.balance > 0;
                
                return (
                  <div key={sup.id} className="supplier-card glow-card" id={`supplier-card-${sup.id}`}>
                    <div className="sup-card-header">
                      <div>
                        <h4>{sup.company}</h4>
                        <span>{sup.name}</span>
                      </div>
                      <button 
                        className="btn-delete-sup" 
                        onClick={() => onDeleteSupplier(sup.id)}
                        id={`btn-delete-supplier-${sup.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="sup-details-body">
                      {sup.phone && (
                        <div className="detail-row">
                          <Phone size={14} /> <span>{sup.phone}</span>
                        </div>
                      )}
                      {sup.email && (
                        <div className="detail-row">
                          <Mail size={14} /> <span>{sup.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Ledger Section */}
                    <div className="sup-ledger-panel">
                      <div className="ledger-balance-box">
                        <span className="balance-label">Güncel Borcumuz:</span>
                        <span className={`balance-value ${hasDebt ? 'debt-warn' : 'debt-clean'}`}>
                          {sup.balance.toFixed(2)} {currency}
                        </span>
                      </div>

                      {/* Transaction buttons */}
                      <div className="ledger-actions">
                        <button 
                          className="btn-ledger-buy"
                          onClick={() => openBuyModal(sup)}
                          id={`btn-supplier-buy-${sup.id}`}
                        >
                          <ShoppingCart size={14} /> Stok Alımı Yap
                        </button>
                        <button 
                          className="btn-ledger-pay" 
                          onClick={() => openPayModal(sup)}
                          id={`btn-supplier-pay-${sup.id}`}
                        >
                          <ArrowDownLeft size={14} /> Ödeme Bildir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal - Make Payment */}
      {activeModal === 'pay' && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-panel animate-pop-in" onClick={(e) => e.stopPropagation()} id="pay-modal">
            <div className="modal-header">
              <h3>Borç Ödemesi Bildir</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)} id="btn-close-pay-modal">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handlePaySubmit} className="modal-form" id="pay-form">
              <p className="modal-desc">
                <strong>{selectedSupplier.company}</strong> firmasına yaptığınız ödemeyi girin. Bu miktar toplam borcunuzdan düşülecektir.
              </p>
              
              <div className="input-group">
                <label htmlFor="pay-amt">Ödenen Tutar ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedSupplier.balance}
                  id="pay-amt"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)} id="btn-cancel-pay">İptal</button>
                <button type="submit" className="btn-save" id="btn-submit-pay">Ödemeyi Onayla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Buy Stock */}
      {activeModal === 'buy' && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-panel animate-pop-in" onClick={(e) => e.stopPropagation()} id="buy-modal">
            <div className="modal-header">
              <h3>Tedarikçiden Stok Satın Al</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)} id="btn-close-buy-modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBuySubmit} className="modal-form" id="buy-form">
              <p className="modal-desc">
                <strong>{selectedSupplier.company}</strong> firmasından aldığınız stok miktarını girin. Alınan ürün adedi envantere eklenecek ve toplam fatura tutarı borç bakiyenize yansıyacaktır.
              </p>

              <div className="input-group">
                <label htmlFor="buy-prod-select">Satın Alınan Ürün</label>
                <select
                  id="buy-prod-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">Ürün Seçin...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) - Stok: {p.stockAmount}</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label htmlFor="buy-quantity">Alınan Miktar</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    id="buy-quantity"
                    placeholder="0"
                    value={buyQty}
                    onChange={(e) => setBuyQty(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="buy-u-price">Birim Alış Fiyatı ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="buy-u-price"
                    placeholder="0.00"
                    value={buyUnitPrice}
                    onChange={(e) => setBuyUnitPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              {buyQty && buyUnitPrice && (
                <div className="purchase-total-preview">
                  Toplam Fatura Tutarı: <strong>{(parseFloat(buyQty) * parseFloat(buyUnitPrice)).toFixed(2)} {currency}</strong>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)} id="btn-cancel-buy">İptal</button>
                <button type="submit" className="btn-save" id="btn-submit-buy">Satın Alımı Onayla</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
