import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    // Verificar si ya existe un usuario admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('Creando usuario administrador...');
      await prisma.user.create({
        data: {
          email: 'admin@fememine.com',
          password: '$2b$10$K8K8K8K8K8K8K8K8K8K8K8', // password: admin123
          name: 'Administrador',
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ Usuario administrador creado');
    } else {
      console.log('✅ Usuario administrador ya existe');
    }

    // Crear algunas marcas básicas si no existen
    const brandsCount = await prisma.brand.count();
    if (brandsCount === 0) {
      console.log('Creando marcas básicas...');
      await prisma.brand.createMany({
        data: [
          { name: 'Nike' },
          { name: 'Adidas' },
          { name: 'Puma' },
          { name: 'Generic' }
        ]
      });
      console.log('✅ Marcas básicas creadas');
    }

    // Crear algunas categorías básicas si no existen
    const categoriesCount = await prisma.category.count();
    if (categoriesCount === 0) {
      console.log('Creando categorías básicas...');
      await prisma.category.createMany({
        data: [
          { name: 'Zapatos' },
          { name: 'Ropa' },
          { name: 'Accesorios' },
          { name: 'Deportivo' }
        ]
      });
      console.log('✅ Categorías básicas creadas');
    }

    // Crear algunos proveedores básicos si no existen
    const suppliersCount = await prisma.supplier.count();
    if (suppliersCount === 0) {
      console.log('Creando proveedores básicos...');
      await prisma.supplier.createMany({
        data: [
          { name: 'Proveedor A', contact: 'contacto@proveedora.com' },
          { name: 'Proveedor B', contact: 'contacto@proveedorb.com' },
          { name: 'Proveedor C', contact: 'contacto@proveedorc.com' }
        ]
      });
      console.log('✅ Proveedores básicos creados');
    }

    console.log('\n🎉 Datos básicos verificados y creados exitosamente');
    
  } catch (error) {
    console.error('❌ Error al crear datos básicos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();
