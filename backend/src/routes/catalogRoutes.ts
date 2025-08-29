import { Router } from 'express';
import { createBrand, createCategory, createSupplier, listBrands, listCategories, listSuppliers, updateBrand, deleteBrand, updateCategory, deleteCategory, updateSupplier, deleteSupplier } from '../controllers/catalogController';

const router = Router();

// Listar marcas
router.get('/brands', listBrands);
// Listar categorías
router.get('/categories', listCategories);
// Listar proveedores
router.get('/suppliers', listSuppliers);

router.post('/brands', createBrand);
router.post('/categories', createCategory);
router.post('/suppliers', createSupplier);

export default router;
// Marcas
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);
// Categorías
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
// Proveedores
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);
