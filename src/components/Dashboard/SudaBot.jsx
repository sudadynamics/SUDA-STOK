import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, AlertTriangle, Key } from 'lucide-react';
import { getAIResponse } from '../../utils/gemini';
import './SudaBot.css';

export default function SudaBot({ products, logs, businessInfo, onOpenSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const chatEndRef = useRef(null);

  const apiKey = businessInfo.geminiApiKey || '';

  // Generate a rule-based smart tip when components load or products change
  useEffect(() => {
    const criticalProducts = products.filter(p => p.stockAmount <= p.criticalLevel);
    if (criticalProducts.length > 0) {
      setCurrentTip(`⚠️ Dikkat! ${criticalProducts.slice(0, 2).map(p => p.name).join(', ')} kritik seviyenin altında! Stok eklemeyi unutmayın.`);
    } else if (products.length === 0) {
      setCurrentTip("👋 Hoş geldin! Henüz ürün eklememişsin. Yukarıdaki 'Yeni Ürün Ekle' butonundan ilk ürününü ekleyerek başlayabilirsin.");
    } else {
      const typeTips = {
        pastane: "🍰 Şeker ve Un stoklarını düzenli kontrol etmek, pasta yapımında yarıda kalmanızı engeller!",
        cafe: "☕ Süt ve Kahve çekirdeği stokları cafelerin can damarıdır, günlük kontrol etmeyi ihmal etmeyin.",
        firin: "🥖 Un ve Maya stok seviyelerinize göre günlük üretim planınızı SudaBot ile analiz edebilirsiniz.",
        market: "📦 En çok satan ürünleri raf ömrü ve son kullanma tarihlerine göre düzenli takip edin."
      };
      setCurrentTip(typeTips[businessInfo.businessType] || "🚀 Stok hareketlerinizi günlük kontrol ederek kayıpların önüne geçin.");
    }
  }, [products, businessInfo.businessType]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const context = {
        businessName: businessInfo.businessName,
        businessType: businessInfo.businessType,
        products: products
      };
      
      const reply = await getAIResponse(apiKey, userMessage, context);
      setIsTyping(false);
      setChatHistory(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      setIsTyping(false);
      setChatHistory(prev => [...prev, { role: 'bot', text: `Hata oluştu: ${err.message}. Lütfen API Anahtarınızı kontrol edin!` }]);
    }
  };

  return (
    <div className="sudabot-wrapper" id="sudabot-widget">
      {/* Small notification bubble above robot if closed */}
      {!isOpen && currentTip && (
        <div className="sudabot-mini-bubble" onClick={() => setIsOpen(true)}>
          <div className="mini-bubble-text">{currentTip}</div>
          <div className="mini-bubble-arrow"></div>
        </div>
      )}

      {/* Main Mascot Button */}
      <button 
        id="btn-toggle-sudabot"
        className={`sudabot-trigger-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="SudaBot Asistan"
      >
        <svg viewBox="0 0 100 100" className="robot-trigger-svg">
          <circle cx="50" cy="12" r="5" fill="#1EAF8A" className="antenna-light" />
          <line x1="50" y1="12" x2="50" y2="25" stroke="#ffffff" strokeWidth="4" />
          <rect x="25" y="25" width="50" height="50" rx="20" fill="#7C3AED" />
          <rect x="33" y="33" width="34" height="26" rx="10" fill="#0B1B3D" />
          {/* Eyes */}
          <path d="M 40 43 Q 43 40 46 43" stroke="#1EAF8A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 54 43 Q 57 40 60 43" stroke="#1EAF8A" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M 44 51 Q 50 56 56 51" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Waving hand */}
          <g className="robot-hand">
            <path d="M 75 45 Q 85 35 90 40" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="90" cy="40" r="4" fill="#F98D2E" />
          </g>
        </svg>
        {products.some(p => p.stockAmount <= p.criticalLevel) && (
          <span className="sudabot-alert-badge">!</span>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="sudabot-chat-window animate-pop-in" id="sudabot-chat-container">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <Bot size={20} />
              <div>
                <h4>SudaBot AI</h4>
                <span>{apiKey ? 'Özel API Key Aktif' : 'SudaBot AI Hazır'}</span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} id="btn-close-sudabot">
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div className="chat-messages-container">
            {/* Welcome Message */}
            <div className="chat-message bot">
              <div className="message-avatar">🤖</div>
              <div className="message-text">
                Merhaba! Ben <strong>SudaBot</strong>. {businessInfo.businessName} için stoklarınızı analiz edebilir, tarif/reçete üretebilir veya kritik durumları inceleyebilirim.
              </div>
            </div>

            {/* Render history */}
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`chat-message ${chat.role}`}>
                <div className="message-avatar">{chat.role === 'user' ? '👤' : '🤖'}</div>
                <div className="message-text">{chat.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="chat-quick-actions">
            <button 
              className="quick-action-tag" 
              onClick={() => setMessage('Hangi ürünlerin stoğu kritik seviyede?')}
              id="btn-quick-action-1"
            >
              Kritik Stokları Sor
            </button>
            {businessInfo.businessType === 'pastane' || businessInfo.businessType === 'cafe' ? (
              <button 
                className="quick-action-tag"
                onClick={() => setMessage('Bana bugüne özel yaratıcı bir tatlı tarifi reçetesi önerir misin?')}
                id="btn-quick-action-2"
              >
                Tarif Önerisi İste
              </button>
            ) : (
              <button 
                className="quick-action-tag"
                onClick={() => setMessage('Genel stok analizi raporu çıkarır mısın?')}
                id="btn-quick-action-3"
              >
                Hızlı Rapor İste
              </button>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="chat-input-form" id="sudabot-input-form">
            <input
              type="text"
              placeholder="SudaBot'a sor..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              id="sudabot-text-input"
            />
            <button type="submit" className="chat-send-btn" disabled={!message.trim()} id="btn-send-sudabot-msg">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
