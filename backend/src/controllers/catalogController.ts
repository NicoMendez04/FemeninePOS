import { PrismaClient } from '../generated/prisma';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Crear marca
export const createBrand = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la marca es requerido' });
    }

    const brand = await prisma.brand.create({ 
      data: { name: name.trim().toUpperCase() } 
    });
    
    res.status(201).json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Error al crear marca' });
  }
};

// Crear categoría
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }

    const category = await prisma.category.create({ 
      data: { name: name.trim().toUpperCase() } 
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// Crear proveedor
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contact } = req.body;
    
    const supplier = await prisma.supplier.create({ 
      data: { 
        name: name.trim(), 
        contact: contact?.trim() || null
      } 
    });
    
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

// Listar marcas
export const listBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(brands);
  } catch (error) {
    console.error('Error listing brands:', error);
    res.status(500).json({ error: 'Error al listar marcas' });
  }
};

// Listar categorías
export const listCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ error: 'Error al listar categorías' });
  }
};

// Listar proveedores
export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error listing suppliers:', error);
    res.status(500).json({ error: 'Error al listar proveedores' });
  }
};

// Editar marca
export const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la marca es requerido' });
    }
    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: { name: name.trim().toUpperCase() }
    });
    res.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Error al actualizar marca' });
  }
};

// Eliminar marca
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Error al eliminar marca' });
  }
};

// Editar categoría
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name: name.trim().toUpperCase() }
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// Eliminar categoría
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

// Editar proveedor
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }
    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        contact: contact?.trim() || null
      }
    });
    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

// Eliminar proveedor
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};
