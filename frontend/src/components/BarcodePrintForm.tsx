import React, { useState } from 'react';

interface BarcodePrintButtonProps {
  text: string;
  barcode: string;
}

const BarcodePrintButton: React.FC<BarcodePrintButtonProps> = ({ text, barcode }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handlePrint = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/print/barcode-custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, barcode })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setNotification('Etiqueta impresa correctamente en Brother QL-800');
      } else {
        setNotification(result.message || 'Error al imprimir');
      }
    } catch (error) {
      setNotification('Error de red o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <button
        type="button"
        onClick={handlePrint}
        disabled={loading || !text || !barcode}
        className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 font-medium mb-2"
      >
        {loading ? 'Imprimiendo en Brother QL-800...' : 'Imprimir en Brother QL-800'}
      </button>
      {notification && (
        <div className="mt-2 p-2 rounded bg-blue-50 text-blue-800 border border-blue-200 text-sm">{notification}</div>
      )}
    </div>
  );
};

export default BarcodePrintButton;
