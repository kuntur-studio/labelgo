const DB_VERSION = 1;

const app = new Framework7({ 
  el: '#app', 
  theme: 'md',
  touch: { tapHold: true, mdTouchRipple: true }
});

const $$ = Dom7;
const db = new Dexie("LabelGoDB");
// Mantenemos los dos almacenes (stores) necesarios
db.version(DB_VERSION).stores({ 
  products: "barcode",
  config: "key" 
});

db.config.get("dbfileurl").then(cfg => { if (cfg) $$('#url-csv').val(cfg.value); });

function playBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, context.currentTime);
  osc.connect(gain);
  gain.connect(context.destination);
  gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);
  osc.start();
  osc.stop(context.currentTime + 0.2);
}

const scanner = new Html5Qrcode("reader");
let isTorchOn = false;

$$('#btn-scan').on('click', async () => {
  $$('#scanner-container').show();
  
  // Recuperar preferencia de linterna de la DB, por defecto false
  const torchCfg = await db.config.get("torch_enabled");
  isTorchOn = torchCfg ? torchCfg.value : false;
  
  // Actualizar icono visual inicial
  updateTorchIcon();

  scanner.start(
    { facingMode: "environment" },
    { fps: 20, qrbox: 250 },
    async (decodedText) => {
      playBeep();
      stopScanner();
      const product = await db.products.get({ barcode: decodedText });
      if (product) {
        printLabel(product);
      } else {
        app.toast.create({ 
          text: `No encontrado: ${decodedText}`, 
          color: 'red', 
          closeTimeout: 3000 
        }).open();
      }
    }
  ).then(() => {
    // Aplicar el estado guardado una vez que la cámara inicia
    applyTorch(isTorchOn);
  }).catch(err => {
    stopScanner();
    app.toast.create({ text: 'Error cámara', color: 'red', closeTimeout: 2000 }).open();
  });
});

function stopScanner() {
  scanner.stop().then(() => {
    $$('#scanner-container').hide();
  }).catch(() => {
    $$('#scanner-container').hide();
  });
}

function applyTorch(state) {
  const track = scanner.getRunningTrackCapabilities();
  if (track && track.torch) {
    scanner.applyVideoConstraints({ advanced: [{ torch: state }] });
  }
}

function updateTorchIcon() {
    $$('#btn-toggle-torch i').text(isTorchOn ? 'flashlight_on' : 'flashlight_off');
}

// Evento Toggle Linterna con PERSISTENCIA
$$('#btn-toggle-torch').on('click', async () => {
  isTorchOn = !isTorchOn;
  
  // 1. Guardar en Store Config automáticamente
  await db.config.put({ key: "torch_enabled", value: isTorchOn });
  
  // 2. Aplicar al hardware
  applyTorch(isTorchOn);
  
  // 3. Actualizar UI
  updateTorchIcon();
});

$$('#btn-cancel-scan').on('click', stopScanner);

async function printLabel(product) {
    try {
        // Toast de procesamiento
        const processingToast = app.toast.create({
            text: 'Generando etiqueta...',
            position: 'center',
            closeTimeout: 2000
        });
        processingToast.open();

        // 1. Generar el HTML de la etiqueta en un contenedor temporal
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-label';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '300px';
        tempContainer.innerHTML = generateLabelHtml(product);
        document.body.appendChild(tempContainer);

        // 2. Capturar como imagen usando el helper
        const imageData = await window.printService.captureLabelAsImage('temp-label');
        
        // 3. Enviar a imprimir (con reintentos automáticos)
        const result = await window.printService.printImage(imageData);
        
        // 4. Limpiar el contenedor temporal
        document.body.removeChild(tempContainer);
        processingToast.close();

        if (result.success) {
            // ✅ Éxito
            app.toast.create({
                text: 'Etiqueta impresa correctamente',
                color: 'green',
                position: 'center',
                closeTimeout: 2000
            }).open();
            
        } else if (result.fallback) {
            // ⚠️ Fallback (QR)
            app.toast.create({
                text: 'Impresión directa no disponible. Usa QR de respaldo.',
                color: 'orange',
                position: 'center',
                closeTimeout: 2000
            }).open();
            
            showQRFallback(result.fallback);
        }

    } catch (error) {
        console.error('Error en impresión:', error);
        
        // Limpiar contenedor temporal si existe
        const temp = document.getElementById('temp-label');
        if (temp) document.body.removeChild(temp);

        // ❌ Error
        app.toast.create({
            text: 'Error al imprimir. Verifica el servicio.',
            color: 'red',
            position: 'center',
            closeTimeout: 2000
        }).open();
    }
}

// Inyecta los estilos de la etiqueta si no están presentes
function injectLabelStyles() {
    const styleId = 'labelgo-label-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .label-container {
            width: 50mm;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        .label-header {
            background-color: #000;
            color: #fff;
            padding: 1.5mm;
            font-size: 3.5mm;
            font-weight: bold;
            text-align: center;
        }
        .label-price {
            text-align: center;
            padding: 2mm 0;
            font-weight: 900;
            line-height: 1;
        }
        .label-footer {
            border-top: 0.4mm solid #000;
            padding: 1mm 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .label-barcode {
            font-size: 3mm;
            font-weight: bold;
        }
        .label-reference {
            font-size: 2.8mm;
            text-align: right;
        }
    `;
    document.head.appendChild(style);
}

function generateLabelHtml(product) {
    // Asegura que los estilos estén inyectados
    injectLabelStyles();
    
    const priceLength = String(product.price).length;
    const priceFontSize = (priceLength > 8) ? "8mm" : "10mm";
    
    // ID único para esta instancia de etiqueta (útil para depuración o referencia futura)
    const labelId = 'label-' + Date.now();
    
    return `
        <div id="${labelId}" class="label-container">
            <div class="label-header">${product.name}</div>
            <div class="label-price" style="font-size:${priceFontSize};">$${product.price}</div>
            <div class="label-footer">
                <div class="label-barcode">${product.barcode}</div>
                <div class="label-reference">${product.reference}: $${product.reference_price}</div>
            </div>
        </div>
    `;
}

// Función auxiliar para mostrar QR (implementar según necesites)
function showQRFallback(data) {
    app.dialog.create({
        title: 'Código QR de Respaldo',
        text: 'Escanea este código para imprimir desde otro dispositivo',
        content: `<div style="text-align: center;">
            <img src="${data.data}" style="max-width: 200px; margin: 10px auto;">
        </div>`,
        buttons: [
            {
                text: 'Cerrar',
                close: true
            }
        ]
    }).open();
}

async function syncData() {
  const baseUrl = $$('#url-csv').val();
  if (!baseUrl) return;
  app.preloader.show();
  try {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const urlConCacheBust = `${baseUrl}${separator}t=${Date.now()}`;
    
    const res = await fetch(urlConCacheBust);
    const text = await res.text();
    
    Papa.parse(text, {
      skipEmptyLines: true, // Evita procesar filas vacías al final del archivo
      complete: async (results) => {
        // Validación robusta: convertimos a string y comprobamos existencia
        const data = results.data.map(r => {
          const getVal = (idx) => (r[idx] !== undefined && r[idx] !== null) ? String(r[idx]).trim() : "";
          return {
            barcode: getVal(0),
            name: getVal(1),
            price: getVal(2),
            reference: getVal(3),
            reference_price: getVal(4)
          };
        }).filter(item => item.barcode !== ""); // No guardamos registros sin código

        await db.products.clear();
        await db.products.bulkPut(data);
        app.preloader.hide();
        app.toast.create({ text: 'Sincronizado correctamente', color: 'green', closeTimeout: 2000 }).open();
      }
    });
  } catch (e) {
    app.preloader.hide();
    app.toast.create({ text: 'Error al conectar con el servidor', color: 'red', closeTimeout: 2000 }).open();
  }
}

$$('#btn-sync').on('click', syncData);
$$('#save-config').on('click', async () => {
  await db.config.put({ key: "dbfileurl", value: $$('#url-csv').val() });
  app.sheet.close('.config-sheet');
  syncData();
});