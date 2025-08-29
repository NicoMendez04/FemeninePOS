import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Bookmark, Search, Filter, MoreVertical, Check, X, Package, Building2 } from 'lucide-react';
import { getBrands, getCategories, getSuppliers, createBrand, createCategory, createSupplier, updateBrand, updateCategory, updateSupplier, deleteBrand, deleteCategory, deleteSupplier } from '../services/api';
import { Brand, Category, Supplier } from '../types';

type CatalogType = 'brands' | 'categories' | 'suppliers';

const CatalogManager: React.FC = () => {
  // State for data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for view control
  const [activeTab, setActiveTab] = useState<CatalogType>('brands');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemContact, setNewItemContact] = useState('');
  const [newItemPhone, setNewItemPhone] = useState('');
  const [newItemEmail, setNewItemEmail] = useState('');
  
  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingContact, setEditingContact] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  
  // State for deletion
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [brandsData, categoriesData, suppliersData] = await Promise.all([
        getBrands(),
        getCategories(),
        getSuppliers()
      ]);
      setBrands(brandsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error al cargar los datos');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) return;
    
    try {
      setLoading(true);
      if (activeTab === 'brands') {
        await createBrand({ name: newItemName.trim() });
        setBrands(await getBrands());
      } else if (activeTab === 'categories') {
        await createCategory({ name: newItemName.trim() });
        setCategories(await getCategories());
      } else if (activeTab === 'suppliers') {
        await createSupplier({ 
          name: newItemName.trim(),
          contact: newItemContact.trim(),
          phone: newItemPhone.trim(),
          email: newItemEmail.trim()
        });
        setSuppliers(await getSuppliers());
      }
      
      setNewItemName('');
      setNewItemContact('');
      setNewItemPhone('');
      setNewItemEmail('');
      setShowCreateForm(false);
      setMessage(`${activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'} creado exitosamente`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating item:', error);
      setMessage('Error al crear el elemento');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editingName.trim()) return;
    
    try {
      setLoading(true);
      if (activeTab === 'brands') {
        await updateBrand(id, { name: editingName.trim() });
        setBrands(await getBrands());
      } else if (activeTab === 'categories') {
        await updateCategory(id, { name: editingName.trim() });
        setCategories(await getCategories());
      } else if (activeTab === 'suppliers') {
        await updateSupplier(id, { 
          name: editingName.trim(),
          contact: editingContact.trim(),
          phone: editingPhone.trim(),
          email: editingEmail.trim()
        });
        setSuppliers(await getSuppliers());
      }
      
      setEditingId(null);
      setEditingName('');
      setEditingContact('');
      setEditingPhone('');
      setEditingEmail('');
      setMessage(`${activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'} actualizado exitosamente`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating item:', error);
      setMessage('Error al actualizar el elemento');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      if (activeTab === 'brands') {
        await deleteBrand(id);
        setBrands(await getBrands());
      } else if (activeTab === 'categories') {
        await deleteCategory(id);
        setCategories(await getCategories());
      } else if (activeTab === 'suppliers') {
        await deleteSupplier(id);
        setSuppliers(await getSuppliers());
      }
      
      setDeletingId(null);
      setMessage(`${activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'} eliminado exitosamente`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting item:', error);
      setMessage('Error al eliminar el elemento');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    const data = activeTab === 'brands' ? brands : activeTab === 'categories' ? categories : suppliers;
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStats = () => {
    return {
      brands: brands.length,
      categories: categories.length,
      suppliers: suppliers.length
    };
  };

  const stats = getStats();
  const currentData = getCurrentData();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Catálogo</h1>
              <p className="text-gray-600">Administra marcas y categorías de productos</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Crear {activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Total Marcas</p>
                <p className="text-2xl font-bold text-blue-900">{stats.brands}</p>
              </div>
              <Tag className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">Total Categorías</p>
                <p className="text-2xl font-bold text-purple-900">{stats.categories}</p>
              </div>
              <Bookmark className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium">Total Proveedores</p>
                <p className="text-2xl font-bold text-orange-900">{stats.suppliers}</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('brands');
                setSearchTerm('');
                setEditingId(null);
                setDeletingId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'brands'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              Marcas ({brands.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setSearchTerm('');
                setEditingId(null);
                setDeletingId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Categorías ({categories.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('suppliers');
                setSearchTerm('');
                setEditingId(null);
                setDeletingId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Proveedores ({suppliers.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'brands' ? 'marcas' : activeTab === 'categories' ? 'categorías' : 'proveedores'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Crear {activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemName.trim()) {
                      if (activeTab !== 'suppliers') handleCreate();
                    }
                    if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewItemName('');
                      setNewItemContact('');
                      setNewItemPhone('');
                      setNewItemEmail('');
                    }
                  }}
                  placeholder={`Nombre ${activeTab === 'brands' ? 'de la marca' : activeTab === 'categories' ? 'de la categoría' : 'del proveedor'}`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              {activeTab === 'suppliers' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contacto
                    </label>
                    <input
                      type="text"
                      value={newItemContact}
                      onChange={(e) => setNewItemContact(e.target.value)}
                      placeholder="Nombre del contacto"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={newItemPhone}
                      onChange={(e) => setNewItemPhone(e.target.value)}
                      placeholder="Número de teléfono"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newItemEmail}
                      onChange={(e) => setNewItemEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={!newItemName.trim() || loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewItemName('');
                    setNewItemContact('');
                    setNewItemPhone('');
                    setNewItemEmail('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'brands' ? 'Marcas' : activeTab === 'categories' ? 'Categorías' : 'Proveedores'} Registrados
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {currentData.length} {currentData.length === 1 ? 'elemento' : 'elementos'} 
            {searchTerm && ` encontrados para "${searchTerm}"`}
          </p>
        </div>

        {currentData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'brands' ? <Tag className="w-8 h-8 text-gray-400" /> : activeTab === 'categories' ? <Bookmark className="w-8 h-8 text-gray-400" /> : <Building2 className="w-8 h-8 text-gray-400" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron resultados' : `No hay ${activeTab === 'brands' ? 'marcas' : activeTab === 'categories' ? 'categorías' : 'proveedores'} registrados`}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No hay ${activeTab === 'brands' ? 'marcas' : activeTab === 'categories' ? 'categorías' : 'proveedores'} que coincidan con "${searchTerm}"`
                : `Comienza creando tu primer${activeTab === 'brands' ? 'a marca' : activeTab === 'categories' ? 'a categoría' : ' proveedor'} para organizar mejor tu inventario`
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                Crear {activeTab === 'brands' ? 'Marca' : activeTab === 'categories' ? 'Categoría' : 'Proveedor'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Nombre</th>
                  {activeTab === 'suppliers' && (
                    <>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Contacto</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Teléfono</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
                    </>
                  )}
                  <th className="text-right py-3 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingName.trim()) {
                              if (activeTab !== 'suppliers') handleEdit(item.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditingName('');
                              setEditingContact('');
                              setEditingPhone('');
                              setEditingEmail('');
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activeTab === 'brands' ? 'bg-blue-500' : 
                            activeTab === 'categories' ? 'bg-purple-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      )}
                    </td>
                    
                    {activeTab === 'suppliers' && (
                      <>
                        <td className="py-4 px-6">
                          {editingId === item.id ? (
                            <input
                              type="text"
                              value={editingContact}
                              onChange={(e) => setEditingContact(e.target.value)}
                              placeholder="Contacto"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-700">{(item as any).contact || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {editingId === item.id ? (
                            <input
                              type="tel"
                              value={editingPhone}
                              onChange={(e) => setEditingPhone(e.target.value)}
                              placeholder="Teléfono"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-700">{(item as any).phone || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {editingId === item.id ? (
                            <input
                              type="email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              placeholder="Email"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-700">{(item as any).email || '-'}</span>
                          )}
                        </td>
                      </>
                    )}
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleEdit(item.id)}
                              disabled={!editingName.trim() || loading}
                              className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingName('');
                                setEditingContact('');
                                setEditingPhone('');
                                setEditingEmail('');
                              }}
                              className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          </>
                        ) : deletingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                              className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditingName(item.name);
                                if (activeTab === 'suppliers') {
                                  setEditingContact((item as any).contact || '');
                                  setEditingPhone((item as any).phone || '');
                                  setEditingEmail((item as any).email || '');
                                }
                              }}
                              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
