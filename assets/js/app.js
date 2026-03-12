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
      const prod = await db.products.get({ barcode: decodedText });
      if (prod) {
        enviarImpresion(prod);
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

function enviarImpresion(p) {
  // Enviamos el objeto producto completo y crudo (barcode, name, price, reference, reference_price)
  const payload = encodeURIComponent(JSON.stringify(p));
  
  // Se invoca al esquema de la app bridge apuntando al nuevo print_helper.php
  window.location.href = `my.bluetoothprint.scheme://?url=https://nfm.kunturstudio.com.ar/print_helper.php?json=${payload}`;
}

async function syncData() {
  const url = $$('#url-csv').val();
  if (!url) return;
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