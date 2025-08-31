import React from 'react';
import Barcode from 'react-barcode';
import { Product } from '../types';

interface LabelTemplateProps {
  product: Product;
  quantity?: number;
}

const LabelTemplate: React.FC<LabelTemplateProps> = ({ product, quantity = 1 }) => {
  return (
    <div className="print-labels">
      {/* Estilos específicos para etiquetas DK-11201 (29mm x 90mm) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-labels, .print-labels * {
            visibility: visible;
          }
          .print-labels {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .dk11201-label {
            width: 90mm;
            height: 29mm;
            border: 1px solid #000;
            margin: 2mm;
            padding: 2mm;
            break-inside: avoid;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            font-family: Arial, sans-serif;
            font-size: 8pt;
            line-height: 1.2;
            background: white;
            box-sizing: border-box;
          }
          .label-line1 {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          .label-line2 {
            font-size: 7pt;
            margin-bottom: 1mm;
          }
          .label-line3 {
            font-size: 8pt;
            display: flex;
            justify-content: space-between;
            margin-bottom: 2mm;
          }
          .label-barcode {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .barcode-sku {
            font-size: 6pt;
            margin-top: 1mm;
          }
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
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        
        /* Estilos para vista previa en pantalla */
        .dk11201-label {
          width: 90mm;
          height: 29mm;
          border: 1px solid #ccc;
          margin: 4px;
          padding: 0;
          display: flex;
          font-family: Arial, sans-serif;
          font-size: 8pt;
          line-height: 1.1;
          background: white;
          box-sizing: border-box;
          transform: scale(0.8);
          transform-origin: top left;
        }
      `}</style>

      {/* Generar etiquetas según quantity */}
      {Array.from({ length: quantity }, (_, index) => (
        <div key={index} className="dk11201-label">
          {/* Línea 1: Nombre del producto */}
          <div className="label-line1">
            {product.name}
          </div>
          
          {/* Línea 2: Talla y Color */}
          <div className="label-line2">
            T: {product.size || 'N/A'}    C: {product.color || 'N/A'}
          </div>
          
          {/* Línea 3: Marca y Precio */}
          <div className="label-line3">
            <span>{product.brand?.name || 'N/A'}</span>
            <span style={{ fontWeight: 'bold' }}>$ {product.salePrice?.toLocaleString('es-CL') || '0'}</span>
          </div>
          
          {/* Código de barras horizontal */}
          <div className="label-barcode">
            <Barcode
              value={product.sku || 'NO-SKU'}
              width={1}
              height={40}
              fontSize={10}
              margin={0}
              displayValue={false}
            />
            <div className="barcode-sku">{product.sku || 'NO-SKU'}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LabelTemplate;
