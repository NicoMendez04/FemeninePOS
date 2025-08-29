import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Tag, 
  Truck, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings,
  Store,
  Shirt
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    {
      to: '/',
      icon: Home,
      label: 'Dashboard',
      description: 'Vista general del negocio'
    },
    {
      to: '/products',
      icon: Shirt,
      label: 'Productos',
      description: 'Gestión de inventario'
    },
    {
      to: '/catalog',
      icon: Tag,
      label: 'Catálogos',
      description: 'Marcas, categorías y proveedores'
    },
    {
      to: '/sales',
      icon: ShoppingCart,
      label: 'Ventas',
      description: 'Registro y seguimiento de ventas'
    },
    {
      to: '/customers',
      icon: Users,
      label: 'Clientes',
      description: 'Base de datos de clientes'
    },
    {
      to: '/reports',
      icon: BarChart3,
      label: 'Reportes',
      description: 'Análisis y estadísticas'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-pink-500 to-purple-600">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-white mr-2" />
              <h1 className="text-white text-xl font-bold">FEMENINE</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              const isActive = isActiveRoute(link.to);
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-pink-50 text-pink-700 border-r-4 border-pink-500' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">{link.label}</div>
                    <div className="text-xs text-gray-500">{link.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User info and settings */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Administrador</p>
                <p className="text-xs text-gray-500">Tienda FEMENINE</p>
              </div>
            </div>
            
            <Link
              to="/settings"
              className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-3" />
              Configuración
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
