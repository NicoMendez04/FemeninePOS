import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🧹 Limpiando todos los datos de la base de datos...');
    
    // Eliminar en orden inverso de dependencias para evitar errores de claves foráneas
    console.log('Eliminando logs de actividad...');
    await prisma.activityLog.deleteMany({});
    
    console.log('Eliminando movimientos de stock...');
    await prisma.stockMovement.deleteMany({});
    
    console.log('Eliminando items de venta...');
    await prisma.saleItem.deleteMany({});
    
    console.log('Eliminando ventas...');
    await prisma.sale.deleteMany({});
    
    console.log('Eliminando items de compra...');
    await prisma.purchaseItem.deleteMany({});
    
    console.log('Eliminando compras...');
    await prisma.purchase.deleteMany({});
    
    console.log('Eliminando productos...');
    await prisma.product.deleteMany({});
    
    console.log('Eliminando proveedores...');
    await prisma.supplier.deleteMany({});
    
    console.log('Eliminando categorías...');
    await prisma.category.deleteMany({});
    
    console.log('Eliminando marcas...');
    await prisma.brand.deleteMany({});
    
    console.log('Eliminando usuarios...');
    await prisma.user.deleteMany({});
    
    console.log('✅ Todos los datos han sido eliminados exitosamente');
    console.log('📊 La estructura de las tablas se mantiene intacta');
    
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
