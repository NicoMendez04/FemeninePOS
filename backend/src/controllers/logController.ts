import { Request, Response } from 'express';
import LogService from '../services/logService';
import { LogAction } from '../generated/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Obtener logs con filtros
export const getLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Solo admin puede ver logs
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const {
      userId,
      action,
      date,
      limit = 20,
      page = 1
    } = req.query;

    const options: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };
    
    if (userId) options.userId = parseInt(userId as string);
    if (action) options.action = action as LogAction;
    if (date) options.date = date as string;

    const result = await LogService.getLogs(options);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de logs
export const getLogStats = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Solo admin puede ver estadísticas
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const stats = await LogService.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener actividad reciente de un usuario
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { userId } = req.params;
    
    // Admin puede ver cualquier actividad, usuarios solo la suya
    if (user?.role !== 'ADMIN' && user?.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const result = await LogService.getLogs({
      userId: parseInt(userId),
      limit: 50
    });

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener resumen de sesiones activas (últimos logins sin logout)
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Solo admin puede ver sesiones activas
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener últimos logins de cada usuario
    const recentLogins = await LogService.getLogs({
      action: LogAction.LOGIN,
      limit: 100
    });

    // Obtener logouts para comparar
    const recentLogouts = await LogService.getLogs({
      action: LogAction.LOGOUT,
      limit: 100
    });

    // Procesar para encontrar sesiones activas
    const activeSessions = recentLogins.logs.filter(login => {
      const userLogouts = recentLogouts.logs.filter(logout => 
        logout.userId === login.userId && 
        logout.timestamp > login.timestamp
      );
      return userLogouts.length === 0;
    });

    res.json({ 
      activeSessions,
      total: activeSessions.length 
    });
  } catch (error) {
    console.error('Error obteniendo sesiones activas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
