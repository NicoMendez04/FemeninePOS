import { PrismaClient } from '../generated/prisma';
import { Request, Response } from 'express';
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

// Obtener todas las ventas (con filtros)
export const getSales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId: filterUserId, startDate, endDate } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Construir filtros
    let where: any = {};

    // Si es vendedor (EMPLOYEE), solo puede ver sus propias ventas
    if (currentUser.role === 'EMPLOYEE') {
      where.userId = currentUser.id;
    } 
    // Si es admin o manager y especifica un usuario, filtrar por ese usuario
    else if (filterUserId && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER')) {
      where.userId = parseInt(filterUserId as string);
    }

    // Filtro por fechas
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                salePrice: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular totales para cada venta (usar el total ya calculado que incluye IVA)
    const salesWithTotals = sales.map(sale => ({
      ...sale,
      total: sale.total || sale.saleItems.reduce((sum, item) => {
        const itemTotal = item.quantity * item.price - (item.discount || 0);
        return sum + itemTotal;
      }, 0),
      itemsCount: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0)
    }));

    res.json(salesWithTotals);
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de ventas
export const getSalesStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Solo admin y manager pueden ver estadísticas completas
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'No tienes permisos para ver estas estadísticas' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventas totales
    const totalSales = await prisma.sale.count();
    
    // Ventas del día
    const todaySales = await prisma.sale.count({
      where: {
        createdAt: {
          gte: startOfDay
        }
      }
    });

    // Ventas del mes
    const monthSales = await prisma.sale.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Ventas por vendedor
    const salesByUser = await prisma.sale.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      where: {
        userId: {
          not: null
        }
      }
    });

    // Obtener nombres de vendedores
    const usersInfo = await prisma.user.findMany({
      where: {
        id: {
          in: salesByUser.map(s => s.userId).filter(id => id !== null) as number[]
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const salesByUserWithNames = salesByUser.map(sale => {
      const user = usersInfo.find(u => u.id === sale.userId);
      return {
        userId: sale.userId,
        userName: user?.name || 'Usuario desconocido',
        userEmail: user?.email || '',
        salesCount: sale._count.id
      };
    });

    res.json({
      totalSales,
      todaySales,
      monthSales,
      salesByUser: salesByUserWithNames
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nueva venta
export const createSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, taxIncluded = false, taxRate = 0.19 } = req.body; // items: [{ productId, quantity, price, discount? }]
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Validar que tenga permisos para crear ventas
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER' && currentUser.role !== 'EMPLOYEE') {
      return res.status(403).json({ error: 'No tienes permisos para crear ventas' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un item en la venta' });
    }

    // Función para calcular valores de IVA
    const calculateTaxValues = (subtotal: number, taxIncluded: boolean, taxRate: number) => {
      if (taxIncluded) {
        // El precio ya incluye IVA, necesitamos extraerlo
        const total = subtotal;
        const taxAmount = total - (total / (1 + taxRate));
        const subtotalWithoutTax = total - taxAmount;
        return { subtotal: subtotalWithoutTax, taxAmount, total };
      } else {
        // El precio no incluye IVA, necesitamos agregarlo
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
      }
    };

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Calcular total y crear items de venta
      let subtotalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        // Verificar que el producto existe y tiene stock suficiente
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`);
        }

        if (product.stockCached && product.stockCached < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Stock disponible: ${product.stockCached}`);
        }

        // Aplicar descuento si existe
        const discount = item.discount || 0;
        const finalPrice = item.price * (1 - discount / 100);
        const itemTotal = finalPrice * item.quantity;
        subtotalAmount += itemTotal;

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: discount
        });
      }

      // Calcular valores de IVA y total
      const taxValues = calculateTaxValues(subtotalAmount, taxIncluded, taxRate);

      // Crear la venta con los valores de IVA
      const sale = await tx.sale.create({
        data: {
          userId: currentUser.id,
          subtotal: taxValues.subtotal,
          taxAmount: taxValues.taxAmount,
          taxRate: taxRate,
          taxIncluded: taxIncluded,
          total: taxValues.total
        }
      });

      // Crear los items de venta
      const saleItems = await Promise.all(
        saleItemsData.map(async (item: any) => {
          // Crear item de venta
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0
            }
          });

          // Actualizar stock del producto
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockCached: {
                decrement: item.quantity
              }
            }
          });

          // Crear movimiento de stock
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALIDA',
              quantity: item.quantity,
              saleItemId: saleItem.id
            }
          });

          return saleItem;
        })
      );

      return { sale, saleItems };
    });

    // Obtener la venta completa para respuesta
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    });

    // Calcular total de la venta para el log (usar el total con IVA)
    const total = completeSale?.total || result.sale.total || 0;

    // Log creación de venta
    if (currentUser && completeSale) {
      await LogService.logCreateSale(
        currentUser.id,
        completeSale.id,
        total
      );
    }

    res.status(201).json({
      folio: result.sale.id, // Solo el número, el frontend lo formateará
      sale: completeSale
    });
  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    });
  }
};

// Obtener resumen de ventas por período
export const getSalesSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Construir filtros de fecha
    let where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Si es vendedor (EMPLOYEE), solo puede ver sus propias ventas
    if (currentUser.role === 'EMPLOYEE') {
      where.userId = currentUser.id;
    }

    // Obtener todas las ventas del período
    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
                brand: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generar resumen agrupado por fecha
    const summary = sales.reduce((acc: any[], sale) => {
      const date = sale.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      let dateEntry = acc.find(entry => entry.date === date);
      if (!dateEntry) {
        dateEntry = {
          date,
          totalSales: 0,
          totalAmount: 0,
          salesCount: 0,
          topProducts: {},
          topCategories: {},
          salesByUser: {}
        };
        acc.push(dateEntry);
      }

      dateEntry.salesCount += 1;
      dateEntry.totalAmount += sale.total || 0;

      // Agrupar por usuario
      const userName = sale.user?.name || 'Usuario desconocido';
      if (!dateEntry.salesByUser[userName]) {
        dateEntry.salesByUser[userName] = { count: 0, amount: 0 };
      }
      dateEntry.salesByUser[userName].count += 1;
      dateEntry.salesByUser[userName].amount += sale.total || 0;

      // Agrupar productos y categorías
      sale.saleItems.forEach((item: any) => {
        if (item.product) {
          // Top productos
          const productName = item.product.name;
          if (!dateEntry.topProducts[productName]) {
            dateEntry.topProducts[productName] = 0;
          }
          dateEntry.topProducts[productName] += item.quantity;

          // Top categorías
          const category = item.product.category?.name || 'Sin categoría';
          if (!dateEntry.topCategories[category]) {
            dateEntry.topCategories[category] = 0;
          }
          dateEntry.topCategories[category] += item.quantity;
        }
      });

      return acc;
    }, []);

    // Convertir objetos de conteo a arrays ordenados
    summary.forEach(entry => {
      entry.topProducts = Object.entries(entry.topProducts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));
      
      entry.topCategories = Object.entries(entry.topCategories)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      entry.salesByUser = Object.entries(entry.salesByUser)
        .sort((a: any, b: any) => b[1].amount - a[1].amount)
        .map(([name, data]: any) => ({ name, ...data }));
    });

    res.json(summary);
  } catch (error) {
    console.error('Error obteniendo resumen de ventas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};
