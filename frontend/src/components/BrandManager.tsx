import React, { useState } from 'react';

const BrandManager: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');


  // Modal para eliminar marca
  const deleteModal = modalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 cursor-pointer" onClick={e => {
      if (e.target === e.currentTarget) {
        setModalOpen(false); setDeleteIdx(null);
      }
    }}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Eliminar marca</h2>
        <p>¿Seguro que deseas eliminar esta marca?</p>
        <div className="flex gap-2 mt-4">
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => {
            if (deleteIdx !== null) {
              setBrands(brands.filter((_, i) => i !== deleteIdx));
            }
            setModalOpen(false);
            setDeleteIdx(null);
          }}>Sí, eliminar</button>
          <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={() => { setModalOpen(false); setDeleteIdx(null); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );

  const handleAddBrand = () => {
    if (newBrand.trim()) {
      setBrands([...brands, newBrand.trim()]);
      setNewBrand('');
    }
  };

  return (
  <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Gestión de Marcas</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newBrand}
          onChange={e => setNewBrand(e.target.value)}
          placeholder="Nueva marca"
          className="border border-gray-300 rounded-lg p-2 w-full"
        />
        <button
          onClick={handleAddBrand}
          className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold p-2 rounded-lg shadow"
        >Agregar</button>
      </div>
      <ul>
        {brands.map((brand, idx) => (
          <li key={idx} className="py-1 text-gray-700 flex justify-between items-center">
            <span>{brand}</span>
            <div className="flex gap-1">
              <button className="text-blue-600" onClick={() => {/* Opcional: edición */}}>Editar</button>
              <button className="text-red-600" onClick={() => { setModalOpen(true); setDeleteIdx(idx); }}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      {deleteModal}
    </div>
  );
};

export default BrandManager;
