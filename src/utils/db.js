const DB_NAME = 'SudaStokDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for settings (metadata, config, api key)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      
      // Store for products
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      }

      // Store for recipes
      if (!db.objectStoreNames.contains('recipes')) {
        db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
      }

      // Store for logs
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Generic helper to get a store transaction
const getStore = async (storeName, mode = 'readonly') => {
  const db = await initDB();
  return db.transaction(storeName, mode).objectStore(storeName);
};

// Settings CRUD
export const getSetting = async (key, defaultValue = null) => {
  try {
    const store = await getStore('settings', 'readonly');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => resolve(defaultValue);
    });
  } catch (e) {
    return defaultValue;
  }
};

export const setSetting = async (key, value) => {
  const store = await getStore('settings', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const deleteSetting = async (key) => {
  const store = await getStore('settings', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Products CRUD
export const getAllProducts = async () => {
  const store = await getStore('products', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const addProduct = async (product) => {
  const store = await getStore('products', 'readwrite');
  return new Promise((resolve, reject) => {
    const item = {
      ...product,
      stockAmount: parseFloat(product.stockAmount) || 0,
      criticalLevel: parseFloat(product.criticalLevel) || 0,
      price: parseFloat(product.price) || 0,
      lastUpdated: new Date().toISOString()
    };
    const request = store.add(item);
    request.onsuccess = (e) => resolve(e.target.result); // Returns the auto-incremented ID
    request.onerror = () => reject(request.error);
  });
};

export const updateProduct = async (product) => {
  const store = await getStore('products', 'readwrite');
  return new Promise((resolve, reject) => {
    const item = {
      ...product,
      stockAmount: parseFloat(product.stockAmount) || 0,
      criticalLevel: parseFloat(product.criticalLevel) || 0,
      price: parseFloat(product.price) || 0,
      lastUpdated: new Date().toISOString()
    };
    const request = store.put(item);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const deleteProduct = async (id) => {
  const store = await getStore('products', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Recipes CRUD
export const getAllRecipes = async () => {
  const store = await getStore('recipes', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const addRecipe = async (recipe) => {
  const store = await getStore('recipes', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(recipe);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteRecipe = async (id) => {
  const store = await getStore('recipes', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Logs CRUD
export const getAllLogs = async () => {
  const store = await getStore('logs', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      // Sort by date descending
      const sorted = (request.result || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
};

export const addLog = async (type, message, details = '') => {
  try {
    const store = await getStore('logs', 'readwrite');
    const log = {
      type,
      message,
      details,
      date: new Date().toISOString()
    };
    return new Promise((resolve) => {
      const request = store.add(log);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error('Failed to log transaction:', e);
    return false;
  }
};

// Backup and Restore
export const exportBackup = async () => {
  const db = await initDB();
  const backup = {};
  
  const stores = ['settings', 'products', 'recipes', 'logs'];
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    backup[storeName] = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });
  }
  
  return JSON.stringify(backup, null, 2);
};

export const importBackup = async (backupJson) => {
  const backup = JSON.parse(backupJson);
  const db = await initDB();
  
  const stores = ['settings', 'products', 'recipes', 'logs'];
  for (const storeName of stores) {
    if (!backup[storeName]) continue;
    
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Clear existing
    store.clear();
    
    // Insert new
    for (const item of backup[storeName]) {
      store.put(item);
    }
    
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  }
  return true;
};
