import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  BarChart3, 
  Settings,
  ShoppingBag,
  Users,
  Package2,
  LucidePackage2,
  Loader,
  Loader2,
  MarsStrokeIcon,
  SquarePlus,
  Receipt,
  Activity,
  QrCode,
  Download
} from 'lucide-react';
import { usePermissions, PERMISSIONS, ROLES } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { hasPermission, canAccess } = usePermissions();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      end: true,
      show: true // Dashboard siempre visible para usuarios autenticados
    },
    {
      to: '/dashboard/catalog',
      icon: Tags,
      label: 'Catálogo',
      show: hasPermission(PERMISSIONS.CREATE_PRODUCTS) // Solo admin y gerente
    },
    {
      to: '/dashboard/cargar-productos',
      icon: SquarePlus,
      label: 'Carga de Productos',
      show: hasPermission(PERMISSIONS.CREATE_PRODUCTS) // Solo admin y gerente
    },
    {
      to: '/dashboard/inventario',
      icon: Package,
      label: 'Inventario',
      show: hasPermission(PERMISSIONS.VIEW_INVENTORY) // Todos los roles
    },
    {
      to: '/dashboard/sales',
      icon: ShoppingBag,
      label: 'Ventas',
      show: hasPermission(PERMISSIONS.CREATE_SALES) // Todos los roles pueden vender
    },
    {
      to: '/dashboard/sales-history',
      icon: Receipt,
      label: 'Historial de Ventas',
      show: hasPermission(PERMISSIONS.VIEW_SALES) // Todos pueden ver ventas
    },
    {
      to: '/dashboard/users',
      icon: Users,
      label: 'Gestión de Usuarios',
      show: hasPermission(PERMISSIONS.MANAGE_USERS) // Solo admin
    },
    {
      to: '/dashboard/logs',
      icon: Activity,
      label: 'Registro de Actividades',
      show: canAccess([ROLES.ADMIN]) // Solo admin
    },
    {
      to: '/dashboard/barcode-generator',
      icon: QrCode,
      label: 'Generador de Códigos',
      show: canAccess([ROLES.ADMIN]) // Solo admin
    },
    {
      to: '/dashboard/exports',
      icon: Download,
      label: 'Exportar Datos',
      show: canAccess([ROLES.ADMIN]) // Solo admin
    },
    {
      to: '/dashboard/reports',
      icon: BarChart3,
      label: 'Reportes',
      show: hasPermission(PERMISSIONS.VIEW_REPORTS) // Solo admin y gerente
    },
    {
      to: '/dashboard/settings',
      icon: Settings,
      label: 'Configuración',
      show: canAccess([ROLES.ADMIN]) // Solo admin
    }
  ];

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                FEMENINE
              </h2>
              <p className="text-xs text-gray-500">Gestión de tienda</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems
              .filter(item => item.show) // Filtrar elementos según permisos
              .map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-pink-600'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
          
          {/* Indicador de rol del usuario */}
          {user && (
            <div className="mt-8 p-3 bg-gray-100 rounded-lg">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Rol actual</div>
              <div className="text-sm font-semibold text-gray-700 capitalize">{user.role}</div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
