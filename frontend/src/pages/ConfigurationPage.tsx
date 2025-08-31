// Mover la función detectPtouchEditor después de showNotification
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
  // ...existing code...
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const handleEditConnection = () => {
    setFieldsLocked(false);
    showNotification('Puedes editar la configuración nuevamente.', 'info');
  };
  // Refs para los input file
  const ptouchFileRef = React.useRef<HTMLInputElement>(null);
  const templateFileRef = React.useRef<HTMLInputElement>(null);
  const tempFileRef = React.useRef<HTMLInputElement>(null);

  // Handlers para seleccionar archivo y guardar ruta
  const handleFileSelect = (type: 'ptouch' | 'template' | 'temp', event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (type === 'ptouch') setPtouchPath(file.name);
  if (type === 'template') setTemplatePath(file.name);
  if (type === 'temp') setTempPath(file.name);
  };
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  
  // Estados locales para los inputs del formulario unificado
  const [ptouchPath, setPtouchPath] = useState<string>('');
  const [templatePath, setTemplatePath] = useState<string>('');
  const [tempPath, setTempPath] = useState<string>('');
  const [basePath, setBasePath] = useState<string>('C:\\DESARROLLO\\Femenine');
  
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [configResponse, printerResponse, verifyResponse] = await Promise.all([
        fetch('http://localhost:4000/api/config', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4000/api/printer/configuration', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4000/api/print/verify', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (configResponse.ok) {
        const config = await configResponse.json();
        setSystemConfig(config);
        setPtouchPath(config.PTOUCH_PATH || '');
        setTemplatePath(config.TEMPLATE_PATH || '');
        setTempPath(config.TEMP_DATA_PATH || '');
        setBasePath(config.BASE_PATH || 'C:\\DESARROLLO\\Femenine');
      }

      if (printerResponse.ok) {
        const printerData = await printerResponse.json();
        setPrinterConfig(printerData);
      }

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        setFieldsLocked(!!verifyData.configured);
      } else {
        setFieldsLocked(false);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      showNotification('Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };
  // ...existing code...
  // ...existing code...

  const saveAllConfiguration = async () => {
    if (!ptouchPath || !templatePath || !tempPath) {
      showNotification('Por favor, completa todas las rutas requeridas', 'warning');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const configData = {
        PTOUCH_PATH: ptouchPath,
        TEMPLATE_PATH: templatePath,
        TEMP_DATA_PATH: tempPath,
        BASE_PATH: basePath
      };

      const response = await fetch('http://localhost:4000/api/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        showNotification('Configuración guardada exitosamente', 'success');
        // Verificar configuración después de guardar
        const verifyResponse = await fetch('http://localhost:4000/api/print/verify', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (verifyResponse.ok) {
          const result = await verifyResponse.json();
          await loadConfiguration(); // Recargar para mostrar estado actualizado
          if (result.configured) {
            setFieldsLocked(true);
            showNotification('Configuración verificada y bloqueada correctamente', 'success');
          } else {
            setFieldsLocked(false);
            showNotification(`Configuración incompleta: ${result.issues.join(', ')}`, 'warning');
          }
        } else {
          setFieldsLocked(false);
          showNotification('Error al verificar la configuración', 'error');
        }
      } else {
        showNotification('Error al guardar la configuración', 'error');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      showNotification('Error al guardar la configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const verifyConfiguration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/print/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        await loadConfiguration(); // Recargar configuración para mostrar el estado actualizado
        
        if (result.configured) {
          showNotification('Configuración verificada correctamente', 'success');
        } else {
          showNotification(`Configuración incompleta: ${result.issues.join(', ')}`, 'warning');
        }
      } else {
        showNotification('Error al verificar la configuración', 'error');
      }
    } catch (error) {
      console.error('Error verifying configuration:', error);
      showNotification('Error al verificar la configuración', 'error');
    }
  };

  const getStatusColor = (issues: string[]) => {
    if (issues.length === 0) return 'border-green-200 bg-green-50';
    return 'border-red-200 bg-red-50';
  };

  const getStatusIcon = (issues: string[]) => {
    if (issues.length === 0) return <Check className="w-5 h-5 text-green-600" />;
    return <X className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role.toLowerCase() !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700">Acceso denegado</p>
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
        <p className="text-gray-600">Configura las rutas para la impresión de etiquetas</p>
      </div>

      {/* Estado actual de la configuración */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Estado de la Configuración</h2>
          </div>
          {printerConfig && (
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(printerConfig.issues)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(printerConfig.issues)}
                <span className="font-medium">
                  {printerConfig.configured ? 'Configuración Completa' : 'Configuración Incompleta'}
                </span>
              </div>
              {printerConfig.issues.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700 mb-1">Problemas encontrados:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {printerConfig.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulario unificado de configuración */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">📋 Configuración de Rutas</h3>
            <div className="space-y-4">
              
              {/* Ruta base personalizable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta Base del Proyecto:
                </label>
                <input
                  type="text"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\DESARROLLO\Femenine"
                  disabled={fieldsLocked}
                />
              </div>

              {/* P-touch Editor Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta del P-touch Editor:
                </label>
                <input
                  type="text"
                  value={ptouchPath}
                  onChange={(e) => setPtouchPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\Program Files (x86)\Brother\Ptouch Editor 5.4\PtouchEditor.exe"
                  disabled={fieldsLocked}
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="file"
                    ref={ptouchFileRef}
                    style={{ display: 'none' }}
                    accept=".exe"
                    onChange={e => handleFileSelect('ptouch', e)}
                  />
                  <button
                    type="button"
                    onClick={() => ptouchFileRef.current?.click()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                    disabled={fieldsLocked}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Buscar
                  </button>
                </div>
              </div>

              {/* Template Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta del Template:
                </label>
                <input
                  type="text"
                  value={templatePath}
                  onChange={(e) => setTemplatePath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\Templates\dk11201-template.lbx"
                  disabled={fieldsLocked}
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="file"
                    ref={templateFileRef}
                    style={{ display: 'none' }}
                    accept=".lbx"
                    onChange={e => handleFileSelect('template', e)}
                  />
                  <button
                    type="button"
                    onClick={() => templateFileRef.current?.click()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                    disabled={fieldsLocked}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Buscar
                  </button>
                </div>
              </div>

              {/* Temp Data Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta de Datos Temporales:
                </label>
                <input
                  type="text"
                  value={tempPath}
                  onChange={(e) => setTempPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\TempData\labels.csv"
                  disabled={fieldsLocked}
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="file"
                    ref={tempFileRef}
                    style={{ display: 'none' }}
                    onChange={e => handleFileSelect('temp', e)}
                  />
                  <button
                    type="button"
                    onClick={() => tempFileRef.current?.click()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                    disabled={fieldsLocked}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {/* Botón único para guardar todas las configuraciones */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={saveAllConfiguration}
                disabled={fieldsLocked || saving || !ptouchPath || !templatePath || !tempPath}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar configuración'
                )}
              </button>
              {fieldsLocked && (
                <button
                  type="button"
                  onClick={handleEditConnection}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-medium"
                >
                  Editar conexión
                </button>
              )}
            </div>
          </div>

          {/* Información de ayuda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Crear Directorios" genera las carpetas necesarias en tu ruta base</li>
              <li>• Asegúrate de crear el template DK-11201 en P-touch Editor (guía abajo)</li>
              <li>• "Verificar Configuración" comprueba que todo esté listo para imprimir</li>
              <li>• Todas las rutas se guardan con un solo botón "Guardar Configuración"</li>
            </ul>
          </div>
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
                      <p className="text-sm text-gray-600">Archivo → Guardar como Template → nombre: dk11201-template.lbx</p>
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
        </div>

      {/* Notificación */}
      {notification ? (
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
      ) : null}
    </div>
  );
};

export default ConfigurationPage;