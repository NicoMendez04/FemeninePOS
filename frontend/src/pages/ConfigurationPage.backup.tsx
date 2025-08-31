import React, { useState, useEffect } from 'react';
import { Settings, Printer, Check, X, AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PrinterConfig {
  configured: boolean;
  issues: string[];
  paths: {
    ptouchPath?: string;
    templatePath?: string;
    tempDataPath?: string;
  };
}

interface SystemConfig {
  [key: string]: string;
}

const ConfigurationPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  
  // Estados locales para los inputs
  const [ptouchPath, setPtouchPath] = useState<string>('');
  const [templatePath, setTemplatePath] = useState<string>('');
  const [tempPath, setTempPath] = useState<string>('');
  const [basePath, setBasePath] = useState<string>('C:\\DESARROLLO\\Femenine'); // Ruta base personalizable
  
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      const [configResponse, printerResponse] = await Promise.all([
        fetch('http://localhost:4000/api/config', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4000/api/printer-config-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (configResponse.ok) {
        const config = await configResponse.json();
        setSystemConfig(config);
        
        // Solo actualizar los estados locales si están vacíos
        if (!ptouchPath && config.printer_ptouch_path) {
          setPtouchPath(config.printer_ptouch_path);
        }
        if (!templatePath && config.printer_template_path) {
          setTemplatePath(config.printer_template_path);
        }
        if (!tempPath && config.printer_temp_path) {
          setTempPath(config.printer_temp_path);
        }
      }

      if (printerResponse.ok) {
        const printer = await printerResponse.json();
        setPrinterConfig(printer);
      }

    } catch (error) {
      console.error('Error cargando configuración:', error);
      showNotification('Error cargando configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Detectar automáticamente P-touch Editor instalado
  const detectPtouchEditor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/config/detect-ptouch-editor', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.found) {
          setPtouchPath(result.path);
          showNotification(`P-touch Editor detectado: ${result.version}`, 'success');
        } else {
          showNotification('P-touch Editor no encontrado automáticamente', 'warning');
        }
      }
    } catch (error) {
      console.error('Error detectando P-touch Editor:', error);
      showNotification('Error detectando P-touch Editor', 'error');
    }
  };

  // Crear directorios automáticamente
  const createDefaultDirectories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/config/create-directories', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ basePath })
      });

      if (response.ok) {
        const result = await response.json();
        setTempPath(result.tempPath);
        setTemplatePath(result.templatesPath + '\\etiqueta-producto-dk11201.lbx');
        showNotification(result.message, 'success');
      }
    } catch (error) {
      console.error('Error creando directorios:', error);
      showNotification('Error creando directorios', 'error');
    }
  };

  const handleFileSelect = (key: string, acceptedTypes: string = '*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fullPath = (file as any).path || file.name; // En Electron tendríamos la ruta completa
        
        // Para desarrollo web, usamos el nombre del archivo
        // En producción con Electron, tendrías la ruta completa
        if (key === 'printer_ptouch_path') {
          setPtouchPath(fullPath);
        } else if (key === 'printer_template_path') {
          setTemplatePath(fullPath);
        } else if (key === 'printer_temp_path') {
          setTempPath(fullPath);
        }
      }
    };
    
    input.click();
  };

  // Función para abrir explorador de archivos y seleccionar carpeta
  const handleFolderSelect = async () => {
    try {
      // Crear un input de archivo que acepte cualquier archivo para poder navegar
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*'; // Aceptar cualquier tipo de archivo
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          
          // Obtener la ruta del archivo usando File API
          const filePath = (file as any).path || file.name;
          
          // Si tenemos la ruta completa (en aplicaciones Electron o algunos navegadores)
          if ((file as any).path) {
            const dirPath = (file as any).path.replace(/[^\\]*$/, ''); // Quitar el nombre del archivo
            setBasePath(dirPath);
            showNotification(`Ruta establecida: ${dirPath}`, 'success');
          } else {
            // Fallback: pedir al usuario que escriba la ruta completa
            const userPath = prompt(
              `Has seleccionado el archivo: "${file.name}"\n\n` +
              `Para obtener la ruta completa, por favor:\n` +
              `1. Abre el explorador de archivos\n` +
              `2. Navega hasta donde quieres crear los directorios\n` +
              `3. Copia la ruta desde la barra de direcciones\n` +
              `4. Pégala aquí:\n\n` +
              `Ejemplo: C:\\DESARROLLO\\Femenine\\BROTHER_QL-800`,
              basePath
            );
            
            if (userPath && userPath.trim()) {
              const cleanPath = userPath.trim().replace(/[/]/g, '\\');
              // Asegurar que termine sin barra
              const finalPath = cleanPath.endsWith('\\') ? cleanPath.slice(0, -1) : cleanPath;
              setBasePath(finalPath);
              showNotification(`Ruta establecida: ${finalPath}`, 'success');
            }
          }
        }
      };
      
      // Agregar instrucciones antes de abrir
      const proceed = confirm(
        "💡 INSTRUCCIONES PARA SELECCIONAR CARPETA:\n\n" +
        "1. Se abrirá el explorador de archivos\n" +
        "2. Navega hasta la carpeta donde quieres crear Templates y Temp\n" +
        "3. Selecciona cualquier archivo de esa carpeta (solo para obtener la ubicación)\n" +
        "4. Si no hay archivos, puedes crear un archivo temporal\n\n" +
        "¿Continuar?"
      );
      
      if (proceed) {
        input.click();
      }
      
    } catch (error) {
      console.log('Selección cancelada por el usuario');
    }
  };

  // Función para ayudar al usuario a obtener la ruta copiándola del explorador
  const handleCopyPathFromExplorer = () => {
    const instructions = `📁 CÓMO OBTENER LA RUTA EXACTA:\n\n` +
      `1. Abre el Explorador de Archivos (Windows + E)\n` +
      `2. Navega hasta la carpeta donde quieres crear Templates y Temp\n` +
      `3. Haz clic en la barra de direcciones (donde aparece la ruta)\n` +
      `4. Copia la ruta completa (Ctrl + C)\n` +
      `5. Pégala en el campo de abajo\n\n` +
      `Ejemplo de ruta: C:\\DESARROLLO\\Femenine\\BROTHER_QL-800\n\n` +
      `¿Quieres que abra automáticamente el explorador de archivos?`;
    
    const openExplorer = confirm(instructions);
    
    if (openExplorer) {
      // Intentar abrir el explorador de archivos en Windows
      const link = document.createElement('a');
      link.href = 'file:///C:/';
      link.target = '_blank';
      link.click();
      
      showNotification('Explorador abierto. Copia la ruta y pégala en el campo.', 'info');
    }
  };

  const handleSave = async (key: string, value: string) => {
    if (!value.trim()) {
      showNotification('Por favor selecciona un archivo', 'warning');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      // Validar ruta si es P-Touch Editor
      if (key === 'printer_ptouch_path') {
        const validateResponse = await fetch('http://localhost:4000/api/config/validate-ptouch-path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ path: value })
        });

        if (!validateResponse.ok) {
          const result = await validateResponse.json();
          showNotification(result.message, 'error');
          return;
        }
      }

      // Guardar configuración
      const response = await fetch(`http://localhost:4000/api/config/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        setSystemConfig(prev => ({ ...prev, [key]: value }));
        showNotification('Configuración guardada correctamente', 'success');
        
        // Recargar estado de impresora
        setTimeout(loadConfiguration, 1000);
      } else {
        showNotification('Error guardando configuración', 'error');
      }

    } catch (error) {
      console.error('Error guardando configuración:', error);
      showNotification('Error guardando configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Nueva función para guardar toda la configuración de una vez
  const handleSaveAllConfiguration = async () => {
    if (!ptouchPath.trim() || !templatePath.trim() || !tempPath.trim()) {
      showNotification('Por favor completa todas las rutas antes de guardar', 'warning');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      // Guardar las tres configuraciones
      const savePromises = [
        fetch('http://localhost:4000/api/config/printer_ptouch_path', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ value: ptouchPath })
        }),
        fetch('http://localhost:4000/api/config/printer_template_path', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ value: templatePath })
        }),
        fetch('http://localhost:4000/api/config/printer_temp_path', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ value: tempPath })
        })
      ];

      const responses = await Promise.all(savePromises);
      
      if (responses.every(response => response.ok)) {
        setSystemConfig(prev => ({
          ...prev,
          printer_ptouch_path: ptouchPath,
          printer_template_path: templatePath,
          printer_temp_path: tempPath
        }));
        
        showNotification('Configuración completa guardada correctamente', 'success');
        
        // Recargar estado de impresora
        setTimeout(loadConfiguration, 1000);
      } else {
        showNotification('Error guardando algunas configuraciones', 'error');
      }

    } catch (error) {
      console.error('Error guardando configuración completa:', error);
      showNotification('Error guardando configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Función para crear directorios
  const handleCreateDirectories = async () => {
    if (!basePath.trim()) {
      showNotification('Por favor ingresa una ruta base', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/config/create-directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ basePath })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Auto-llenar las rutas basándose en la ruta base
        setTemplatePath(`${basePath}\\Templates\\etiqueta-producto-dk11201.lbx`);
        setTempPath(`${basePath}\\Temp\\label-data.csv`);
        
        showNotification('Directorios creados y rutas actualizadas', 'success');
      } else {
        showNotification('Error creando directorios', 'error');
      }
    } catch (error) {
      console.error('Error creando directorios:', error);
      showNotification('Error creando directorios', 'error');
    }
  };

  // Función para verificar configuración
  const verifyConfiguration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/print/printer/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.isConfigured) {
          showNotification('✅ Configuración verificada correctamente', 'success');
        } else {
          showNotification(`❌ Problemas encontrados: ${result.issues.join(', ')}`, 'error');
        }
      } else {
        showNotification('Error verificando configuración', 'error');
      }
    } catch (error) {
      console.error('Error verificando configuración:', error);
      showNotification('Error verificando configuración', 'error');
    }
  };

  const getStatusIcon = (issues: string[], path?: string) => {
    if (!path) return <X className="w-5 h-5 text-red-500" />;
    if (issues.length === 0) return <Check className="w-5 h-5 text-green-500" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (issues: string[], path?: string) => {
    if (!path) return 'border-red-200 bg-red-50';
    if (issues.length === 0) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        </div>
        <p className="text-gray-600">Configura la impresora Brother QL-800 para etiquetas con código de barras</p>
      </div>

      {/* Configuración de Impresora */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuración de Impresora Brother QL-800</h2>
          </div>
          
          {printerConfig && (
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(printerConfig.issues)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(printerConfig.issues)}
                <span className="font-medium">
                  {printerConfig.configured ? 'Configuración Correcta' : 'Configuración Incompleta'}
                </span>
              </div>
              
              {printerConfig.issues.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Problemas encontrados:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {printerConfig.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Configuración Simplificada - Un solo formulario */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">🛠️ Configuración de Rutas</h3>
            <div className="space-y-4">
              
              {/* Ruta Base */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📁 Ruta Base para Directorios
                </label>
                <input
                  type="text"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: C:\DESARROLLO\Femenine\BROTHER_QL-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los directorios Templates y Temp se crearán aquí
                </p>
              </div>

              {/* P-Touch Editor Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🖨️ Ruta del P-Touch Editor
                </label>
                <input
                  type="text"
                  value={ptouchPath}
                  onChange={(e) => setPtouchPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\Program Files (x86)\Brother\Ptedit54\ptedit54.exe"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ruta completa al ejecutable de P-Touch Editor
                </p>
              </div>

              {/* Template Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Ruta del Template (.lbx)
                </label>
                <input
                  type="text"
                  value={templatePath}
                  onChange={(e) => setTemplatePath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\DESARROLLO\Femenine\BROTHER_QL-800\Templates\etiqueta-producto-dk11201.lbx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Archivo template creado en P-Touch Editor para DK-11201
                </p>
              </div>

              {/* Temp CSV Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💾 Ruta del archivo CSV temporal
                </label>
                <input
                  type="text"
                  value={tempPath}
                  onChange={(e) => setTempPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\DESARROLLO\Femenine\BROTHER_QL-800\Temp\label-data.csv"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Archivo donde se guardan los datos para cada etiqueta
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={detectPtouchEditor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Auto-detectar
              </button>
              
              <button
                onClick={handleCreateDirectories}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Crear Directorios
              </button>
              
              <button
                onClick={handleSaveAllConfiguration}
                disabled={saving || !ptouchPath.trim() || !templatePath.trim() || !tempPath.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 ml-auto"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>

          {/* Verificación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">🔍 Verificar Configuración</h3>
            <p className="text-sm text-blue-700 mb-3">
              Después de guardar, verifica que todo esté configurado correctamente.
            </p>
            <button
              onClick={verifyConfiguration}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Verificar Configuración
            </button>
          </div>
        </div>

          {/* Configuración de Directorio Temporal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💾 Archivo Temporal (CSV)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Ruta completa donde se guardará el archivo CSV temporal
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={tempPath}
                onChange={(e) => setTempPath(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: C:\Temp\label-data.csv"
              />
              <button
                onClick={() => handleSave('printer_temp_path', tempPath)}
                disabled={saving || !tempPath.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>

          {/* Botón de verificar */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={loadConfiguration}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Verificar Configuración
            </button>
          </div>
        </div>
      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Pasos para configurar P-touch Editor Lite 5.4:</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li><strong>Detección automática:</strong> Usa el botón "Detectar P-touch Editor" arriba</li>
          <li><strong>Crear directorios:</strong> Especifica tu ruta base y usa el botón "Crear Directorios"</li>
          <li><strong>Buscar manualmente:</strong> Si la detección falla, usa los botones "Buscar"</li>
          <li><strong>Crear template:</strong> Sigue la guía detallada abajo</li>
          <li><strong>Verificar:</strong> Usa el botón "Verificar Configuración"</li>
          <li><strong>¡Listo!</strong> Ya puedes imprimir etiquetas desde el inventario</li>
        </ol>
      </div>

      {/* Guía para crear template DK-11201 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🏷️ Crear Template DK-11201 en P-touch Editor</h2>
          <p className="text-gray-600 mt-1">Guía paso a paso para crear tu template de etiquetas</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pasos detallados */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Pasos Detallados:</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <strong>Abrir P-touch Editor Lite 5.4</strong>
                    <p className="text-sm text-gray-600">Archivo → Nuevo → Etiqueta</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <strong>Seleccionar DK-11201</strong>
                    <p className="text-sm text-gray-600">Tamaño: 29mm × 90mm (Etiqueta estándar)</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <strong>Diseñar en 2 columnas</strong>
                    <p className="text-sm text-gray-600">45mm cada columna: Info + Código de barras</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <strong>Agregar campos de datos</strong>
                    <p className="text-sm text-gray-600">Usar "Insertar → Campo" para variables</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <strong>Guardar como Template</strong>
                    <p className="text-sm text-gray-600">Archivo → Guardar como Template → C:\Templates\dk11201-template.lbx</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Layout visual */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Layout Recomendado:</h3>
              <div className="border border-gray-300 bg-white p-4 rounded-lg">
                <div className="text-xs text-center text-gray-500 mb-2">DK-11201 (29mm × 90mm)</div>
                <div className="border border-gray-400 h-24 flex bg-gray-50">
                  {/* Columna izquierda */}
                  <div className="w-1/2 border-r border-gray-300 p-2 text-xs">
                    <div className="font-bold mb-1">[ProductName]</div>
                    <div className="text-xs mb-1">T:[Size] C:[Color]</div>
                    <div className="text-xs italic mb-1">[Brand]</div>
                    <div className="font-bold text-sm">$[Price]</div>
                  </div>
                  {/* Columna derecha */}
                  <div className="w-1/2 p-2 flex items-center justify-center text-xs">
                    <div className="transform rotate-90 text-center">
                      <div>||||||||||||</div>
                      <div>[Barcode]</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Campos Importantes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li><strong>ProductName:</strong> Nombre del producto</li>
                  <li><strong>Size:</strong> Talla (precedido por "T:")</li>
                  <li><strong>Color:</strong> Color (precedido por "C:")</li>
                  <li><strong>Brand:</strong> Marca</li>
                  <li><strong>Price:</strong> Precio (precedido por "$")</li>
                  <li><strong>Barcode:</strong> Código de barras CODE128 (rotado 90°)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <X className="w-5 h-5" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
