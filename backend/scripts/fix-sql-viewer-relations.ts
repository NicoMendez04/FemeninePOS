import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function enableForeignKeysAndCreateIndexes() {
  try {
    console.log('🔧 Habilitando claves foráneas en SQLite...');
    
    // Habilitar claves foráneas en SQLite
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    console.log('✅ Claves foráneas habilitadas');

    // Crear índices para mejorar las relaciones
    console.log('📊 Creando índices para relaciones...');
    
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_activitylog_userid ON ActivityLog(userId);`;
      console.log('✅ Índice creado para ActivityLog.userId');
    } catch (e) {
      console.log('ℹ️ Índice ActivityLog.userId ya existe');
    }

    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sale_userid ON Sale(userId);`;
      console.log('✅ Índice creado para Sale.userId');
    } catch (e) {
      console.log('ℹ️ Índice Sale.userId ya existe');
    }

    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_activitylog_productid ON ActivityLog(productId);`;
      console.log('✅ Índice creado para ActivityLog.productId');
    } catch (e) {
      console.log('ℹ️ Índice ActivityLog.productId ya existe');
    }

    // Verificar que las claves foráneas estén funcionando
    console.log('\n🔍 Verificando claves foráneas...');
    
    const foreignKeyCheck = await prisma.$queryRaw`PRAGMA foreign_key_check;`;
    
    if (Array.isArray(foreignKeyCheck) && foreignKeyCheck.length === 0) {
      console.log('✅ Todas las claves foráneas están correctas');
    } else {
      console.log('⚠️ Problemas encontrados en claves foráneas:', foreignKeyCheck);
    }

    // Mostrar información de las tablas relacionadas
    console.log('\n📋 Información de relaciones:');
    
    const activityLogInfo = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='ActivityLog';
    `;
    console.log('ActivityLog DDL:', activityLogInfo);

    const saleInfo = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='Sale';
    `;
    console.log('Sale DDL:', saleInfo);

    console.log('\n✅ Configuración completada. Ahora tu visor SQL debería mostrar las relaciones correctamente.');
    console.log('\n💡 Sugerencias para tu visor SQL:');
    console.log('   - Actualiza/recarga la vista de la base de datos');
    console.log('   - Busca una opción "Show Foreign Keys" o "Show Relationships"');
    console.log('   - En algunos visores, las relaciones aparecen en un diagrama separado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableForeignKeysAndCreateIndexes();
