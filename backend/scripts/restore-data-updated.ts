import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  users: any[];
  brands: any[];
  categories: any[];
  suppliers: any[];
  products: any[];
  purchases: any[];
  purchaseItems: any[];
  stockMovements: any[];
  sales?: any[];
  saleItems?: any[];
  activityLogs?: any[];
}

async function restoreData() {
  try {
    // Buscar el archivo de backup más reciente
    const archiveDir = path.join(__dirname, '..', 'archive');
    const backupFiles = fs.readdirSync(archiveDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      console.log('No se encontraron archivos de backup');
      return;
    }

    const latestBackup = backupFiles[0];
    const backupPath = path.join(archiveDir, latestBackup);
    
    console.log(`Restaurando datos desde: ${latestBackup}`);
    
    const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Restaurar en orden de dependencias
    console.log('Restaurando usuarios...');
    for (const user of backupData.users) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          }
        });
      } catch (error) {
        console.log(`Saltando usuario ${user.email}`);
      }
    }

    console.log('Restaurando marcas...');
    for (const brand of backupData.brands) {
      await prisma.brand.create({
        data: {
          id: brand.id,
          name: brand.name
        }
      });
    }

    console.log('Restaurando categorías...');
    for (const category of backupData.categories) {
      await prisma.category.create({
        data: {
          id: category.id,
          name: category.name
        }
      });
    }

    console.log('Restaurando proveedores...');
    for (const supplier of backupData.suppliers) {
      await prisma.supplier.create({
        data: {
          id: supplier.id,
          name: supplier.name,
          contact: supplier.contact
        }
      });
    }

    console.log('Restaurando productos...');
    for (const product of backupData.products) {
      await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          brandId: product.brandId,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          size: product.size,
          color: product.color,
          baseCode: product.baseCode,
          sku: product.sku,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          stockCached: product.stockCached,
          stockMin: product.stockMin,
          isActive: product.isActive,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        }
      });
    }

    if (backupData.purchases && backupData.purchases.length > 0) {
      console.log('Restaurando compras...');
      for (const purchase of backupData.purchases) {
        await prisma.purchase.create({
          data: {
            id: purchase.id,
            supplierId: purchase.supplierId,
            createdAt: new Date(purchase.createdAt)
          }
        });
      }
    }

    if (backupData.purchaseItems && backupData.purchaseItems.length > 0) {
      console.log('Restaurando items de compra...');
      for (const item of backupData.purchaseItems) {
        await prisma.purchaseItem.create({
          data: {
            id: item.id,
            purchaseId: item.purchaseId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }
        });
      }
    }

    if (backupData.stockMovements && backupData.stockMovements.length > 0) {
      console.log('Restaurando movimientos de stock...');
      for (const movement of backupData.stockMovements) {
        try {
          await prisma.stockMovement.create({
            data: {
              id: movement.id,
              productId: movement.productId,
              type: movement.type,
              quantity: movement.quantity,
              purchaseItemId: movement.purchaseItemId || null,
              saleItemId: movement.saleItemId || null,
              createdAt: new Date(movement.createdAt)
            }
          });
        } catch (error) {
          console.log(`Saltando movimiento ${movement.id} por dependencias faltantes`);
        }
      }
    }

    if (backupData.sales && backupData.sales.length > 0) {
      console.log('Restaurando ventas...');
      for (const sale of backupData.sales) {
        await prisma.sale.create({
          data: {
            id: sale.id,
            total: sale.total,
            userId: sale.userId,
            createdAt: new Date(sale.createdAt)
          }
        });
      }
    }

    if (backupData.saleItems && backupData.saleItems.length > 0) {
      console.log('Restaurando items de venta...');
      for (const item of backupData.saleItems) {
        await prisma.saleItem.create({
          data: {
            id: item.id,
            saleId: item.saleId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount
          }
        });
      }
    }

    console.log('✅ Datos restaurados exitosamente');
    
  } catch (error) {
    console.error('❌ Error al restaurar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();
