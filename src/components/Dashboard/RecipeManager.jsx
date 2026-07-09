import React, { useState } from 'react';
import { Plus, Trash2, Play, Layers, HelpCircle, Check, AlertCircle } from 'lucide-react';
import './RecipeManager.css';

export default function RecipeManager({ products, recipes, onAddRecipe, onDeleteRecipe, onProduceRecipe }) {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [produceQuantity, setProduceQuantity] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!selectedProductId || !ingredientAmount) return;

    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;

    // Check if ingredient already added
    if (ingredients.some(ing => ing.productId === product.id)) {
      setErrorMsg('Bu hammadde zaten listeye eklenmiş!');
      return;
    }

    setIngredients(prev => [...prev, {
      productId: product.id,
      name: product.name,
      amount: parseFloat(ingredientAmount),
      unit: product.unit
    }]);

    setSelectedProductId('');
    setIngredientAmount('');
    setErrorMsg('');
  };

  const handleRemoveIngredient = (idx) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateRecipe = (e) => {
    e.preventDefault();
    if (!recipeName.trim() || ingredients.length === 0) {
      setErrorMsg('Lütfen reçete adı girin ve en az 1 hammadde ekleyin!');
      return;
    }

    const newRecipe = {
      name: recipeName,
      ingredients: ingredients
    };

    onAddRecipe(newRecipe);
    setRecipeName('');
    setIngredients([]);
    setIsAdding(false);
    setErrorMsg('');
    setSuccessMsg('Reçete başarıyla kaydedildi!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleProduce = (recipe) => {
    const qty = parseFloat(produceQuantity[recipe.id]) || 1;
    if (qty <= 0) return;

    // Validate if there is enough stock for all ingredients
    const missingItems = [];
    recipe.ingredients.forEach(ing => {
      const product = products.find(p => p.id === ing.productId);
      const totalNeeded = ing.amount * qty;
      if (!product || product.stockAmount < totalNeeded) {
        const available = product ? product.stockAmount : 0;
        missingItems.push({
          name: ing.name,
          needed: totalNeeded,
          available: available,
          missing: totalNeeded - available,
          unit: ing.unit
        });
      }
    });

    if (missingItems.length > 0) {
      const missingDetails = missingItems.map(item => 
        `${item.name} (Gereken: ${item.needed} ${item.unit}, Stok: ${item.available} ${item.unit})`
      ).join(', ');
      setErrorMsg(`Yetersiz Stok! Üretim yapılamıyor: ${missingDetails}`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    // Trigger parent production logic
    onProduceRecipe(recipe, qty);
    setSuccessMsg(`Başarılı! ${qty} adet "${recipe.name}" başarıyla üretildi. Stoklar güncellendi.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleQtyChange = (recipeId, val) => {
    setProduceQuantity(prev => ({
      ...prev,
      [recipeId]: val
    }));
  };

  return (
    <div className="recipe-manager-container animate-fade-in" id="recipe-manager-section">
      <div className="recipe-header">
        <div>
          <h2>👨‍🍳 Reçete (Üretim) Yönetimi</h2>
          <p className="recipe-subtitle">Mamul reçeteleri oluşturun ve ürettikçe hammaddeleri stoktan otomatik düşün.</p>
        </div>
        <button 
          className="btn-add-recipe-trigger" 
          onClick={() => { setIsAdding(!isAdding); setErrorMsg(''); }}
          id="btn-toggle-new-recipe"
        >
          {isAdding ? 'Listeye Dön' : 'Yeni Reçete Oluştur'}
        </button>
      </div>

      {errorMsg && (
        <div className="recipe-alert error animate-pop-in">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="recipe-alert success animate-pop-in">
          <Check size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {isAdding ? (
        /* Create Recipe Screen */
        <div className="create-recipe-card animate-fade-in-up" id="new-recipe-form-card">
          <h3>Yeni Ürün Reçetesi</h3>
          <form onSubmit={handleCreateRecipe}>
            <div className="input-group">
              <label htmlFor="recipe-name-input">Mamul Ürün Adı (Satılan Ürün)</label>
              <input
                type="text"
                id="recipe-name-input"
                placeholder="Örn: Çilekli Pasta, Kruvasan, Karamel Latte"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                required
              />
            </div>

            {/* Ingredients builder */}
            <div className="ingredients-builder-box">
              <h4>Malzemeler (Hammaddeler)</h4>
              
              <div className="ingredient-input-row">
                <div className="select-wrapper">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    id="ingredient-product-select"
                  >
                    <option value="">Malzeme Seçin...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit}) - Stok: {p.stockAmount}</option>
                    ))}
                  </select>
                </div>
                
                <input
                  type="number"
                  step="any"
                  placeholder="Miktar"
                  value={ingredientAmount}
                  onChange={(e) => setIngredientAmount(e.target.value)}
                  id="ingredient-amount-input"
                />

                <button 
                  type="button" 
                  onClick={handleAddIngredient} 
                  className="btn-add-ing"
                  id="btn-add-ingredient"
                >
                  Ekle
                </button>
              </div>

              {/* Added ingredients list */}
              <div className="added-ingredients-list">
                {ingredients.length === 0 ? (
                  <p className="no-ingredients-text">Henüz malzeme eklemediniz.</p>
                ) : (
                  <table className="ingredients-table">
                    <thead>
                      <tr>
                        <th>Malzeme Adı</th>
                        <th>Kullanılan Miktar</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ing, idx) => (
                        <tr key={idx}>
                          <td>{ing.name}</td>
                          <td><strong>{ing.amount}</strong> {ing.unit}</td>
                          <td>
                            <button 
                              type="button" 
                              className="btn-trash-ing" 
                              onClick={() => handleRemoveIngredient(idx)}
                              id={`btn-remove-ingredient-${idx}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="form-actions-row">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setIsAdding(false)}
                id="btn-cancel-recipe"
              >
                İptal Et
              </button>
              <button 
                type="submit" 
                className="btn-save-recipe" 
                disabled={ingredients.length === 0 || !recipeName.trim()}
                id="btn-save-recipe-submit"
              >
                Reçeteyi Kaydet
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Recipes List Screen */
        <div className="recipes-grid-list">
          {recipes.length === 0 ? (
            <div className="empty-recipes animate-pop-in">
              <Layers size={48} className="empty-icon animate-float" />
              <h3>Kayıtlı Reçete Bulunmuyor</h3>
              <p>Hammadde stoklarınızı tek tıkla düşmek için hemen ilk mamul reçetenizi oluşturun!</p>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 16 }} onClick={() => setIsAdding(true)} id="btn-create-first-recipe">
                İlk Reçeteyi Oluştur
              </button>
            </div>
          ) : (
            <div className="recipes-grid">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="recipe-card glow-card" id={`recipe-card-${recipe.id}`}>
                  <div className="recipe-card-header">
                    <h4>{recipe.name}</h4>
                    <button 
                      className="btn-delete-recipe" 
                      onClick={() => onDeleteRecipe(recipe.id)}
                      title="Reçeteyi Sil"
                      id={`btn-delete-recipe-${recipe.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="recipe-ingredients-preview">
                    <h5>Gereken Malzemeler:</h5>
                    <ul>
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i}>
                          <span>{ing.name}</span>
                          <strong>{ing.amount} {ing.unit}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Production Panel */}
                  <div className="recipe-production-action">
                    <div className="qty-selector">
                      <label htmlFor={`qty-input-${recipe.id}`}>Adet:</label>
                      <input
                        type="number"
                        min="1"
                        id={`qty-input-${recipe.id}`}
                        value={produceQuantity[recipe.id] || 1}
                        onChange={(e) => handleQtyChange(recipe.id, e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn-produce" 
                      onClick={() => handleProduce(recipe)}
                      id={`btn-produce-recipe-${recipe.id}`}
                    >
                      <Play size={14} fill="currentColor" /> Üretim Yap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
