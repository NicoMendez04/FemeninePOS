import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Eye, ShoppingBag, TrendingUp, Users, Receipt as ReceiptIcon, X, Printer } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, PERMISSIONS } from '../hooks/usePermissions';
import Receipt from '../components/Receipt';

interface SaleItem {
  id: number;
  quantity: number;
  price: number;
  discount: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
}

interface Sale {
  id: number;
  userId?: number;
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  taxIncluded?: boolean;
  total: number;
  itemsCount: number;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  saleItems: SaleItem[];
}

interface SalesStats {
  totalSales: number;
  todaySales: number;
  monthSales: number;
  salesByUser: {
    userId: number;
    userName: string;
    userEmail: string;
    salesCount: number;
  }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const isAdmin = hasPermission(PERMISSIONS.VIEW_ALL_SALES);
  const canViewStats = hasPermission(PERMISSIONS.VIEW_REPORTS);

  useEffect(() => {
    fetchSales();
    if (canViewStats) {
      fetchStats();
    }
    if (isAdmin) {
      fetchUsers();
    }
  }, [selectedUser, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedUser) params.append('userId', selectedUser);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/sales?${params.toString()}`);
      setSales(response.data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      alert('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/sales/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.filter((u: User) => u.role === 'EMPLOYEE' || u.role === 'MANAGER'));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = searchTerm === '' || 
      sale.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toString().includes(searchTerm) ||
      sale.saleItems.some(item => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFolio = (id: number | string): string => {
    // Si ya viene formateado (B000015), lo devuelve tal como está
    if (typeof id === 'string' && id.startsWith('B')) {
      return id;
    }
    // Si es solo el número, lo formatea
    return `B${id.toString().padStart(6, '0')}`;
  };

  const clearFilters = () => {
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const showReceipt = (sale: Sale) => {
    setSelectedSaleForReceipt(sale);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? 'Gestiona y revisa todas las ventas del sistema' : 'Revisa tu historial de ventas'}
          </p>
        </div>
      </div>

      {/* Estadísticas (Solo para Admin/Manager) */}
      {canViewStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSales}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ventas Hoy</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todaySales}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ventas Este Mes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.monthSales}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vendedores Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.salesByUser.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por vendedor (Solo Admin) */}
          {isAdmin && (
            <div>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los vendedores</option>
                {users.map(u => (
                  <option key={u.id} value={u.id.toString()}>
                    {u.name} ({u.role === 'EMPLOYEE' ? 'Vendedor' : 'Gerente'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha inicio */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Limpiar filtros */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venta #
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <React.Fragment key={sale.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatFolio(sale.id)}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.user?.name || 'Sin asignar'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {sale.user?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(sale.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.itemsCount} productos</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sale.total)}
                      </div>
                      {sale.taxAmount !== undefined && sale.taxAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          IVA: {formatCurrency(sale.taxAmount)} ({((sale.taxRate || 0) * 100).toFixed(0)}%)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => showReceipt(sale)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Ver boleta"
                        >
                          <ReceiptIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Detalles expandidos */}
                  {expandedSale === sale.id && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Detalles de la venta</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {sale.saleItems.map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded border">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{item.product.name}</div>
                                  <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900">
                                    {item.quantity} x {formatCurrency(item.price)}
                                  </div>
                                  {item.discount > 0 && (
                                    <div className="text-sm text-red-600">
                                      Descuento: -{formatCurrency(item.discount)}
                                    </div>
                                  )}
                                  <div className="text-sm font-medium text-gray-900">
                                    Subtotal: {formatCurrency((item.quantity * item.price) - (item.discount || 0))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Resumen de totales con IVA */}
                          <div className="border-t pt-3 mt-3">
                            <div className="bg-white p-3 rounded border">
                              <h5 className="font-medium text-gray-900 mb-2">Resumen de la venta</h5>
                              <div className="space-y-1 text-sm">
                                {sale.subtotal !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Subtotal {sale.taxIncluded ? '(sin IVA)' : ''}:
                                    </span>
                                    <span>{formatCurrency(sale.subtotal)}</span>
                                  </div>
                                )}
                                {sale.taxAmount !== undefined && sale.taxAmount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      IVA ({((sale.taxRate || 0) * 100).toFixed(0)}%):
                                    </span>
                                    <span className="text-blue-600">{formatCurrency(sale.taxAmount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-medium text-gray-900 border-t pt-1">
                                  <span>Total:</span>
                                  <span>{formatCurrency(sale.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedUser || startDate || endDate
                ? 'No se encontraron ventas con los filtros aplicados.'
                : 'Aún no se han registrado ventas.'}
            </p>
          </div>
        )}
      </div>

      {/* Ventas por vendedor (Solo Admin) */}
      {canViewStats && stats && stats.salesByUser.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas por Vendedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.salesByUser.map((userStat) => (
              <div key={userStat.userId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{userStat.userName}</h4>
                    <p className="text-sm text-gray-500">{userStat.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{userStat.salesCount}</div>
                    <div className="text-sm text-gray-500">ventas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Componente de boleta */}
      <Receipt 
        receiptData={selectedSaleForReceipt ? {
          folio: selectedSaleForReceipt.id,
          items: selectedSaleForReceipt.saleItems.map(saleItem => ({
            id: saleItem.id,
            quantity: saleItem.quantity,
            price: saleItem.price,
            discount: saleItem.discount,
            product: {
              id: saleItem.product.id,
              name: saleItem.product.name,
              sku: saleItem.product.sku,
              color: (saleItem.product as any).color,
              size: (saleItem.product as any).size
            }
          })),
          subtotal: selectedSaleForReceipt.subtotal,
          taxAmount: selectedSaleForReceipt.taxAmount,
          taxRate: selectedSaleForReceipt.taxRate,
          taxIncluded: selectedSaleForReceipt.taxIncluded,
          total: selectedSaleForReceipt.total,
          date: selectedSaleForReceipt.createdAt,
          user: selectedSaleForReceipt.user
        } : null}
        isVisible={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedSaleForReceipt(null);
        }}
      />
    </div>
  );
};

export default SalesHistoryPage;
