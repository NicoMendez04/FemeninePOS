import React from 'react';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../hooks/usePermissions';
import SalesmanDashboard from './SalesmanDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Si es empleado, mostrar dashboard específico
  if (user?.role === ROLES.EMPLOYEE) {
    return <SalesmanDashboard />;
  }

  // Dashboard para admin y gerente
  const stats = [
    {
      title: 'Total Productos',
      value: '0',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Ventas del Mes',
      value: '$0',
      icon: ShoppingBag,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Clientes',
      value: '0',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Crecimiento',
      value: '0%',
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen de tu tienda FEMENINE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Recientes</h3>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay productos registrados aún</p>
            <p className="text-sm mt-1">¡Comienza agregando tu primer producto!</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay actividad reciente</p>
            <p className="text-sm mt-1">La actividad aparecerá aquí cuando empieces a usar el sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
