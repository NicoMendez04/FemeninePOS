// Servicio base para llamadas a la API
import axios from 'axios';
import { ProductFormData, Product, Brand, Category, Supplier } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

// Productos
export const getProducts = async (includeInactive: boolean = false): Promise<Product[]> => {
  const response = await api.get('/products', {
    params: { includeInactive: includeInactive ? 'true' : 'false' }
  });
  return response.data;
};

export const getProductBySKU = async (sku: string): Promise<Product> => {
  const response = await api.get(`/products/sku/${sku}`);
  return response.data;
};

export const createProducts = async (productsData: ProductFormData[]): Promise<{ message: string; products: Product[] }> => {
  const response = await api.post('/products', productsData);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<{ message: string; type: string }> => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const reactivateProduct = async (id: number): Promise<{ message: string }> => {
  const response = await api.patch(`/products/${id}/reactivate`);
  return response.data;
};

export const checkProductDeletability = async (id: number): Promise<{ canBeDeleted: boolean; hasHistory: boolean; details: { movements: number; sales: number; purchases: number } }> => {
  const response = await api.get(`/products/${id}/deletability`);
  return response.data;
};

// Catálogo
export const getBrands = async (): Promise<Brand[]> => {
  const response = await api.get('/catalog/brands');
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/catalog/categories');
  return response.data;
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get('/catalog/suppliers');
  return response.data;
};

export const createBrand = async (brandData: { name: string }): Promise<Brand> => {
  const response = await api.post('/catalog/brands', brandData);
  return response.data;
};

export const createCategory = async (categoryData: { name: string }): Promise<Category> => {
  const response = await api.post('/catalog/categories', categoryData);
  return response.data;
};

export const createSupplier = async (supplierData: { name: string; contact: string; phone: string; email: string }): Promise<Supplier> => {
  const response = await api.post('/catalog/suppliers', supplierData);
  return response.data;
};

export const updateBrand = async (id: number, brandData: { name: string }): Promise<Brand> => {
  const response = await api.put(`/catalog/brands/${id}`, brandData);
  return response.data;
};

export const deleteBrand = async (id: number): Promise<void> => {
  await api.delete(`/catalog/brands/${id}`);
};

export const updateCategory = async (id: number, categoryData: { name: string }): Promise<Category> => {
  const response = await api.put(`/catalog/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/catalog/categories/${id}`);
};

export const updateSupplier = async (id: number, supplierData: { name: string; contact: string; phone: string; email: string }): Promise<Supplier> => {
  const response = await api.put(`/catalog/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/catalog/suppliers/${id}`);
};

export const registerSale = async (
  items: Array<{ productId: number; quantity: number; price: number; discount: number }>,
  taxOptions?: { taxIncluded: boolean; taxRate: number }
) => {
  // Llama al endpoint de ventas en el backend
  const response = await api.post('/sales', { 
    items,
    ...taxOptions
  });
  return response.data;
};

export const getSales = async () => {
  const response = await api.get('/sales');
  return response.data;
};

// Logging
export const logPrintBarcode = async (productId: number): Promise<{ message: string }> => {
  const response = await api.post(`/products/${productId}/print`);
  return response.data;
};

export default api;
