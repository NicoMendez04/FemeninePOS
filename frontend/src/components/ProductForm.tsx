import React, { useState, useRef, useEffect } from 'react';
import { X, Package, Tag, Barcode, DollarSign, Palette, Ruler, UserPlus, Plus, Copy } from 'lucide-react';
import Notification from './Notification';

interface Brand {
	id: number;
	name: string;
}
interface Supplier {
	id: number;
	name: string;
}
interface Category {
	id: number;
	name: string;
}

interface Product {
	name: string;
	description?: string;
	size: string;
	color: string;
	baseCode: string;
	costPrice?: number;
	salePrice?: number;
	stockCached?: number;
	sku: string;
	brandId?: number;
	supplierId?: number;
	categoryId?: number;
	stockMin?: number;
}

interface ProductFormProps {
	onSubmit: (products: Product[] | Product) => void;
	loading?: boolean;
	brands: Brand[];
	suppliers: Supplier[];
	categories: Category[];
	onCancel?: () => void;
	importedProducts?: Product[];
	editingProduct?: Product | null;
	onImportProcessed?: () => void; // Callback para limpiar productos importados
	importCounter?: number; // Para forzar re-render cuando se importan productos
}

export default function ProductForm({ onSubmit, loading, brands, suppliers, categories, onCancel, importedProducts = [], editingProduct = null, onImportProcessed, importCounter }: ProductFormProps) {
	const [product, setProduct] = useState<Product>({
		name: '',
		size: '',
		color: '',
		baseCode: '',
		costPrice: undefined,
		sku: '',
		stockCached: undefined,
		salePrice: undefined,
	});

	const [products, setProducts] = useState<Product[]>([]);
	const [isDuplicateMode, setIsDuplicateMode] = useState(false);
	
	// Estados para notificaciones
	const [notification, setNotification] = useState<{
		message: string;
		type: 'success' | 'error' | 'warning' | 'info';
	} | null>(null);

	// Función para mostrar notificación
	const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	// Efecto para cargar productos importados
	useEffect(() => {
		console.log('UseEffect triggered:', { 
			importedProductsLength: importedProducts?.length, 
			importCounter,
			currentProductsLength: products.length 
		});
		
		if (importedProducts && importedProducts.length > 0) {
			// Obtener SKUs de productos que ya están en la lista actual
			const currentProductSKUs = products.map(p => p.sku);
			console.log('Current SKUs:', currentProductSKUs);
			console.log('Imported products SKUs:', importedProducts.map(p => p.sku));
			
			// Filtrar productos que no están en la lista actual
			const newImportedProducts = importedProducts.filter(product => 
				!currentProductSKUs.includes(product.sku)
			);
			
			console.log('New products to process:', newImportedProducts.length);
			
			if (newImportedProducts.length === 0) {
				console.log('No new products to process');
				return; // No hay productos nuevos para procesar
			}

			// Resolver IDs de marca, categoría y proveedor basándose en nombres
			const processedProducts = newImportedProducts.map((product: any) => {
				let brandId = product.brandId;
				let categoryId = product.categoryId;
				let supplierId = product.supplierId;

				// Buscar brand por nombre
				if (product._brandName && !brandId) {
					const foundBrand = brands.find(brand => 
						brand.name.toLowerCase() === product._brandName.toLowerCase()
					);
					if (foundBrand) brandId = foundBrand.id;
				}

				// Buscar category por nombre
				if (product._categoryName && !categoryId) {
					const foundCategory = categories.find(category => 
						category.name.toLowerCase() === product._categoryName.toLowerCase()
					);
					if (foundCategory) categoryId = foundCategory.id;
				}

				// Buscar supplier por nombre
				if (product._supplierName && !supplierId) {
					const foundSupplier = suppliers.find(supplier => 
						supplier.name.toLowerCase() === product._supplierName.toLowerCase()
					);
					if (foundSupplier) supplierId = foundSupplier.id;
				}

				// Eliminar campos auxiliares y devolver producto limpio
				const cleanProduct = { ...product };
				delete cleanProduct._brandName;
				delete cleanProduct._categoryName;
				delete cleanProduct._supplierName;

				return {
					...cleanProduct,
					brandId,
					categoryId,
					supplierId
				};
			});

			if (processedProducts.length > 0) {
				console.log('Adding products to list:', processedProducts.length);
				setProducts(prevProducts => [...prevProducts, ...processedProducts]);
				showNotification(`${processedProducts.length} productos cargados desde archivo`, 'success');
				
				// Notificar al padre que se procesaron los productos para que los limpie
				// Usar timeout para asegurar que el estado se actualice correctamente
				setTimeout(() => {
					if (onImportProcessed) {
						console.log('Calling onImportProcessed');
						onImportProcessed();
					}
				}, 100);
			}
		} else {
			console.log('No imported products or empty array');
		}
	}, [importedProducts, brands, categories, suppliers, importCounter]);

	// Efecto para cargar datos del producto en modo edición
	useEffect(() => {
		if (editingProduct) {
			setProduct({
				name: editingProduct.name || '',
				description: editingProduct.description || '',
				size: editingProduct.size || '',
				color: editingProduct.color || '',
				baseCode: editingProduct.baseCode || '',
				costPrice: editingProduct.costPrice,
				salePrice: editingProduct.salePrice,
				stockCached: editingProduct.stockCached,
				stockMin: editingProduct.stockMin,
				sku: editingProduct.sku || '',
				brandId: editingProduct.brandId,
				categoryId: editingProduct.categoryId,
				supplierId: editingProduct.supplierId,
			});
			// En modo edición, no mostrar lista de productos, solo editar uno
			setProducts([]);
		}
	}, [editingProduct]);

	const fieldRefs = {
		name: useRef<HTMLInputElement>(null),
		description: useRef<HTMLInputElement>(null),
		size: useRef<HTMLInputElement>(null),
		color: useRef<HTMLInputElement>(null),
		baseCode: useRef<HTMLInputElement>(null),
		costPrice: useRef<HTMLInputElement>(null),
		salePrice: useRef<HTMLInputElement>(null),
		stockCached: useRef<HTMLInputElement>(null),
		brandId: useRef<HTMLSelectElement>(null),
		supplierId: useRef<HTMLSelectElement>(null),
		categoryId: useRef<HTMLSelectElement>(null),
	};

	// Función para capitalizar la primera letra de cada palabra
	const capitalizeWords = (str: string): string => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Función para convertir a mayúsculas
	const toUpperCase = (str: string): string => {
		return str.toUpperCase();
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		
		let formattedValue = value;
		
		// Aplicar formateo según el campo
		if (name === 'name' || name === 'description' || name === 'size' || name === 'color') {
			formattedValue = capitalizeWords(value);
		} else if (name === 'baseCode') {
			formattedValue = toUpperCase(value);
		}
		
		setProduct(prev => ({ ...prev, [name]: formattedValue }));
	};

	const handleKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
		// Salir del modo duplicado con Escape
		if (e.key === 'Escape' && isDuplicateMode) {
			e.preventDefault();
			setIsDuplicateMode(false);
			showNotification('❌ Modo duplicado cancelado', 'info');
			fieldRefs.name?.current?.focus();
			return;
		}
		
		if (e.key === 'Enter') {
			e.preventDefault();
			
			// Flujo especial para modo duplicado: solo talla → stock
			if (isDuplicateMode) {
				if (fieldName === 'size') {
					fieldRefs.stockCached?.current?.focus();
					return;
				} else if (fieldName === 'stockCached') {
					handleAddProduct();
					return;
				}
			}
			
			// Flujo normal
			const fieldOrder = ['name', 'description', 'brandId', 'supplierId', 'categoryId', 'size', 'color', 'baseCode', 'costPrice', 'salePrice', 'stockCached'];
			const currentIndex = fieldOrder.indexOf(fieldName);
			
			// Si estamos en el último campo (stockCached), agregar el producto automáticamente
			if (fieldName === 'stockCached') {
				handleAddProduct();
				return;
			}
			
			// Si no es el último campo, ir al siguiente
			if (currentIndex < fieldOrder.length - 1) {
				const nextField = fieldOrder[currentIndex + 1] as keyof typeof fieldRefs;
				fieldRefs[nextField]?.current?.focus();
			}
		}
	};

	// Función para duplicar un producto
	const handleDuplicateProduct = (productToDuplicate: any) => {
		setIsDuplicateMode(true);
		setProduct({
			name: productToDuplicate.name,
			description: productToDuplicate.description || '',
			brandId: productToDuplicate.brandId,
			supplierId: productToDuplicate.supplierId,
			categoryId: productToDuplicate.categoryId,
			size: '', // Se deja vacío para modificar
			color: productToDuplicate.color,
			baseCode: productToDuplicate.baseCode,
			costPrice: productToDuplicate.costPrice,
			salePrice: productToDuplicate.salePrice,
			stockCached: undefined, // Se limpia para que lo llenen nuevo
			sku: ''
		});
		
		// Mostrar notificación de modo duplicado activado
		showNotification(`🔄 Modo duplicado activado para "${productToDuplicate.name}"`, 'info');
		
		// Enfocar el campo de talla para edición rápida
		setTimeout(() => {
			fieldRefs.size?.current?.focus();
		}, 100);
	};

	const handleAddProduct = () => {
		if (!product.name.trim() || !product.size.trim() || !product.color.trim() || !product.baseCode.trim() || !product.costPrice) {
			showNotification('Completa todos los campos obligatorios', 'error');
			return;
		}
		
		const prodWithCodes = {
			...product,
			stockMin: 2, // stock mínimo fijo
			brandId: product.brandId ? Number(product.brandId) : undefined,
			supplierId: product.supplierId ? Number(product.supplierId) : undefined,
			categoryId: product.categoryId ? Number(product.categoryId) : undefined
		};
		
		setProducts(prev => [...prev, prodWithCodes]);
		
		// Mostrar notificación de éxito
		const actionText = isDuplicateMode ? 'duplicado' : 'agregado';
		showNotification(`✅ Producto "${product.name}" ${actionText} correctamente`, 'success');
		
		setProduct({
			name: '',
			size: '',
			color: '',
			baseCode: '',
			costPrice: undefined,
			sku: '',
			stockCached: undefined,
			salePrice: undefined,
		});
		
		// Salir del modo duplicado
		setIsDuplicateMode(false);
		
		// Enfocar el campo nombre para continuar agregando productos
		setTimeout(() => {
			fieldRefs.name?.current?.focus();
		}, 100);
	};

	const handleRemoveProduct = (index: number) => {
		const productToRemove = products[index];
		setProducts(prev => prev.filter((_, i) => i !== index));
		showNotification(`🗑️ "${productToRemove.name}" eliminado de la lista`, 'info');
	};

	if (onCancel) {
		return (
			<div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-3xl shadow-2xl w-full max-w-7xl relative border-2 border-purple-100 mx-auto">
				{/* Notificación flotante */}
				{notification && (
					<Notification 
						message={notification.message} 
						type={notification.type} 
						onClose={() => setNotification(null)}
					/>
				)}
				
				{/* Header compacto */}
				<div className="text-center mb-6">
					<div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
						<Package className="text-white" size={24} />
					</div>
					<h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
						{editingProduct ? 'Editar Producto' : 'Agregar Productos al Inventario'}
					</h2>
					<p className="text-gray-600 text-sm">
						{editingProduct ? 'Modifica la información del producto' : 'Completa la información y crea múltiples productos'}
					</p>
				</div>

				{/* Layout: Una columna para edición, dos columnas para creación */}
				<div className={`grid ${editingProduct ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
					{/* Formulario */}
					<div className="space-y-4">
						<form onSubmit={e => e.preventDefault()} className="space-y-4">
							{/* Sección: Información Básica */}
							<div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<div className="bg-purple-100 p-1.5 rounded-lg">
											<Tag className="text-purple-600" size={16} />
										</div>
										<h3 className="text-sm font-semibold text-gray-800">Información Básica</h3>
									</div>
									{isDuplicateMode && (
										<span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
											<Copy size={12} />
											Modo Duplicado
										</span>
									)}
								</div>
								<div className="grid grid-cols-1 gap-3">
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Producto</label>
										<div className="relative">
											<Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
											<input 
												ref={fieldRefs.name}
												name="name" 
												value={product.name} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'name')}
												placeholder="Ej: Camiseta Básica" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200'
												}`}
												required 
											/>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
										<div className="relative">
											<Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
											<input 
												ref={fieldRefs.description}
												name="description" 
												value={product.description || ''} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'description')}
												placeholder="Descripción (opcional)" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200'
												}`}
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Sección: Clasificación */}
							<div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="bg-blue-100 p-1.5 rounded-lg">
										<UserPlus className="text-blue-600" size={16} />
									</div>
									<h3 className="text-sm font-semibold text-gray-800">Clasificación</h3>
								</div>
								<div className="grid grid-cols-1 gap-3">
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
										<div className="relative">
											<UserPlus className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
											<select 
												ref={fieldRefs.brandId}
												name="brandId" 
												value={product.brandId || ''} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'brandId')}
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all bg-white text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
												}`}
											>
												<option value="">🏷️ Sin marca</option>
												{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
											</select>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Proveedor</label>
										<div className="relative">
											<UserPlus className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
											<select 
												ref={fieldRefs.supplierId}
												name="supplierId" 
												value={product.supplierId || ''} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'supplierId')}
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all bg-white text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
												}`}
											>
												<option value="">🚚 Sin proveedor</option>
												{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
											</select>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
										<div className="relative">
											<UserPlus className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
											<select 
												ref={fieldRefs.categoryId}
												name="categoryId" 
												value={product.categoryId || ''} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'categoryId')}
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all bg-white text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
												}`}
											>
												<option value="">📂 Sin categoría</option>
												{Array.isArray(categories) && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
											</select>
										</div>
									</div>
								</div>
							</div>

							{/* Sección: Características */}
							<div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="bg-pink-100 p-1.5 rounded-lg">
										<Palette className="text-pink-600" size={16} />
									</div>
									<h3 className="text-sm font-semibold text-gray-800">Características</h3>
								</div>
								<div className="grid grid-cols-1 gap-3">
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Talla</label>
										<div className="relative">
											<Ruler className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400 group-focus-within:text-pink-600 transition-colors" />
											<input 
												ref={fieldRefs.size}
												name="size" 
												value={product.size} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'size')}
												placeholder="Ej: M, L, XL" 
												className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all text-sm font-medium" 
												required 
											/>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
										<div className="relative">
											<Palette className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400 group-focus-within:text-pink-600 transition-colors" />
											<input 
												ref={fieldRefs.color}
												name="color" 
												value={product.color} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'color')}
												placeholder="Ej: Rojo, Azul" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200'
												}`}
												required 
											/>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Código Base</label>
										<div className="relative">
											<Barcode className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400 group-focus-within:text-pink-600 transition-colors" />
											<input 
												ref={fieldRefs.baseCode}
												name="baseCode" 
												value={product.baseCode} 
												onChange={handleChange} 
												onKeyDown={(e) => handleKeyDown(e, 'baseCode')}
												placeholder="Ej: CAM001" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200'
												}`}
												required 
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Sección: Precios y Stock */}
							<div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="bg-green-100 p-1.5 rounded-lg">
										<DollarSign className="text-green-600" size={16} />
									</div>
									<h3 className="text-sm font-semibold text-gray-800">Precios y Stock</h3>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Precio Costo</label>
										<div className="relative">
											<DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
											<input 
												ref={fieldRefs.costPrice}
												name="costPrice" 
												type="number" 
												value={product.costPrice !== undefined ? product.costPrice : ''} 
												onChange={(e) => {
													const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
													setProduct(prev => ({ ...prev, costPrice: value }));
												}}
												onKeyDown={(e) => handleKeyDown(e, 'costPrice')}
												placeholder="0.00" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all font-semibold text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-blue-700'
												}`}
												required 
												min={0.01} 
												step={0.01} 
											/>
										</div>
									</div>
									<div className="group">
										<label className="block text-xs font-medium text-gray-700 mb-1">Precio Venta</label>
										<div className="relative">
											<DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 group-focus-within:text-green-600 transition-colors" />
											<input 
												ref={fieldRefs.salePrice}
												name="salePrice" 
												type="number" 
												value={product.salePrice !== undefined ? product.salePrice : ''} 
												onChange={(e) => {
													const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
													setProduct(prev => ({ ...prev, salePrice: value }));
												}}
												onKeyDown={(e) => handleKeyDown(e, 'salePrice')}
												placeholder="0.00" 
												disabled={isDuplicateMode}
												className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl focus:outline-none transition-all font-semibold text-sm ${
													isDuplicateMode 
														? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
														: 'border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-200 text-green-700'
												}`}
												required 
												min={0.01} 
												step={0.01} 
											/>
										</div>
									</div>
									<div className="group col-span-2">
										<label className="block text-xs font-medium text-gray-700 mb-1">Stock Inicial</label>
										<div className="relative">
											<Package className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
											<input 
												ref={fieldRefs.stockCached}
												name="stockCached" 
												type="number" 
												value={product.stockCached !== undefined ? product.stockCached : ''} 
												onChange={(e) => {
													const value = e.target.value === '' ? undefined : parseInt(e.target.value);
													setProduct(prev => ({ ...prev, stockCached: value }));
												}}
												onKeyDown={(e) => handleKeyDown(e, 'stockCached')}
												min="0"
												placeholder="0"
												className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all font-semibold text-sm" 
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Botones de acción */}
							<div className="flex gap-2">
								{editingProduct ? (
									// Botones para modo edición
									<>
										<button
											type="button"
											onClick={() => onCancel && onCancel()}
											className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
										>
											Cancelar
										</button>
										<button
											type="button"
											onClick={() => {
												if (!product.name.trim() || !product.size.trim() || !product.color.trim() || !product.baseCode.trim()) {
													showNotification('Completa todos los campos obligatorios', 'error');
													return;
												}
												
												const prodWithCodes = {
													...product,
													stockMin: product.stockMin || 2
												};
												
												onSubmit(prodWithCodes);
											}}
											className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
											disabled={loading}
										>
											<Package size={16} />
											{loading ? 'Guardando...' : 'Guardar Cambios'}
										</button>
									</>
								) : (
									// Botones para modo creación
									<>
										<button
											type="button"
											onClick={handleAddProduct}
											className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
										>
											<Plus size={16} />
											Agregar a Lista
										</button>
										{products.length > 0 && (
											<button
												type="button"
												onClick={() => {
													const count = products.length;
													onSubmit(products);
													setProducts([]);
													showNotification(`🎉 ${count} producto${count > 1 ? 's' : ''} guardado${count > 1 ? 's' : ''} exitosamente`, 'success');
												}}
												className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
												disabled={loading}
											>
												<Package size={16} />
												{loading ? 'Guardando...' : `Guardar ${products.length} productos`}
											</button>
										)}
									</>
								)}
							</div>
						</form>
					</div>

					{/* Columna derecha: Lista de productos - Solo en modo creación */}
					{!editingProduct && (
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<div className="bg-purple-100 p-1.5 rounded-lg">
									<Package className="text-purple-600" size={16} />
								</div>
								<h3 className="text-sm font-semibold text-gray-800">Lista de Productos</h3>
								<span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
									{products.length}
								</span>
							</div>
							{products.length > 0 && (
								<button
									onClick={() => {
										setProducts([]);
										showNotification('🗑️ Lista de productos limpiada', 'info');
									}}
									className="text-red-500 hover:text-red-700 text-xs"
								>
									Limpiar todo
								</button>
							)}
						</div>

						{products.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<Package className="mx-auto mb-2 text-gray-300" size={32} />
								<p className="text-sm">No hay productos en la lista</p>
								<p className="text-xs text-gray-400">Los productos aparecerán aquí</p>
							</div>
						) : (
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{products.map((prod, index) => (
									<div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-purple-200 transition-all group">
										<div className="flex justify-between items-start mb-2">
											<div className="flex-1">
												<h4 className="font-semibold text-sm text-gray-800 leading-tight">{prod.name}</h4>
												<p className="text-xs text-gray-600">{prod.size} • {prod.color}</p>
											</div>
											<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => handleDuplicateProduct(prod)}
													className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-lg transition-colors"
													title="Duplicar producto"
												>
													<Copy size={12} />
												</button>
												<button
													onClick={() => handleRemoveProduct(index)}
													className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-lg transition-colors"
													title="Eliminar producto"
												>
													<X size={12} />
												</button>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div className="bg-white rounded-lg p-2">
												<span className="text-gray-500">Costo:</span>
												<span className="font-semibold text-blue-600 ml-1">${prod.costPrice}</span>
											</div>
											<div className="bg-white rounded-lg p-2">
												<span className="text-gray-500">Venta:</span>
												<span className="font-semibold text-green-600 ml-1">${prod.salePrice}</span>
											</div>
										</div>
										<div className="mt-2 text-xs text-gray-600">
											<span className="bg-white rounded-lg px-2 py-1">Código: {prod.baseCode}</span>
											{prod.stockCached !== undefined && (
												<span className="bg-white rounded-lg px-2 py-1 ml-1">Stock: {prod.stockCached}</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					)}
				</div>
			</div>
		);
	}

	// Vista original más simple para cuando no hay onCancel
	return (
		<div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
			{/* Notificación flotante */}
			{notification && (
				<Notification 
					message={notification.message} 
					type={notification.type} 
					onClose={() => setNotification(null)}
				/>
			)}
			
			<h2 className="text-xl font-bold mb-4">Agregar Producto</h2>
			<form onSubmit={e => e.preventDefault()} className="space-y-4">
				<input 
					ref={fieldRefs.name}
					name="name" 
					value={product.name} 
					onChange={handleChange} 
					placeholder="Nombre" 
					className="border rounded p-2 w-full" 
					required 
				/>
				<input 
					ref={fieldRefs.size}
					name="size" 
					value={product.size} 
					onChange={handleChange} 
					placeholder="Talla" 
					className="border rounded p-2 w-full" 
					required 
				/>
				<input 
					ref={fieldRefs.color}
					name="color" 
					value={product.color} 
					onChange={handleChange} 
					placeholder="Color" 
					className="border rounded p-2 w-full" 
					required 
				/>
				<input 
					ref={fieldRefs.baseCode}
					name="baseCode" 
					value={product.baseCode} 
					onChange={handleChange} 
					placeholder="Código base" 
					className="border rounded p-2 w-full" 
					required 
				/>
				<input 
					ref={fieldRefs.costPrice}
					name="costPrice" 
					type="number" 
					value={product.costPrice !== undefined ? product.costPrice : ''} 
					onChange={(e) => {
						const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
						setProduct(prev => ({ ...prev, costPrice: value }));
					}}
					placeholder="Precio de costo" 
					className="border rounded p-2 w-full" 
					required 
					min={0.01} 
					step={0.01} 
				/>
				<input 
					ref={fieldRefs.salePrice}
					name="salePrice" 
					type="number" 
					value={product.salePrice !== undefined ? product.salePrice : ''} 
					onChange={(e) => {
						const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
						setProduct(prev => ({ ...prev, salePrice: value }));
					}}
					placeholder="Precio de venta" 
					className="border rounded p-2 w-full" 
					required 
					min={0.01} 
					step={0.01} 
				/>
				<button
					type="button"
					onClick={() => {
						if (!product.name.trim() || !product.size.trim() || !product.color.trim() || !product.baseCode.trim()) {
							showNotification('Completa todos los campos obligatorios', 'error');
							return;
						}
						
						const prodWithCodes = {
							...product,
							stockMin: product.stockMin || 2
						};
						
						if (editingProduct) {
							// Modo edición: solo enviar los datos del producto editado
							onSubmit(prodWithCodes);
							showNotification(`✅ Producto "${product.name}" actualizado correctamente`, 'success');
						} else {
							// Modo creación: mantener comportamiento original
							onSubmit([prodWithCodes]);
							showNotification(`✅ Producto "${product.name}" guardado correctamente`, 'success');
							
							setProduct({
								name: '',
								size: '',
								color: '',
								baseCode: '',
								costPrice: undefined,
								sku: '',
								stockCached: undefined,
								salePrice: undefined,
							});
						}
					}}
					className="bg-blue-500 text-white p-2 rounded w-full"
					disabled={loading}
				>
					{loading ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Guardar'}
				</button>
			</form>
		</div>
	);
}
