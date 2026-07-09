import React, { useEffect, useRef } from 'react';
import './StockCharts.css';

export default function StockCharts({ products, currency }) {
  const donutCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  // Group products by category and calculate values
  const categoriesData = {};
  products.forEach(p => {
    const val = p.stockAmount * p.price;
    if (categoriesData[p.category]) {
      categoriesData[p.category] += val;
    } else {
      categoriesData[p.category] = val;
    }
  });

  const categoryLabels = Object.keys(categoriesData);
  const categoryValues = Object.values(categoriesData);
  const totalValue = categoryValues.reduce((a, b) => a + b, 0);

  // Top 5 products by stock quantity
  const topProducts = [...products]
    .sort((a, b) => b.stockAmount - a.stockAmount)
    .slice(0, 5);

  const colors = [
    '#7C3AED', // Purple
    '#F98D2E', // Orange
    '#1EAF8A', // Teal
    '#FBBF24', // Yellow
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#EC4899', // Pink
  ];

  // Draw Donut Chart
  useEffect(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Support retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    const innerRadius = radius * 0.55;

    ctx.clearRect(0, 0, width, height);

    if (totalValue === 0) {
      // Draw empty placeholder circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = radius * 0.45;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();
      
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Veri Yok', centerX, centerY);
      return;
    }

    let startAngle = -Math.PI / 2;

    categoryValues.forEach((val, idx) => {
      const sliceAngle = (val / totalValue) * (2 * Math.PI);
      const color = colors[idx % colors.length];

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Draw center hole highlight
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 1, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // Draw text inside
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOPLAM DEĞER', centerX, centerY - 8);

    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#0B1B3D';
    ctx.fillText(`${totalValue.toFixed(1)} ${currency}`, centerX, centerY + 8);

  }, [products, totalValue, currency]);

  // Draw Bar Chart
  useEffect(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    if (topProducts.length === 0) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Veri Yok', width / 2, height / 2);
      return;
    }

    const maxVal = Math.max(...topProducts.map(p => p.stockAmount), 10);
    const paddingLeft = 35;
    const paddingBottom = 25;
    const paddingTop = 15;
    const paddingRight = 15;
    
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Draw Y Axis gridlines
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = paddingTop + (graphHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Y Labels
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const labelVal = maxVal - (maxVal * i) / 4;
      ctx.fillText(Math.round(labelVal), paddingLeft - 6, y);
    }

    // Draw Bars
    const barWidth = Math.min(30, (graphWidth / topProducts.length) * 0.5);
    const spacing = (graphWidth - (barWidth * topProducts.length)) / (topProducts.length + 1);

    topProducts.forEach((p, idx) => {
      const barHeight = (p.stockAmount / maxVal) * graphHeight;
      const x = paddingLeft + spacing + idx * (barWidth + spacing);
      const y = height - paddingBottom - barHeight;

      // Create gradient color for bar
      const gradient = ctx.createLinearGradient(x, y, x, height - paddingBottom);
      gradient.addColorStop(0, '#7C3AED'); // Purple
      gradient.addColorStop(1, 'rgba(124, 58, 237, 0.4)');

      // Draw rounded bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Draw rounded top corners
      const radius = Math.min(4, barHeight);
      ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();

      // Product label text
      ctx.fillStyle = '#0B1B3D';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.stockAmount, x + barWidth / 2, y - 5);

      // X Label
      ctx.fillStyle = '#64748B';
      ctx.font = '8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      // Truncate name if long
      let displayName = p.name;
      if (displayName.length > 8) displayName = displayName.substring(0, 6) + '..';
      ctx.fillText(displayName, x + barWidth / 2, height - paddingBottom + 12);
    });

  }, [products, topProducts]);

  return (
    <div className="charts-grid-wrapper" id="analytics-charts-grid">
      
      {/* Category Value Donut Chart Box */}
      <div className="chart-card">
        <h4>Kategori Bütçe Dağılımı</h4>
        <p className="chart-card-subtitle">Kategorilerin toplam stok değerine göre yüzdesel dağılımı.</p>
        <div className="donut-chart-container">
          <canvas ref={donutCanvasRef} className="donut-canvas"></canvas>
          
          <div className="donut-legend-list">
            {categoryLabels.slice(0, 4).map((label, idx) => {
              const val = categoriesData[label];
              const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
              const color = colors[idx % colors.length];
              
              return (
                <div key={idx} className="legend-item">
                  <span className="legend-color-dot" style={{ backgroundColor: color }}></span>
                  <div className="legend-label">
                    <span className="legend-title">{label}</span>
                    <span className="legend-value">{pct.toFixed(0)}% ({val.toFixed(0)} {currency})</span>
                  </div>
                </div>
              );
            })}
            {categoryLabels.length > 4 && (
              <div className="legend-item-more">
                +{categoryLabels.length - 4} diğer kategori daha...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Stocks Bar Chart Box */}
      <div className="chart-card">
        <h4>Miktar Bazında En Çok Stoklananlar</h4>
        <p className="chart-card-subtitle">Stok miktarı (adet/birim) en yüksek olan ilk 5 ürün.</p>
        <div className="bar-chart-container">
          <canvas ref={barCanvasRef} className="bar-canvas"></canvas>
        </div>
      </div>

    </div>
  );
}
