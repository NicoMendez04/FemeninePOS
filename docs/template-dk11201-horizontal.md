# Template DK-11201 - Diseño Horizontal

## Diseño Recomendado para DK-11201 (29mm x 90mm)

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

## Ventajas de este Diseño

- ✅ **Mejor aprovechamiento del espacio**
- ✅ **Código de barras más grande y legible**
- ✅ **Información clara y organizada**
- ✅ **Fácil lectura tanto para humanos como scanners**

## Campos del Template

| Campo | Descripción | Formato en P-touch |
|-------|-------------|-------------------|
| `{ProductName}` | Nombre del producto | Fuente 8-9pt, bold |
| `{Size}` | Talla | Parte de línea 2 |
| `{Color}` | Color | Parte de línea 2 |
| `{Brand}` | Marca | Fuente 7pt |
| `{Price}` | Precio | Fuente 10-11pt, bold |
| `{SKU}` | Código para barcode | Code 128, rotado 90° |

## Pasos para Crear en P-touch Editor

### 1. Configuración Inicial
```
File > New
Printer: QL-800
Media: DK-11201 (29mm x 90mm)
```

### 2. Lado Izquierdo (Información)
```
Línea 1: {ProductName}
         Fuente: 8-9pt, Bold
         
Línea 2: T: {Size}   C: {Color}
         Fuente: 7pt
         
Línea 3: {Brand}
         Fuente: 7pt
         
Línea 4: ${Price}
         Fuente: 10-11pt, Bold
```

### 3. Lado Derecho (Código de Barras)
```
Insert > Barcode
Tipo: Code 128
Datos: {SKU}
Rotación: 90° (vertical)
Posición: Lado derecho
Altura: Máxima disponible
```

### 4. Guardar Template
```
File > Save As
Nombre: etiqueta-producto-dk11201.lbx
Ubicación: C:\Templates\
```

## Configuración en FemeninePOS

1. **Ir a Configuración > Impresora**
2. **Detectar P-touch Editor automáticamente**
3. **Seleccionar template:** `C:\Templates\etiqueta-producto-dk11201.lbx`
4. **Probar desde Inventario > Producto > Imprimir Etiqueta**

## Ejemplo de Datos Reales

```json
{
  "ProductName": "Jeans Skinny Mujer",
  "Size": "36",
  "Color": "Azul",
  "Brand": "Zara",
  "Price": "25990",
  "SKU": "FEM-2025-08-000123"
}
```

## Notas Importantes

- El código de barras **rotado 90°** es clave para el diseño
- El SKU se usa tanto para el barcode como para identificación
- El precio debe destacar visualmente
- Las etiquetas DK-11201 son perfectas para este formato
