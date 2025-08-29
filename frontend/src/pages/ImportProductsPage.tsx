import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

interface ImportResult {
  success: boolean;
  message: string;
  errors: string[];
  successCount: number;
  errorCount: number;
  duplicateCount: number;
}

interface ProductRow {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  proveedor?: string;
  talla?: string;
  color?: string;
  codigoBase?: string;
  sku?: string;
  precioVenta?: number;
  precioCosto?: number;
  stock?: number;
  stockMinimo?: number;
}

const ImportProductsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ProductRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plantilla de ejemplo para descarga
  const downloadTemplate = () => {
    const templateData = [
      {
        'nombre': 'Blusa Floral Manga Larga',
        'descripcion': 'Blusa elegante con estampado floral',
        'categoria': 'Blusas',
        'marca': 'ZARA',
        'proveedor': 'Proveedor A',
        'talla': 'M',
        'color': 'Rosa',
        'codigoBase': 'BLU001',
        'precioVenta': 45.99,
        'precioCosto': 25.00,
        'stock': 15,
        'stockMinimo': 3
      },
      {
        'nombre': 'Pantalón Jeans Skinny',
        'descripcion': 'Pantalón jeans de corte skinny',
        'categoria': 'Pantalones',
        'marca': 'H&M',
        'proveedor': 'Proveedor B',
        'talla': 'L',
        'color': 'Azul',
        'codigoBase': 'PAN001',
        'precioVenta': 89.99,
        'precioCosto': 45.00,
        'stock': 8,
        'stockMinimo': 2
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 25 }, // nombre
      { wch: 35 }, // descripcion
      { wch: 15 }, // categoria
      { wch: 15 }, // marca
      { wch: 15 }, // proveedor
      { wch: 10 }, // talla
      { wch: 10 }, // color
      { wch: 15 }, // codigoBase
      { wch: 20 }, // sku
      { wch: 12 }, // precioVenta
      { wch: 12 }, // precioCosto
      { wch: 8 },  // stock
      { wch: 12 }  // stockMinimo
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setPreviewData([]);
      setShowPreview(false);
      
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        alert('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const previewFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

      setPreviewData(jsonData.slice(0, 10)); // Mostrar solo los primeros 10 para vista previa
      setShowPreview(true);
    } catch (error) {
      console.error('Error al leer archivo:', error);
      alert('Error al leer el archivo. Verifica el formato.');
    } finally {
      setLoading(false);
    }
  };

  const importProducts = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

      // Transformar datos al formato esperado por el backend
      const products = jsonData.map(row => ({
        name: row.nombre,
        description: row.descripcion || '',
        category: row.categoria || '',
        brand: row.marca || '',
        supplier: row.proveedor || '',
        size: row.talla || '',
        color: row.color || '',
        baseCode: row.codigoBase || '',
        sku: row.sku || '',
        salePrice: Number(row.precioVenta) || 0,
        costPrice: Number(row.precioCosto) || 0,
        stockCached: Number(row.stock) || 0,
        stockMin: Number(row.stockMinimo) || 2
      }));

      // Enviar al backend
      const response = await api.post('/products/import', { products });
      setImportResult(response.data);
      
      // Limpiar archivo después de importación exitosa
      if (response.data.success) {
        setFile(null);
        setPreviewData([]);
        setShowPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Error al importar productos:', error);
      setImportResult({
        success: false,
        message: 'Error al importar productos',
        errors: [error.response?.data?.error || 'Error desconocido'],
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Importar Productos
        </h1>
        <p className="text-gray-600">
          Carga productos masivamente desde archivos Excel (.xlsx) o CSV
        </p>
      </div>

      {/* Descarga de plantilla */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Plantilla de Importación
            </h2>
            <p className="text-blue-700 text-sm">
              Descarga la plantilla con el formato correcto para importar productos
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar Plantilla
          </button>
        </div>
      </div>

      {/* Selector de archivo */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Seleccionar Archivo
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          
          {!file ? (
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Haz clic para seleccionar un archivo
              </p>
              <p className="text-sm text-gray-500">
                Archivos soportados: .xlsx, .xls, .csv
              </p>
            </label>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-700">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {file && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={previewFile}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Cargando...' : 'Vista Previa'}
            </button>
            <button
              onClick={importProducts}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Importando...' : 'Importar Productos'}
            </button>
          </div>
        )}
      </div>

      {/* Vista previa */}
      {showPreview && previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Vista Previa (Primeros 10 registros)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.nombre}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.categoria}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.marca}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.talla}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.color}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">${row.precioVenta}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <div className={`rounded-lg p-6 ${
          importResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-4">
            {importResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
            )}
            <h3 className={`text-lg font-semibold ${
              importResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {importResult.message}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Productos exitosos</p>
              <p className="text-xl font-bold text-green-600">{importResult.successCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Productos con error</p>
              <p className="text-xl font-bold text-red-600">{importResult.errorCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Duplicados omitidos</p>
              <p className="text-xl font-bold text-yellow-600">{importResult.duplicateCount}</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Información sobre la importación
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• El campo "nombre" es obligatorio para todos los productos</li>
          <li>• Si no se proporciona SKU, se generará automáticamente</li>
          <li>• Los productos duplicados (mismo SKU) serán omitidos</li>
          <li>• Las categorías, marcas y proveedores se crearán automáticamente si no existen</li>
          <li>• Los precios deben ser números positivos</li>
          <li>• El stock mínimo por defecto es 2 si no se especifica</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportProductsPage;
