import React, { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer, Download, Copy, RefreshCw } from 'lucide-react';
import BarcodePrintButton from '../components/BarcodePrintForm';

const BarcodeGeneratorPage: React.FC = () => {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('CODE128');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [margin, setMargin] = useState(10);
  const [printingBrother, setPrintingBrother] = useState(false);
  const [brotherNotification, setBrotherNotification] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (barcodeRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Código de Barras - ${text}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .barcode-container {
                  text-align: center;
                  margin: 20px;
                  padding: 20px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                }
                @media print {
                  body { margin: 0; }
                  .barcode-container { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                ${barcodeRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (barcodeRef.current) {
      const svg = barcodeRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
        canvas.height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
        
        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = `barcode-${text || 'generated'}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
  };

  const generateRandomCode = () => {
    const randomCode = Math.random().toString().substr(2, 12);
    setText(randomCode);
  };

  const handleBrotherPrint = async () => {
    if (!text) return;
    setPrintingBrother(true);
    setBrotherNotification(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/print/barcode-custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, barcode: text })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setBrotherNotification('Etiqueta impresa correctamente en Brother QL-800');
      } else {
        setBrotherNotification(result.message || 'Error al imprimir en Brother');
      }
    } catch (error) {
      setBrotherNotification('Error de red o servidor');
    } finally {
      setPrintingBrother(false);
    }
  };

  const barcodeFormats = [
    'CODE128',
    'CODE39',
    'EAN13',
    'EAN8',
    'UPC',
    'ITF14',
    'MSI',
    'pharmacode'
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Generador de Códigos de Barras
        </h1>
        <p className="text-gray-600">
          Genera códigos de barras personalizados para tus productos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Configuración */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Configuración
          </h2>
          
          <div className="space-y-4">
            {/* Texto del código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto del código de barras
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ingresa el texto para el código de barras"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateRandomCode}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title="Generar código aleatorio"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyText}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title="Copiar texto"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {barcodeFormats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            {/* Ancho de línea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ancho de línea: {width}px
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Altura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altura: {height}px
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Tamaño de fuente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de fuente: {fontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="30"
                step="2"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Margen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margen: {margin}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Mostrar texto */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="displayValue"
                checked={displayValue}
                onChange={(e) => setDisplayValue(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="displayValue" className="text-sm font-medium text-gray-700">
                Mostrar texto debajo del código
              </label>
            </div>
          </div>
        </div>

        {/* Vista previa del código de barras */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Vista Previa
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!text}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={handlePrint}
                disabled={!text}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
            {text ? (
              <div ref={barcodeRef} className="text-center">
                <Barcode
                  value={text}
                  format={format as any}
                  width={width}
                  height={height}
                  displayValue={displayValue}
                  fontSize={fontSize}
                  margin={margin}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Ingresa un texto para generar el código de barras</p>
              </div>
            )}
          </div>

          {text && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Formato:</span> {format} | 
                <span className="font-medium"> Texto:</span> {text} | 
                <span className="font-medium"> Dimensiones:</span> {width}x{height}px
              </p>
            </div>
          )}
          {/* Botón para imprimir el código generado */}
      {text && (
        <BarcodePrintButton text={text} barcode={text} />
      )}
        </div>
        
      </div>


    

      
    </div>
  );
};

export default BarcodeGeneratorPage;
