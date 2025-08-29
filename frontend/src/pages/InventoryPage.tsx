import React, { useState, useEffect } from 'react';
import ProductDetailsModal from '../components/ProductDetailsModal';
import { Plus, Search, Package, Tag, Truck, AlertTriangle, Trash2, Edit, RefreshCw, Eye, EyeOff, Archive, TrendingUp, TrendingDown, DollarSign, Box, Palette, Ruler, X } from 'lucide-react';
import { getProducts, getBrands, getCategories, getSuppliers, createProducts, deleteProduct, reactivateProduct, checkProductDeletability } from '../services/api';
import { Product, ProductFormData, Brand, Category, Supplier } from '../types';
import ProductForm from '../components/ProductForm';
import Notification from '../components/Notification';
import { useAuth } from '../contexts/AuthContext';

const InventoryPage: React.FC = () => {
	const { user } = useAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [brandFilter, setBrandFilter] = useState<number | 'none' | ''>('');
	const [categoryFilter, setCategoryFilter] = useState<number | 'none' | ''>('');
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	
	// Estados para notificaciones y eliminación
	const [notification, setNotification] = useState<{
		message: string;
		type: 'success' | 'error' | 'warning' | 'info';
	} | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const [showInactive, setShowInactive] = useState(false);
	const [productDeletability, setProductDeletability] = useState<{ [key: number]: { canBeDeleted: boolean; hasHistory: boolean } }>({});
	
	// Estados para edición y restock
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showRestockModal, setShowRestockModal] = useState(false);
	const [restockProduct, setRestockProduct] = useState<Product | null>(null);
	const [restockQuantity, setRestockQuantity] = useState<number>(0);

	// Función para mostrar notificación
	const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	// Función para eliminar producto
	const handleDeleteProduct = async (productId: number) => {
		try {
			const result = await deleteProduct(productId);
			setConfirmDeleteId(null);
			
			// Actualizar el estado del producto según el tipo de eliminación
			if (result.type === 'deleted') {
				// Si fue eliminado físicamente, remover de la lista
				setProducts(prev => prev.filter(p => p.id !== productId));
				showNotification('✅ Producto eliminado exitosamente', 'success');
			} else if (result.type === 'deactivated') {
				// Si fue desactivado, actualizar su estado isActive
				setProducts(prev => prev.map(p => 
					p.id === productId ? { ...p, isActive: false } : p
				));
				showNotification('⚠️ Producto desactivado (tenía historial de ventas)', 'warning');
			}
		} catch (error) {
			console.error('Error eliminando producto:', error);
			showNotification('❌ Error al eliminar el producto', 'error');
		}
	};

	// Función para reactivar producto
	const handleReactivateProduct = async (productId: number) => {
		try {
			await reactivateProduct(productId);
			// Actualizar el estado del producto localmente
			setProducts(prev => prev.map(p => 
				p.id === productId ? { ...p, isActive: true } : p
			));
			showNotification('✅ Producto reactivado exitosamente', 'success');
		} catch (error) {
			console.error('Error reactivando producto:', error);
			showNotification('❌ Error al reactivar el producto', 'error');
		}
	};

	// Función para abrir modal de edición
	const handleEditProduct = (product: Product) => {
		setEditingProduct(product);
		setShowEditModal(true);
	};

	// Función para guardar cambios de edición
	const handleSaveEdit = async (updatedProductData: any) => {
		if (!editingProduct) return;

		console.log('Saving edit for product:', editingProduct.id);
		console.log('Updated product data:', updatedProductData);

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`http://localhost:4000/api/products/${editingProduct.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(updatedProductData)
			});

			console.log('Response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Error response:', errorText);
				throw new Error('Error al actualizar producto');
			}

			const updatedProduct = await response.json();
			console.log('Updated product from server:', updatedProduct);
			
			// Recargar todos los datos para asegurar que estén actualizados
			await loadData();
			
			setShowEditModal(false);
			setEditingProduct(null);
			showNotification('✅ Producto actualizado exitosamente', 'success');
		} catch (error) {
			console.error('Error actualizando producto:', error);
			showNotification('❌ Error al actualizar el producto', 'error');
		}
	};

	// Función para abrir modal de restock
	const handleOpenRestock = (product: Product) => {
		setRestockProduct(product);
		setRestockQuantity(0);
		setShowRestockModal(true);
	};

	// Función para confirmar restock
	const handleConfirmRestock = async () => {
		if (!restockProduct || restockQuantity <= 0) return;

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`http://localhost:4000/api/products/${restockProduct.id}/restock`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ quantity: restockQuantity })
			});

			if (!response.ok) {
				throw new Error('Error al actualizar stock');
			}

			// Actualizar el stock localmente
			setProducts(prev => prev.map(p => 
				p.id === restockProduct.id 
					? { ...p, stockCached: p.stockCached + restockQuantity }
					: p
			));
			
			setShowRestockModal(false);
			setRestockProduct(null);
			setRestockQuantity(0);
			showNotification(`✅ Stock actualizado: +${restockQuantity} unidades`, 'success');
		} catch (error) {
			console.error('Error actualizando stock:', error);
			showNotification('❌ Error al actualizar el stock', 'error');
		}
	};

	const loadProductDeletability = async (products: Product[]) => {
		try {
			const activeProducts = products.filter(p => p.isActive);
			
			const deletabilityPromises = activeProducts
				.map(async (product) => {
					try {
						const info = await checkProductDeletability(product.id);
						return { id: product.id, info };
					} catch (error) {
						console.error(`Error checking deletability for product ${product.id}:`, error);
						return { id: product.id, info: { canBeDeleted: false, hasHistory: true } };
					}
				});

			const results = await Promise.all(deletabilityPromises);
			const deletabilityMap: { [key: number]: { canBeDeleted: boolean; hasHistory: boolean } } = {};
			
			results.forEach(({ id, info }) => {
				deletabilityMap[id] = info;
			});
			
			setProductDeletability(deletabilityMap);
		} catch (error) {
			console.error('Error loading product deletability:', error);
		}
	};

	const loadData = async () => {
		try {
			setLoading(true);
			// Siempre cargar todos los productos (activos e inactivos) para las estadísticas
			const allProducts = await getProducts(true);
			setProducts(allProducts);
			setBrands(await getBrands());
			setCategories(await getCategories());
			setSuppliers(await getSuppliers());
			setError(null);
			
			// Cargar información de eliminabilidad para productos activos
			await loadProductDeletability(allProducts);
		} catch (err) {
			setError('Error al cargar productos');
		} finally {
			setLoading(false);
		}
	};

	// Función helper para obtener el icono y texto de eliminación
	const getDeleteAction = (productId: number) => {
		const deletability = productDeletability[productId];
		
		if (!deletability) {
			// Si no tenemos información aún, mostrar el icono de carga
			return {
				icon: <Archive className="h-4 w-4" />,
				text: 'Cargando...',
				title: 'Verificando producto...',
				className: 'text-gray-400'
			};
		}

		if (deletability.canBeDeleted) {
			return {
				icon: <Trash2 className="h-4 w-4" />,
				text: 'Eliminar',
				title: 'Eliminar producto permanentemente',
				className: 'text-red-600 hover:text-red-900'
			};
		} else {
			return {
				icon: <Archive className="h-4 w-4" />,
				text: 'Ocultar',
				title: 'Desactivar producto (tiene historial)',
				className: 'text-orange-600 hover:text-orange-900'
			};
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	// Verificar si el usuario es admin
	const isAdmin = user?.role === 'ADMIN';

	const filteredProducts = products.filter(product => {
		// Filtrar por estado activo/inactivo
		// Los vendedores solo pueden ver productos activos
		const matchesActiveState = isAdmin 
			? (showInactive ? !product.isActive : product.isActive)
			: product.isActive;
		
		const matchesSearch = !searchTerm || 
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(product.brand && product.brand.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(product.category && product.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

		let matchesBrand = true;
		if (brandFilter === 'none') {
			matchesBrand = !product.brand;
		} else if (brandFilter) {
		matchesBrand = !!product.brand && product.brand.id === brandFilter;
		}

		let matchesCategory = true;
		if (categoryFilter === 'none') {
			matchesCategory = !product.category;
		} else if (categoryFilter) {
		matchesCategory = !!product.category && product.category.id === categoryFilter;
		}

		return matchesActiveState && matchesSearch && matchesBrand && matchesCategory;
	});

	const hasLowStock = (product: Product): boolean => {
		return product.stockCached <= product.stockMin;
	};

	// Calcular estadísticas
	const totalProducts = products.length;
	const activeProducts = products.filter(p => p.isActive).length;
	const inactiveProducts = products.filter(p => !p.isActive).length;
	const lowStockCount = products.filter(p => p.isActive && hasLowStock(p)).length;

	return (
		<div className="p-6 bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen">
			{/* Header con gradiente y estadísticas */}
			<div className="mb-8">
				<div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div className="mb-4 lg:mb-0">
							<h1 className="text-3xl font-bold mb-2">
								{showInactive ? 'Productos Inactivos' : 'Inventario de Productos'}
							</h1>
							<p className="text-indigo-100">
								{showInactive 
									? 'Productos desactivados que puedes reactivar' 
									: 'Gestiona tu inventario y controla el stock de productos'
								}
							</p>
						</div>
						
						<div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
								<Package className="h-6 w-6 mx-auto mb-2 text-indigo-200" />
								<div className="text-2xl font-bold">{isAdmin ? totalProducts : activeProducts}</div>
								<div className="text-xs text-indigo-200">{isAdmin ? 'Total Productos' : 'Productos'}</div>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
								<AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-200" />
								<div className="text-2xl font-bold text-red-200">{lowStockCount}</div>
								<div className="text-xs text-indigo-200">Stock Bajo</div>
							</div>
							{isAdmin && (
								<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
									<Tag className="h-6 w-6 mx-auto mb-2 text-green-200" />
									<div className="text-2xl font-bold">{activeProducts}</div>
									<div className="text-xs text-indigo-200">Activos</div>
								</div>
							)}
							{isAdmin && (
								<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
									<Archive className="h-6 w-6 mx-auto mb-2 text-orange-200" />
									<div className="text-2xl font-bold">{inactiveProducts}</div>
									<div className="text-xs text-indigo-200">Inactivos</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Filtros y controles modernos */}
			<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 mb-1">Filtros y Búsqueda</h2>
						<p className="text-sm text-gray-500">Encuentra productos específicos usando los filtros</p>
					</div>
					{isAdmin && (
						<button
							onClick={() => setShowInactive(!showInactive)}
							className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
								showInactive
									? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
									: 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
							}`}
						>
							{showInactive ? <Package className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							<span>{showInactive ? 'Ver productos activos' : 'Ver productos inactivos'}</span>
						</button>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Búsqueda */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Buscar productos
						</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
							<input
							type="text"
							value={searchTerm.replace(/[,']/g, '-')}
							onChange={(e) => setSearchTerm(e.target.value.replace(/[,']/g, '-'))}
							placeholder="Buscar por nombre, SKU, marca o categoría..."
							className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
						/>
					</div>
				</div>					{/* Filtro por Marca */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Marca
						</label>
						<div className="relative">
							<Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
							<select 
								value={brandFilter}
								onChange={(e) => {
									const val = e.target.value;
									if (val === '') setBrandFilter('');
									else if (val === 'none') setBrandFilter('none');
									else setBrandFilter(Number(val));
								}}
								className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
							>
								<option value="">Todas las marcas</option>
								<option value="none">Sin marca</option>
								{brands.map(brand => (
									<option key={brand.id} value={brand.id}>{brand.name}</option>
								))}
							</select>
						</div>
					</div>

					{/* Filtro por Categoría */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Categoría
						</label>
						<div className="relative">
							<Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
							<select 
								value={categoryFilter}
								onChange={(e) => {
									const val = e.target.value;
									if (val === '') setCategoryFilter('');
									else if (val === 'none') setCategoryFilter('none');
									else setCategoryFilter(Number(val));
								}}
								className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
							>
								<option value="">Todas las categorías</option>
								<option value="none">Sin categoría</option>
								{categories.map(category => (
									<option key={category.id} value={category.id}>{category.name}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Limpiar filtros */}
				{(searchTerm || brandFilter || categoryFilter) && (
					<div className="mt-4 flex justify-end">
						<button
							onClick={() => {
								setSearchTerm('');
								setBrandFilter('');
								setCategoryFilter('');
							}}
							className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
						>
							<X className="h-4 w-4" />
							<span>Limpiar filtros</span>
						</button>
					</div>
				)}
			</div>

			{/* Content */}
			{loading ? (
				<div className="bg-white rounded-lg shadow p-8 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
					<p className="mt-4 text-gray-600">Cargando productos...</p>
				</div>
			) : error ? (
				<div className="bg-white rounded-lg shadow p-8 text-center">
					<div className="text-red-600 mb-4">
						<Package className="h-12 w-12 mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar productos</h3>
					<p className="text-gray-600 mb-4">{error}</p>
					  {/* Botón de reintentar eliminado, función loadData no existe */}
				</div>
			) : filteredProducts.length === 0 ? (
				<div className="bg-white rounded-lg shadow p-8 text-center">
					<div className="text-gray-400 mb-4">
						<Package className="h-12 w-12 mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{showInactive ? 'No hay productos inactivos' : 'No hay productos'}
					</h3>
					<p className="text-gray-600 mb-4">
						{searchTerm || brandFilter || categoryFilter 
							? `No se encontraron productos ${showInactive ? 'inactivos' : ''} con los filtros aplicados`
							: showInactive 
								? 'Todos los productos están activos. ¡Excelente gestión!'
								: 'Aún no hay productos registrados'
						}
					</p>
					  {/* Botón de crear producto eliminado */}
				</div>
			) : (
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
					<div className="divide-y divide-gray-100">
						{filteredProducts.map((product) => (
							<div key={product.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
								<div className="flex items-center justify-between">
									{/* Información principal del producto */}
									<div className="flex items-center space-x-4 flex-1">
										{/* Icono de estado */}
										<div className="flex-shrink-0">
											{hasLowStock(product) ? (
												<div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
													<AlertTriangle className="h-5 w-5 text-red-500" />
												</div>
											) : (
												<div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
													<Package className="h-5 w-5 text-green-500" />
												</div>
											)}
										</div>

										{/* Detalles del producto */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-gray-900 truncate">
														{product.name}
													</h3>
													{product.description && (
														<p className="text-sm text-gray-600 truncate mt-1">
															{product.description}
														</p>
													)}
													<div className="flex items-center space-x-4 mt-2">
														<div className="flex items-center space-x-1">
															<Box className="h-4 w-4 text-gray-400" />
															<span className="text-sm font-mono text-gray-700">
																{product.sku}
															</span>
														</div>
														<span className="text-sm text-gray-500">•</span>
														<span className="text-sm text-gray-600">
															{product.baseCode}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Información secundaria en grid */}
									<div className="hidden lg:flex items-center space-x-6 flex-shrink-0">
										{/* Marca y Categoría */}
										<div className="text-center min-w-[120px]">
											<div className="flex items-center justify-center space-x-1 mb-1">
												<Tag className="h-4 w-4 text-blue-500" />
												<span className="text-xs text-gray-500 uppercase tracking-wide">Marca</span>
											</div>
											<p className="text-sm font-medium text-gray-900 truncate">
												{product.brand?.name || 'Sin marca'}
											</p>
											<span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mt-1">
												{product.category?.name || 'Sin categoría'}
											</span>
										</div>

										{/* Talla y Color */}
										<div className="text-center min-w-[100px]">
											<div className="flex items-center justify-center space-x-1 mb-1">
												<Ruler className="h-4 w-4 text-orange-500" />
												<span className="text-xs text-gray-500 uppercase tracking-wide">Talla</span>
											</div>
											<p className="text-sm font-medium text-gray-900">
												{product.size}
											</p>
											<p className="text-xs text-gray-600 flex items-center justify-center space-x-1">
												<Palette className="h-3 w-3" />
												<span>{product.color}</span>
											</p>
										</div>

										{/* Stock */}
										<div className="text-center min-w-[100px]">
											<div className="flex items-center justify-center space-x-1 mb-1">
												<Package className="h-4 w-4 text-indigo-500" />
												<span className="text-xs text-gray-500 uppercase tracking-wide">Stock</span>
											</div>
											<div className={`text-xl font-bold ${hasLowStock(product) ? 'text-red-600' : 'text-green-600'}`}>
												{product.stockCached}
											</div>
											<p className="text-xs text-gray-500">
												Mín: {product.stockMin}
											</p>
											{hasLowStock(product) && (
												<span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full mt-1">
													Stock bajo
												</span>
											)}
										</div>

										{/* Precios */}
										<div className="text-center min-w-[120px]">
											<div className="flex items-center justify-center space-x-1 mb-1">
												<DollarSign className="h-4 w-4 text-green-500" />
												<span className="text-xs text-gray-500 uppercase tracking-wide">Precios</span>
											</div>
											<div className="text-sm">
												<div className="font-semibold text-green-700">
													${product.salePrice?.toFixed(2) || '-'}
												</div>
												{isAdmin && (
													<div className="text-xs text-gray-600">
														Costo: ${product.costPrice?.toFixed(2) || '-'}
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Acciones */}
									<div className="flex items-center space-x-2 flex-shrink-0 ml-4">
										{isAdmin && (
											<>
												<button 
													onClick={() => handleEditProduct(product)}
													className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
												>
													<Edit className="h-4 w-4" />
													<span className="hidden sm:inline">Editar</span>
												</button>

												<button 
													onClick={() => handleOpenRestock(product)}
													className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 text-sm font-medium"
												>
													<TrendingUp className="h-4 w-4" />
													<span className="hidden sm:inline">Restock</span>
												</button>

												<button 
													onClick={() => { setSelectedProduct(product); setDetailsOpen(true); }}
													className="flex items-center space-x-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200 text-sm font-medium"
												>
													<Eye className="h-4 w-4" />
													<span className="hidden sm:inline">Detalles</span>
												</button>
												
												{showInactive ? (
													<button
														onClick={() => handleReactivateProduct(product.id)}
														className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
													>
														<RefreshCw className="h-4 w-4" />
														<span className="hidden sm:inline">Reactivar</span>
													</button>
												) : (
													(() => {
														const action = getDeleteAction(product.id);
														const isDelete = productDeletability[product.id]?.canBeDeleted;
														return (
															<button
																onClick={() => setConfirmDeleteId(product.id)}
																className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
																	isDelete 
																		? 'bg-red-100 hover:bg-red-200 text-red-700' 
																		: 'bg-orange-100 hover:bg-orange-200 text-orange-700'
																}`}
																title={action.title}
															>
																{action.icon}
																<span className="hidden sm:inline">{action.text}</span>
															</button>
														);
													})()
												)}
											</>
										)}
									</div>
								</div>

								{/* Información adicional en móvil */}
								<div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-gray-500">Marca:</span>
											<span className="ml-1 font-medium">{product.brand?.name || 'Sin marca'}</span>
										</div>
										<div>
											<span className="text-gray-500">Categoría:</span>
											<span className="ml-1 font-medium">{product.category?.name || 'Sin categoría'}</span>
										</div>
										<div>
											<span className="text-gray-500">Talla/Color:</span>
											<span className="ml-1 font-medium">{product.size} / {product.color}</span>
										</div>
										<div>
											<span className="text-gray-500">Stock:</span>
											<span className={`ml-1 font-semibold ${hasLowStock(product) ? 'text-red-600' : 'text-green-600'}`}>
												{product.stockCached} (Mín: {product.stockMin})
											</span>
										</div>
										<div>
											<span className="text-gray-500">Venta:</span>
											<span className="ml-1 font-semibold text-green-700">
												${product.salePrice?.toFixed(2) || '-'}
											</span>
										</div>
										{isAdmin && (
											<div>
												<span className="text-gray-500">Costo:</span>
												<span className="ml-1 font-medium text-gray-700">
													${product.costPrice?.toFixed(2) || '-'}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

	<ProductDetailsModal product={selectedProduct} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
	
	{/* Modal de confirmación de eliminación */}
	{confirmDeleteId && (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
				{(() => {
					const action = getDeleteAction(confirmDeleteId);
					const isDelete = productDeletability[confirmDeleteId]?.canBeDeleted;
					
					return (
						<>
							{/* Header del modal */}
							<div className={`p-6 ${isDelete ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white`}>
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										{isDelete ? (
											<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
												<Trash2 className="h-6 w-6" />
											</div>
										) : (
											<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
												<Archive className="h-6 w-6" />
											</div>
										)}
									</div>
									<div>
										<h3 className="text-xl font-bold">
											{isDelete ? 'Eliminar Producto' : 'Desactivar Producto'}
										</h3>
										<p className="text-sm opacity-90">
											{isDelete ? 'Esta acción es irreversible' : 'El producto se ocultará del inventario'}
										</p>
									</div>
								</div>
							</div>

							{/* Contenido del modal */}
							<div className="p-6">
								<div className="mb-4">
									<div className={`flex items-center space-x-2 p-3 rounded-lg ${isDelete ? 'bg-red-50' : 'bg-orange-50'}`}>
										<AlertTriangle className={`h-5 w-5 ${isDelete ? 'text-red-500' : 'text-orange-500'}`} />
										<span className={`text-sm font-medium ${isDelete ? 'text-red-800' : 'text-orange-800'}`}>
											{isDelete ? 'Advertencia: Eliminación Permanente' : 'Producto se marcará como inactivo'}
										</span>
									</div>
								</div>
								
								<p className="text-gray-600 leading-relaxed">
									{isDelete 
										? 'Esta acción eliminará permanentemente el producto y no se podrá recuperar. ¿Estás completamente seguro?'
										: 'El producto se desactivará y ya no aparecerá en el inventario activo, pero conservará todo su historial y podrás reactivarlo cuando desees.'
									}
								</p>
							</div>

							{/* Footer con botones */}
							<div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
								<button
									onClick={() => setConfirmDeleteId(null)}
									className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
								>
									Cancelar
								</button>
								<button
									onClick={() => handleDeleteProduct(confirmDeleteId)}
									className={`px-6 py-2.5 text-white rounded-xl transition-all duration-200 font-medium shadow-lg ${
										isDelete 
											? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
											: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
									}`}
								>
									{isDelete ? 'Eliminar Permanentemente' : 'Desactivar Producto'}
								</button>
							</div>
						</>
					);
				})()}
			</div>
		</div>
	)}

	{/* Modal de Edición */}
	{showEditModal && editingProduct && (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<Edit className="h-6 w-6" />
							<h3 className="text-xl font-bold">Editar Producto</h3>
						</div>
						<button
							onClick={() => setShowEditModal(false)}
							className="text-white hover:text-gray-200 transition-colors"
						>
							<X className="h-6 w-6" />
						</button>
					</div>
				</div>
				
				<div className="p-6">
					<ProductForm
						brands={brands}
						suppliers={suppliers}
						categories={categories}
						editingProduct={editingProduct}
						onSubmit={handleSaveEdit}
						onCancel={() => setShowEditModal(false)}
					/>
				</div>
			</div>
		</div>
	)}

	{/* Modal de Restock */}
	{showRestockModal && restockProduct && (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
				<div className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<TrendingUp className="h-6 w-6" />
							<h3 className="text-xl font-bold">Restock de Producto</h3>
						</div>
						<button
							onClick={() => setShowRestockModal(false)}
							className="text-white hover:text-gray-200 transition-colors"
						>
							<X className="h-6 w-6" />
						</button>
					</div>
				</div>
				
				<div className="p-6">
					<div className="mb-4">
						<h4 className="font-semibold text-gray-900 mb-2">{restockProduct.name}</h4>
						<p className="text-sm text-gray-600">SKU: {restockProduct.sku}</p>
						<div className="mt-2 flex items-center space-x-4">
							<span className="text-sm text-gray-600">Stock actual:</span>
							<span className={`font-bold ${hasLowStock(restockProduct) ? 'text-red-600' : 'text-green-600'}`}>
								{restockProduct.stockCached} unidades
							</span>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">Stock mínimo:</span>
							<span className="font-medium text-gray-900">{restockProduct.stockMin} unidades</span>
						</div>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Cantidad a agregar
						</label>
						<input
							type="number"
							min="1"
							value={restockQuantity}
							onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							placeholder="Ingresa la cantidad"
						/>
						{restockQuantity > 0 && (
							<p className="mt-2 text-sm text-gray-600">
								Nuevo stock: <span className="font-semibold text-green-600">
									{restockProduct.stockCached + restockQuantity} unidades
								</span>
							</p>
						)}
					</div>

					<div className="flex justify-end space-x-3">
						<button
							onClick={() => setShowRestockModal(false)}
							className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancelar
						</button>
						<button
							onClick={handleConfirmRestock}
							disabled={restockQuantity <= 0}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							Confirmar Restock
						</button>
					</div>
				</div>
			</div>
		</div>
	)}

	{/* Componente de notificación */}
	{notification && (
		<Notification
			type={notification.type}
			message={notification.message}
			onClose={() => setNotification(null)}
		/>
	)}

	{/* El modal para crear producto se elimina de inventario */}
		</div>
	);
};

export default InventoryPage;
