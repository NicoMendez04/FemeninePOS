# Integración Brother QL-800 con FemenineV1.1

## Opciones de Integración

### 1. Brother Print SDK for Web (Recomendada)
- **b-PAC SDK**: SDK oficial de Brother para aplicaciones web
- **Compatibilidad**: QL-800, QL-810W, QL-820NWB
- **Lenguajes**: JavaScript, Node.js

### 2. Brother QL Web API
- API REST para controlar impresoras Brother
- Instalación local en el equipo
- Control desde navegador web

### 3. Automatización con P-Touch Editor
- Usar scripts para automatizar P-Touch Editor
- Integración mediante archivos CSV
- Menos elegante pero funcional

## Implementación Recomendada: b-PAC SDK

### Instalación
1. Descargar b-PAC SDK desde Brother Developer Center
2. Instalar en el equipo con la impresora
3. Integrar con nuestra aplicación web

### Código de Ejemplo

```javascript
// Función para imprimir etiqueta de producto
async function printProductLabel(product) {
  try {
    // Inicializar b-PAC
    const bpac = new ActiveXObject("bpac.Document");
    
    // Abrir template de etiqueta
    if (bpac.Open("C:\\Templates\\producto-template.lbx")) {
      // Configurar datos del producto
      bpac.GetObject("ProductName").Text = product.name;
      bpac.GetObject("SKU").Text = product.sku;
      bpac.GetObject("Price").Text = `$${product.salePrice}`;
      bpac.GetObject("Barcode").Text = product.sku;
      
      // Imprimir
      bpac.StartPrint("", 0);
      bpac.PrintOut(1, 0); // 1 copia
      bpac.EndPrint();
      bpac.Close();
      
      return { success: true, message: "Etiqueta impresa correctamente" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Integración con React
const PrintLabelButton = ({ product }) => {
  const handlePrint = async () => {
    const result = await printProductLabel(product);
    if (result.success) {
      alert("Etiqueta impresa");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <button onClick={handlePrint} className="print-btn">
      🖨️ Imprimir Etiqueta
    </button>
  );
};
```

### Template de Etiqueta (.lbx)
- Crear en P-Touch Editor
- Definir campos: Nombre, SKU, Precio, Código de barras
- Guardar como template para reutilizar

## Alternativa: Brother QL Web API

### Instalación
```bash
# Descargar Brother QL Web API
# Instalar como servicio Windows
# Puerto por defecto: 8080
```

### Uso desde Frontend
```javascript
// Enviar datos de impresión
const printLabel = async (productData) => {
  const response = await fetch('http://localhost:8080/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'product-label',
      data: productData
    })
  });
  
  return response.json();
};
```

## Integración con Backend Actual

### 1. Endpoint de Impresión
```typescript
// backend/src/routes/printRoutes.ts
import express from 'express';

const router = express.Router();

router.post('/print-label/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { brand: true, category: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Llamar función de impresión
    const result = await printProductLabel(product);
    
    // Log de actividad
    await LogService.logPrintBarcode(
      req.user.id,
      product.id,
      product.sku,
      product.name
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al imprimir etiqueta' });
  }
});

export default router;
```

### 2. Integración Frontend
```tsx
// Botón en InventoryPage.tsx
const handlePrintLabel = async (product: Product) => {
  try {
    const response = await fetch(`/api/print-label/${product.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      setNotification({
        type: 'success',
        message: 'Etiqueta impresa correctamente'
      });
    }
  } catch (error) {
    setNotification({
      type: 'error',
      message: 'Error al imprimir etiqueta'
    });
  }
};
```

## Configuración Inicial

### 1. Instalar Brother Drivers
- Descargar drivers QL-800 desde Brother
- Instalar P-Touch Editor Lite
- Conectar impresora USB

### 2. Crear Template Base
- Abrir P-Touch Editor
- Crear etiqueta con campos: Nombre, SKU, Precio, Barcode
- Guardar como "producto-template.lbx"

### 3. Configurar Permisos
- Habilitar ActiveX en navegador (para b-PAC)
- O usar Brother Web API como alternativa

## Ventajas de Cada Método

### b-PAC SDK
✅ Control total sobre el diseño
✅ Integración nativa con Brother
✅ Soporte oficial
❌ Requiere ActiveX (solo IE/Edge legacy)

### Brother Web API
✅ Compatible con cualquier navegador
✅ API REST estándar
✅ Fácil integración
❌ Funcionalidad limitada

### Automatización P-Touch
✅ Usa software existente
✅ No requiere desarrollo adicional
❌ Menos integrado
❌ Requiere intervención manual

## Recomendación Final

Para tu caso, recomiendo **Brother Web API** porque:
1. Funciona con cualquier navegador moderno
2. Fácil integración con tu stack actual
3. No requiere ActiveX
4. Mantienes el control desde tu aplicación web

¿Te parece bien empezar con esta implementación?
