import express from 'express';
import { getLogs, getLogStats, getUserActivity, getActiveSessions } from '../controllers/logController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener logs del sistema (solo admin)
router.get('/', getLogs);

// Obtener estadísticas de logs (solo admin)
router.get('/stats', getLogStats);

// Obtener actividad de un usuario específico
router.get('/user/:userId', getUserActivity);

// Obtener sesiones activas (solo admin)
router.get('/sessions', getActiveSessions);

export default router;
