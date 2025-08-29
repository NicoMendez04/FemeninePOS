import { useAuth } from '../contexts/AuthContext';

// Definición de roles y sus permisos
export const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER'
} as const;

export const PERMISSIONS = {
  // Productos
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  
  // Ventas
  VIEW_SALES: 'view_sales',
  CREATE_SALES: 'create_sales',
  VIEW_ALL_SALES: 'view_all_sales',
  
  // Inventario
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
  
  // Usuarios
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Reportes
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data'
} as const;

// Mapeo de roles a permisos
const rolePermissions = {
  [ROLES.ADMIN]: [
    // Admin tiene todos los permisos
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.EMPLOYEE]: [
    // Vendedor solo puede ver inventario y vender
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_SALES // Solo sus propias ventas
  ],
  
  [ROLES.MANAGER]: [
    // Gerente puede todo excepto gestionar usuarios
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ]
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Normalizar el rol del usuario a mayúsculas para comparación consistente
    const normalizedRole = user.role?.toUpperCase();
    const userPermissions = rolePermissions[normalizedRole as keyof typeof rolePermissions] || [];
    return userPermissions.includes(permission as any);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccess = (requiredRoles: string[]): boolean => {
    if (!user) return false;
    // Normalizar tanto el rol del usuario como los roles requeridos
    const normalizedUserRole = user.role?.toUpperCase();
    const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());
    return normalizedRequiredRoles.includes(normalizedUserRole || '');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    userRole: user?.role || null
  };
};

export default usePermissions;
