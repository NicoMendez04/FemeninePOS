import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Printer, Eye, X } from 'lucide-react';
import Barcode from 'react-barcode';

interface LabelPreviewProps {
  product: Product;
  quantity?: number;
  onClose?: () => void;
  onPrint?: () => void;
  isModal?: boolean;
}

const LabelPreview: React.FC<LabelPreviewProps> = ({ 
  product, 
  quantity = 1, 
  onClose,
  onPrint,
  isModal = true
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintPreview = () => {
    setIsPreviewMode(true);
    setTimeout(() => {
      window.print();
      setIsPreviewMode(false);
    }, 100);
  };

  const renderDK11201Label = (product: Product, index: number) => (
    <div key={index} className="dk11201-label">
      {/* Sección izquierda: Información del producto */}
      <div className="label-info-section">
        <div className="product-name">
          {product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}
        </div>
        <div className="product-details">
          <div className="detail-row">
            <span className="label-text">T:</span>
            <span className="value-text">{product.size}</span>
            <span className="label-text">C:</span>
            <span className="value-text">{product.color}</span>
          </div>
          <div className="detail-row">
            <span className="brand-text">{product.brand?.name || 'N/A'}</span>
          </div>
        </div>
        <div className="price-section">
          <span className="price-symbol">$</span>
          <span className="price-value">{product.salePrice?.toFixed(0) || '0'}</span>
        </div>
      </div>

      {/* Sección derecha: Código de barras */}
      <div className="barcode-section">
        <div className="barcode-container">
          <Barcode 
            value={product.sku || ''} 
            format="CODE128" 
            width={1.2}
            height={60}
            displayValue={true}
            fontSize={8}
            background="#ffffff"
            lineColor="#000000"
            textMargin={2}
          />
        </div>
      </div>
    </div>
  );

  const renderLabelContent = () => (
    <div className="space-y-4">
      {/* Vista previa de etiquetas DK-11201 */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Etiquetas DK-11201 (29mm x 90mm)</h4>
        <div className="flex flex-wrap gap-4 justify-center">
          {Array.from({ length: Math.min(quantity, 3) }, (_, index) => (
            <div key={index} className="dk11201-preview">
              {renderDK11201Label(product, index)}
            </div>
          ))}
          {quantity > 3 && (
            <div className="flex items-center justify-center border border-gray-300 border-dashed p-2 text-gray-500 text-xs dk11201-preview">
              +{quantity - 3} etiquetas más
            </div>
          )}
        </div>
      </div>

      {/* Estilos CSS para etiquetas DK-11201 */}
      <style>{`
        .dk11201-label {
          width: 90mm;
          height: 29mm;
          display: flex;
          background: white;
          border: 1px solid #000;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }

        .dk11201-preview {
          transform: scale(0.8);
          transform-origin: top left;
          border: 1px solid #ccc;
          background: white;
          margin: 4px;
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
          font-size: 10pt;
          font-weight: bold;
          line-height: 1.1;
          margin-bottom: 1mm;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

        @media print {
          .dk11201-label {
            break-inside: avoid;
            page-break-inside: avoid;
            margin: 2mm;
          }
          
          .dk11201-preview {
            transform: scale(1);
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );

  if (!isModal) {
    return renderLabelContent();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Vista Previa - Etiquetas DK-11201</h3>
            <p className="text-sm text-gray-600">
              {quantity} etiqueta{quantity > 1 ? 's' : ''} • 29mm x 90mm • {product.name}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPreviewMode
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-1" />
              {isPreviewMode ? 'Vista Normal' : 'Vista Impresión'}
            </button>
            <button
              onClick={onPrint || handlePrintPreview}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Printer className="h-4 w-4 inline mr-1" />
              Imprimir
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                <X className="h-4 w-4 inline mr-1" />
                Cerrar
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {isPreviewMode ? (
            <div className="space-y-4">
              {/* Información de configuración */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Configuración - Brother DK-11201</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
                  <div><strong>Modelo:</strong> DK-11201</div>
                  <div><strong>Tamaño:</strong> 29mm x 90mm</div>
                  <div><strong>Etiquetas/rollo:</strong> 400</div>
                  <div><strong>Material:</strong> Papel blanco</div>
                </div>
              </div>

              {/* Vista previa de impresión para DK-11201 */}
              <div className="border border-gray-300 bg-white p-4" style={{ minHeight: '400px' }}>
                <div ref={printRef} className="print-labels">
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, 90mm)' }}>
                    {Array.from({ length: quantity }, (_, index) => 
                      renderDK11201Label(product, index)
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Información del producto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Información del Producto</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><strong>Nombre:</strong> {product.name}</div>
                  <div><strong>SKU:</strong> {product.sku}</div>
                  <div><strong>Precio:</strong> ${product.salePrice?.toFixed(2)}</div>
                  <div><strong>Talla:</strong> {product.size}</div>
                  <div><strong>Color:</strong> {product.color}</div>
                  <div><strong>Marca:</strong> {product.brand?.name || 'N/A'}</div>
                  <div><strong>Categoría:</strong> {product.category?.name || 'N/A'}</div>
                  <div><strong>Código Base:</strong> {product.baseCode}</div>
                </div>
              </div>

              {renderLabelContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelPreview;
