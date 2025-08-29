import { Router } from 'express';
import { 
  getProducts, 
  createProducts, 
  getProductById, 
  getProductBySKU,
  updateProduct, 
  deleteProduct,
  reactivateProduct,
  checkProductDeletability,
  logPrintBarcode,
  getLowStockProducts,
  importProducts,
  restockProduct
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar productos
router.get('/', getProducts);

// Obtener productos con stock bajo
router.get('/low-stock', getLowStockProducts);

// Crear productos (lote)
router.post('/', createProducts);

// Importar productos desde archivo
router.post('/import', importProducts);

// Buscar producto por SKU (para códigos de barras/QR)
router.get('/sku/:sku', getProductBySKU);

// Verificar si un producto puede ser eliminado físicamente
router.get('/:id/deletability', checkProductDeletability);

// Obtener producto por ID
router.get('/:id', getProductById);

// Actualizar producto
router.put('/:id', updateProduct);

// Eliminar producto
router.delete('/:id', deleteProduct);

// Reactivar producto
router.patch('/:id/reactivate', reactivateProduct);

// Restock de producto
router.post('/:id/restock', restockProduct);

// Log impresión de código de barras
router.post('/:id/print', logPrintBarcode);

export default router;
