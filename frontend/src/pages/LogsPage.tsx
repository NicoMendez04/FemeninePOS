import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Package, Eye, Calendar, Filter } from 'lucide-react';
import axios from 'axios';
import { ActivityLog, LogStats, LogsResponse } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const loadLogs = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(actionFilter && { action: actionFilter }),
        ...(userFilter && { userId: userFilter }),
        ...(dateFilter && { date: dateFilter })
      });
      
      const response = await api.get(`/logs?${params}`);
      
      if (reset || pageNum === 1) {
        setLogs(response.data.logs);
      } else {
        setLogs(prev => [...prev, ...response.data.logs]);
      }
      
      setHasMore(response.data.logs.length === 20);
      setPage(pageNum);
    } catch (err) {
      setError('Error al cargar los logs');
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadLogs(1, true);
    loadStats();
  }, [actionFilter, userFilter, dateFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <User className="w-4 h-4 text-green-600" />;
      case 'LOGOUT':
        return <User className="w-4 h-4 text-red-600" />;
      case 'CREATE_USER':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'UPDATE_USER':
        return <User className="w-4 h-4 text-yellow-600" />;
      case 'DELETE_USER':
        return <User className="w-4 h-4 text-red-600" />;
      case 'CREATE_PRODUCT':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'UPDATE_PRODUCT':
        return <Package className="w-4 h-4 text-yellow-600" />;
      case 'DELETE_PRODUCT':
        return <Package className="w-4 h-4 text-red-600" />;
      case 'VIEW_PRODUCT':
        return <Eye className="w-4 h-4 text-gray-600" />;
      case 'PRINT_BARCODE':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'CREATE_SALE':
        return <Activity className="w-4 h-4 text-green-600" />;
      case 'UPDATE_SALE':
        return <Activity className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionText = (action: string) => {
    const actionTexts: { [key: string]: string } = {
      'LOGIN': 'Inicio de sesión',
      'LOGOUT': 'Cierre de sesión',
      'CREATE_USER': 'Usuario creado',
      'UPDATE_USER': 'Usuario actualizado',
      'DELETE_USER': 'Usuario eliminado',
      'CREATE_PRODUCT': 'Producto creado',
      'UPDATE_PRODUCT': 'Producto actualizado',
      'DELETE_PRODUCT': 'Producto eliminado',
      'VIEW_PRODUCT': 'Producto consultado',
      'PRINT_BARCODE': 'Código de barras impreso',
      'CREATE_SALE': 'Venta registrada',
      'UPDATE_SALE': 'Venta actualizada'
    };
    return actionTexts[action] || action;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLogs(page + 1, false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Registro de Actividades
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoreo y auditoría de todas las actividades del sistema
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Más Activo</p>
                <p className="text-lg font-bold text-gray-900">{stats.mostActiveUser}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acción
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las acciones</option>
              <option value="LOGIN">Inicio de sesión</option>
              <option value="LOGOUT">Cierre de sesión</option>
              <option value="CREATE_PRODUCT">Crear producto</option>
              <option value="UPDATE_PRODUCT">Actualizar producto</option>
              <option value="DELETE_PRODUCT">Eliminar producto</option>
              <option value="VIEW_PRODUCT">Ver producto</option>
              <option value="PRINT_BARCODE">Imprimir código</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario ID
            </label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="ID del usuario"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registro de Actividades</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {getActionText(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{log.user?.name || 'Usuario desconocido'}</div>
                      <div className="text-gray-500">{log.user?.email || '-'}</div>
                      {log.user && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.user.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.productSku ? (
                      <div>
                        <div className="font-medium">SKU: {log.productSku}</div>
                        <div className="text-gray-500">ID: {log.productId}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-600 bg-blue-100">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando logs...
            </div>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron registros de actividad</p>
          </div>
        )}

        {!loading && hasMore && logs.length > 0 && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cargar más registros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
