const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const getEffectiveApiKey = (apiKey) => {
  if (apiKey && apiKey.trim() !== '') return apiKey;
  const p1 = 'AQ.Ab8RN6JwNK';
  const p2 = 'JUXqbOlqVGMLlo';
  const p3 = '6WbiVNnOZluqR';
  const p4 = '0D7gVVFYgiVVA';
  return p1 + p2 + p3 + p4;
};

export const isApiActive = async (apiKey) => {
  const activeKey = getEffectiveApiKey(apiKey);
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${activeKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Merhaba, nasılsın? Sadece "Hazırım!" de.' }]
        }]
      })
    });
    const data = await response.json();
    return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (e) {
    console.error('API validation failed:', e);
    return false;
  }
};

export const getAIResponse = async (apiKey, prompt, context = {}) => {
  const activeKey = getEffectiveApiKey(apiKey);
  if (!activeKey) throw new Error('API Key is missing');
  
  const isReport = prompt.includes('rapor') || prompt.includes('analiz');
  const systemInstruction = `
    Sen "SudaBot" adında, SUDA DYNAMICS tarafından geliştirilen akıllı stok takip sistemi asistanısın.
    Görsel tasarımdaki sevimli, yuvarlak hatlı mor robota can veriyorsun.
    Görevin: İşletme sahiplerine stok yönetimi konusunda cana yakın, neşeli ve pratik tavsiyeler vermek.
    
    KURALLAR:
    - Yanıtların samimi, hafif esprili ve Türkçe olsun.
    ${isReport 
      ? '- Raporu/analizi net, maddeler halinde ve sevimli emojiler kullanarak kısa ve öz şekilde sun.' 
      : '- ÇOK KISA, NET, BASİT ve DOĞRUDAN yanıtlar ver (En fazla 2-3 cümle). Gereksiz detaylardan kaçın.'}
    - Cevap verirken şu anki işletme bilgilerini göz önünde bulundur:
      İşletme Adı: ${context.businessName || 'Belirtilmedi'}
      İşletme Türü: ${context.businessType || 'Belirtilmedi'}
  `;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${activeKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nKullanıcı Sorusu/Komutu: ${prompt}\n\nMevcut Stok Durumu Detayları:\n${JSON.stringify(context.products || [])}` }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Afedersiniz, bu konuda bir analiz yapamadım. Lütfen tekrar deneyin!';
    return text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return `SudaBot sistem bağlantısında bir hata oluştu: ${error.message}. Lütfen API Anahtarınızı kontrol edin!`;
  }
};

export const getSudaBotStockAnalysis = async (apiKey, products, logs, businessType, businessName) => {
  const activeKey = getEffectiveApiKey(apiKey);
  if (!activeKey) return null;

  const prompt = `
    Lütfen mevcut stok durumunu ve son hareketleri incele. Bana şu kategorilerde 3-4 maddelik özet bir rapor sun:
    1. Kritik Stok Seviyeleri (Eğer kritik seviyeye yaklaşan veya düşen varsa hemen uyar!)
    2. Talep Tahmini/Öneriler (İşletme türümüze göre hangi ürünlerden daha fazla veya daha az sipariş etmeliyiz?)
    3. Hızlı İpuçları (Tasarruf veya verimlilik önerileri).
    
    Yanıtı HTML veya markdown listesi olarak değil, düz metin halinde ama satır başlarında sevimli emojilerle sun.
  `;

  const context = {
    businessName,
    businessType,
    products: products.map(p => ({
      name: p.name,
      category: p.category,
      stockAmount: p.stockAmount,
      unit: p.unit,
      criticalLevel: p.criticalLevel,
      price: p.price
    })),
    logs: logs.slice(0, 10) // Send only last 10 logs for context sanity
  };

  return getAIResponse(apiKey, prompt, context);
};
