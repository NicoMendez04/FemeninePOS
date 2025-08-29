export interface Brand {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  brandId: number;
  categoryId: number;
  supplierId: number;
  size: string;
  color: string;
  baseCode: string;
  sku: string;
  barcode?: string;
  salePrice: number;
  costPrice: number;
  stockCached: number;
  stockMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
  category?: Category;
  supplier?: Supplier;
}

export interface ProductFormData {
  name: string;
  description?: string;
  brandId: number;
  categoryId: number;
  supplierId: number;
  size: string;
  color: string;
  baseCode: string;
  sku?: string; // Vista previa del SKU generado localmente
  barcode?: string;
  salePrice: number;
  costPrice: number;
  stockCached: number;
  stockMin: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  productId: number | null;
  productSku: string | null;
  details: string | null;
  timestamp: string;
  user: User | null;
}

export interface LogStats {
  totalLogs: number;
  todayLogs: number;
  uniqueUsers: number;
  mostActiveUser: string;
}

export interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
