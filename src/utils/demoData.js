import { addProduct, addRecipe, addSupplier, addLog, getAllProducts } from './db';

const DEMO_PRESETS = {
  pastane: {
    products: [
      { name: 'Buğday Unu', category: 'Un & Maya', unit: 'kg', stockAmount: 120, criticalLevel: 25, price: 18.50, expiryOffset: 60 },
      { name: 'Kristal Şeker', category: 'Hammaddeler', unit: 'kg', stockAmount: 85, criticalLevel: 15, price: 24.00, expiryOffset: 120 },
      { name: 'Taze Çilek', category: 'Meyve & Sebze', unit: 'kg', stockAmount: 12, criticalLevel: 4, price: 65.00, expiryOffset: 2 }, // Expiry soon
      { name: 'Pastörize Süt', category: 'Süt & Şarküteri', unit: 'L', stockAmount: 40, criticalLevel: 10, price: 19.80, expiryOffset: -1 }, // Expired!
      { name: 'Kakao Tozu', category: 'Hammaddeler', unit: 'kg', stockAmount: 8, criticalLevel: 2, price: 110.00, expiryOffset: 90 },
      { name: 'Tereyağı', category: 'Süt & Şarküteri', unit: 'kg', stockAmount: 15, criticalLevel: 3, price: 185.00, expiryOffset: 15 },
      { name: 'Karton Pasta Kutusu', category: 'Ambalaj & Paket', unit: 'Adet', stockAmount: 200, criticalLevel: 50, price: 4.50 }, // No expiry
      { name: 'Krem Şanti', category: 'Süt & Şarküteri', unit: 'kg', stockAmount: 18, criticalLevel: 5, price: 75.00, expiryOffset: 4 }  // Expiry soon
    ],
    suppliers: [
      { name: 'Kemal Aksoy', company: 'Suda Un Sanayi A.Ş.', phone: '0532 111 22 33', email: 'kemal@sudaun.com', balance: 1450.00 },
      { name: 'Zeynep Yılmaz', company: 'Dynamics Süt Ürünleri', phone: '0543 222 33 44', email: 'zeynep@dynamicssut.com', balance: 680.00 }
    ],
    recipes: [
      {
        name: 'Çilekli Pasta (1 Adet)',
        ingredients: [
          { name: 'Buğday Unu', amount: 0.2 },
          { name: 'Kristal Şeker', amount: 0.1 },
          { name: 'Taze Çilek', amount: 0.15 },
          { name: 'Pastörize Süt', amount: 0.25 },
          { name: 'Tereyağı', amount: 0.05 },
          { name: 'Krem Şanti', amount: 0.1 },
          { name: 'Karton Pasta Kutusu', amount: 1 }
        ]
      },
      {
        name: 'Çikolatalı Kurabiye (1 Tepsi)',
        ingredients: [
          { name: 'Buğday Unu', amount: 0.5 },
          { name: 'Kristal Şeker', amount: 0.25 },
          { name: 'Tereyağı', amount: 0.2 },
          { name: 'Kakao Tozu', amount: 0.1 }
        ]
      }
    ],
    logs: [
      { type: 'system', message: 'Veritabanı başlatıldı ve Pastane Şablonu yüklendi.', details: '8 ürün, 2 tedarikçi ve 2 reçete eklendi.' },
      { type: 'add', message: 'Toptan Un Alımı Yapıldı', details: 'Suda Un Sanayi A.Ş.\'den 120 kg Buğday Unu envantere eklendi.' }
    ]
  },
  cafe: {
    products: [
      { name: 'Espresso Kahve Çekirdeği', category: 'Kahve & İçecek', unit: 'kg', stockAmount: 30, criticalLevel: 8, price: 340.00, expiryOffset: 90 },
      { name: 'Barista Sütü', category: 'Süt & Şarküteri', unit: 'L', stockAmount: 120, criticalLevel: 20, price: 21.00, expiryOffset: -2 }, // Expired
      { name: 'Karamel Şurubu', category: 'Kahve & İçecek', unit: 'Kutu', stockAmount: 10, criticalLevel: 3, price: 95.00, expiryOffset: 150 },
      { name: 'Karton Bardak 12oz', category: 'Ambalaj & Paket', unit: 'Adet', stockAmount: 500, criticalLevel: 100, price: 1.20 },
      { name: 'Karton Bardak Kapağı', category: 'Ambalaj & Paket', unit: 'Adet', stockAmount: 480, criticalLevel: 100, price: 0.60 },
      { name: 'Çikolatalı Muffin', category: 'Hammaddeler', unit: 'Adet', stockAmount: 18, criticalLevel: 5, price: 28.00, expiryOffset: 3 }, // Expiry soon
      { name: 'Ihlamur Bitki Çayı', category: 'Kahve & İçecek', unit: 'Paket', stockAmount: 15, criticalLevel: 4, price: 42.00, expiryOffset: 120 }
    ],
    suppliers: [
      { name: 'Ahmet Mert', company: 'Kuzey Kahve İthalat', phone: '0555 444 33 22', email: 'ahmet@kuzeykahve.com', balance: 3400.00 },
      { name: 'Elif Şen', company: 'Dynamics Gıda Dağıtım A.Ş.', phone: '0533 555 66 77', email: 'elif@dynamicsgida.com', balance: 0.00 }
    ],
    recipes: [
      {
        name: 'Karamel Caffe Latte (Sıcak)',
        ingredients: [
          { name: 'Espresso Kahve Çekirdeği', amount: 0.02 },
          { name: 'Barista Sütü', amount: 0.22 },
          { name: 'Karamel Şurubu', amount: 0.02 },
          { name: 'Karton Bardak 12oz', amount: 1 },
          { name: 'Karton Bardak Kapağı', amount: 1 }
        ]
      }
    ],
    logs: [
      { type: 'system', message: 'Cafe Demo şablonu yüklendi.', details: '7 ürün, 2 tedarikçi ve 1 reçete veritabanına aktarıldı.' }
    ]
  },
  firin: {
    products: [
      { name: 'Tip 650 Ekmeklik Un', category: 'Un & Maya', unit: 'Çuval', stockAmount: 25, criticalLevel: 5, price: 380.00, expiryOffset: 45 },
      { name: 'Yaş Maya (Paket)', category: 'Un & Maya', unit: 'Kutu', stockAmount: 15, criticalLevel: 3, price: 115.00, expiryOffset: 5 }, // Expiry soon
      { name: 'Tuz (İnce)', category: 'Hammaddeler', unit: 'kg', stockAmount: 50, criticalLevel: 10, price: 6.50, expiryOffset: 360 },
      { name: 'Ekmek Poşeti', category: 'Ambalaj & Paket', unit: 'Paket', stockAmount: 30, criticalLevel: 5, price: 45.00 },
      { name: 'Susam', category: 'Hammaddeler', unit: 'kg', stockAmount: 20, criticalLevel: 5, price: 90.00, expiryOffset: 90 }
    ],
    suppliers: [
      { name: 'Kemal Aksoy', company: 'Suda Un Sanayi A.Ş.', phone: '0532 111 22 33', email: 'kemal@sudaun.com', balance: 7600.00 }
    ],
    recipes: [
      {
        name: 'Klasik Somun Ekmek (50 Adet)',
        ingredients: [
          { name: 'Tip 650 Ekmeklik Un', amount: 0.5 },
          { name: 'Yaş Maya (Paket)', amount: 0.1 },
          { name: 'Tuz (İnce)', amount: 0.5 },
          { name: 'Ekmek Poşeti', amount: 50 }
        ]
      },
      {
        name: 'Susamlı Simit (100 Adet)',
        ingredients: [
          { name: 'Tip 650 Ekmeklik Un', amount: 0.4 },
          { name: 'Yaş Maya (Paket)', amount: 0.1 },
          { name: 'Susam', amount: 1.5 }
        ]
      }
    ],
    logs: [
      { type: 'system', message: 'Fırın Demo verileri başarıyla yüklendi.', details: 'Ürünler ve üretim formülleri hazır.' }
    ]
  },
  market: {
    products: [
      { name: 'Spagetti Makarna 500g', category: 'Hammaddeler', unit: 'Adet', stockAmount: 150, criticalLevel: 30, price: 11.50, expiryOffset: 180 },
      { name: 'Sızma Zeytinyağı 1L', category: 'Meyve & Sebze', unit: 'Adet', stockAmount: 40, criticalLevel: 10, price: 210.00, expiryOffset: 360 },
      { name: 'Çikolatalı Gofret 35g', category: 'Hammaddeler', unit: 'Kutu', stockAmount: 120, criticalLevel: 20, price: 4.80, expiryOffset: -3 }, // Expired
      { name: 'Bulaşık Deterjanı 750ml', category: 'Süt & Şarküteri', unit: 'Adet', stockAmount: 60, criticalLevel: 15, price: 34.00, expiryOffset: 240 },
      { name: 'Doğal Kaynak Suyu 1.5L', category: 'Kahve & İçecek', unit: 'Adet', stockAmount: 300, criticalLevel: 50, price: 5.50, expiryOffset: 180 },
      { name: 'Florürlü Diş Macunu 75ml', category: 'Süt & Şarküteri', unit: 'Adet', stockAmount: 45, criticalLevel: 10, price: 48.00, expiryOffset: 4 } // Expiry soon
    ],
    suppliers: [
      { name: 'Metin Tekin', company: 'Dynamics Toptan Market', phone: '0212 999 88 77', email: 'metin@dynamicstoptan.com', balance: 8400.00 }
    ],
    recipes: [],
    logs: [
      { type: 'system', message: 'Market Demo şablonu yüklendi.', details: 'Hızlı tüketim ürün grupları cari hesaplarla bağlandı.' }
    ]
  }
};

export const loadDemoData = async (businessType) => {
  const preset = DEMO_PRESETS[businessType];
  if (!preset) return false;

  try {
    // Insert Suppliers
    const supplierIds = {};
    for (const sup of preset.suppliers) {
      const id = await addSupplier(sup);
      supplierIds[sup.company] = id;
    }

    // Insert Products with calculated dynamic expiry dates
    const productIds = {};
    for (const prod of preset.products) {
      let finalExpiry = '';
      if (prod.expiryOffset !== undefined) {
        const d = new Date();
        d.setDate(d.getDate() + prod.expiryOffset);
        finalExpiry = d.toISOString().split('T')[0];
      }
      
      const productToAdd = {
        name: prod.name,
        category: prod.category,
        unit: prod.unit,
        stockAmount: prod.stockAmount,
        criticalLevel: prod.criticalLevel,
        price: prod.price,
        expiryDate: finalExpiry
      };

      const id = await addProduct(productToAdd);
      productIds[prod.name] = id;
    }

    // Insert Recipes
    for (const rec of preset.recipes) {
      const parsedIngredients = rec.ingredients
        .map(ing => {
          const matchedId = productIds[ing.name];
          return matchedId ? { productId: matchedId, name: ing.name, amount: ing.amount, unit: preset.products.find(p => p.name === ing.name)?.unit || 'Adet' } : null;
        })
        .filter(Boolean);

      if (parsedIngredients.length > 0) {
        await addRecipe({
          name: rec.name,
          ingredients: parsedIngredients
        });
      }
    }

    // Insert Logs
    for (const log of preset.logs) {
      await addLog(log.type, log.message, log.details);
    }

    return true;
  } catch (error) {
    console.error('Failed to populate demo dataset:', error);
    return false;
  }
};
