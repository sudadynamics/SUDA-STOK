import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, FileText, ShoppingBag } from 'lucide-react';
import './FinancialReport.css';

export default function FinancialReport({ logs, products, currency }) {
  // Parse stats from log history
  const financialSummary = logs.reduce((acc, log) => {
    // 1. Parse POS Sales Revenue
    if (log.type === 'sell' && log.message && log.message.includes('POS Satışı:')) {
      const match = log.message.match(/POS Satışı:\s*([\d.]+)/);
      if (match && match[1]) {
        acc.revenue += parseFloat(match[1]);
      }
    }

    // 2. Parse Stock Purchases Expenses
    if (log.type === 'add' && log.details && log.details.includes('Borç: +')) {
      const match = log.details.match(/Borç:\s*\+\s*([\d.]+)/);
      if (match && match[1]) {
        acc.expenses += parseFloat(match[1]);
      }
    }

    // 3. Parse Waste / Fire Cost Loss
    if (log.message && log.message.includes('Zayiat/Fire:')) {
      const match = log.details ? log.details.match(/Zarar:\s*-\s*([\d.]+)/) : null;
      if (match && match[1]) {
        acc.wasteLoss += parseFloat(match[1]);
      }
    }

    return acc;
  }, { revenue: 0, expenses: 0, wasteLoss: 0 });

  const netProfit = financialSummary.revenue - financialSummary.expenses - financialSummary.wasteLoss;
  const isProfitable = netProfit >= 0;

  // Calculate top sales items from logs
  const itemSalesCounts = {};
  logs.forEach(log => {
    if (log.type === 'sell' && log.details && !log.message.includes('Üretim Yapıldı')) {
      // Details example: "2 Adet Espresso Kahve Çekirdeği, 1 L Barista Sütü"
      // Split by comma
      const parts = log.details.split(',');
      parts.forEach(part => {
        const itemMatch = part.trim().match(/^([\d.]+)\s+(\w+)\s+(.+)$/);
        if (itemMatch) {
          const qty = parseFloat(itemMatch[1]);
          const unit = itemMatch[2];
          const name = itemMatch[3].split('(')[0].trim(); // clean any bracketed details
          
          if (!itemSalesCounts[name]) {
            itemSalesCounts[name] = { qty: 0, unit };
          }
          itemSalesCounts[name].qty += qty;
        }
      });
    }
  });

  // Map to list, sort by quantity descending, get top 4
  const topSellingItems = Object.keys(itemSalesCounts).map(name => {
    const prodObj = products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    const unitPrice = prodObj ? prodObj.price : 0;
    const totalVal = itemSalesCounts[name].qty * unitPrice;
    return {
      name,
      qty: itemSalesCounts[name].qty,
      unit: itemSalesCounts[name].unit,
      totalVal
    };
  }).sort((a, b) => b.qty - a.qty).slice(0, 4);

  // Financial status helper percentage
  const totalOutlay = financialSummary.expenses + financialSummary.wasteLoss;
  const marginPercentage = financialSummary.revenue > 0 
    ? Math.max(-100, Math.min(100, (netProfit / financialSummary.revenue) * 100))
    : 0;

  return (
    <div className="financial-report-container animate-fade-in" id="financial-report-section">
      <div className="fin-header">
        <h2>📈 Finansal Durum & Kasa Raporu</h2>
        <p className="fin-subtitle">İşletmenizin ciro, alım, fire kayıpları ve net kar durumunu izleyin.</p>
      </div>

      {/* Grid boxes for Financial Metrics */}
      <div className="fin-metrics-grid">
        {/* Card A: Toplam Ciro */}
        <div className="fin-metric-card border-green">
          <div className="fin-card-icon-box bg-green">
            <DollarSign size={24} />
          </div>
          <div className="fin-card-info">
            <span className="fin-label">Toplam Gelir (Ciro)</span>
            <strong className="fin-value text-green">+{financialSummary.revenue.toFixed(2)} {currency}</strong>
            <span className="fin-meta">Kasadan yapılan tüm satışlar</span>
          </div>
        </div>

        {/* Card B: Toplam Alım Maliyeti */}
        <div className="fin-metric-card border-red">
          <div className="fin-card-icon-box bg-red">
            <TrendingDown size={24} />
          </div>
          <div className="fin-card-info">
            <span className="fin-label">Tedarikçi Alımları</span>
            <strong className="fin-value text-red">-{financialSummary.expenses.toFixed(2)} {currency}</strong>
            <span className="fin-meta">Stok alım faturaları toplamı</span>
          </div>
        </div>

        {/* Card C: Zayiat Kaybı */}
        <div className="fin-metric-card border-orange">
          <div className="fin-card-icon-box bg-orange">
            <AlertTriangle size={24} />
          </div>
          <div className="fin-card-info">
            <span className="fin-label">Zayiat (Fire) Maliyeti</span>
            <strong className="fin-value text-orange">-{financialSummary.wasteLoss.toFixed(2)} {currency}</strong>
            <span className="fin-meta">Bozulma, dökülme kayıpları</span>
          </div>
        </div>

        {/* Card D: Net Kar / Zarar */}
        <div className={`fin-metric-card ${isProfitable ? 'border-teal' : 'border-red-dark'} fin-card-glow`}>
          <div className={`fin-card-icon-box ${isProfitable ? 'bg-teal' : 'bg-red-dark'}`}>
            {isProfitable ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="fin-card-info">
            <span className="fin-label">Net Kar / Zarar</span>
            <strong className={`fin-value ${isProfitable ? 'text-teal' : 'text-red'}`}>
              {isProfitable ? '+' : ''}{netProfit.toFixed(2)} {currency}
            </strong>
            <span className="fin-meta">Gelir - Gider dengesi</span>
          </div>
        </div>
      </div>

      {/* Visual Profit & Loss Progress / Bar */}
      <div className="fin-analysis-card">
        <h3>📊 Finansal Sağlık & Kar Marjı</h3>
        <div className="fin-progress-row">
          <div className="fin-progress-bar-track">
            <div 
              className={`fin-progress-bar-fill ${isProfitable ? 'bg-teal' : 'bg-red'}`}
              style={{ width: `${Math.max(5, Math.min(100, financialSummary.revenue > 0 ? (financialSummary.revenue / (financialSummary.revenue + totalOutlay)) * 100 : 0))}%` }}
            ></div>
          </div>
          <div className="fin-ratio-labels">
            <span>Giderler & Zayiat ({totalOutlay.toFixed(2)} {currency})</span>
            <span>Ciro ({financialSummary.revenue.toFixed(2)} {currency})</span>
          </div>
        </div>

        <div className="fin-kpi-summary">
          <div className="kpi-box">
            <span className="kpi-title">Kar Marjı</span>
            <strong className={isProfitable ? 'text-teal' : 'text-red'}>{marginPercentage.toFixed(1)}%</strong>
          </div>
          <div className="kpi-box">
            <span className="kpi-title">İşletme Durumu</span>
            <strong className={isProfitable ? 'text-teal' : 'text-red'}>
              {isProfitable ? '🚀 KAR EDİYOR' : '⚠️ ZARARDA'}
            </strong>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Sales and Recent logs */}
      <div className="fin-subgrid">
        
        {/* Left: Top selling items list */}
        <div className="fin-subcard">
          <h3>🛍️ En Çok Ciro Yapan Ürünler</h3>
          <div className="top-selling-list">
            {topSellingItems.length === 0 ? (
              <p className="no-selling-data">Henüz POS satışı gerçekleşmediği için satış verisi bulunmuyor.</p>
            ) : (
              topSellingItems.map((item, idx) => (
                <div key={idx} className="top-selling-row">
                  <div className="selling-item-info">
                    <div className="selling-index">{idx + 1}</div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>Miktar: {item.qty} {item.unit}</span>
                    </div>
                  </div>
                  <strong className="selling-value text-teal">+{item.totalVal.toFixed(2)} {currency}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent POS Receipts List */}
        <div className="fin-subcard">
          <h3>🧾 Son Kasa Satışları</h3>
          <div className="recent-sales-list">
            {logs.filter(l => l.type === 'sell').length === 0 ? (
              <p className="no-selling-data">Kayıtlı satış fişi bulunmuyor.</p>
            ) : (
              logs.filter(l => l.type === 'sell').slice(0, 4).map((log, idx) => (
                <div key={idx} className="recent-sale-row">
                  <div>
                    <strong>{log.message}</strong>
                    <span>{new Date(log.date).toLocaleTimeString()}</span>
                  </div>
                  <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '11px' }}>Ödendi</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
