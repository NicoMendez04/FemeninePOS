import React, { useState } from 'react';
// Limpieza y corrección de lógica de edición y eliminación

const CategoryManager: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  // Modal para eliminar categoría
  // Solo un bloque, bien cerrado y funcional
  const deleteModal = modalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 cursor-pointer" onClick={(e) => {
      if (e.target === e.currentTarget) {
        setModalOpen(false); setDeleteIdx(null);
      }
    }}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Eliminar categoría</h2>
        <p>¿Seguro que deseas eliminar esta categoría?</p>
        <div className="flex gap-2 mt-4">
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => {
            if (deleteIdx !== null) {
              setCategories(categories.filter((_, i) => i !== deleteIdx));
            }
            setModalOpen(false);
            setDeleteIdx(null);
          }}>Sí, eliminar</button>
          <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={() => { setModalOpen(false); setDeleteIdx(null); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );

  return (
  <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Gestión de Categorías</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder="Nueva categoría"
          className="border border-gray-300 rounded-lg p-2 w-full"
        />
        <button
          onClick={handleAddCategory}
          className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold p-2 rounded-lg shadow"
        >Agregar</button>
      </div>
      <ul>
        {categories.map((category, idx) => (
          <li key={idx} className="py-1 text-gray-700 flex justify-between items-center">
            {editingIdx === idx ? (
              <>
                <input className="border rounded px-1 mr-2 text-sm" value={editingValue} onChange={e => setEditingValue(e.target.value)} />
                <button className="text-green-600 mr-1" onClick={() => {
                  const newCats = [...categories];
                  newCats[idx] = editingValue;
                  setCategories(newCats);
                  setEditingIdx(null);
                }}>✔</button>
                <button className="text-gray-400" onClick={() => setEditingIdx(null)}>✖</button>
              </>
            ) : (
              <>
                <span>{category}</span>
                <div className="flex gap-1">
                  <button className="text-blue-600" onClick={() => { setEditingIdx(idx); setEditingValue(category); }}>Editar</button>
                  <button className="text-red-600" onClick={() => { setModalOpen(true); setDeleteIdx(idx); }}>Eliminar</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {deleteModal}
    </div>
  );

}

export default CategoryManager;
