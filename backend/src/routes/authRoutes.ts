import { Router } from 'express';
import { register, login, getProfile, logout, getUsers, updateUser, deleteUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Registro de usuario
router.post('/register', register);

// Login de usuario
router.post('/login', login);

// Obtener perfil (requiere autenticación)
router.get('/profile', authenticateToken, getProfile);

// Logout
router.post('/logout', logout);

// GESTIÓN DE USUARIOS (Solo para admin)
// Obtener todos los usuarios
router.get('/users', authenticateToken, getUsers);

// Actualizar usuario
router.put('/users/:id', authenticateToken, updateUser);

// Eliminar usuario
router.delete('/users/:id', authenticateToken, deleteUser);

export default router;
