import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

export const registerSale = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // [{ productId, quantity, discount }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No sale items provided.' });
    }
    // Create sale record
  const sale = await prisma.sale.create({
      data: {
        saleItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price, // Debe venir del frontend
            discount: item.discount || 0
          }))
        }
      },
      include: { saleItems: true }
    });
    // Reduce stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockCached: { decrement: item.quantity }
        }
      });
    }
    // Return boleta/receipt info
    res.json({ folio: sale.id, sale });
  } catch (err: any) {
    console.error('Error en registerSale:', err);
    res.status(500).json({ error: err?.message || 'Error registering sale.' });
  }
};

// Obtener todas las ventas
export const getSales = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        saleItems: {
          include: {
            product: {
              include: {
                brand: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular totales para cada venta
    const salesWithTotals = sales.map(sale => {
      const total = sale.saleItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity - (item.discount || 0));
      }, 0);
      
      return {
        ...sale,
        total
      };
    });

    res.json(salesWithTotals);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};
