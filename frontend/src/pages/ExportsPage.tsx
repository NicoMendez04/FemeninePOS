import React, { useState } from 'react';
import { Download, FileText, Database, Calendar, Package, ShoppingBag, Users, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../services/api';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  endpoint: string;
  filename: string;
  color: string;
}

const ExportsPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const exportOptions: ExportOption[] = [
    {
      id: 'products',
      title: 'Inventario Completo',
      description: 'Exportar todos los productos con su información completa',
      icon: Package,
      endpoint: '/products',
      filename: 'inventario_completo',
      color: 'blue'
    },
    {
      id: 'sales',
      title: 'Historial de Ventas',
      description: 'Exportar todas las ventas realizadas con detalles',
      icon: ShoppingBag,
      endpoint: '/sales',
      filename: 'historial_ventas',
      color: 'green'
    },
    {
      id: 'sales_summary',
      title: 'Resumen de Ventas por Período',
      description: 'Exportar resumen de ventas agrupado por fecha',
      icon: Calendar,
      endpoint: '/sales/summary',
      filename: 'resumen_ventas',
      color: 'purple'
    },
    {
      id: 'users',
      title: 'Usuarios del Sistema',
      description: 'Exportar lista de usuarios y sus roles',
      icon: Users,
      endpoint: '/users',
      filename: 'usuarios_sistema',
      color: 'indigo'
    },
    {
      id: 'activity_logs',
      title: 'Registro de Actividades',
      description: 'Exportar logs de actividades del sistema',
      icon: Activity,
      endpoint: '/logs',
      filename: 'registro_actividades',
      color: 'gray'
    },
    {
      id: 'low_stock',
      title: 'Productos con Stock Bajo',
      description: 'Exportar productos que necesitan reposición',
      icon: Database,
      endpoint: '/products/low-stock',
      filename: 'stock_bajo',
      color: 'red'
    }
  ];

  const exportToExcel = async (option: ExportOption, format: 'xlsx' | 'csv') => {
    setLoading(option.id);
    try {
      let url = option.endpoint;
      
      // Agregar parámetros de fecha si están definidos y es relevante para ventas
      if ((option.id === 'sales' || option.id === 'sales_summary') && dateRange.startDate && dateRange.endDate) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }

      const response = await api.get(url);
      let data = response.data;

      // Procesar datos específicos según el tipo de exportación
      switch (option.id) {
        case 'products':
          data = data.map((product: any) => ({
            'SKU': product.sku,
            'Nombre': product.name,
            'Descripción': product.description,
            'Precio de Compra': product.costPrice,
            'Precio de Venta': product.salePrice,
            'Stock': product.stockCached,
            'Stock Mínimo': product.stockMin,
            'Categoría': product.category?.name || 'Sin categoría',
            'Marca': product.brand?.name || 'Sin marca',
            'Talla': product.size,
            'Color': product.color,
            'Estado': product.isActive ? 'Activo' : 'Inactivo',
            'Fecha de Creación': new Date(product.createdAt).toLocaleDateString('es-ES'),
            'Última Actualización': new Date(product.updatedAt).toLocaleDateString('es-ES')
          }));
          break;

        case 'sales':
          data = data.map((sale: any) => ({
            'ID Venta': sale.id,
            'Total': sale.total,
            'Descuento': sale.discount || 0,
            'Método de Pago': sale.paymentMethod,
            'Usuario': sale.user?.name || 'N/A',
            'Email Usuario': sale.user?.email || 'N/A',
            'Fecha': new Date(sale.createdAt).toLocaleDateString('es-ES'),
            'Hora': new Date(sale.createdAt).toLocaleTimeString('es-ES'),
            'Productos': sale.items?.map((item: any) => `${item.product?.name} (${item.quantity})`).join(', ') || 'N/A'
          }));
          break;

        case 'users':
          data = data.map((user: any) => ({
            'ID': user.id,
            'Nombre': user.name,
            'Email': user.email,
            'Rol': user.role,
            'Estado': user.isActive ? 'Activo' : 'Inactivo',
            'Fecha de Registro': new Date(user.createdAt).toLocaleDateString('es-ES'),
            'Último Acceso': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'
          }));
          break;

        case 'activity_logs':
          data = data.map((log: any) => ({
            'ID': log.id,
            'Acción': log.action,
            'Usuario': log.user?.name || 'Sistema',
            'Email Usuario': log.user?.email || 'N/A',
            'Detalles': log.details || 'N/A',
            'IP': log.ipAddress || 'N/A',
            'Fecha': new Date(log.createdAt).toLocaleDateString('es-ES'),
            'Hora': new Date(log.createdAt).toLocaleTimeString('es-ES')
          }));
          break;

        case 'low_stock':
          data = data.map((product: any) => ({
            'SKU': product.sku,
            'Nombre': product.name,
            'Stock Actual': product.stockCached,
            'Stock Mínimo': product.stockMin,
            'Diferencia': (product.stockCached || 0) - (product.stockMin || 0),
            'Precio de Compra': product.costPrice,
            'Valor Total Stock': (product.stockCached || 0) * (product.costPrice || 0),
            'Categoría': product.category?.name || 'Sin categoría',
            'Marca': product.brand?.name || 'Sin marca'
          }));
          break;
      }

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');

      // Generar archivo
      const fileName = `${option.filename}_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'xlsx') {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(dataBlob, `${fileName}.xlsx`);
      } else {
        const csvData = XLSX.utils.sheet_to_csv(ws);
        const dataBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        saveAs(dataBlob, `${fileName}.csv`);
      }

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos. Por favor intenta nuevamente.');
    } finally {
      setLoading(null);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      green: 'border-green-200 bg-green-50 text-green-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      gray: 'border-gray-200 bg-gray-50 text-gray-700',
      red: 'border-red-200 bg-red-50 text-red-700'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getButtonColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      gray: 'bg-gray-600 hover:bg-gray-700',
      red: 'bg-red-600 hover:bg-red-700'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Exportar Datos
        </h1>
        <p className="text-gray-600">
          Exporta datos del sistema en formato Excel (.xlsx) o CSV para análisis externo
        </p>
      </div>

      {/* Filtros de fecha para ventas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Filtros de Fecha (para ventas)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Opciones de exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = loading === option.id;
          
          return (
            <div key={option.id} className={`border-2 rounded-lg p-6 ${getColorClasses(option.color)}`}>
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-white shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                </div>
              </div>
              
              <p className="text-sm mb-4 opacity-80">
                {option.description}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => exportToExcel(option, 'xlsx')}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-md transition-colors flex items-center justify-center gap-2 ${getButtonColorClasses(option.color)} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Excel
                </button>
                
                <button
                  onClick={() => exportToExcel(option, 'csv')}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-md transition-colors flex items-center justify-center gap-2 ${getButtonColorClasses(option.color)} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Información sobre las exportaciones
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los archivos Excel (.xlsx) mantienen el formato y son ideales para análisis</li>
          <li>• Los archivos CSV son compatibles con cualquier aplicación de hojas de cálculo</li>
          <li>• Los filtros de fecha solo aplican para exportaciones de ventas</li>
          <li>• Los datos se exportan tal como están almacenados en la base de datos</li>
          <li>• Puedes abrir los archivos en Excel, Google Sheets, LibreOffice, etc.</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportsPage;
