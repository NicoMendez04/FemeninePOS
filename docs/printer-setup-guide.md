# 🖨️ Configuración de Impresora Brother QL-800

## 📱 Cómo Configurar desde la Aplicación

### 1. Acceder a Configuración
1. Inicia sesión como **Administrador**
2. Ve al menú lateral y haz clic en **"Configuración"**
3. En la sección "Configuración de Impresora Brother QL-800"

### 2. Configurar P-Touch Editor
1. Haz clic en **"Explorar"** junto a "Ruta de P-Touch Editor"
2. Navega hasta donde esté instalado P-Touch Editor (usualmente):
   - `C:\Program Files (x86)\Brother\P-touch Editor 5.2\P-touch Editor.exe`
   - `C:\Program Files\Brother\P-touch Editor 5.2\P-touch Editor.exe`
3. Selecciona el archivo `P-touch Editor.exe`
4. La aplicación validará automáticamente que sea un archivo válido

### 3. Configurar Template de Etiquetas
1. Primero, crea tu template en P-Touch Editor:
   - Abre P-Touch Editor
   - Crea una nueva etiqueta con los campos necesarios
   - Guarda como template (.lbx)
2. En la aplicación, haz clic en **"Explorar"** junto a "Template de Etiquetas"
3. Selecciona tu archivo .lbx guardado
4. El sistema verificará que el archivo existe

### 4. Configurar Directorio Temporal
1. Haz clic en **"Editar"** junto a "Directorio Temporal"
2. Ingresa una ruta como: `C:\Temp\label-data.csv`
3. El sistema creará automáticamente el directorio si no existe

### 5. Verificar Configuración
1. Haz clic en **"Verificar Configuración"**
2. El sistema te mostrará el estado de cada componente:
   - ✅ Verde: Configurado correctamente
   - ⚠️ Amarillo: Problemas detectados
   - ❌ Rojo: No configurado o error

## 🎯 Usar la Impresora

### Desde Inventario
1. Ve a **"Inventario"**
2. Busca el producto que quieres imprimir
3. Haz clic en el botón **🖨️** junto al producto
4. Se abrirá una vista previa de la etiqueta
5. Haz clic en **"Imprimir Etiqueta"**
6. La etiqueta se enviará automáticamente a la impresora

## 🔧 Solución de Problemas

### "P-Touch Editor not found"
- Verifica que P-Touch Editor esté instalado
- Usa el botón "Explorar" para localizar manualmente el .exe
- Instala desde: https://support.brother.com

### "Template not found" 
- Crea un template en P-Touch Editor primero
- Guarda como archivo .lbx
- Usa el botón "Explorar" para seleccionarlo

### "Permission denied"
- Ejecuta la aplicación como Administrador
- Verifica que los directorios tengan permisos de escritura

### "Printer not responding"
- Verifica que la impresora esté conectada por USB
- Instala los drivers Brother QL-800
- Prueba imprimir desde Windows primero

## 💡 Consejos

- **Ruta Manual**: Si el botón "Explorar" no funciona, usa "Editar" para escribir la ruta manualmente
- **Template Simple**: Empieza con un template básico y agrégale complejidad gradualmente
- **Prueba Primero**: Antes de configurar en la app, asegúrate de que P-Touch Editor imprime correctamente
- **Backup**: Guarda una copia de tu template .lbx en un lugar seguro

¡Tu configuración está lista! 🎉
