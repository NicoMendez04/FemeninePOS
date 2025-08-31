// Controlador para productos individuales

import { PrismaClient } from '../generated/prisma';
import { Request, Response } from 'express';
import { generateUniqueSKU } from '../utils/skuGenerator';
import LogService from '../services/logService';

const prisma = new PrismaClient();

// Listar todos los productos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const whereClause = includeInactive === 'true' ? {} : { isActive: true };
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Log acceso a detalles del producto
    const user = (req as any).user;
    if (user) {
      await LogService.logViewProduct(
        user.id, 
        product.id, 
        product.sku || '',
        product.name
      );
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Buscar producto por SKU (para códigos de barras/QR)
export const getProductBySKU = async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku: sku },
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado con ese SKU' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    res.status(500).json({ error: 'Error al buscar producto por SKU' });
  }
};

// Crear productos en lote
export const createProducts = async (req: Request, res: Response) => {
  try {
    const products = req.body;

    // Validar que sea un array
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Se esperaba un array de productos' });
    }

    const createdProducts = [];

    for (const productData of products) {
      const {
        name,
        description,
        brandId,
        categoryId,
        supplierId,
        size,
        color,
        baseCode,
        sku,
        barcode,
        salePrice,
        costPrice,
        stockCached,
        stockMin
      } = productData;

      // Validaciones básicas
      if (!name) {
        return res.status(400).json({ 
          error: 'Falta el campo requerido: name' 
        });
      }

      // Generar SKU único automáticamente
      const uniqueSKU = await generateUniqueSKU();

      // Crear el producto
      const product = await prisma.product.create({
        data: {
          name,
          description: description || '',
          brandId: parseInt(brandId),
          categoryId: parseInt(categoryId),
          supplierId: supplierId && !isNaN(parseInt(supplierId)) ? parseInt(supplierId) : null,
          size: String(size || ''),
          color: color || '',
          baseCode: baseCode || '',
          sku: uniqueSKU, // Usar el SKU único generado
          salePrice: parseFloat(salePrice) || 0,
          costPrice: parseFloat(costPrice) || 0,
          stockCached: parseInt(stockCached) || 0,
          stockMin: parseInt(stockMin) || 0,
        },
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      });

      createdProducts.push(product);
    }

    // Log creación de productos
    const user = (req as any).user;
    if (user && createdProducts.length > 0) {
      // Log cada producto creado individualmente
      for (const product of createdProducts) {
        await LogService.logCreateProduct(
          user.id, 
          product.id, 
          product.sku || '',
          product.name
        );
      }
    }

    res.status(201).json({
      message: `${createdProducts.length} productos creados exitosamente`,
      products: createdProducts
    });
  } catch (error) {
    console.error('Error creating products:', error);
    res.status(500).json({ error: 'Error al crear productos' });
  }
};

// Actualizar producto
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      brandId,
      categoryId,
      supplierId,
      size,
      color,
      baseCode,
      sku,
      barcode,
      salePrice,
      costPrice,
      stockCached,
      stockMin
    } = req.body;

    console.log('Updating product ID:', id);
    console.log('Request body:', req.body);

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(brandId && { brandId: parseInt(brandId) }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(supplierId && { supplierId: parseInt(supplierId) }),
        ...(size !== undefined && { size }),
        ...(color !== undefined && { color }),
        ...(baseCode !== undefined && { baseCode }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(salePrice !== undefined && { salePrice: parseFloat(salePrice) }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(stockCached !== undefined && { stockCached: parseInt(stockCached) }),
        ...(stockMin !== undefined && { stockMin: parseInt(stockMin) }),
      },
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
    });

    // Log actualización del producto
    const user = (req as any).user;
    if (user) {
      await LogService.logUpdateProduct(
        user.id, 
        product.id, 
        product.sku || '',
        product.name
      );
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto (eliminación inteligente)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        movements: true,
        saleItems: true,
        purchaseItems: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si el producto tiene movimientos de stock, ventas o compras
    const hasMovements = product.movements.length > 0;
    const hasSales = product.saleItems.length > 0;
    const hasPurchases = product.purchaseItems.length > 0;

    if (hasMovements || hasSales || hasPurchases) {
      // Si tiene historial, realizar eliminación lógica (desactivar)
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      });

      // Log desactivación
      const user = (req as any).user;
      if (user) {
        await LogService.logUpdateProduct(
          user.id, 
          productId, 
          product.sku || '',
          `Producto desactivado: ${product.name}`
        );
      }

      res.json({ 
        message: 'Producto desactivado exitosamente',
        type: 'deactivated'
      });
    } else {
      // Si no tiene historial, eliminar físicamente
      await prisma.product.delete({
        where: { id: productId }
      });

      // Log eliminación física
      const user = (req as any).user;
      if (user) {
        await LogService.logDeleteProduct(
          user.id, 
          productId, 
          product.sku || '',
          product.name
        );
      }

      res.json({ 
        message: 'Producto eliminado exitosamente',
        type: 'deleted'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// Reactivar producto
export const reactivateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.isActive) {
      return res.status(400).json({ error: 'El producto ya está activo' });
    }

    // Reactivar producto
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: true }
    });

    // Log reactivación
    const user = (req as any).user;
    if (user) {
      await LogService.logUpdateProduct(
        user.id, 
        productId, 
        product.sku || '',
        `Producto reactivado: ${product.name}`
      );
    }

    res.json({ 
      message: 'Producto reactivado exitosamente'
    });
  } catch (error) {
    console.error('Error reactivating product:', error);
    res.status(500).json({ error: 'Error al reactivar producto' });
  }
};

// Verificar si un producto puede ser eliminado físicamente
export const checkProductDeletability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        movements: true,
        saleItems: true,
        purchaseItems: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si el producto tiene movimientos de stock, ventas o compras
    const hasMovements = product.movements.length > 0;
    const hasSales = product.saleItems.length > 0;
    const hasPurchases = product.purchaseItems.length > 0;

    const canBeDeleted = !hasMovements && !hasSales && !hasPurchases;

    res.json({ 
      canBeDeleted,
      hasHistory: hasMovements || hasSales || hasPurchases,
      details: {
        movements: product.movements.length,
        sales: product.saleItems.length,
        purchases: product.purchaseItems.length
      }
    });
  } catch (error) {
    console.error('Error checking product deletability:', error);
    res.status(500).json({ error: 'Error al verificar el producto' });
  }
};

// Log cuando se imprime un código de barras
export const logPrintBarcode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, sku: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Log impresión de código de barras
    await LogService.logPrintBarcode(
      user.id, 
      product.id,
      product.sku || '',
      product.name
    );

    res.json({ message: 'Impresión registrada exitosamente' });
  } catch (error) {
    console.error('Error logging print:', error);
    res.status(500).json({ error: 'Error al registrar impresión' });
  }
};

// Obtener productos con stock bajo
export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    // Primero obtenemos todos los productos activos
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
      orderBy: [
        { stockCached: 'asc' }
      ]
    });

    // Filtramos aquellos donde el stock es menor o igual al stock mínimo
    const lowStockProducts = products.filter(product => 
      (product.stockCached || 0) <= (product.stockMin || 0)
    );

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Error getting low stock products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Importar productos desde archivo
export const importProducts = async (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    const user = (req as any).user;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de productos' });
    }

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    // Procesar cada producto
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 1 y la fila 1 es el header

      try {
        // Validaciones básicas
        if (!productData.nombre || productData.nombre.trim() === '') {
          errors.push(`Fila ${rowNumber}: El nombre del producto es obligatorio`);
          errorCount++;
          continue;
        }

        // Buscar o crear categoría
        let categoryId = null;
        if (productData.categoria && productData.categoria.trim() !== '') {
          const category = await prisma.category.upsert({
            where: { name: productData.categoria.trim() },
            update: {},
            create: { name: productData.categoria.trim() }
          });
          categoryId = category.id;
        }

        // Buscar o crear marca
        let brandId = null;
        if (productData.marca && productData.marca.trim() !== '') {
          const brand = await prisma.brand.upsert({
            where: { name: productData.marca.trim() },
            update: {},
            create: { name: productData.marca.trim() }
          });
          brandId = brand.id;
        }

        // Buscar o crear proveedor
        let supplierId = null;
        if (productData.proveedor && productData.proveedor.trim() !== '') {
          const supplier = await prisma.supplier.upsert({
            where: { name: productData.proveedor.trim() },
            update: {},
            create: {
              name: productData.proveedor.trim(),
              contact: null
            }
          });
          supplierId = supplier.id;
        }        // Generar SKU si no se proporciona
        let sku = productData.sku;
        if (!sku || sku.trim() === '') {
          sku = await generateUniqueSKU();
        }

        // Verificar si el SKU ya existe
        const existingProduct = await prisma.product.findUnique({
          where: { sku: sku }
        });

        if (existingProduct) {
          duplicateCount++;
          continue;
        }

        // Crear el producto
        const newProduct = await prisma.product.create({
          data: {
            name: productData.nombre.trim(),
            description: productData.descripcion?.trim() || null,
            categoryId,
            brandId,
            supplierId,
            size: productData.talla?.trim() || null,
            color: productData.color?.trim() || null,
            baseCode: productData.codigoBase?.trim() || null,
            sku,
            salePrice: productData.precioVenta ? parseFloat(productData.precioVenta.toString()) : null,
            costPrice: productData.precioCosto ? parseFloat(productData.precioCosto.toString()) : null,
            stockCached: productData.stock ? parseInt(productData.stock.toString()) : 0,
            stockMin: productData.stockMinimo ? parseInt(productData.stockMinimo.toString()) : 2,
            isActive: true
          }
        });

        // Log de creación del producto
        await LogService.logCreateProduct(
          user.id,
          newProduct.id,
          newProduct.sku || '',
          newProduct.name
        );

        successCount++;

      } catch (error) {
        console.error(`Error procesando producto en fila ${rowNumber}:`, error);
        errors.push(`Fila ${rowNumber}: Error al procesar producto - ${error instanceof Error ? error.message : 'Error desconocido'}`);
        errorCount++;
      }
    }

    const result = {
      success: successCount > 0,
      message: `Importación completada. ${successCount} productos creados, ${errorCount} errores, ${duplicateCount} duplicados omitidos.`,
      successCount,
      errorCount,
      duplicateCount,
      errors: errors.slice(0, 20) // Limitar a 20 errores para no sobrecargar la respuesta
    };

    res.json(result);

  } catch (error) {
    console.error('Error en importación de productos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor durante la importación',
      errors: [error instanceof Error ? error.message : 'Error desconocido'],
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0
    });
  }
};

// Restock de producto
export const restockProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = (req as any).user;
    const productId = parseInt(id);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Actualizar el stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stockCached: {
          increment: quantity
        }
      }
    });

    // Log de restock
    if (user) {
      await LogService.logUpdateProduct(
        user.id,
        productId,
        product.sku || '',
        `Restock: +${quantity} unidades (Stock: ${product.stockCached} → ${updatedProduct.stockCached})`
      );
    }

    res.json({
      message: 'Stock actualizado exitosamente',
      previousStock: product.stockCached,
      newStock: updatedProduct.stockCached,
      quantity
    });

  } catch (error) {
    console.error('Error en restock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
