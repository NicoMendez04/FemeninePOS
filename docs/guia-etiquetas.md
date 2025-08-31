# 🏷️ Guía Completa: Generación de Plantillas de Etiquetas para FemeninePOS

## 📋 Resumen del Sistema Actual

Tu proyecto **FemeninePOS** ya tiene implementado un sistema completo para generar e imprimir etiquetas con códigos de barras para productos. El sistema incluye:

### 🔧 Componentes Implementados

1. **ProductDetailsModal.tsx** - Modal básico para imprimir etiquetas individuales
2. **ProductLabelModal.tsx** - Modal avanzado con opciones de cantidad y modos de impresión
3. **LabelTemplate.tsx** - Componente reutilizable para plantillas de etiquetas
4. **LabelPreview.tsx** - Vista previa mejorada con opciones de impresión
5. **BrotherPrinterService.ts** - Servicio backend para impresora Brother QL-800
6. **PrintRoutes.ts** - Endpoints API para impresión

---

## 🎯 Cómo Usar el Sistema de Etiquetas

### 📱 **En la Vista de Detalles del Producto**

1. **Acceder al modal de etiquetas:**
   ```tsx
   // En InventoryPage.tsx o donde muestres los productos
   import ProductLabelModal from '../components/ProductLabelModal';
   
   const [showLabelModal, setShowLabelModal] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   
   // Botón para abrir el modal
   <button 
     onClick={() => {
       setSelectedProduct(product);
       setShowLabelModal(true);
     }}
     className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
   >
     <Printer className="h-4 w-4" />
     <span>Imprimir Etiqueta</span>
   </button>
   
   // Modal de etiquetas
   <ProductLabelModal
     product={selectedProduct}
     open={showLabelModal}
     onClose={() => setShowLabelModal(false)}
   />
   ```

2. **Características del modal:**
   - Selección de cantidad (1-50 etiquetas)
   - Modo Brother QL-800 o impresión web
   - Vista previa en tiempo real
   - Información detallada del producto

---

## 🖨️ Configuración para Brother QL-800

### **Método 1: Usando P-Touch Editor (Recomendado)**

1. **Instalar P-Touch Editor:**
   - Descargar desde: https://support.brother.com/
   - Instalar en Windows

2. **Crear Template (.lbx):**
   ```
   1. Abrir P-Touch Editor
   2. Nuevo documento → Etiqueta personalizada
   3. Tamaño: DK-11201 (29mm x 90mm)
   4. Diseño en 2 columnas:
      Columna izquierda (45mm):
      - Campo texto: ProductName
      - Campo texto: Size (T:) y Color (C:)
      - Campo texto: Brand
      - Campo texto: Price (destacado)
      
      Columna derecha (45mm):
      - Código de barras: vinculado a campo "Barcode"
      - Orientación: Vertical (rotado 90°)
      - Formato: CODE128
   5. Guardar como: C:\Templates\dk11201-template.lbx
   ```

3. **Configurar en FemeninePOS:**
   - Ir a **Configuración** en la aplicación
   - Sección "Impresora Brother QL-800"
   - Configurar rutas:
     - **P-Touch Editor**: `C:\Program Files (x86)\Brother\P-touch Editor 5.2\P-touchEditor.exe`
     - **Template**: `C:\Templates\dk11201-template.lbx`
     - **Carpeta temporal**: `C:\Temp\`
   - **Importante:** Seleccionar DK-11201 como tipo de etiqueta en Brother

### **Método 2: Impresión Web (DK-11201 compatible)**

Si no tienes Brother QL-800, puedes usar la impresión web que:
- Genera etiquetas en formato HTML/CSS optimizado para DK-11201
- Compatible con cualquier impresora
- Tamaño optimizado 29mm x 90mm
- Incluye códigos de barras rotados con react-barcode
- Layout de 2 columnas: información + código de barras

---

## 📐 Formato de Etiqueta DK-11201 (29mm x 90mm)

### **Contenido de cada etiqueta:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Jeans Skinny Mujer │                                           │
│                    │         ||||||||||||||||                  │
│ T: 36   C: Azul   │         ||||||||||||||||                  │
│ Zara              │         FEM-2025-08-000123                │
│                    │         ||||||||||||||||                  │
│ $25990            │                                           │
└─────────────────────────────────────────────────────────────────┘
   ← 45mm Info →      ← 45mm Código de Barras (rotado 90°) →
```

### **Distribución del espacio:**
- **Lado Izquierdo (45mm):** Información del producto
  - Nombre del producto (máx. 18 caracteres)
  - Talla y Color (T: / C:)
  - Marca
  - Precio destacado
- **Lado Derecho (45mm):** Código de barras
  - CODE128 rotado 90°
  - SKU visible debajo
  - Altura optimizada (60px)

### **Características específicas DK-11201:**
- **Tamaño:** 29mm x 90mm (formato alargado)
- **Material:** Papel blanco adhesivo
- **Cantidad por rollo:** 400 etiquetas
- **Orientación:** Horizontal con código de barras vertical

---

## 🔧 Personalizar Plantillas

### **Modificar el componente LabelTemplate.tsx:**

```tsx
// Cambiar tamaño de etiqueta
.label-item {
  width: 62mm;    // Ancho
  height: 29mm;   // Alto
  // ... otros estilos
}

// Personalizar código de barras
<Barcode 
  value={product.sku || ''} 
  format="CODE128"     // Formato: CODE128, CODE39, EAN13, etc.
  width={0.8}          // Ancho de líneas
  height={25}          // Alto del código
  displayValue={true}  // Mostrar texto
  fontSize={6}         // Tamaño del texto
/>

// Agregar campos personalizados
<div className="custom-field">
  <strong>Proveedor:</strong> {product.supplier?.name}
</div>
```

### **Estilos CSS para impresión:**

```css
@media print {
  .label-item {
    width: 62mm;
    height: 29mm;
    border: 1px solid #000;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  @page {
    size: A4;
    margin: 10mm;
  }
}
```

---

## 🚀 Integración en Otras Vistas

### **En la página de inventario:**

```tsx
// Agregar botón de etiqueta en cada producto
<button 
  onClick={() => handlePrintLabel(product)}
  className="text-blue-600 hover:text-blue-800"
  title="Imprimir etiqueta"
>
  <Printer className="h-4 w-4" />
</button>

const handlePrintLabel = (product: Product) => {
  setSelectedProduct(product);
  setShowLabelModal(true);
};
```

### **En ventas (para reimprimir):**

```tsx
// Botón para reimprimir etiqueta de producto vendido
<button 
  onClick={() => reprintLabel(saleItem.product)}
  className="text-green-600 hover:text-green-800"
>
  Reimprimir Etiqueta
</button>
```

### **Impresión masiva:**

```tsx
// Seleccionar múltiples productos para imprimir
const handleBulkPrint = async (products: Product[]) => {
  for (const product of products) {
    await printLabel(product, quantity);
  }
};
```

---

## 📊 API Endpoints Disponibles

### **Imprimir etiqueta:**
```http
POST /api/products/:id/print-label
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Producto",
  "sku": "FEM-2025-08-000123",
  "price": 25990,
  "size": "M",
  "color": "Azul",
  "brand": "Zara",
  "category": "Jeans",
  "barcode": "FEM-2025-08-000123"
}
```

### **Vista previa:**
```http
GET /api/products/:id/label-preview
Authorization: Bearer <token>
```

### **Estado de impresora:**
```http
GET /api/printer-config-status
Authorization: Bearer <token>
```

---

## 🎨 Plantillas Personalizadas

### **Crear nueva plantilla:**

1. **Duplicar LabelTemplate.tsx** como `CustomLabelTemplate.tsx`
2. **Modificar el diseño:**

```tsx
const CustomLabelTemplate: React.FC<LabelTemplateProps> = ({ product, quantity = 1 }) => {
  return (
    <div className="print-labels">
      <style>{`
        .custom-label {
          width: 50mm;  /* Etiqueta más pequeña */
          height: 25mm;
          /* Tu CSS personalizado */
        }
      `}</style>

      {Array.from({ length: quantity }, (_, index) => (
        <div key={index} className="custom-label">
          {/* Tu diseño personalizado aquí */}
          <div className="label-header">
            {product.name}
          </div>
          
          {/* Solo precio y código de barras */}
          <div className="label-barcode">
            <Barcode value={product.sku || ''} format="CODE39" />
          </div>
          
          <div className="label-price">
            ${product.salePrice?.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ **Resumen: Todo está listo para usar**

Tu sistema FemeninePOS ya incluye:

✅ **Componentes de React** para etiquetas  
✅ **Integración con Brother QL-800**  
✅ **Plantillas personalizables**  
✅ **Vista previa en tiempo real**  
✅ **Impresión web como fallback**  
✅ **APIs backend completas**  
✅ **Configuración desde la interfaz**  

**Solo necesitas:**
1. Instalar P-Touch Editor (opcional, para Brother QL-800)
2. Crear el template .lbx (si usas Brother)
3. Configurar las rutas en la página de Configuración
4. ¡Empezar a imprimir etiquetas!

**Para usar inmediatamente:**
- Ve a Inventario → Selecciona un producto → Botón "Imprimir Etiqueta"
- Usa el modo "Impresión Web" si no tienes Brother QL-800 configurada

¡El sistema está completamente funcional y listo para generar etiquetas profesionales con códigos de barras! 🚀
