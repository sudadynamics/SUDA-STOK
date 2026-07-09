import React, { useState } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import './PosTerminal.css';

export default function PosTerminal({ products, suppliers, currency, onSellProduct, onAddLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'cari'
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add to cart helper
  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stockAmount) {
        alert('Stok miktarından fazla ürün sepete eklenemez!');
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      if (product.stockAmount <= 0) {
        alert('Bu ürünün stoğu tükenmiş!');
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Adjust qty helper
  const handleAdjustQty = (productId, delta) => {
    const existing = cart.find(item => item.product.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > existing.product.stockAmount) {
      alert('Stok limitine ulaşıldı!');
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQty } 
        : item
    ));
  };

  // Remove from cart
  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setReceivedAmount('');
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const changeAmount = receivedAmount ? parseFloat(receivedAmount) - cartSubtotal : 0;

  // Complete checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      // Loop over items, update stock via onSellProduct
      for (const item of cart) {
        await onSellProduct(item.product.id, item.quantity);
      }

      // Handle Cari Debt connection
      let logDetail = '';
      if (paymentType === 'cari' && selectedSupplier) {
        const sup = suppliers.find(s => s.id === parseInt(selectedSupplier));
        if (sup) {
          logDetail = `Müşteri/Cari: ${sup.company} hesabına borç yazıldı.`;
        }
      } else {
        logDetail = `Nakit Ödeme (Para Üstü: ${changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'} ${currency})`;
      }

      // Add sales log entry
      const itemsListText = cart.map(item => `${item.quantity} ${item.product.unit} ${item.product.name}`).join(', ');
      await onAddLog('sell', `POS Satışı: ${cartSubtotal.toFixed(2)} ${currency}`, `${itemsListText}. (${logDetail})`);

      setSuccessMsg('Satış Başarıyla Tamamlandı! Stoklar güncellendi.');
      handleClearCart();

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);

    } catch (err) {
      alert('Satış işlemi sırasında bir hata oluştu: ' + err.message);
    }
  };

  // Filter products for catalog
  const catalogProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pos-terminal-container animate-fade-in" id="pos-terminal-section">
      
      {successMsg && (
        <div className="pos-success-alert animate-pop-in">
          <CheckCircle size={24} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="pos-grid">
        
        {/* Left Side: Product Catalog Grid */}
        <div className="pos-catalog-panel">
          <div className="pos-catalog-header">
            <h3>🛍️ Satış Kataloğu</h3>
            <div className="pos-search-wrapper">
              <Search size={18} className="pos-search-icon" />
              <input
                type="text"
                placeholder="Hızlı ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="pos-catalog-search"
              />
            </div>
          </div>

          <div className="pos-products-grid">
            {catalogProducts.length === 0 ? (
              <p className="no-pos-products">Katalogda eşleşen ürün bulunamadı.</p>
            ) : (
              catalogProducts.map(product => {
                const isOutOfStock = product.stockAmount <= 0;
                const isCritical = product.stockAmount <= product.criticalLevel;

                return (
                  <button
                    key={product.id}
                    id={`btn-pos-product-${product.id}`}
                    className={`pos-product-card glow-card ${isOutOfStock ? 'disabled' : ''} ${isCritical ? 'warning-border' : ''}`}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    disabled={isOutOfStock}
                  >
                    <div className="pos-prod-info">
                      <h4>{product.name}</h4>
                      <span className="pos-prod-cat">{product.category}</span>
                    </div>
                    <div className="pos-prod-price-stock">
                      <span className="pos-price">{product.price.toFixed(2)} {currency}</span>
                      <span className={`pos-stock ${isCritical ? 'text-danger' : 'text-success'}`}>
                        Stok: {product.stockAmount} {product.unit}
                      </span>
                    </div>
                    {isOutOfStock && <div className="out-of-stock-overlay">Tükendi</div>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Cart Summary Panel */}
        <div className="pos-cart-panel">
          <div className="pos-cart-header">
            <h3>
              <ShoppingCart size={20} />
              <span>Satış Sepeti</span>
            </h3>
            {cart.length > 0 && (
              <button className="btn-clear-cart" onClick={handleClearCart} id="btn-pos-clear-cart">
                <Trash2 size={16} /> Temizle
              </button>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-empty-cart">
                <ShoppingCart size={48} className="empty-cart-icon" />
                <p>Sepetiniz boş. Satış yapmak için sol taraftaki ürün kartlarına tıklayın.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="pos-cart-item" id={`pos-cart-item-${item.product.id}`}>
                  <div className="item-detail">
                    <h4>{item.product.name}</h4>
                    <span>{item.product.price.toFixed(2)} {currency}</span>
                  </div>
                  
                  <div className="item-actions">
                    <div className="qty-controls">
                      <button onClick={() => handleAdjustQty(item.product.id, -1)} id={`btn-pos-minus-${item.product.id}`}>
                        <Minus size={12} />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button onClick={() => handleAdjustQty(item.product.id, 1)} id={`btn-pos-plus-${item.product.id}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button className="btn-remove-item" onClick={() => handleRemoveItem(item.product.id)} id={`btn-pos-remove-${item.product.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary Form */}
          {cart.length > 0 && (
            <form onSubmit={handleCheckout} className="pos-checkout-form" id="pos-checkout-form">
              <div className="pos-subtotal-row">
                <span>Toplam Tutar:</span>
                <strong>{cartSubtotal.toFixed(2)} {currency}</strong>
              </div>

              {/* Payment Type Selection */}
              <div className="payment-type-tabs">
                <button
                  type="button"
                  className={`payment-tab-btn ${paymentType === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentType('cash')}
                  id="btn-pay-cash"
                >
                  💵 Nakit / POS
                </button>
                <button
                  type="button"
                  className={`payment-tab-btn ${paymentType === 'cari' ? 'active' : ''}`}
                  onClick={() => setPaymentType('cari')}
                  id="btn-pay-cari"
                >
                  📝 Cari Borç
                </button>
              </div>

              {paymentType === 'cash' ? (
                /* Cash Change calculator */
                <div className="cash-calculator animate-fade-in-up">
                  <div className="input-group">
                    <label htmlFor="received-amount-input">Alınan Nakit Tutar ({currency})</label>
                    <input
                      type="number"
                      id="received-amount-input"
                      step="0.01"
                      min={cartSubtotal}
                      placeholder="Örn: 200"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      required
                    />
                  </div>
                  {receivedAmount && changeAmount >= 0 && (
                    <div className="change-preview">
                      <span>Para Üstü:</span>
                      <strong>{changeAmount.toFixed(2)} {currency}</strong>
                    </div>
                  )}
                </div>
              ) : (
                /* Cari selection dropdown */
                <div className="cari-selector animate-fade-in-up">
                  <div className="input-group">
                    <label htmlFor="pos-supplier-select">Borçlandırılacak Cari Kart (Tedarikçi/Müşteri)</label>
                    <select
                      id="pos-supplier-select"
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      required
                    >
                      <option value="">Cari Seçin...</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.company} ({sup.name})</option>
                      ))}
                    </select>
                  </div>
                  <p className="cari-info-note">Satış tutarı bu cari hesaba otomatik borç/alacak olarak kaydedilecektir.</p>
                </div>
              )}

              <button type="submit" className="btn-pos-checkout" id="btn-pos-submit-checkout">
                Satışı Onayla ve Tamamla ({totalItems} Ürün)
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
