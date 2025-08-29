import React, { useState, useEffect } from 'react';
import { Product, Brand, Category } from '../types';
import { getProducts, getBrands, getCategories } from '../services/api';
import { ShoppingCart, Plus, Minus, Trash2, Search, Scan, Check, AlertCircle, Package } from 'lucide-react';
import Receipt from '../components/Receipt';

const SalesPage: React.FC = () => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalBrandFilter, setModalBrandFilter] = useState<number | ''>('');
  const [modalCategoryFilter, setModalCategoryFilter] = useState<number | ''>('');
  const [modalColorFilter, setModalColorFilter] = useState('');
  const [modalSizeFilter, setModalSizeFilter] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<Array<{ 
    id: string; // ID único para cada item en el carrito
    product: Product; 
    quantity: number; 
    discount: number;
    discountMode: 'individual' | 'total';
  }>>([]);
  const [discountModalIdx, setDiscountModalIdx] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountMode, setDiscountMode] = useState<'individual' | 'total'>('total');
  const [discountValue, setDiscountValue] = useState(0);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandFilter, setBrandFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [colorFilter, setColorFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [totalDiscount, setTotalDiscount] = useState(0);
  
  // Estados para IVA - siempre activo
  const [taxIncluded, setTaxIncluded] = useState(true); // Por defecto incluido en el precio
  const [taxRate, setTaxRate] = useState(0.19); // 19% por defecto
  
  // Estados para feedback visual
  const [recentlyAdded, setRecentlyAdded] = useState<number | null>(null);
  const [notification, setNotification] = useState<string>('');

  // Función para mostrar notificación
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Función para agregar producto al carrito (cada unidad es un item separado)
  const addToCart = (product: Product) => {
    // Cada producto se agrega como un item individual con un ID único
    const newItem = {
      id: `${product.id}-${Date.now()}-${Math.random()}`, // ID único
      product,
      quantity: 1,
      discount: 0,
      discountMode: 'total' as const
    };
    
    setCart([...cart, newItem]);
    showNotification(`${product.name} agregado al carrito`);
    
    // Feedback visual
    setRecentlyAdded(product.id);
    setTimeout(() => setRecentlyAdded(null), 2000);
  };

  useEffect(() => {
    async function loadData() {
      setProducts(await getProducts());
      setBrands(await getBrands());
      setCategories(await getCategories());
    }
    loadData();
  }, []);

  // Filtrado avanzado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase()) || product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !brandFilter || product.brandId === brandFilter;
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
    const matchesColor = !colorFilter || product.color.toLowerCase() === colorFilter.toLowerCase();
    const matchesSize = !sizeFilter || product.size.toLowerCase() === sizeFilter.toLowerCase();
    return matchesSearch && matchesBrand && matchesCategory && matchesColor && matchesSize;
  });

  // Calcular el total del carrito con IVA
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.salePrice || 0;
    return sum + (price - item.discount);
  }, 0) - totalDiscount;
  
  const calculateTaxValues = (subtotal: number, taxIncluded: boolean, taxRate: number) => {
    if (taxIncluded) {
      // El precio ya incluye IVA, necesitamos extraerlo
      const total = subtotal;
      const taxAmount = total - (total / (1 + taxRate));
      const subtotalWithoutTax = total - taxAmount;
      return { subtotal: subtotalWithoutTax, taxAmount, total };
    } else {
      // El precio no incluye IVA, necesitamos agregarlo
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      return { subtotal, taxAmount, total };
    }
  };
  
  const taxValues = calculateTaxValues(subtotal, taxIncluded, taxRate);
  const total = taxValues.total;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={20} />
          {notification}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ShoppingCart className="text-blue-600" size={32} />
          Punto de Venta
        </h1>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Package size={20} className="text-blue-600" />
          <span className="font-medium text-blue-800">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en carrito
          </span>
        </div>
      </div>

      {/* Campo de escaneo prominente */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl shadow-lg border border-blue-200 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Scan className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Escanear Producto</h2>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={barcodeInput.replace(/[,']/g, '-')}
              onChange={e => setBarcodeInput(e.target.value.replace(/[,']/g, '-'))}
              onKeyDown={e => {
                if (e.key === 'Enter' && barcodeInput.trim()) {
                  const formatted = barcodeInput.trim().replace(/[,']/g, '-');
                  const found = products.find(p => p.sku === formatted);
                  if (found) {
                    addToCart(found);
                    setBarcodeInput('');
                  } else {
                    showNotification('Producto no encontrado con ese código');
                  }
                }
              }}
              placeholder="Escanea o ingresa el código de barras del producto..."
              className="w-full px-4 py-3 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Scan className="text-blue-400" size={20} />
            </div>
          </div>
          <button
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
            onClick={() => setShowProductsModal(true)}
          >
            <Search size={20} />
            Buscar Productos
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
          <AlertCircle size={16} />
          Presiona Enter después de escanear o escribir el código
        </p>
      </div>
      {/* Lista de productos filtrados */}
      {/* Modal de productos mejorado */}
      {showProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowProductsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl m-4 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Package size={28} />
                    Catálogo de Productos
                  </h2>
                  <p className="text-blue-100 mt-1">Encuentra y agrega productos a la venta</p>
                </div>
                <button 
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg" 
                  onClick={() => setShowProductsModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filtros mejorados */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <select 
                  value={modalBrandFilter} 
                  onChange={e => setModalBrandFilter(e.target.value ? Number(e.target.value) : '')} 
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">🏷️ Todas las marcas</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                
                <select 
                  value={modalCategoryFilter} 
                  onChange={e => setModalCategoryFilter(e.target.value ? Number(e.target.value) : '')} 
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">📂 Todas las categorías</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                <input 
                  type="text" 
                  value={modalColorFilter} 
                  onChange={e => setModalColorFilter(e.target.value)} 
                  placeholder="🎨 Color..." 
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                
                <input 
                  type="text" 
                  value={modalSizeFilter} 
                  onChange={e => setModalSizeFilter(e.target.value)} 
                  placeholder="📏 Talla..." 
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              {/* Botón para limpiar filtros */}
              {(modalSearch || modalBrandFilter || modalCategoryFilter || modalColorFilter || modalSizeFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setModalSearch('');
                      setModalBrandFilter('');
                      setModalCategoryFilter('');
                      setModalColorFilter('');
                      setModalSizeFilter('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Lista de productos mejorada */}
            <div className="overflow-auto max-h-[50vh]">
              {(() => {
                const modalFilteredProducts = products.filter(product => {
                  const matchesSearch = !modalSearch || 
                    product.name.toLowerCase().includes(modalSearch.toLowerCase()) || 
                    product.sku.toLowerCase().includes(modalSearch.toLowerCase());
                  const matchesBrand = !modalBrandFilter || product.brandId === modalBrandFilter;
                  const matchesCategory = !modalCategoryFilter || product.categoryId === modalCategoryFilter;
                  const matchesColor = !modalColorFilter || product.color.toLowerCase().includes(modalColorFilter.toLowerCase());
                  const matchesSize = !modalSizeFilter || product.size.toLowerCase().includes(modalSizeFilter.toLowerCase());
                  return matchesSearch && matchesBrand && matchesCategory && matchesColor && matchesSize;
                });

                if (modalFilteredProducts.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Package size={64} className="text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
                      <p className="text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {modalFilteredProducts.map(product => {
                      const isLowStock = (product.stockCached || 0) <= 5;
                      const isOutOfStock = (product.stockCached || 0) === 0;
                      
                      return (
                        <div 
                          key={product.id} 
                          className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
                            recentlyAdded === product.id ? 'border-green-400 bg-green-50' : 
                            isOutOfStock ? 'border-red-200 bg-red-50' :
                            isLowStock ? 'border-yellow-200 bg-yellow-50' :
                            'border-gray-200 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
                              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                              
                              <div className="flex flex-wrap gap-2 text-xs">
                                {product.brand && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {brands.find(b => b.id === product.brandId)?.name}
                                  </span>
                                )}
                                {product.category && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    {categories.find(c => c.id === product.categoryId)?.name}
                                  </span>
                                )}
                                {product.color && (
                                  <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                                    {product.color}
                                  </span>
                                )}
                                {product.size && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {product.size}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                ${(product.salePrice || 0).toLocaleString()}
                              </p>
                              <p className={`text-sm ${
                                isOutOfStock ? 'text-red-600 font-semibold' :
                                isLowStock ? 'text-yellow-600 font-semibold' :
                                'text-gray-600'
                              }`}>
                                Stock: {product.stockCached || 0}
                                {isLowStock && !isOutOfStock && ' (Bajo)'}
                                {isOutOfStock && ' (Agotado)'}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (!isOutOfStock) {
                                  addToCart(product);
                                }
                              }}
                              disabled={isOutOfStock}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                                isOutOfStock 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : recentlyAdded === product.id
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                              }`}
                            >
                              {recentlyAdded === product.id ? (
                                <>
                                  <Check size={16} />
                                  Agregado
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  Agregar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de descuento individual */}
        {discountModalIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDiscountModalIdx(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-purple-200" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setDiscountModalIdx(null)}>&times;</button>
              
              <div className="text-center mb-6">
                <div className="bg-purple-100 p-3 rounded-full inline-block mb-3">
                  <Package className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Aplicar Descuento</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {cart[discountModalIdx]?.product.name}
                </p>
                <p className="text-purple-600 text-sm font-medium mt-1">
                  Unidad individual
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tipo de descuento:</h4>
                <div className="flex gap-2 mb-4">
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    discountType === 'amount' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <input 
                      type="radio" 
                      checked={discountType === 'amount'} 
                      onChange={() => setDiscountType('amount')} 
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">Monto Fijo</div>
                      <div className="text-sm text-gray-500">$ pesos</div>
                    </div>
                  </label>
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    discountType === 'percent' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <input 
                      type="radio" 
                      checked={discountType === 'percent'} 
                      onChange={() => setDiscountType('percent')} 
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">Porcentaje</div>
                      <div className="text-sm text-gray-500">% descuento</div>
                    </div>
                  </label>
                </div>
                
                <input
                  type="number"
                  min={0}
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-center focus:border-purple-500 focus:outline-none"
                  placeholder={discountType === 'amount' ? '0.00' : '0'}
                  autoFocus
                />
                
                {/* Preview del descuento */}
                {discountValue > 0 && cart[discountModalIdx] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Precio original:</span>
                        <span>${cart[discountModalIdx].product.salePrice?.toFixed(2)}</span>
                      </div>
                      <hr className="my-2" />
                      {(() => {
                        const item = cart[discountModalIdx];
                        const unitPrice = item.product.salePrice || 0;
                        let discountAmount = 0;
                        
                        if (discountType === 'amount') {
                          discountAmount = discountValue;
                        } else {
                          discountAmount = unitPrice * (discountValue / 100);
                        }
                        
                        const finalPrice = unitPrice - discountAmount;
                        
                        return (
                          <>
                            <div className="flex justify-between text-red-600">
                              <span>Descuento:</span>
                              <span>-${discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-600">
                              <span>Precio final:</span>
                              <span>${finalPrice.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDiscountModalIdx(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                  onClick={() => {
                    const idx = discountModalIdx;
                    if (idx === null) return;
                    const newCart = [...cart];
                    const item = newCart[idx];
                    const unitPrice = item.product.salePrice || 0;
                    
                    // Calcular el descuento
                    let finalDiscount = 0;
                    if (discountType === 'amount') {
                      finalDiscount = discountValue;
                    } else {
                      finalDiscount = unitPrice * (discountValue / 100);
                    }
                    
                    newCart[idx].discount = finalDiscount;
                    setCart(newCart);
                    setDiscountModalIdx(null);
                    
                    showNotification(`Descuento aplicado: $${finalDiscount.toFixed(2)}`);
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Carrito de venta mejorado */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <ShoppingCart size={24} />
            Carrito de Venta
            {cart.length > 0 && (
              <span className="bg-white text-purple-600 px-2 py-1 rounded-full text-sm font-medium">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Carrito vacío</h3>
              <p className="text-gray-400">Escanea un producto o busca en el catálogo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Agrupar items por producto para mostrarlos organizadamente
                const groupedItems = cart.reduce((groups, item, index) => {
                  const key = item.product.id;
                  if (!groups[key]) {
                    groups[key] = [];
                  }
                  groups[key].push({ ...item, originalIndex: index });
                  return groups;
                }, {} as Record<number, Array<typeof cart[0] & { originalIndex: number }>>);

                return Object.entries(groupedItems).map(([productId, items]) => (
                  <div key={productId} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    {/* Encabezado del producto */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{items[0].product.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>SKU: {items[0].product.sku}</span>
                          <span>Color: {items[0].product.color}</span>
                          <span>Talla: {items[0].product.size}</span>
                        </div>
                        <div className="text-lg font-bold text-purple-600 mt-2">
                          ${items[0].product.salePrice?.toFixed(2) || '0.00'} c/u (precio base)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          {items.length} unidad{items.length > 1 ? 'es' : ''} en carrito
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                          Total: ${items.reduce((sum, item) => {
                            const price = item.product.salePrice || 0;
                            const itemTotal = price - item.discount;
                            return sum + itemTotal;
                          }, 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tabla de unidades con descuentos */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2">
                        <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700">
                          <div>Unidad</div>
                          <div className="text-center">Precio Base</div>
                          <div className="text-center">Descuento</div>
                          <div className="text-center">Precio Final</div>
                          <div className="text-center">Acciones</div>
                          <div className="text-center">Eliminar</div>
                        </div>
                      </div>
                      
                      {/* Filas de unidades */}
                      {items.map((item, itemIdx) => (
                        <div 
                          key={item.id}
                          className={`grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100 items-center transition-all ${
                            recentlyAdded === item.product.id 
                              ? 'bg-green-50 border-green-200' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Número de unidad */}
                          <div className="flex items-center">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                              #{itemIdx + 1}
                            </span>
                          </div>
                          
                          {/* Precio base */}
                          <div className="text-center">
                            <span className="text-gray-700 font-medium">
                              ${item.product.salePrice?.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Descuento */}
                          <div className="text-center">
                            {item.discount > 0 ? (
                              <div className="flex flex-col items-center">
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                                  -${item.discount.toFixed(2)}
                                </span>
                                <span className="text-xs text-red-600 mt-1">
                                  ({((item.discount / (item.product.salePrice || 1)) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Sin descuento</span>
                            )}
                          </div>
                          
                          {/* Precio final */}
                          <div className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-bold text-lg ${
                                item.discount > 0 ? 'text-green-600' : 'text-gray-800'
                              }`}>
                                ${((item.product.salePrice || 0) - item.discount).toFixed(2)}
                              </span>
                              {item.discount > 0 && (
                                <span className="text-xs text-green-600">
                                  Ahorro: ${item.discount.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Botón de descuento */}
                          <div className="text-center">
                            <button 
                              onClick={() => {
                                setDiscountModalIdx(item.originalIndex);
                                setDiscountType('amount');
                                setDiscountMode('total');
                                setDiscountValue(0);
                              }}
                              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors w-full"
                            >
                              {item.discount > 0 ? 'Editar' : 'Aplicar'}
                            </button>
                          </div>
                          
                          {/* Eliminar */}
                          <div className="text-center">
                            <button
                              onClick={() => {
                                const newCart = cart.filter((_, i) => i !== item.originalIndex);
                                setCart(newCart);
                                showNotification(`Unidad eliminada del carrito`);
                              }}
                              className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors mx-auto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Botón para agregar otra unidad */}
                    <button
                      onClick={() => addToCart(items[0].product)}
                      className="w-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 py-3 rounded-lg border border-purple-200 hover:from-purple-200 hover:to-pink-200 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus size={18} />
                      Agregar otra unidad de este producto
                    </button>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
        
        {/* Resumen mejorado del carrito */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Resumen de Compra
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información de productos */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-gray-700 mb-2">Productos en Carrito</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {cart.length}
                </div>
                <div className="text-sm text-gray-600">
                  {cart.length === 1 ? 'producto' : 'productos'}
                </div>
              </div>
              
              {/* Información de descuentos */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-gray-700 mb-2">Descuentos Aplicados</h4>
                {cart.some(item => item.discount > 0) ? (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      ${cart.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {cart.filter(item => item.discount > 0).length} productos con descuento
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-400">$0.00</div>
                    <div className="text-sm text-gray-600">Sin descuentos</div>
                  </>
                )}
              </div>
              
              {/* Total final con configuración de IVA integrada */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">Resumen de Compra</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Tasa IVA:</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value={0.19}>19%</option>
                      <option value={0.16}>16%</option>
                      <option value={0.21}>21%</option>
                      <option value={0.10}>10%</option>
                      <option value={0.05}>5%</option>
                    </select>
                  </div>
                </div>
                
                {/* Toggle para tipo de IVA */}
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxIncluded}
                      onChange={(e) => setTaxIncluded(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Los precios mostrados incluyen IVA
                    </span>
                  </label>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    {taxIncluded ? 'El IVA se extrae del precio total' : 'El IVA se agrega al precio base'}
                  </div>
                </div>
                
                {/* Desglose detallado */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{taxIncluded ? 'Subtotal (sin IVA):' : 'Subtotal:'}</span>
                    <span>${taxIncluded ? taxValues.subtotal.toFixed(2) : subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
                    <span>${taxValues.taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCart([]);
                  showNotification('Carrito vaciado');
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Vaciar Carrito
              </button>
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    alert('No hay productos en el carrito.');
                    return;
                  }
                  setShowSummaryModal(true);
                }}
                className="flex-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 font-bold shadow-lg"
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de resumen y boleta */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowSummaryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-pink-200" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-pink-600 text-2xl" onClick={() => setShowSummaryModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-6 text-pink-700 text-center">Resumen de Venta</h2>
            
            <div className="mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Productos a Vender:</h3>
              
              {/* Tabla de productos */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2">
                  <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700">
                    <div>Producto</div>
                    <div className="text-center">Precio Base</div>
                    <div className="text-center">Descuento</div>
                    <div className="text-center">Precio Final</div>
                  </div>
                </div>
                
                {cart.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-100 items-center">
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-800">{item.product.name}</div>
                      <div className="text-xs text-gray-600">
                        SKU: {item.product.sku} | {item.product.color} | {item.product.size}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-gray-700">
                        ${item.product.salePrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      {item.discount > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            -${item.discount.toFixed(2)}
                          </span>
                          <span className="text-xs text-red-600 mt-1">
                            ({((item.discount / (item.product.salePrice || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin descuento</span>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className={`font-bold ${item.discount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                        ${((item.product.salePrice || 0) - item.discount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4 mb-6">
              {/* Subtotal sin IVA */}
              <div className="flex justify-between text-gray-700 mb-2">
                <span>Subtotal {taxIncluded ? '(sin IVA)' : ''}:</span>
                <span>${taxIncluded ? taxValues.subtotal.toFixed(2) : subtotal.toFixed(2)}</span>
              </div>
              
              {/* Descuentos si hay alguno */}
              {cart.some(item => item.discount > 0) && (
                <div className="flex justify-between text-red-600 mb-2">
                  <span>Descuentos:</span>
                  <span>-${cart.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</span>
                </div>
              )}
              
              {/* IVA */}
              <div className="flex justify-between text-blue-600 mb-2">
                <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
                <span>${taxValues.taxAmount.toFixed(2)}</span>
              </div>
              
              {/* Total final */}
              <div className="flex justify-between text-xl font-bold text-purple-600 border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-3 rounded-lg w-full font-bold shadow hover:scale-105 transition"
              onClick={async () => {
                // Registrar venta y reducir stock en backend
                try {
                  // Agrupar items por producto para enviar al backend
                  const groupedSales = cart.reduce((groups, item) => {
                    const existingGroup = groups.find(g => g.productId === item.product.id && g.price === item.product.salePrice && g.discount === item.discount);
                    if (existingGroup) {
                      existingGroup.quantity += 1;
                    } else {
                      groups.push({
                        productId: item.product.id,
                        quantity: 1,
                        price: item.product.salePrice || 0,
                        discount: item.discount || 0
                      });
                    }
                    return groups;
                  }, [] as Array<{productId: number, quantity: number, price: number, discount: number}>);
                  
                  const result = await import('../services/api').then(api => api.registerSale(groupedSales, {
                    taxIncluded,
                    taxRate
                  }));
                  // Guardar datos de la boleta y mostrar el modal
                  setReceiptData({
                    folio: result.folio || Math.floor(Math.random() * 100000).toString(),
                    items: cart,
                    subtotal: taxValues.subtotal,
                    taxAmount: taxValues.taxAmount,
                    taxRate: taxRate,
                    taxIncluded: taxIncluded,
                    total: total,
                    date: new Date(),
                    user: result.sale?.user // Información del vendedor que viene del backend
                  });
                  setShowSummaryModal(false);
                  setShowReceiptModal(true);
                  setCart([]);
                } catch (err) {
                  alert('Error al registrar la venta.');
                }
              }}
            >Confirmar y Generar Boleta</button>
          </div>
        </div>
      )}

      {/* Componente de boleta */}
      <Receipt 
        receiptData={receiptData}
        isVisible={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptData(null);
        }}
      />
    </div>
  );
};

export default SalesPage;
