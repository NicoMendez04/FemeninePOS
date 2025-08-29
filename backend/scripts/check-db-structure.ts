import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');

    // Verificar tablas existentes
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `;
    
    console.log('📋 Tablas en la base de datos:');
    console.table(tables);

    // Verificar estructura de la tabla User
    const userSchema = await prisma.$queryRaw`
      PRAGMA table_info(User);
    `;
    
    console.log('\n👤 Estructura de la tabla User:');
    console.table(userSchema);

    // Verificar estructura de la tabla ActivityLog
    const activityLogSchema = await prisma.$queryRaw`
      PRAGMA table_info(ActivityLog);
    `;
    
    console.log('\n📝 Estructura de la tabla ActivityLog:');
    console.table(activityLogSchema);

    // Verificar estructura de la tabla Sale
    const saleSchema = await prisma.$queryRaw`
      PRAGMA table_info(Sale);
    `;
    
    console.log('\n💰 Estructura de la tabla Sale:');
    console.table(saleSchema);

    // Verificar claves foráneas
    const userForeignKeys = await prisma.$queryRaw`
      PRAGMA foreign_key_list(ActivityLog);
    `;
    
    console.log('\n🔗 Claves foráneas en ActivityLog:');
    console.table(userForeignKeys);

    const saleForeignKeys = await prisma.$queryRaw`
      PRAGMA foreign_key_list(Sale);
    `;
    
    console.log('\n🔗 Claves foráneas en Sale:');
    console.table(saleForeignKeys);

    // Verificar datos de prueba
    const userCount = await prisma.user.count();
    const activityLogCount = await prisma.activityLog.count();
    const saleCount = await prisma.sale.count();

    console.log('\n📊 Resumen de datos:');
    console.log(`- Usuarios: ${userCount}`);
    console.log(`- Logs de actividad: ${activityLogCount}`);
    console.log(`- Ventas: ${saleCount}`);

    // Verificar relación específica
    const userWithRelations = await prisma.user.findFirst({
      include: {
        sales: true,
        logs: true
      }
    });

    console.log('\n🔍 Usuario con relaciones:');
    console.log('Usuario:', userWithRelations?.name);
    console.log('Ventas asociadas:', userWithRelations?.sales?.length || 0);
    console.log('Logs asociados:', userWithRelations?.logs?.length || 0);

  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();
