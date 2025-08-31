import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../services/api';

interface ProductRow {
  nombre: string;
  descripcion?: string;
  categoria: string;
  marca: string;
  proveedor?: string;
  talla?: string;
  color?: string;
  codigoBase?: string;
  precioVenta?: number;
  precioCosto?: number;
  stock?: number;
  stockMinimo?: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

interface Product {
  name: string;
  description?: string;
  size: string;
  color: string;
  baseCode: string;
  costPrice?: number;
  salePrice?: number;
  stockCached?: number;
  sku: string;
  brandId?: number;
  supplierId?: number;
  categoryId?: number;
  stockMin?: number;
}

interface ImportedFile {
  id: string;
  name: string;
  size: number;
  timestamp: string;
  products: Product[];
  productCount: number;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (products: Product[]) => void; // Callback que devuelve los productos parseados
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ProductRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      { wch: 30 }, // descripcion
      { wch: 15 }, // categoria
      { wch: 15 }, // marca
      { wch: 15 }, // proveedor
      { wch: 10 }, // talla
      { wch: 10 }, // color
      { wch: 12 }, // codigoBase
      { wch: 12 }, // precioVenta
      { wch: 12 }, // precioCosto
      { wch: 8 },  // stock
      { wch: 12 }  // stockMinimo
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const processFileAutomatically = async (selectedFile: File) => {
    try {
      setLoading(true);
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

      // Convertir los datos del Excel al formato esperado por ProductForm
      const convertedProducts: Product[] = jsonData.map((row, index) => ({
        name: row.nombre || '',
        description: row.descripcion || '',
        size: row.talla || '', 
        color: row.color || '',
        baseCode: row.codigoBase || '',
        costPrice: row.precioCosto || undefined,
        salePrice: row.precioVenta || undefined,
        stockCached: row.stock || 0,
        stockMin: row.stockMinimo || 2,
        sku: '', // Se generará automáticamente
        // Estos campos se rellenarán cuando se encuentren las marcas/categorías/proveedores
        brandId: undefined,
        categoryId: undefined,
        supplierId: undefined,
        // Información adicional para que ProductForm pueda buscar por nombre
        _brandName: row.marca || '',
        _categoryName: row.categoria || '',
        _supplierName: row.proveedor || '',
      } as any));

      // Crear entrada del archivo importado
      const newImportedFile: ImportedFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        size: selectedFile.size,
        timestamp: new Date().toLocaleTimeString(),
        products: convertedProducts,
        productCount: convertedProducts.length
      };

      // Agregar a la lista de archivos importados
      const updatedFiles = [...importedFiles, newImportedFile];
      setImportedFiles(updatedFiles);

      // Combinar todos los productos de todos los archivos
      const allProducts = updatedFiles.flatMap(f => f.products);
      
      // Devolver los productos al componente padre
      onImportComplete(allProducts);
      
      // Calcular totales acumulados
      const totalProducts = updatedFiles.reduce((sum, f) => sum + f.productCount, 0);
      
      setImportResult({
        success: true,
        message: `${convertedProducts.length} productos agregados (${totalProducts} total de ${updatedFiles.length} archivo(s))`,
        created: totalProducts,
        duplicates: 0,
        errors: 0
      });

      // Limpiar el archivo actual para permitir cargar otro
      setFile(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error procesando archivo:', error);
      setImportResult({
        success: false,
        message: 'Error al procesar el archivo',
        created: 0,
        duplicates: 0,
        errors: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        return;
      }

      // Procesar el archivo automáticamente
      await processFileAutomatically(selectedFile);
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

      // Convertir los datos del Excel al formato esperado por ProductForm
      const convertedProducts: Product[] = jsonData.map((row, index) => ({
        name: row.nombre || '',
        description: row.descripcion || '',
        size: row.talla || '', 
        color: row.color || '',
        baseCode: row.codigoBase || '',
        costPrice: row.precioCosto || undefined,
        salePrice: row.precioVenta || undefined,
        stockCached: row.stock || 0,
        stockMin: row.stockMinimo || 2,
        sku: '', // Se generará automáticamente
        // Estos campos se rellenarán cuando se encuentren las marcas/categorías/proveedores
        brandId: undefined,
        categoryId: undefined,
        supplierId: undefined,
        // Información adicional para que ProductForm pueda buscar por nombre
        _brandName: row.marca || '',
        _categoryName: row.categoria || '',
        _supplierName: row.proveedor || '',
      } as any));

      // Crear entrada del archivo importado
      const newImportedFile: ImportedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        timestamp: new Date().toLocaleTimeString(),
        products: convertedProducts,
        productCount: convertedProducts.length
      };

      // Agregar a la lista de archivos importados
      const updatedFiles = [...importedFiles, newImportedFile];
      setImportedFiles(updatedFiles);

      // Combinar todos los productos de todos los archivos
      const allProducts = updatedFiles.flatMap(f => f.products);
      
      // Devolver los productos al componente padre
      onImportComplete(allProducts);
      
      // Calcular totales acumulados
      const totalProducts = updatedFiles.reduce((sum, f) => sum + f.productCount, 0);
      
      setImportResult({
        success: true,
        message: `${convertedProducts.length} productos agregados (${totalProducts} total de ${updatedFiles.length} archivo(s))`,
        created: totalProducts,
        duplicates: 0,
        errors: 0
      });

      // Limpiar el archivo actual para permitir cargar otro
      setFile(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error procesando archivo:', error);
      setImportResult({
        success: false,
        message: 'Error al procesar el archivo',
        created: 0,
        duplicates: 0,
        errors: 1
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

  const removeImportedFile = (fileId: string) => {
    const updatedFiles = importedFiles.filter(f => f.id !== fileId);
    setImportedFiles(updatedFiles);
    
    // Actualizar productos combinados
    const allProducts = updatedFiles.flatMap(f => f.products);
    onImportComplete(allProducts);
    
    // Actualizar resultado
    const totalProducts = updatedFiles.reduce((sum, f) => sum + f.productCount, 0);
    if (updatedFiles.length > 0) {
      setImportResult({
        success: true,
        message: `${totalProducts} total de ${updatedFiles.length} archivo(s)`,
        created: totalProducts,
        duplicates: 0,
        errors: 0
      });
    } else {
      setImportResult(null);
    }
  };

  const clearAllFiles = () => {
    setImportedFiles([]);
    setImportResult(null);
    onImportComplete([]);
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    setPreviewData([]);
    setShowPreview(false);
    setImportedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Importar Productos Masivamente
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Descarga de plantilla */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  Plantilla de Importación
                </h3>
                <p className="text-blue-700 text-sm">
                  Descarga la plantilla con el formato correcto. El SKU se genera automáticamente.
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Selecciona un archivo Excel o CSV
              </p>
              <p className="text-sm text-gray-500">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
            </label>
          </div>

          {/* Archivo seleccionado */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={previewFile}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {loading ? 'Cargando...' : 'Vista Previa'}
                  </button>
                  <button
                    onClick={clearFile}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa */}
          {showPreview && previewData.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Vista Previa (Primeros 10 registros)
              </h3>
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
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={importProducts}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium"
                >
                  {loading ? 'Cargando...' : 'Cargar a Lista'}
                </button>
              </div>
            </div>
          )}

          {/* Archivos Importados */}
          {importedFiles.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Archivos Cargados ({importedFiles.length})
                </h3>
                <button
                  onClick={clearAllFiles}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Limpiar Todo
                </button>
              </div>
              
              <div className="space-y-3">
                {importedFiles.map((importedFile) => (
                  <div key={importedFile.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-800">{importedFile.name}</p>
                          <p className="text-sm text-gray-600">
                            {(importedFile.size / 1024 / 1024).toFixed(2)} MB • {importedFile.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                          {importedFile.productCount} productos
                        </span>
                        <button
                          onClick={() => removeImportedFile(importedFile.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remover archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-medium mb-1">Vista previa:</p>
                      <div className="text-sm text-gray-700 space-y-1">
                        {importedFile.products.slice(0, 2).map((product, index) => (
                          <div key={index} className="text-gray-600">
                            {product.name}
                          </div>
                        ))}
                        {importedFile.products.length > 2 && (
                          <div className="text-gray-500 text-xs">
                            y {importedFile.products.length - 2} productos más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    // Llamar a onImportComplete con todos los productos
                    const allProducts = importedFiles.flatMap(f => f.products);
                    onImportComplete(allProducts);
                    onClose();
                  }}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  Cargar {importedFiles.reduce((sum, f) => sum + f.productCount, 0)} Productos
                </button>
              </div>
            </div>
          )}

          {/* Resultado de importación */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${
              importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {importResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <h3 className={`text-lg font-semibold ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  Resultado de la Carga
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                  <div className="text-sm text-gray-600">Cargados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-gray-600">Omitidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
              </div>
              
              <p className={`text-sm ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>

              {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-700 mb-2">Detalles de errores:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {importResult.errorDetails.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
