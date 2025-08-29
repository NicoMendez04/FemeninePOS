import React from 'react';
import { Package, ShoppingBag, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SalesmanDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ¡Hola, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Panel de vendedor - Gestiona tu inventario y realiza ventas
        </p>
      </div>

      {/* Estadísticas rápidas para vendedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos en Stock</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900">$--</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hora de Trabajo</p>
              <p className="text-2xl font-bold text-gray-900">08:30</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Acciones rápidas para vendedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <h3 className="text-xl font-bold mb-2">🛒 Nueva Venta</h3>
          <p className="text-green-100 mb-4">
            Comienza una nueva venta escaneando productos o buscando por código
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/sales'}
            className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Ir a Ventas
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <h3 className="text-xl font-bold mb-2">📦 Consultar Inventario</h3>
          <p className="text-blue-100 mb-4">
            Revisa el stock disponible y precios de los productos
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/inventario'}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Ver Inventario
          </button>
        </div>
      </div>

      {/* Información importante para vendedor */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          📋 Recordatorios del Día
        </h3>
        <ul className="text-yellow-700 space-y-1">
          <li>• Verifica el inventario antes de confirmar ventas</li>
          <li>• Usa el lector de códigos de barras para mayor rapidez</li>
          <li>• Registra correctamente los datos del cliente</li>
          <li>• Consulta con tu supervisor si tienes dudas sobre precios</li>
        </ul>
      </div>
    </div>
  );
};

export default SalesmanDashboard;
