// Guardar múltiples configuraciones
export const saveMultipleConfigs = async (req: Request, res: Response) => {
  try {
    const configs = req.body; // { key1: value1, key2: value2, ... }
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ message: 'Datos inválidos' });
    }
    const results = [];
    for (const key of Object.keys(configs)) {
      const value = configs[key];
      if (!value) continue;
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
      results.push(config);
    }
    res.json({ updated: results.length, configs: results });
  } catch (error) {
    console.error('Error guardando configuraciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Obtener todas las configuraciones
export const getConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    
    // Convertir a objeto para facilitar el uso en frontend
    const configObject = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    res.json(configObject);
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener una configuración específica
export const getConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });

    if (!config) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    res.json({ key: config.key, value: config.value });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar o crear una configuración
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({ message: 'El valor es requerido' });
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { 
        value,
        description: description || undefined
      },
      create: { 
        key, 
        value,
        description: description || undefined
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Validar ruta de P-Touch Editor
export const validatePTouchPath = async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ message: 'La ruta es requerida' });
    }
    
    // Verificar que el archivo existe
    if (!fs.existsSync(path)) {
      return res.status(400).json({ 
        message: 'El archivo no existe en la ruta especificada',
        valid: false
      });
    }

    // Verificar que es un archivo .exe
    if (!path.toLowerCase().endsWith('.exe')) {
      return res.status(400).json({ 
        message: 'El archivo debe ser un ejecutable (.exe)',
        valid: false
      });
    }

    res.json({ 
      message: 'Ruta válida',
      valid: true 
    });
  } catch (error) {
    console.error('Error validando ruta:', error);
    res.status(500).json({ 
      message: 'Error validando la ruta',
      valid: false
    });
  }
};

// Detectar automáticamente P-Touch Editor instalado
export const detectPTouchEditor = async (req: Request, res: Response) => {
  try {
    const possiblePaths = [
      // P-touch Editor 5.4 (más común)
      'C:\\Program Files (x86)\\Brother\\Ptedit54\\ptedit54.exe',
      'C:\\Program Files\\Brother\\Ptedit54\\ptedit54.exe',
      // P-touch Editor Lite 5.4
      'C:\\Program Files\\Brother\\P-touch Editor Lite 5.4\\P-touch Editor.exe',
      'C:\\Program Files (x86)\\Brother\\P-touch Editor Lite 5.4\\P-touch Editor.exe',
      // Otras versiones
      'C:\\Program Files\\Brother\\P-touch Editor Lite\\P-touch Editor.exe',
      'C:\\Program Files (x86)\\Brother\\P-touch Editor Lite\\P-touch Editor.exe',
      'C:\\Program Files\\Brother\\P-touch Editor 5.4\\P-touchEditor.exe',
      'C:\\Program Files (x86)\\Brother\\P-touch Editor 5.4\\P-touchEditor.exe',
      'C:\\Program Files\\Brother\\P-touch Editor 5.2\\P-touchEditor.exe',
      'C:\\Program Files (x86)\\Brother\\P-touch Editor 5.2\\P-touchEditor.exe',
    ];

    for (const ptouchPath of possiblePaths) {
      if (fs.existsSync(ptouchPath)) {
        // Determinar versión basada en la ruta
        let version = 'P-touch Editor';
        if (ptouchPath.includes('ptedit54.exe')) version = 'P-touch Editor 5.4';
        else if (ptouchPath.includes('Lite 5.4')) version = 'P-touch Editor Lite 5.4';
        else if (ptouchPath.includes('Lite')) version = 'P-touch Editor Lite';
        else if (ptouchPath.includes('5.4')) version = 'P-touch Editor 5.4';
        else if (ptouchPath.includes('5.2')) version = 'P-touch Editor 5.2';

        return res.json({
          found: true,
          path: ptouchPath,
          version: version,
          message: `${version} encontrado automáticamente`
        });
      }
    }

    res.json({
      found: false,
      message: 'P-touch Editor no encontrado en las ubicaciones comunes',
      searchedPaths: possiblePaths
    });

  } catch (error) {
    console.error('Error detectando P-Touch Editor:', error);
    res.status(500).json({ 
      found: false,
      message: 'Error durante la detección automática' 
    });
  }
};

// Crear directorios necesarios para el sistema
export const createDirectories = async (req: Request, res: Response) => {
  try {
    // Obtener ruta base del cuerpo de la request, o usar valor por defecto
    const { basePath } = req.body;
    const baseDir = basePath || 'C:';
    
    const templatesDir = path.join(baseDir, 'Templates');
    const tempDir = path.join(baseDir, 'Temp');
    const tempCsvPath = path.join(tempDir, 'label-data.csv');

    // Crear directorio Templates (siempre)
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Crear directorio Temp (siempre)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // SIEMPRE crear/recrear un archivo CSV de ejemplo
    const exampleCsvData = [
      'ProductName,SKU,Price,Size,Color,Brand',
      'Blusa Floral Manga Larga,FEM-2025-08-000001,39990,M,Rosa,Femeninee'
    ].join('\n');
    
    fs.writeFileSync(tempCsvPath, exampleCsvData, 'utf8');

    // Crear archivo de instrucciones en Templates
    const instructionsPath = path.join(templatesDir, 'INSTRUCCIONES-TEMPLATE.txt');
    const instructions = `
INSTRUCCIONES PARA CREAR TEMPLATE DK-11201 EN P-TOUCH EDITOR:

1. Abrir P-Touch Editor (ptedit54.exe)
2. Crear nueva etiqueta DK-11201 (29mm x 90mm)

CONECTAR A BASE DE DATOS CSV:
1. Menu: Database > Connect to Database
2. Tipo: Text File (CSV)
3. Archivo: ${tempCsvPath}
4. Separador: Comma (,)
5. Calificador: Double Quote (")
6. Primera línea contiene nombres de campos: SÍ

CAMPOS DISPONIBLES:
- ProductName
- SKU 
- Price
- Size
- Color
- Brand

DISEÑO DE ETIQUETA:
Línea 1: Insert > Database Field > ProductName
Línea 2: Text "T: " + Database Field Size + Text " C: " + Database Field Color
Línea 3: Database Field Brand (izq.) + Text "$ " + Database Field Price (der.)
Línea 4: Insert > Barcode Code 128 > Data Source: Database Field SKU
Línea 5: Database Field SKU (texto debajo del barcode)

GUARDAR COMO: etiqueta-producto-dk11201.lbx

IMPORTANTE: 
- NO usar texto con {} sino Database Fields directamente
- El CSV se actualiza automáticamente al imprimir
- Conectar la base de datos UNA SOLA VEZ
`;
    
    fs.writeFileSync(instructionsPath, instructions, 'utf8');

    res.json({
      success: true,
      templatesPath: templatesDir,
      tempPath: tempCsvPath,
      exampleCsvCreated: true,
      instructionsCreated: instructionsPath,
      message: `Directorios creados, CSV de ejemplo generado y instrucciones guardadas en: ${baseDir}`
    });

  } catch (error) {
    console.error('Error creando directorios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creando directorios: ' + (error as Error).message
    });
  }
};
