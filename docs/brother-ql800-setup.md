# 🖨️ Guía de Configuración Brother QL-800

## 📋 Requisitos Previos

### Hardware
- ✅ Impresora Brother QL-800
- ✅ Cable USB conectado
- ✅ Etiquetas autoadhesivas (62mm x 29mm recomendado)

### Software
- ✅ Windows 10/11
- ✅ P-Touch Editor Lite (incluido con drivers)
- ✅ Drivers Brother QL-800

## 🚀 Configuración Paso a Paso

### 1. Instalar Drivers y Software
```bash
# Descargar desde Brother Support
https://support.brother.com/g/b/downloadlist.aspx?c=us&lang=en&prod=lpql800eus

# Instalar en este orden:
1. QL-800 Driver
2. P-Touch Editor Lite
3. Brother Utilities (opcional)
```

### 2. Conectar la Impresora
```bash
# Verificar conexión
1. Conectar USB a PC
2. Encender impresora QL-800
3. Windows detectará automáticamente
4. Probar impresión desde Windows
```

### 3. Crear Template de Etiqueta

#### A. Abrir P-Touch Editor Lite
```
Inicio → Programas → Brother → P-Touch Editor 5.2
```

#### B. Configurar Nueva Etiqueta
```
1. File → New
2. Seleccionar "Continuous Length Tape"
3. Ancho: 62mm
4. Alto: 29mm (ajustable)
```

#### C. Agregar Campos de Texto
```
Campos requeridos:
- ProductName (Nombre del producto)
- SKU (Código SKU)
- BaseCode (Código base)
- Price (Precio con formato $XX.XX)
- Size (Talla)
- Color (Color)
- Brand (Marca)
```

#### D. Agregar Código de Barras
```
1. Insert → Barcode
2. Tipo: CODE128 o EAN13
3. Vincular a campo "Barcode"
4. Tamaño: Ajustar para ser legible
```

#### E. Guardar Template
```
1. File → Save As
2. Nombre: producto-template.lbx
3. Ubicación: C:\Templates\producto-template.lbx
4. Tipo: P-Touch Template (*.lbx)
```

### 4. Configuración del Sistema

#### A. Crear Directorios
```powershell
# Ejecutar en PowerShell como Administrador
New-Item -ItemType Directory -Path "C:\Templates" -Force
New-Item -ItemType Directory -Path "C:\Temp" -Force
```

#### B. Configurar Permisos
```powershell
# Dar permisos de escritura a la aplicación
icacls "C:\Templates" /grant Users:F
icacls "C:\Temp" /grant Users:F
```

### 5. Probar Integración

#### A. Desde la Aplicación Web
```
1. Ir a Inventario
2. Buscar un producto
3. Hacer clic en "🖨️ Etiqueta"
4. Verificar que se imprima correctamente
```

#### B. Verificar Logs
```
Backend Console mostrará:
- "Datos para impresión de etiqueta: {...}"
- Estado de impresión (éxito/error)
```

## 🔧 Solución de Problemas

### Problema: "P-Touch Editor not found"
```bash
Solución:
1. Verificar instalación de P-Touch Editor
2. Buscar ejecutable en:
   - C:\Program Files (x86)\Brother\P-touch Editor 5.2\
   - C:\Program Files\Brother\P-touch Editor 5.2\
3. Actualizar ruta en brotherPrinterService.ts
```

### Problema: "Template not found"
```bash
Solución:
1. Verificar que existe C:\Templates\producto-template.lbx
2. Recrear template siguiendo guía
3. Verificar permisos de archivo
```

### Problema: "Permission denied"
```bash
Solución:
1. Ejecutar aplicación como Administrador
2. Configurar permisos de directorios
3. Verificar antivirus no bloquee
```

### Problema: "Printer not responding"
```bash
Solución:
1. Verificar conexión USB
2. Reiniciar impresora
3. Verificar drivers actualizados
4. Probar impresión desde Windows
```

## 📊 Formato de Etiqueta Recomendado

```
┌─────────────────────────────────────┐
│ [BRAND] - [PRODUCT NAME]            │
│ SKU: [SKU] | Código: [BASE_CODE]    │
│ Talla: [SIZE] | Color: [COLOR]      │
│ Precio: $[PRICE]                    │
│ ███████████████ [BARCODE] ████████  │
└─────────────────────────────────────┘
```

## 🔌 Métodos de Integración Disponibles

### 1. CSV + P-Touch Editor (Actual)
✅ **Funciona inmediatamente**
- Genera archivo CSV temporal
- Ejecuta P-Touch Editor con datos
- Imprime automáticamente

### 2. Brother Web API (Futuro)
🔄 **En desarrollo**
- API REST local
- Control directo de impresora
- Mayor flexibilidad

### 3. b-PAC SDK (Avanzado)
🔄 **Para implementar**
- SDK oficial Brother
- Control total programático
- Requiere ActiveX

## 📞 Soporte

### Contactos Útiles
- **Brother Support**: https://support.brother.com
- **Manual QL-800**: Buscar "QL-800 User Guide"
- **Drivers**: https://www.brother.com/downloads

### Archivos de Configuración
- **Template**: `C:\Templates\producto-template.lbx`
- **Logs**: Console del backend
- **Datos temporales**: `C:\Temp\label-data.csv`

## ✅ Checklist de Verificación

- [ ] Impresora conectada y encendida
- [ ] Drivers instalados correctamente
- [ ] P-Touch Editor Lite funcional
- [ ] Template creado y guardado
- [ ] Directorios creados con permisos
- [ ] Botón "Etiqueta" visible en inventario
- [ ] Impresión de prueba exitosa

¡Tu Brother QL-800 está lista para imprimir etiquetas automáticamente! 🎉
