import React, { useState } from 'react';
import Barcode from 'react-barcode';
import { Product } from '../types';
import { X, Printer, Package, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logPrintBarcode } from '../services/api';

interface ProductDetailsModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, open, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [printing, setPrinting] = useState(false);
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

  const handlePrint = async () => {
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
        barcode: product.sku || '' // El código de barras es el mismo SKU
      };

      // Registrar la impresión en el backend
      await logPrintBarcode(product.id);
      
      // Llamar a la API de impresión Brother QL-800
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/products/${product.id}/print-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(labelData)
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(`🖨️ Etiqueta enviada a Brother QL-800: ${product.name}`, 'success');
      } else {
        const error = await response.json();
        showNotification(`❌ Error al imprimir: ${error.message || 'Error desconocido'}`, 'error');
        
        // Fallback a impresión normal del navegador
        console.log('Fallback a impresión del navegador');
        window.print();
      }
      
    } catch (error) {
      console.error('Error imprimiendo etiqueta:', error);
      showNotification('❌ Error de conexión. Usando impresión del navegador.', 'warning');
      
      // Fallback a impresión normal del navegador
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden print:shadow-none print:max-w-none print:rounded-none print:p-8" onClick={e => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Código de Barras</h2>
                <p className="text-indigo-100">Información para impresión</p>
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
        <div className="p-6 print:p-0">
          {/* Información del producto para pantalla */}
          <div className="text-center mb-6 print:mb-2">
            <h3 className="text-lg font-bold text-gray-900 mb-2 print:text-base print:mb-1">{product.name}</h3>
            <div className="flex justify-center space-x-4 text-sm text-gray-600 print:text-xs print:text-black print:space-x-2">
              <span><strong>Talla:</strong> {product.size}</span>
              <span><strong>Color:</strong> {product.color}</span>
              <span><strong>Cat:</strong> {product.category?.name || 'N/A'}</span>
            </div>
          </div>

          {/* Código de barras - visible en pantalla e impresión */}
          <div className="text-center bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 print:border-gray-400 print:mb-0 print:p-2">
            <div className="flex justify-center mb-4 print:mb-1">
              <Barcode 
                value={product.sku || ''} 
                format="CODE128" 
                width={1.5} 
                height={60} 
                displayValue={true}
                fontSize={12}
                background="#ffffff"
                lineColor="#000000"
                className="print:!w-auto print:!h-auto"
              />
            </div>
          </div>
        </div>

        {/* Footer con botón de imprimir - solo visible en pantalla */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 print:hidden">
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
          
          <div className="flex justify-center space-x-3">
            <button 
              className={`flex items-center space-x-2 px-8 py-4 rounded-xl transition-all duration-200 font-bold text-lg shadow-lg ${
                printing 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handlePrint}
              disabled={printing}
              type="button"
            >
              <Printer className={`h-6 w-6 ${printing ? 'animate-spin' : ''}`} />
              <span>{printing ? '🖨️ IMPRIMIENDO...' : '🖨️ IMPRIMIR ETIQUETA'}</span>
            </button>
            <button 
              className="flex items-center space-x-2 px-6 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
              <span>Cerrar</span>
            </button>
          </div>
          
          {/* Información adicional */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>🖨️ Brother QL-800 • Etiqueta con código de barras • SKU: {product.sku}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;