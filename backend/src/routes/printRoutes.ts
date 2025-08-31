import express from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken } from '../middleware/auth';
import LogService from '../services/logService';
import { BrotherPrinterService } from '../services/brotherPrinterService';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint para imprimir código de barras personalizado
router.post('/print/barcode-custom', authenticateToken, async (req, res) => {
  try {
    // Leer configuración desde la base de datos
    const configs = await prisma.systemConfig.findMany();
    const configObj = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);
    const ptouchPath = configObj.PTOUCH_PATH;
    const templatePath = configObj.TEMPLATE_PATH;
    const tempPath = configObj.TEMP_DATA_PATH;
    // Validar configuración
    if (!ptouchPath || !templatePath || !tempPath) {
      return res.status(400).json({ success: false, message: 'Configuración incompleta para imprimir.' });
    }
    // Validar datos recibidos
    const { text, barcode } = req.body;
    if (!text || !barcode) {
      return res.status(400).json({ success: false, message: 'Faltan datos para imprimir.' });
    }
    // Preparar datos para la etiqueta DK-11201 (29mm x 90mm)
    const labelData = {
      name: text,
      sku: barcode,
      price: 0,
      size: '',
      color: '',
      brand: '',
    };
    // Imprimir usando BrotherPrinterService
    const printResult = await BrotherPrinterService.printLabel(labelData);
    if (!printResult.success) {
      return res.status(500).json({ success: false, message: printResult.message });
    }
    // Registrar la actividad de impresión
    await LogService.logPrintBarcode((req as any).user.id, 0, barcode, text);
    return res.json({ success: true, message: 'Etiqueta de código impresa correctamente.' });
  } catch (error) {
    console.error('Error imprimiendo código personalizado:', error);
    return res.status(500).json({ success: false, message: 'Error interno al imprimir código.' });
  }
});

// Endpoint para imprimir etiqueta de producto
router.post('/products/:id/print-label', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const productId = parseInt(id);

    // Obtener datos del producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        supplier: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Log del producto obtenido
    console.log('=== PRODUCTO ENCONTRADO ===');
    console.log('Product ID:', productId);
    console.log('Product data:', JSON.stringify({
      name: product.name,
      sku: product.sku,
      baseCode: product.baseCode,
      salePrice: product.salePrice,
      size: product.size,
      color: product.color,
      brand: product.brand?.name,
      category: product.category?.name
    }, null, 2));

    // Preparar datos para la etiqueta - solo los campos necesarios
    const labelData = {
      name: product.name,
      sku: product.sku || '',
      price: product.salePrice || 0,
      size: product.size || '',
      color: product.color || '',
      brand: product.brand?.name || ''
    };

    console.log('=== LABEL DATA PREPARADO ===');
    console.log('LabelData:', JSON.stringify(labelData, null, 2));

    // Intentar imprimir con Brother Printer Service
    const printResult = await BrotherPrinterService.printLabel(labelData);
    
    if (!printResult.success) {
      console.log('Impresión falló:', printResult.message);
    }

    // Registrar la actividad de impresión
    await LogService.logPrintBarcode(
      user.id,
      product.id,
      product.sku || '',
      product.name
    );

    // Respuesta exitosa
    res.json({
      success: printResult.success,
      message: printResult.message,
      labelData: labelData
    });

  } catch (error) {
    console.error('Error al imprimir etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Endpoint para obtener vista previa de etiqueta
router.get('/products/:id/label-preview', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        supplier: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Preparar datos para la vista previa
    const labelData = {
      name: product.name,
      sku: product.sku || '',
      price: product.salePrice || 0,
      size: product.size || '',
      color: product.color || '',
      brand: product.brand?.name || ''
    };

    res.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        salePrice: product.salePrice,
        size: product.size,
        color: product.color,
        brand: product.brand?.name || '',
        category: product.category?.name || ''
      },
      labelData
    });

  } catch (error) {
    console.error('Error obteniendo vista previa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para verificar estado de la impresora
router.get('/printer/status', authenticateToken, async (req, res) => {
  try {
    // Usar la nueva función de diagnóstico
    const diagnosis = await BrotherPrinterService.diagnosePrintingSetup();
    
    res.json({
      isConfigured: diagnosis.success,
      issues: diagnosis.issues,
      recommendations: diagnosis.recommendations,
      instructions: BrotherPrinterService.generateTemplateInstructions()
    });
    
  } catch (error) {
    console.error('Error verificando estado de impresora:', error);
    res.status(500).json({ 
      error: 'Error verificando impresora',
      isConfigured: false,
      issues: ['Error interno del servidor'],
      recommendations: ['Verificar configuración del sistema']
    });
  }
});

// Endpoint para configuración de impresora  
router.get('/printer/configuration', authenticateToken, async (req, res) => {
  try {
    // Verificar estado de configuración
    const configStatus = await BrotherPrinterService.checkPrinterConfiguration();
    
    res.json({
      configured: configStatus.configured,
      issues: configStatus.issues,
      paths: configStatus.paths,
      instructions: BrotherPrinterService.generateTemplateInstructions()
    });
    
  } catch (error) {
    console.error('Error obteniendo configuración de impresora:', error);
    res.status(500).json({ 
      error: 'Error obteniendo configuración',
      configured: false,
      issues: ['Error interno del servidor']
    });
  }
});

// Endpoint para abrir explorador de archivos para P-touch Editor
router.post('/print/browse-ptouch', authenticateToken, async (req, res) => {
  // Simulación: Retornar ruta seleccionada manualmente
  // En producción, usar dialog de Electron o similar
  res.json({ path: 'C:\\Program Files (x86)\\Brother\\Ptouch Editor 5.4\\PtouchEditor.exe' });
});

// Endpoint para abrir explorador de archivos para template
router.post('/print/browse-template', authenticateToken, async (req, res) => {
  res.json({ path: 'C:\\Templates\\dk11201-template.lbx' });
});

// Endpoint para abrir explorador de archivos para datos temporales
router.post('/print/browse-temp', authenticateToken, async (req, res) => {
  res.json({ path: 'C:\\TempData\\labels.csv' });
});

// Endpoint para detectar P-touch Editor automáticamente
router.post('/print/detect-ptouch', authenticateToken, async (req, res) => {
  // Simulación: Buscar ejecutable en ruta estándar
  const found = true;
  const path = 'C:\\Program Files (x86)\\Brother\\Ptouch Editor 5.4\\PtouchEditor.exe';
  res.json({ found, path });
});

// Endpoint para verificación de configuración
router.post('/print/verify', authenticateToken, async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configObj = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);
    const ptouchPath = configObj.PTOUCH_PATH;
    const templatePath = configObj.TEMPLATE_PATH;
    const tempPath = configObj.TEMP_DATA_PATH;
    const issues = [];
    if (!ptouchPath) issues.push('Falta la ruta de P-touch Editor');
    if (!templatePath) issues.push('Falta la ruta del template');
    if (!tempPath) issues.push('Falta la ruta de datos temporales');
    if (issues.length === 0) {
      return res.json({ success: true, configured: true, issues: [], message: 'Configuración verificada correctamente.' });
    } else {
      return res.json({ success: false, configured: false, issues, message: 'Faltan campos para la verificación.' });
    }
  } catch (error) {
    console.error('Error verificando configuración:', error);
    return res.status(500).json({ success: false, message: 'Error interno al verificar configuración.' });
  }
});

export default router;
