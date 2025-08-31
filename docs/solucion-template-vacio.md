# 🔧 SOLUCIÓN: Template P-touch Editor con Datos

## ❌ Problema: La etiqueta imprime vacía sin datos del producto

## ✅ Solución: Configurar campos correctamente en P-touch Editor

### 📋 **Paso 1: Verificar los datos que se envían**

El sistema envía estos datos en el CSV:
```csv
ProductName,SKU,BaseCode,Price,Size,Color,Brand,Category,Barcode
Pantalón Jeans Skinny,PAN001,PAN,42990,L,Azul,Zara,Pantalones,PAN001
```

### 🎯 **Paso 2: Crear template en P-touch Editor CORRECTAMENTE**

#### A. Abrir P-touch Editor
- Ejecutar: `C:\Program Files (x86)\Brother\Ptedit54\ptedit54.exe`
- File > New > Seleccionar QL-800 > Media: DK-11201

#### B. Insertar campos de BASE DE DATOS (NO texto estático)

**🔹 CAMPO 1: Nombre del Producto**
1. Insert > Database Field (NO "Text")
2. En "Field Name" escribir exactamente: `ProductName`
3. Posicionar en la línea superior

**🔹 CAMPO 2: Talla y Color**
- Insertar texto fijo: `T: `
- Insert > Database Field > Field Name: `Size`
- Insertar texto fijo: `   C: `
- Insert > Database Field > Field Name: `Color`

**🔹 CAMPO 3: Marca**
1. Insert > Database Field
2. Field Name: `Brand`
3. Posicionar a la izquierda

**🔹 CAMPO 4: Precio**
- Insertar texto fijo: `$ `
- Insert > Database Field > Field Name: `Price`
- Alinear a la derecha

**🔹 CAMPO 5: Código de Barras**
1. Insert > Barcode
2. Tipo: Code 128
3. **IMPORTANTE:** En "Data Source" seleccionar "Database"
4. En "Database Field" escribir: `SKU`

**🔹 CAMPO 6: Texto del SKU**
1. Insert > Database Field
2. Field Name: `SKU`
3. Centrar debajo del código de barras

### 📁 **Paso 3: Guardar el Template**
- File > Save As
- Nombre: `etiqueta-producto-dk11201.lbx`
- Ubicación: `[Tu ruta configurada]\Templates\`

### 🔍 **Paso 4: Verificar la Configuración**

#### A. En la aplicación:
1. Ir a Configuración > Impresora
2. Verificar que las rutas estén correctas:
   - P-touch Editor: `C:\Program Files (x86)\Brother\Ptedit54\ptedit54.exe`
   - Template: `[TuRuta]\Templates\etiqueta-producto-dk11201.lbx`
   - Archivo temporal: `[TuRuta]\Temp\label-data.csv`

#### B. Probar impresión:
1. Ir a Inventario
2. Seleccionar un producto que tenga datos completos
3. Ver Detalles > Imprimir Etiqueta
4. Revisar la consola del backend para ver los logs

### 🐛 **Depuración: Si sigue sin funcionar**

#### 1. Verificar logs del backend:
- Debe mostrar los datos del producto
- Debe mostrar el CSV generado
- Debe mostrar el comando ejecutado

#### 2. Verificar el archivo CSV:
- Ir a `[TuRuta]\Temp\label-data.csv`
- Abrir con Notepad y verificar que contiene los datos

#### 3. Verificar el template:
- Abrir el template en P-touch Editor
- Ir a File > Database > Connect
- Seleccionar el archivo `label-data.csv`
- Verificar que los campos se llenan con datos

### 🎨 **Resultado Esperado:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Pantalón Jeans Skinny                                           │
│ T: L   C: Azul                                                  │
│ Zara                            $ 42990                         │
│ ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||  │
│                         PAN001                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ⚠️ **Errores Comunes:**

1. **Usar campos de texto estático** en lugar de campos de base de datos
2. **Nombres de campos incorrectos** (ProductName ≠ productname)
3. **Template no configurado para usar CSV** como fuente de datos
4. **Ruta del template incorrecta** en la configuración del sistema

### 🔧 **Si necesitas ayuda:**
1. Revisar los logs del backend en la consola
2. Verificar que el producto tenga todos los datos (nombre, SKU, precio, etc.)
3. Comprobar que el template se guardó en la ruta correcta
