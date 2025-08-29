import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Creando datos de prueba...');
    
    // Crear usuario administrador
    console.log('Creando usuario administrador...');
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fememine.com',
        password: '$2b$10$K8K8K8K8K8K8K8K8K8K8K8', // password: admin123
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true
      }
    });

    // Crear usuario vendedor
    console.log('Creando usuario vendedor...');
    const sellerUser = await prisma.user.create({
      data: {
        email: 'vendedor@fememine.com',
        password: '$2b$10$K8K8K8K8K8K8K8K8K8K8K8', // password: admin123
        name: 'Vendedor',
        role: 'EMPLOYEE',
        isActive: true
      }
    });

    // Crear marcas
    console.log('Creando marcas...');
    const brand = await prisma.brand.create({
      data: { name: 'Nike' }
    });

    // Crear categorías
    console.log('Creando categorías...');
    const category = await prisma.category.create({
      data: { name: 'Zapatos' }
    });

    // Crear proveedores
    console.log('Creando proveedores...');
    const supplier = await prisma.supplier.create({
      data: { 
        name: 'Proveedor Principal',
        contact: 'contacto@proveedor.com'
      }
    });

    // Crear productos
    console.log('Creando productos...');
    const product1 = await prisma.product.create({
      data: {
        name: 'Nike Air Max',
        description: 'Zapatos deportivos',
        brandId: brand.id,
        categoryId: category.id,
        supplierId: supplier.id,
        size: '42',
        color: 'Negro',
        baseCode: 'NAM',
        sku: 'NAM-42-NEG-001',
        salePrice: 150.00,
        costPrice: 80.00,
        stockCached: 10,
        stockMin: 2,
        isActive: true
      }
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'Nike Revolution',
        description: 'Zapatos casuales',
        brandId: brand.id,
        categoryId: category.id,
        supplierId: supplier.id,
        size: '38',
        color: 'Blanco',
        baseCode: 'NRV',
        sku: 'NRV-38-BLN-001',
        salePrice: 120.00,
        costPrice: 60.00,
        stockCached: 5,
        stockMin: 2,
        isActive: true
      }
    });

    // Crear una venta
    console.log('Creando venta de prueba...');
    const sale = await prisma.sale.create({
      data: {
        total: 270.00,
        userId: sellerUser.id,
        saleItems: {
          create: [
            {
              productId: product1.id,
              quantity: 1,
              price: 150.00,
              discount: 0
            },
            {
              productId: product2.id,
              quantity: 1,
              price: 120.00,
              discount: 0
            }
          ]
        }
      }
    });

    // Crear algunos logs de actividad
    console.log('Creando logs de actividad...');
    await prisma.activityLog.createMany({
      data: [
        {
          userId: adminUser.id,
          action: 'LOGIN',
          details: 'Usuario administrador inició sesión'
        },
        {
          userId: adminUser.id,
          action: 'CREATE_PRODUCT',
          productId: product1.id,
          productSku: product1.sku,
          details: `Producto creado: ${product1.name}`
        },
        {
          userId: adminUser.id,
          action: 'CREATE_PRODUCT',
          productId: product2.id,
          productSku: product2.sku,
          details: `Producto creado: ${product2.name}`
        },
        {
          userId: sellerUser.id,
          action: 'LOGIN',
          details: 'Usuario vendedor inició sesión'
        },
        {
          userId: sellerUser.id,
          action: 'VIEW_PRODUCT',
          productId: product1.id,
          productSku: product1.sku,
          details: `Producto consultado: ${product1.name}`
        },
        {
          userId: sellerUser.id,
          action: 'PRINT_BARCODE',
          productId: product1.id,
          productSku: product1.sku,
          details: `Código de barras impreso para: ${product1.name}`
        }
      ]
    });

    console.log('✅ Datos de prueba creados exitosamente');
    console.log('👤 Usuarios creados:');
    console.log(`   - Admin: admin@fememine.com (ID: ${adminUser.id})`);
    console.log(`   - Vendedor: vendedor@fememine.com (ID: ${sellerUser.id})`);
    console.log('📦 Productos creados: 2');
    console.log('💰 Ventas creadas: 1');
    console.log('📝 Logs de actividad: 6');
    
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
