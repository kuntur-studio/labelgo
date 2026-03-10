# LabelGo - PWA para Distribuidora NFM

**LabelGo** es una Progressive Web App (PWA) diseñada para optimizar el proceso de etiquetado de precios en góndola. Permite al personal de la distribuidora escanear productos y generar etiquetas de forma inmediata utilizando el hardware integrado de terminales móviles.

## 🚀 Funcionalidades Principales

* **Escaneo en Tiempo Real:** Integración con la cámara del dispositivo para lectura rápida de códigos de barra.
* **Gestión de Datos Offline:** Uso de base de datos indexada (IndexedDB) para garantizar que la búsqueda de productos sea instantánea y funcione sin conexión constante a internet.
* **Sincronización de Precios:** Actualización bajo demanda mediante el procesamiento de archivos CSV exportados directamente desde el sistema administrativo de la empresa.
* **Impresión Directa:** Integración con impresoras térmicas mediante un app bridge, optimizado específicamente para dispositivos **SUNMI V2**.

## 🛠️ Tecnologías Utilizadas

* **Framework 7:** Desarrollo de la interfaz con componentes nativos de alto rendimiento.
* **Dexie.js:** Manejo robusto de la base de datos IndexedDB.
* **PapaParse:** Parseo eficiente de grandes volúmenes de datos en formato CSV.
* **HTML5-QRCode:** Implementación del scanner de códigos de barra sobre estándares web modernos.

## 📱 Hardware Soportado

Esta aplicación está diseñada específicamente para correr en:
* **Dispositivo:** SUNMI V2 (Handheld POS).
* **Salida:** Impresora térmica integrada (vía Bridge App).

## ⚙️ Estructura de la Interfaz

La aplicación se basa en la simplicidad para facilitar el trabajo en el salón:

1.  **Botón de Actualización:** Descarga el archivo CSV desde la ruta configurada, lo parsea y refresca la base de datos local.
2.  **Botón de Scanner:** Activa la cámara para identificar el producto y disparar la impresión de la etiqueta.
3.  **Ícono de Configuración (⚙️):** Panel para definir la URL del servidor web donde se aloja el origen de datos (CSV).

---
*Desarrollado para Distribuidora NFM.*