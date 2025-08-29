import { PrismaClient, UserRole } from '../generated/prisma';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import LogService from '../services/logService';

// Extender la interfaz Request para incluir el usuario
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-muy-segura';

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'EMPLOYEE' } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, contraseña y nombre son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Ya existe un usuario con ese email' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as UserRole,
        isActive: true
      }
    });

    // Log creación de usuario
    const adminUser = (req as AuthenticatedRequest).user;
    if (adminUser && adminUser.role === 'ADMIN') {
      // Usuario creado por admin
      await LogService.logCreateUser(
        adminUser.id,
        user.id,
        user.email,
        user.name,
        user.role
      );
    } else {
      // Auto-registro
      await LogService.logCreateUser(
        user.id, // El propio usuario se auto-registra
        user.id,
        user.email,
        user.name,
        user.role
      );
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Log intento de login fallido
      // await LogService.logLoginFailed(email, req); // TODO: Implementar
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      // Log intento de login con usuario inactivo
      // await LogService.logLoginFailed(email, req); // TODO: Implementar
      return res.status(401).json({ 
        error: 'Usuario desactivado' 
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      // Log intento de login con contraseña incorrecta
      // await LogService.logLoginFailed(email, req); // TODO: Implementar
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login exitoso
    await LogService.logLogin(user.id, user.email);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar token y obtener perfil
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Viene del middleware de autenticación

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Logout (opcional, principalmente para limpiar en frontend)
export const logout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Viene del middleware de autenticación
    
    if (user) {
      // Log logout
      await LogService.logLogout(user.id, user.email);
    }
    
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.json({ message: 'Logout exitoso' }); // Siempre retornar éxito para logout
  }
};

// GESTIÓN DE USUARIOS (Solo para admin)

// Obtener todos los usuarios
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar usuario (principalmente el rol)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, name, email, isActive } = req.body;

    // Validar que el ID sea un número
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role: role as UserRole }),
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log actualización de usuario
    const adminUser = (req as AuthenticatedRequest).user;
    if (adminUser) {
      await LogService.logUpdateUser(
        adminUser.id,
        updatedUser.id,
        updatedUser.email,
        updatedUser.name
      );
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar usuario
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar al propio usuario admin
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log eliminación de usuario
    if (req.user) {
      await LogService.logDeleteUser(
        req.user.id,
        existingUser.id,
        existingUser.email,
        existingUser.name
      );
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
