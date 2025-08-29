import { Router } from 'express';
import { getSales, getSalesStats, createSale, getSalesSummary } from '../controllers/salesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener ventas (con filtros)
router.get('/', getSales);

// Obtener estadísticas de ventas
router.get('/stats', getSalesStats);

// Obtener resumen de ventas por período
router.get('/summary', getSalesSummary);

// Crear nueva venta
router.post('/', createSale);

export default router;
