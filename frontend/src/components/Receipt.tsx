import React from 'react';
import { X, Printer } from 'lucide-react';

interface ReceiptItem {
  id: number;
  quantity: number;
  price: number;
  discount: number;
  product: {
    id: number;
    name: string;
    sku: string;
    color?: string;
    size?: string;
  };
}

interface ReceiptData {
  folio: number | string;
  items: ReceiptItem[];
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  taxIncluded?: boolean;
  total: number;
  date: string | Date;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReceiptProps {
  receiptData: ReceiptData | null;
  isVisible: boolean;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ receiptData, isVisible, onClose }) => {
  if (!isVisible || !receiptData) return null;

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFolio = (id: number | string): string => {
    if (typeof id === 'string' && id.startsWith('B')) {
      return id;
    }
    return `B${id.toString().padStart(6, '0')}`;
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>
      
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white my-8">
        {/* Header del modal */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h3 className="text-lg font-medium text-gray-900">Boleta de Venta</h3>
          <div className="flex gap-2">
            <button
              onClick={printReceipt}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
              title="Imprimir boleta"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Contenido de la boleta */}
        <div className="bg-white p-8 print:p-4" id="receipt-content">
          {/* Header de la empresa */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">FEMENINE</h1>
            <p className="text-gray-600">Boleta de Venta</p>
            <div className="border-b-2 border-gray-300 mt-4"></div>
          </div>

          {/* Información de la venta */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-semibold">Boleta N°:</span> {formatFolio(receiptData.folio)}</p>
                <p><span className="font-semibold">Fecha:</span> {formatDate(receiptData.date)}</p>
              </div>
              <div>
                {receiptData.user && (
                  <p><span className="font-semibold">Vendedor:</span> {receiptData.user.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Productos</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-center py-2">Cant.</th>
                  <th className="text-right py-2">Precio Unit.</th>
                  <th className="text-right py-2">Descuento</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Agrupar items por producto para mostrar correctamente en la boleta
                  const itemsGrouped = receiptData.items.reduce((groups: any, currentItem: any) => {
                    const key = `${currentItem.product.id}-${currentItem.product.salePrice || currentItem.price}-${currentItem.discount}`;
                    if (!groups[key]) {
                      groups[key] = {
                        id: currentItem.product.id,
                        product: currentItem.product,
                        quantity: 0,
                        price: currentItem.product.salePrice || currentItem.price,
                        discount: currentItem.discount
                      };
                    }
                    groups[key].quantity += 1;
                    return groups;
                  }, {});
                  
                  return Object.values(itemsGrouped).map((item: any, index: number) => {
                    const subtotal = (item.quantity * item.price) - (item.discount * item.quantity);
                    return (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-xs text-gray-500">
                              SKU: {item.product.sku}
                              {item.product.color && ` | Color: ${item.product.color}`}
                              {item.product.size && ` | Talla: ${item.product.size}`}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.price)}</td>
                        <td className="text-right py-2">
                          {item.discount > 0 ? `-${formatCurrency(item.discount * item.quantity)}` : '-'}
                        </td>
                        <td className="text-right py-2 font-medium">{formatCurrency(subtotal)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Cantidad de productos:</span>
              <span className="text-sm">{receiptData.items.length}</span>
            </div>
            
            {/* Subtotal sin IVA */}
            {receiptData.subtotal !== undefined && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Subtotal {receiptData.taxIncluded ? '(sin IVA)' : ''}:</span>
                <span className="text-sm">{formatCurrency(receiptData.subtotal)}</span>
              </div>
            )}
            
            {/* IVA */}
            {receiptData.taxAmount !== undefined && receiptData.taxRate !== undefined && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">IVA ({(receiptData.taxRate * 100).toFixed(0)}%):</span>
                <span className="text-sm">{formatCurrency(receiptData.taxAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <div className="border-t border-gray-300 pt-4">
              <p>Gracias por su compra</p>
              <p>Sistema FEMENINE - {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
