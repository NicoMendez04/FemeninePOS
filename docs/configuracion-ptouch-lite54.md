# 🖨️ Configuración P-touch Editor Lite 5.4 para FemeninePOS

## 📋 Requisitos Previos

- ✅ **P-touch Editor Lite 5.4** instalado
- ✅ **Brother QL-800** conectada por USB
- ✅ **Etiquetas DK-11201** (29mm x 90mm)
- ✅ **FemeninePOS** funcionando

---

## 🎯 Configuración Automática

### **1. Detección Automática en FemeninePOS**

1. Ve a **Configuración** en FemeninePOS
2. Busca la sección "Configuración de Impresora Brother QL-800"
3. En el recuadro azul "Detección Automática":
   - Clic en **"Detectar P-touch Editor"**
   - Clic en **"Crear Directorios"**
4. El sistema buscará automáticamente en:
   ```
   C:\Program Files\Brother\P-touch Editor Lite 5.4\P-touch Editor.exe
   C:\Program Files (x86)\Brother\P-touch Editor Lite 5.4\P-touch Editor.exe
   ```

### **2. Configuración Manual (si es necesario)**

Si la detección automática falla:

**P-touch Editor:**
- Clic en "Buscar"
- Navega hasta la carpeta de instalación de Brother
- Selecciona `P-touch Editor.exe`

**Directorios:**
- Template: `C:\Templates\`
- Temporal: `C:\Temp\`

---

## 🏷️ Crear Template DK-11201

### **Paso 1: Nuevo Documento**
1. Abre **P-touch Editor Lite 5.4**
2. **Archivo** → **Nuevo**
3. Selecciona **"Etiqueta"**

### **Paso 2: Seleccionar DK-11201**
1. En la lista de etiquetas, busca **"DK-11201"**
2. Tamaño: **29mm × 90mm**
3. Clic en **"Aceptar"**

### **Paso 3: Diseño de la Etiqueta**

#### **Layout Recomendado:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [ProductName]      │                                           │
│                    │    ||||||||||||||||                       │
│ T:[Size] C:[Color] │    [Barcode - CODE128]                    │
│ [Brand]            │    (Rotado 90°)                          │
│ $[Price]           │                                           │
└─────────────────────────────────────────────────────────────────┘
   ← 45mm Info →      ← 45mm Código de Barras →
```

#### **Columna Izquierda (45mm):**

1. **Nombre del Producto:**
   - **Insertar** → **Campo**
   - Nombre: `ProductName`
   - Fuente: Arial, 10pt, **Negrita**
   - Posición: Superior izquierda

2. **Talla y Color:**
   - Texto fijo: `T:` + **Campo** `Size`
   - Texto fijo: `C:` + **Campo** `Color`
   - Fuente: Arial, 8pt
   - En la misma línea

3. **Marca:**
   - **Insertar** → **Campo**
   - Nombre: `Brand`
   - Fuente: Arial, 8pt, *Cursiva*

4. **Precio:**
   - Texto fijo: `$` + **Campo** `Price`
   - Fuente: Arial, 14pt, **Negrita**
   - Posición: Inferior izquierda

#### **Columna Derecha (45mm):**

1. **Código de Barras:**
   - **Insertar** → **Código de barras**
   - Tipo: **CODE128**
   - Campo vinculado: `Barcode`
   - **Importante:** Rotar **90° hacia la derecha**
   - Tamaño: Altura ~60px
   - Centrado en la columna

### **Paso 4: Configurar Campos de Datos**

En **P-touch Editor**, asegúrate de que los campos sean **variables** (no texto fijo):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ProductName` | Texto | Nombre del producto |
| `Size` | Texto | Talla (S, M, L, 36, 38, etc.) |
| `Color` | Texto | Color del producto |
| `Brand` | Texto | Marca del producto |
| `Price` | Número | Precio sin decimales |
| `Barcode` | Código de barras | SKU del producto |

### **Paso 5: Guardar Template**

1. **Archivo** → **Guardar como Template**
2. Navegar a: `C:\Templates\`
3. Nombre: `dk11201-template.lbx`
4. Clic en **"Guardar"**

---

## ⚙️ Configurar en FemeninePOS

### **Rutas de Configuración:**

1. **P-touch Editor Path:**
   ```
   C:\Program Files\Brother\P-touch Editor Lite 5.4\P-touch Editor.exe
   ```

2. **Template Path:**
   ```
   C:\Templates\dk11201-template.lbx
   ```

3. **Temp Path:**
   ```
   C:\Temp\label-data.csv
   ```

### **Verificar Configuración:**

1. En FemeninePOS → **Configuración**
2. Clic en **"Verificar Configuración"**
3. Debe mostrar: **"Configuración Correcta"** ✅

---

## 🧪 Probar Impresión

### **Desde Inventario:**
1. Ve a **Inventario**
2. Selecciona un producto
3. Clic en el ícono de **impresora** 🖨️
4. Selecciona cantidad
5. Clic en **"Imprimir Etiqueta"**

### **Verificar Resultado:**
- ✅ Nombre del producto visible
- ✅ Talla y color correctos
- ✅ Marca visible
- ✅ Precio destacado
- ✅ Código de barras legible
- ✅ SKU debajo del código

---

## 🔧 Solución de Problemas

### **Error: "P-touch Editor no encontrado"**
- Verificar que esté instalado correctamente
- Usar detección automática
- Buscar manualmente el archivo .exe

### **Error: "Template no encontrado"**
- Verificar que el archivo .lbx existe
- Recrear el template siguiendo la guía
- Verificar permisos de escritura en C:\Templates\

### **Error: "No se puede escribir archivo temporal"**
- Verificar permisos en C:\Temp\
- Crear directorios manualmente
- Ejecutar FemeninePOS como administrador

### **Código de barras no se imprime**
- Verificar que el campo se llame exactamente `Barcode`
- Verificar que sea tipo CODE128
- Rotar 90° en P-touch Editor

### **Etiqueta sale cortada**
- Verificar que sea DK-11201 (29mm x 90mm)
- Ajustar márgenes en P-touch Editor
- Verificar alineación de la impresora

---

## 📞 Soporte

Si tienes problemas:

1. **Revisar logs** en la consola del navegador
2. **Verificar** que la impresora esté conectada
3. **Probar** imprimir desde P-touch Editor directamente
4. **Consultar** la documentación de Brother

---

## ✅ Lista de Verificación Final

- [ ] P-touch Editor Lite 5.4 instalado
- [ ] Brother QL-800 conectada y reconocida
- [ ] Etiquetas DK-11201 cargadas
- [ ] Template dk11201-template.lbx creado
- [ ] Configuración en FemeninePOS completada
- [ ] Prueba de impresión exitosa
- [ ] Código de barras legible con escáner

¡Listo para usar! 🎉
