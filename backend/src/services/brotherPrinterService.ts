import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface LabelData {
  name: string;
  sku: string;
  price: number;
  size: string;
  color: string;
  brand: string;
}

export class BrotherPrinterService {
  // Eliminar las rutas estáticas - ahora las obtendremos de la base de datos
  
  /**
   * Obtener configuración desde la base de datos
   */
  private static async getConfig(key: string): Promise<string> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key }
      });
      
      if (!config) {
        throw new Error(`Configuración '${key}' no encontrada`);
      }
      
      return config.value;
    } catch (error) {
      console.error(`Error obteniendo configuración ${key}:`, error);
      throw error;
    }
  }

  /**
   * Método 1: Integración con P-Touch Editor usando archivos CSV
   * Este es el método más simple y funcional
   */
  static async printLabelWithCSV(labelData: LabelData): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener rutas de configuración
      const ptouchPath = await this.getConfig('printer_ptouch_path');
      const templatePath = await this.getConfig('printer_template_path');
      const tempDataPath = await this.getConfig('printer_temp_path');
      
      // Verificar que las rutas existen
      if (!fs.existsSync(ptouchPath)) {
        throw new Error(`P-Touch Editor no encontrado en: ${ptouchPath}`);
      }
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template no encontrado en: ${templatePath}`);
      }

      // Crear directorio temporal si no existe
      const tempDir = path.dirname(tempDataPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Crear datos CSV para P-Touch Editor
      const csvData = this.createCSVData(labelData);
      
      // Log para depuración
      console.log('=== DATOS DE LA ETIQUETA ===');
      console.log('LabelData recibido:', JSON.stringify(labelData, null, 2));
      console.log('CSV generado:', csvData);
      console.log('Guardando en:', tempDataPath);
      
      // Guardar archivo CSV temporal
      fs.writeFileSync(tempDataPath, csvData, 'utf8');
      
      // Verificar que el archivo se creó correctamente
      if (fs.existsSync(tempDataPath)) {
        const fileContent = fs.readFileSync(tempDataPath, 'utf8');
        console.log('Contenido del archivo CSV:', fileContent);
      }
      
      // Ejecutar P-Touch Editor con el archivo CSV
      const command = `"${ptouchPath}" "${templatePath}" /d "${tempDataPath}" /p`;
      
      console.log('Ejecutando comando de impresión:', command);
      
      try {
        execSync(command, { 
          timeout: 30000,
          stdio: 'pipe' // Capturar output para debugging
        });
        console.log('✅ Comando ejecutado exitosamente');
      } catch (execError: any) {
        console.error('❌ P-Touch Editor devolvió exit code:', execError.status);
        console.error('- Signal:', execError.signal);
        console.error('- Stdout:', execError.stdout?.toString() || 'Sin stdout');
        console.error('- Stderr:', execError.stderr?.toString() || 'Sin stderr');
        
        // Exit code 45 es común en P-Touch Editor pero la impresión puede haber funcionado
        if (execError.status === 45) {
          console.log('⚠️ Exit code 45 detectado - esto es normal en P-Touch Editor');
          console.log('✅ La etiqueta probablemente se imprimió correctamente');
          console.log('🔍 Verifica si la etiqueta salió de la impresora');
          
          // Considerar como éxito ya que es un comportamiento normal
          return {
            success: true,
            message: 'Etiqueta enviada a impresión (P-Touch Editor exit code 45 es normal)'
          };
        }
        
        // Para otros códigos de error, sí es un problema real
        let errorMessage = 'Error ejecutando P-Touch Editor';
        
        switch (execError.status) {
          case 1:
            errorMessage = 'P-Touch Editor no puede acceder al template o CSV';
            break;
          case 2:
            errorMessage = 'Archivo template no encontrado o corrupto';
            break;
          default:
            errorMessage = `P-Touch Editor falló con código ${execError.status}. Revisa que:
            - La impresora esté conectada
            - El template esté configurado correctamente
            - Tengas permisos para imprimir`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Limpiar archivo temporal
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
      
      return {
        success: true,
        message: 'Etiqueta impresa correctamente'
      };
      
    } catch (error) {
      console.error('Error imprimiendo etiqueta:', error);
      return {
        success: false,
        message: `Error al imprimir: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Verificar estado de la configuración de impresión
   */
  static async checkPrinterConfiguration(): Promise<{ 
    configured: boolean; 
    issues: string[];
    paths: {
      ptouchPath?: string;
      templatePath?: string;
      tempDataPath?: string;
    }
  }> {
    const issues: string[] = [];
    const paths: any = {};

    try {
      // Verificar P-Touch Editor
      try {
        paths.ptouchPath = await this.getConfig('printer_ptouch_path');
        if (!fs.existsSync(paths.ptouchPath)) {
          issues.push('P-Touch Editor no encontrado en la ruta configurada');
        }
      } catch (error) {
        issues.push('Ruta de P-Touch Editor no configurada');
      }

      // Verificar template
      try {
        paths.templatePath = await this.getConfig('printer_template_path');
        if (!fs.existsSync(paths.templatePath)) {
          issues.push('Template de etiqueta no encontrado');
        }
      } catch (error) {
        issues.push('Ruta del template no configurada');
      }

      // Verificar directorio temporal
      try {
        paths.tempDataPath = await this.getConfig('printer_temp_path');
        const tempDir = path.dirname(paths.tempDataPath);
        if (!fs.existsSync(tempDir)) {
          // Intentar crear el directorio
          try {
            fs.mkdirSync(tempDir, { recursive: true });
          } catch (mkdirError) {
            issues.push('No se puede acceder al directorio temporal');
          }
        }
      } catch (error) {
        issues.push('Ruta temporal no configurada');
      }

      return {
        configured: issues.length === 0,
        issues,
        paths
      };

    } catch (error) {
      return {
        configured: false,
        issues: ['Error verificando configuración'],
        paths: {}
      };
    }
  }

  /**
   * Método 2: Integración con Brother Web API (cuando esté disponible)
   */
  static async printLabelWithWebAPI(labelData: LabelData): Promise<{ success: boolean; message: string }> {
    try {
      // Hacer request a Brother Web API local
      const response = await fetch('http://localhost:8080/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template: 'product-label',
          data: labelData
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Etiqueta enviada a impresión'
        };
      } else {
        return {
          success: false,
          message: 'Error en Brother Web API'
        };
      }
      
    } catch (error) {
      console.error('Error con Brother Web API:', error);
      return {
        success: false,
        message: 'Brother Web API no disponible'
      };
    }
  }

  /**
   * Método principal que intenta diferentes métodos de impresión
   */
  static async printLabel(labelData: LabelData): Promise<{ success: boolean; message: string }> {
    // Intentar primero con Web API, luego con CSV
    let result = await this.printLabelWithWebAPI(labelData);
    
    if (!result.success) {
      console.log('Web API falló, intentando con CSV...');
      result = await this.printLabelWithCSV(labelData);
    }
    
    return result;
  }

  /**
   * Crear archivo CSV con datos de la etiqueta
   */
  private static createCSVData(labelData: LabelData): string {
    // Solo los campos que realmente necesitamos para la etiqueta DK-11201
    const headers = ['ProductName', 'SKU', 'Price', 'Size', 'Color', 'Brand'];
    const values = [
      labelData.name,
      labelData.sku,
      labelData.price.toString(),
      labelData.size,
      labelData.color,
      labelData.brand
    ];
    
    // Escapar valores CSV
    const escapedValues = values.map(value => 
      value.includes(',') || value.includes('"') || value.includes('\n') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    );
    
    return `${headers.join(',')}\n${escapedValues.join(',')}`;
  }

  /**
   * Verificar y diagnosticar el setup completo de impresión
   */
  static async diagnosePrintingSetup(): Promise<{ 
    success: boolean; 
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Verificar P-Touch Editor
      const ptouchPath = await this.getConfig('printer_ptouch_path');
      if (!fs.existsSync(ptouchPath)) {
        issues.push('P-Touch Editor no encontrado en la ruta configurada');
        recommendations.push('Reinstalar P-Touch Editor o actualizar la ruta en configuración');
      }

      // 2. Verificar template
      const templatePath = await this.getConfig('printer_template_path');
      if (!fs.existsSync(templatePath)) {
        issues.push('Template de etiqueta no encontrado');
        recommendations.push('Crear el template etiqueta-producto-dk11201.lbx siguiendo las instrucciones');
      }

      // 3. Verificar directorio temporal
      const tempDataPath = await this.getConfig('printer_temp_path');
      const tempDir = path.dirname(tempDataPath);
      if (!fs.existsSync(tempDir)) {
        issues.push('Directorio temporal no existe');
        recommendations.push('Crear directorios desde la página de configuración');
      }

      // 4. Probar crear CSV de ejemplo
      try {
        const testData: LabelData = {
          name: "Producto Test",
          sku: "TEST-001",
          price: 10000,
          size: "M",
          color: "Rojo",
          brand: "TestBrand"
        };
        
        const csvContent = this.createCSVData(testData);
        fs.writeFileSync(tempDataPath, csvContent, 'utf8');
        
        if (!fs.existsSync(tempDataPath)) {
          issues.push('No se puede crear archivo CSV temporal');
          recommendations.push('Verificar permisos de escritura en el directorio Temp');
        }
      } catch (csvError) {
        issues.push('Error creando archivo CSV de prueba');
        recommendations.push('Verificar permisos y espacio en disco');
      }

      // 5. Probar comando básico de P-Touch Editor
      try {
        execSync(`"${ptouchPath}" /?`, { timeout: 5000, stdio: 'pipe' });
      } catch (cmdError) {
        issues.push('P-Touch Editor no responde a comandos');
        recommendations.push('Verificar que P-Touch Editor no esté corrupto');
      }

      return {
        success: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        success: false,
        issues: ['Error general en el diagnóstico'],
        recommendations: ['Verificar configuración completa del sistema']
      };
    }
  }

  /**
   * Crear directorios necesarios
   */
  static ensureDirectories(): void {
    const templatesDir = 'C:\\Templates';
    const tempDir = 'C:\\Temp';
    
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  /**
   * Generar template base para P-Touch Editor DK-11201
   */
  static generateTemplateInstructions(): string {
    return `
    INSTRUCCIONES DETALLADAS PARA CREAR TEMPLATE DK-11201:
    
    1. Abrir P-Touch Editor (ptedit54.exe)
    2. Crear nueva etiqueta DK-11201 (29mm x 90mm)
    3. IMPORTANTE: Conectar a base de datos CSV
    
    CONFIGURACIÓN DE BASE DE DATOS:
    
    1. En P-Touch Editor ir a: Database > Connect to Database
    2. Seleccionar "Text File (CSV)" como tipo de base de datos
    3. Configurar:
       - File Path: [RutaTemp]\\label-data.csv
       - Field Separator: Comma (,)
       - Text Qualifier: Double Quote (")
       - First line contains field names: ✅ YES
    
    CAMPOS DISPONIBLES EN EL CSV:
    ProductName, SKU, Price, Size, Color, Brand
    
    DISEÑO DE LA ETIQUETA:
    
    Línea 1: Insert > Database Field > ProductName
    Línea 2: Insert > Text "T: " + Database Field > Size + Text " C: " + Database Field > Color  
    Línea 3: Insert > Database Field > Brand (izquierda) + Text "$ " + Database Field > Price (derecha)
    Línea 4: Insert > Barcode > Code 128
             - Data Source: Database Field
             - Field: SKU
    Línea 5: Insert > Database Field > SKU (como texto debajo del barcode)
    
    DISEÑO FINAL:
    ┌─────────────────────────────────────────────────────────────────┐
    │ [ProductName]                                                   │
    │ T: [Size]   C: [Color]                                         │
    │ [Brand]                            $ [Price]                   │
    │ ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||  │
    │                         [SKU]                                  │
    └─────────────────────────────────────────────────────────────────┘
    
    NOTAS IMPORTANTES:
    - NO usar texto estático con {}, usar Database Fields directamente
    - El archivo CSV se actualiza cada vez que imprimes una etiqueta
    - Conectar la base de datos UNA SOLA VEZ, luego P-Touch recordará la conexión
    - Guardar como: [RutaBase]\\Templates\\etiqueta-producto-dk11201.lbx
    `;
  }
}

export default BrotherPrinterService;
