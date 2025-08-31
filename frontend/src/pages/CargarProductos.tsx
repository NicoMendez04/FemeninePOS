import React, { useState, useEffect } from 'react';
import ProductForm from '../components/ProductForm';
import ImportModal from '../components/ImportModal';
import { getBrands, getSuppliers, getCategories } from '../services/api';
import { Upload, Plus } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
}
interface Supplier {
  id: number;
  name: string;
}
interface Category {
  id: number;
  name: string;
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
  origin?: 'manual' | 'imported';
}

const CargarProductos: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);

  const refreshData = async () => {
    setBrands(await getBrands());
    setSuppliers(await getSuppliers());
    setCategories(await getCategories());
  };

  useEffect(() => {
    refreshData();
  }, [refreshTrigger]);

  const handleImportComplete = (products: Product[]) => {
    // Solo actualizar productos importados, NO cerrar el modal
    setImportedProducts(products);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Cargar Productos
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega productos nuevos al sistema de forma individual o masiva
          </p>
        </div>
        
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Importar desde Excel/CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">Carga Individual</h2>
        </div>
        
        <ProductForm
          brands={brands}
          suppliers={suppliers}
          categories={categories}
          importedProducts={importedProducts}
          onSubmit={async (products) => {
            // Normalizar los datos antes de enviar
            const productsArray = Array.isArray(products) ? products : [products];
            const normalized = productsArray.map((prod: Product) => ({
              ...prod,
              brandId: prod.brandId ? parseInt(prod.brandId as any) : undefined,
              categoryId: prod.categoryId ? parseInt(prod.categoryId as any) : undefined,
              supplierId: prod.supplierId ? parseInt(prod.supplierId as any) : undefined,
              // Eliminar barcode si existe
              barcode: undefined
            }));
            try {
              const token = localStorage.getItem('token');
              await fetch('http://localhost:4000/api/products', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(normalized)
              });
              alert('Productos guardados correctamente');
              setRefreshTrigger(prev => prev + 1); // Refresh para actualizar datos
              setImportedProducts([]); // Limpiar productos importados después de guardar
            } catch (err) {
              alert('Error al guardar productos');
            }
          }}
          onCancel={() => {
            setImportedProducts([]); // Limpiar productos importados al cancelar
          }}
        />
      </div>

      {/* Modal de importación */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default CargarProductos;
