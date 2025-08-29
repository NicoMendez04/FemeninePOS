// Utilidad para generar SKUs únicos
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const generateUniqueSKU = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Buscar el último SKU del mes actual para obtener el siguiente número
  const lastProduct = await prisma.product.findFirst({
    where: {
      sku: {
        startsWith: `FEM-${year}-${month}-`
      }
    },
    orderBy: {
      sku: 'desc'
    }
  });

  let nextNumber = 1;
  
  if (lastProduct && lastProduct.sku) {
    // Extraer el número del último SKU (últimos 6 dígitos)
    const lastNumber = parseInt(lastProduct.sku.slice(-6));
    nextNumber = lastNumber + 1;
  }

  // Formatear el número con 6 dígitos
  const formattedNumber = String(nextNumber).padStart(6, '0');
  
  return `FEM-${year}-${month}-${formattedNumber}`;
};

export const generateSKUFromData = (baseCode: string, size: string, color: string): string => {
  // Función legacy para mantener compatibilidad si alguien quiere usar el formato anterior
  return `${baseCode}-${size}-${color}`.toUpperCase();
};
