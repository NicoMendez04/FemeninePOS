import { PrismaClient, LogAction } from '../generated/prisma';

const prisma = new PrismaClient();

interface LogData {
  userId?: number;
  action: LogAction;
  productId?: number;
  productSku?: string;
  details?: string;
}

class LogService {
  
  /**
   * Registra una actividad en el sistema
   */
  static async log(data: LogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          productId: data.productId || null,
          productSku: data.productSku || null,
          details: data.details || null,
        }
      });
    } catch (error) {
      console.error('Error al guardar log:', error);
      // No lanzamos error para que no afecte la operación principal
    }
  }

  /**
   * Logs de autenticación
   */
  static async logLogin(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.LOGIN,
      details: `Usuario ${email} inició sesión`
    });
  }

  static async logLogout(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.LOGOUT,
      details: `Usuario ${email} cerró sesión`
    });
  }

  /**
   * Logs de productos
   */
  static async logCreateProduct(userId: number, productId: number, productSku: string, productName: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.CREATE_PRODUCT,
      productId,
      productSku,
      details: `Producto creado: ${productName}`
    });
  }

  static async logUpdateProduct(userId: number, productId: number, productSku: string, productName: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.UPDATE_PRODUCT,
      productId,
      productSku,
      details: `Producto actualizado: ${productName}`
    });
  }

  static async logDeleteProduct(userId: number, productId: number, productSku: string, productName: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.DELETE_PRODUCT,
      productId,
      productSku,
      details: `Producto eliminado: ${productName}`
    });
  }

  static async logViewProduct(userId: number, productId: number, productSku: string, productName: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.VIEW_PRODUCT,
      productId,
      productSku,
      details: `Producto consultado: ${productName}`
    });
  }

  static async logPrintBarcode(userId: number, productId: number, productSku: string, productName: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.PRINT_BARCODE,
      productId,
      productSku,
      details: `Código de barras impreso para: ${productName}`
    });
  }

  /**
   * Logs de usuarios
   */
  static async logCreateUser(adminUserId: number, newUserId: number, newUserEmail: string, newUserName: string, newUserRole: string): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: LogAction.CREATE_USER,
      details: `Usuario creado: ${newUserName} (${newUserEmail}) con rol ${newUserRole}`
    });
  }

  static async logUpdateUser(adminUserId: number, targetUserId: number, targetUserEmail: string, targetUserName: string): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: LogAction.UPDATE_USER,
      details: `Usuario actualizado: ${targetUserName} (${targetUserEmail})`
    });
  }

  static async logDeleteUser(adminUserId: number, targetUserId: number, targetUserEmail: string, targetUserName: string): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: LogAction.DELETE_USER,
      details: `Usuario eliminado: ${targetUserName} (${targetUserEmail})`
    });
  }

  /**
   * Logs de ventas
   */
  static async logCreateSale(userId: number, saleId: number, totalAmount: number, customerName?: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.CREATE_SALE,
      details: `Venta registrada - ID: ${saleId}, Total: $${totalAmount}${customerName ? `, Cliente: ${customerName}` : ''}`
    });
  }

  static async logUpdateSale(userId: number, saleId: number, totalAmount: number, customerName?: string): Promise<void> {
    await this.log({
      userId,
      action: LogAction.UPDATE_SALE,
      details: `Venta actualizada - ID: ${saleId}, Total: $${totalAmount}${customerName ? `, Cliente: ${customerName}` : ''}`
    });
  }

  /**
   * Obtener logs con paginación y filtros
   */
  static async getLogs(options: {
    page?: number;
    limit?: number;
    action?: LogAction;
    userId?: number;
    date?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      action,
      userId,
      date
    } = options;

    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (action) {
      where.action = action;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.timestamp = {
        gte: startDate,
        lt: endDate
      };
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.activityLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Obtener estadísticas de logs
   */
  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalLogs, todayLogs, uniqueUsers, mostActiveUser] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({
        where: {
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.activityLog.aggregate({
        _count: {
          userId: true
        },
        where: {
          userId: {
            not: null
          }
        }
      }),
      prisma.activityLog.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: {
          userId: {
            not: null
          }
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 1
      })
    ]);

    let mostActiveUserName = 'N/A';
    if (mostActiveUser.length > 0 && mostActiveUser[0].userId) {
      const user = await prisma.user.findUnique({
        where: { id: mostActiveUser[0].userId },
        select: { name: true }
      });
      mostActiveUserName = user?.name || 'Usuario desconocido';
    }

    return {
      totalLogs,
      todayLogs,
      uniqueUsers: uniqueUsers._count.userId,
      mostActiveUser: mostActiveUserName
    };
  }
}

export default LogService;
