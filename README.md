👗 FEMENINE — Sistema de Gestión para Tienda de Ropa

## 📋 Descripción General
**FEMENINE** es un sistema de gestión para tiendas de ropa femenina.  
Su propósito es digitalizar inventario, proveedores, ventas y clientes, manteniendo trazabilidad completa incluso cuando los productos se agotan.

Basado en el levantamiento de requerimientos de negocio:contentReference[oaicite:0]{index=0}, el sistema incluye control de inventario con variantes (talla, color, marca), reposiciones, compras a proveedores y reportes.

---

## 🎯 Objetivos del Proyecto
- Centralizar la gestión de inventario, proveedores y ventas.
- Mantener trazabilidad histórica de productos, aunque se queden sin stock.
- Permitir carga masiva de productos y reposiciones.
- Filtrar por proveedor, categoría, marca, talla y color.
- Generar etiquetas con **códigos de barras/QR** para búsquedas y ventas rápidas.
- Escalar hacia múltiples canales de venta (físico, redes sociales, online).

---

## ✨ Funcionalidades Principales (MVP)
- **Inventario en tiempo real**
  - Productos → variantes (talla+color).
  - SKU y `barcodePayload` únicos y estables.
  - Stock calculado a partir de **movimientos**.
- **Compras y reposiciones**
  - Proveedores con datos de contacto.
  - Órdenes de compra (`Purchase`, `PurchaseItem`).
  - Movimientos ENTRADA al recibir.
- **Ventas**
  - Registro de ventas (`Sale`, `SaleItem`).
  - Movimientos SALIDA automáticos.
- **Ajustes**
  - Movimientos AJUSTE para inventarios físicos.
- **Carga masiva**
  - CSV/JSON con productos, variantes y stock inicial.
  - Defaults (categoría, proveedor, marca).
  - Creación automática de catálogos si no existen.
  - Detección de duplicados → en vez de error, hace **reposiciones**.
- **Reportes**
  - Stock bajo (`stockCached <= stockMin`).
  - Productos más/menos vendidos.
  - Ventas por categoría/proveedor/fecha.

---

## 🗄️ Modelo de Datos (Prisma + SQLite)

### Base de Datos
- **SQLite**: Base de datos local liviana para uso en tienda única
- **Archivo**: `backend/dev.db`
- **Ventajas**: Sin configuración, fácil backup, portabilidad

### Entidades principales
- **Brand**: marcas.
- **Category**: categorías.
- **Supplier**: proveedores (nullable en productos).
- **Product**: modelo base.
- **ProductVariant**: combinación talla+color.  
  - Constraint `@@unique([productId, size, color])`.
- **StockMovement**: entradas, salidas y ajustes.
- **Purchase / PurchaseItem**: compras a proveedores.
- **Sale / SaleItem**: ventas.
- **PriceHistory (opcional)**: historial de precios de venta.

### Reglas clave
- `stockCached` se actualiza en cada movimiento, pero el origen de verdad es `StockMovement`.
- No permitir stock negativo.
- Productos agotados siguen existiendo → se filtran en la UI por defecto (`stock > 0`).
- Si en import llega un producto igual (misma marca/categoría/talla/color) → **reposiciona stock** en vez de crear duplicado.

---

## 📦 Carga Masiva

### Endpoint
POST /api/import/products
multipart/form-data:

file (CSV/JSON)

defaultCategoryName?

defaultSupplierName?

defaultBrandName?

createMissingEntities=true|false

dedupeBy="SKU"|"NAME_VARIANT"

dryRun=true|false

arduino
Copiar
Editar

### CSV sugerido
```csv
name,brand,category,supplier,description,size,color,purchasePrice,salePrice,initialStock,sku
Jeans Skinny Mujer,Zara,Jeans,Proveedor Andes,"Tiro alto",36,Azul,10990,25990,5,
Jeans Skinny Mujer,Zara,Jeans,Proveedor Andes,"Tiro alto",38,Azul,10990,25990,5,
Jeans Mom Fit,Bershka,Jeans,Proveedor Andes,"Algodón",S,Negro,11990,27990,4,
Jeans Wide Leg,Levi's,Jeans,,"Pierna ancha",M,Azul,19990,39990,3,
Lógica de importación
Normalizar datos (trim, upper-case, sin tildes).

Resolver/crear Brand, Category, Supplier si faltan.

Buscar producto:

Por (name+brand+category) → upsert.

Buscar variante:

Por sku o (productId+size+color).

Si existe → actualizar precios opcionalmente y reponer stock con movimiento ENTRADA.

Si no existe → crear variante nueva.

Crear movimiento de stock inicial (ENTRADA).

Respuesta ejemplo
json
Copiar
Editar
{
  "summary": {
    "rows": 10,
    "created": { "products": 5, "variants": 8, "suppliers": 1 },
    "updated": { "products": 0, "variants": 2 },
    "movements": 10
  },
  "errors": [],
  "warnings": [{ "row": 4, "message": "Proveedor vacío → null" }]
}
🧩 Reglas de Negocio
Los productos no se duplican: se reponen con stock.

Proveedor puede ser null.

Se pueden crear proveedores/categorías/marcas al vuelo.

Se pueden archivar/discontinuar variantes para ocultarlas sin perder trazabilidad.

Import soporta dryRun para validar antes de insertar.

🖥️ Estructura del Proyecto
bash
Copiar
Editar
femenine/
├── backend/
│   ├── src/controllers/   # lógica de negocio
│   ├── src/routes/        # endpoints API
│   ├── prisma/schema.prisma
│   └── server.ts
├── frontend/
│   ├── src/pages/         # inventario, ventas, proveedores, reportes
│   ├── src/components/    # forms, tablas, filtros, uploadCSV
│   └── src/services/api.ts
└── docker-compose.yml
⚙️ Instalación Rápida
bash
Copiar
Editar
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Docker (todo junto)
docker-compose up -d
🚦 Roadmap
1.0 MVP: inventario, ventas, compras, carga masiva, reportes base.

1.1: clientes frecuentes, precios mayoristas, export CSV/Excel.