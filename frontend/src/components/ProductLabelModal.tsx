import React, { useState } from 'react';
import { Product } from '../types';
import { X, Printer, Package, AlertTriangle, Check, Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logPrintBarcode } from '../services/api';
import LabelTemplate from './LabelTemplate';

interface ProductLabelModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductLabelModal: React.FC<ProductLabelModalProps> = ({ product, open, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [printing, setPrinting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [printMode, setPrintMode] = useState<'brother' | 'web'>('brother');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  
  if (!open || !product) return null;

  // Si no es admin, no mostrar el modal
  if (!isAdmin) {
    return null;
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBrotherPrint = async () => {
    try {
      setPrinting(true);
      
      // Preparar datos para la etiqueta Brother QL-800
      const labelData = {
        name: product.name,
        sku: product.sku || '',
        baseCode: product.baseCode || '',
        price: product.salePrice || 0,
        size: product.size || '',
        color: product.color || '',
        brand: product.brand?.name || '',
        category: product.category?.name || '',
        barcode: product.sku || ''
      };

      // Registrar la impresión en el backend
      await logPrintBarcode(product.id);
      
      // Llamar a la API de impresión Brother QL-800
      const token = localStorage.getItem('token');
      
      // Imprimir múltiples etiquetas
      for (let i = 0; i < quantity; i++) {
        const response = await fetch(`http://localhost:4000/api/products/${product.id}/print-label`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(labelData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error de impresión');
        }
      }

      showNotification(`🖨️ ${quantity} etiqueta(s) enviada(s) a Brother QL-800: ${product.name}`, 'success');
      
    } catch (error) {
      console.error('Error imprimiendo etiqueta:', error);
      showNotification(`❌ Error al imprimir: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    } finally {
      setPrinting(false);
    }
  };

  const handleWebPrint = () => {
    // Mostrar la plantilla web e imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Etiquetas - ${product.name}</title>
          <style>
            ${getWebPrintStyles()}
          </style>
        </head>
        <body>
          ${generateLabelHTML(product, quantity)}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const getWebPrintStyles = () => `
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
    }
    
    .labels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }
    
    .dk11201-label {
      width: 90mm;
      height: 29mm;
      border: 1px solid #000;
      padding: 0;
      box-sizing: border-box;
      display: flex;
      font-size: 8pt;
      line-height: 1.1;
      break-inside: avoid;
      background: white;
    }
    
    .label-info-section {
      width: 45mm;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .barcode-section {
      width: 45mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1mm;
    }
    
    .barcode-container {
      transform: rotate(90deg);
      transform-origin: center;
    }
    
    .product-name {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 1mm;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    
    .product-details {
      font-size: 8pt;
      margin-bottom: 2mm;
    }
    
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.5mm;
    }
    
    .label-text {
      font-weight: bold;
      margin-right: 1mm;
      min-width: 8mm;
    }
    
    .value-text {
      margin-right: 3mm;
      font-weight: normal;
    }
    
    .brand-text {
      font-size: 7pt;
      color: #666;
      font-style: italic;
    }
    
    .price-section {
      display: flex;
      align-items: baseline;
      justify-content: flex-start;
    }
    
    .price-symbol {
      font-size: 12pt;
      font-weight: bold;
      margin-right: 1mm;
    }
    
    .price-value {
      font-size: 14pt;
      font-weight: bold;
      color: #000;
    }
  `;

  const generateLabelHTML = (product: Product, qty: number) => {
    const labels = Array.from({ length: qty }, (_, index) => `
      <div class="dk11201-label">
        <div class="label-info-section">
          <div class="product-name">
            ${product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}
          </div>
          <div class="product-details">
            <div class="detail-row">
              <span class="label-text">T:</span>
              <span class="value-text">${product.size}</span>
              <span class="label-text">C:</span>
              <span class="value-text">${product.color}</span>
            </div>
            <div class="detail-row">
              <span class="brand-text">${product.brand?.name || 'N/A'}</span>
            </div>
          </div>
          <div class="price-section">
            <span class="price-symbol">$</span>
            <span class="price-value">${product.salePrice?.toFixed(0) || '0'}</span>
          </div>
        </div>
        
        <div class="barcode-section">
          <div class="barcode-container">
            <div style="font-family: 'Libre Barcode 128', monospace; font-size: 20pt; letter-spacing: 0; writing-mode: vertical-lr; text-orientation: mixed;">
              ${product.sku || ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    return `<div class="labels-container">${labels}</div>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Imprimir Etiquetas</h2>
                <p className="text-indigo-100">{product.name}</p>
              </div>
            </div>
            <button 
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          {/* Información del producto */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>SKU:</strong> {product.sku}</div>
              <div><strong>Precio:</strong> ${product.salePrice?.toFixed(2)}</div>
              <div><strong>Talla:</strong> {product.size}</div>
              <div><strong>Color:</strong> {product.color}</div>
              <div><strong>Marca:</strong> {product.brand?.name || 'N/A'}</div>
              <div><strong>Categoría:</strong> {product.category?.name || 'N/A'}</div>
            </div>
          </div>

          {/* Configuración de impresión */}
          <div className="space-y-4 mb-6">
            {/* Modo de impresión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modo de Impresión
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="brother"
                    checked={printMode === 'brother'}
                    onChange={(e) => setPrintMode(e.target.value as 'brother' | 'web')}
                    className="mr-2"
                  />
                  <span className="text-sm">Brother QL-800 (Recomendado)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="web"
                    checked={printMode === 'web'}
                    onChange={(e) => setPrintMode(e.target.value as 'brother' | 'web')}
                    className="mr-2"
                  />
                  <span className="text-sm">Impresora Web</span>
                </label>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Etiquetas
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-semibold min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={quantity >= 50}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Máximo 50 etiquetas</p>
            </div>
          </div>

          {/* Vista previa */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Vista Previa</h3>
            <div className="bg-white border rounded p-2 max-h-40 overflow-auto">
              <LabelTemplate product={product} quantity={Math.min(quantity, 4)} />
            </div>
          </div>

          {/* Notificación */}
          {notification && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
              notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
              'bg-yellow-100 border border-yellow-400 text-yellow-700'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' && <Check className="w-4 h-4" />}
                {notification.type === 'error' && <X className="w-4 h-4" />}
                {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button 
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              onClick={onClose}
              type="button"
            >
              Cerrar
            </button>
            <button 
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                printing 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={printMode === 'brother' ? handleBrotherPrint : handleWebPrint}
              disabled={printing}
              type="button"
            >
              <Printer className={`h-5 w-5 ${printing ? 'animate-spin' : ''}`} />
              <span>
                {printing ? 'Imprimiendo...' : `Imprimir ${quantity} etiqueta${quantity > 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductLabelModal;
