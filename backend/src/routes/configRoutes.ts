import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getConfigs, 
  getConfig, 
  updateConfig, 
  validatePTouchPath,
  detectPTouchEditor,
  createDirectories
} from '../controllers/configController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/config - Obtener todas las configuraciones
router.get('/', getConfigs);

// GET /api/config/detect-ptouch-editor - Detectar P-Touch Editor automáticamente
router.get('/detect-ptouch-editor', detectPTouchEditor);

// POST /api/config/create-directories - Crear directorios necesarios
router.post('/create-directories', createDirectories);

// GET /api/config/:key - Obtener una configuración específica
router.get('/:key', getConfig);

// PUT /api/config/:key - Actualizar o crear una configuración
router.put('/:key', updateConfig);

// POST /api/config - Guardar múltiples configuraciones
import { saveMultipleConfigs } from '../controllers/configController';
router.post('/', saveMultipleConfigs);

// POST /api/config/validate-ptouch-path - Validar ruta de P-Touch Editor
router.post('/validate-ptouch-path', validatePTouchPath);

export default router;
