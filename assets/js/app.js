const DB_VERSION = 1;

const app = new Framework7({ 
  el: '#app', 
  theme: 'md', 
  touch: { mdTouchRipple: true } 
});

const $$ = Dom7;

const db = new Dexie("LabelGoDB");
db.version(DB_VERSION).stores({ products: "barcode", config: "key" });

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

async function syncData() {
  const url = $$('#url-csv').val();
  if (!url) return;
  app.preloader.show();
  try {
    const res = await fetch(url);
    const text = await res.text();
    Papa.parse(text, {
      complete: async (results) => {
        const data = results.data.map(r => ({
          barcode: r?.trim(),
          name: r?.trim(),
          price: r?.trim(),
          reference: r?.trim(),
          reference_price: r?.trim()
        }));
        await db.products.clear();
        await db.products.bulkPut(data);
        app.preloader.hide();
        app.toast.create({ text: 'Sincronizado', color: 'green', closeTimeout: 2000 }).open();
      }
    });
  } catch (e) {
    app.preloader.hide();
    app.toast.create({ text: 'Error de red', color: 'red' }).open();
  }
}

const scanner = new Html5Qrcode("reader");

$$('#btn-scan').on('click', async () => {
  $$('#reader').show();
  
  // 1. Iniciamos el scanner
  scanner.start(
    { facingMode: "environment" },
    { fps: 20, qrbox: 250 },
    async (decodedText) => {
      playBeep();
      await scanner.stop();
      $$('#reader').hide();
      
      const prod = await db.products.get({ barcode: decodedText });
      if (prod) {
        enviarImpresion(prod);
      } else {
        app.toast.create({ text: 'No encontrado', color: 'red' }).open();
      }
    }
  ).then(() => {
    // 2. Intentamos encender la linterna después de que la cámara esté activa
    // Verificamos si el scanner tiene capacidad de linterna
    const track = scanner.getRunningTrackCapabilities();
    if (track && track.torch) {
      scanner.applyVideoConstraints({
        advanced: [{ torch: true }]
      }).catch(err => console.log("No se pudo forzar la linterna", err));
    }
  }).catch(err => {
    $$('#reader').hide();
    app.toast.create({ text: 'Error: ' + err, color: 'red' }).open();
  });
});

function enviarImpresion(p) {
  const ticket = {
    "0": { "type": 0, "content": p.name, "bold": 1, "align": 1, "size": 22 },
    "1": { "type": 0, "content": "\n------------------------------------------\n", "align": 1 },
    "2": { "type": 0, "content": `$${p.price}`, "bold": 1, "align": 1, "size": 65 },
    "3": { "type": 0, "content": "\n", "align": 1 },
    "4": { "type": 2, "value": p.barcode, "width": 2, "height": 70, "align": 1, "pos": 2 },
    "5": { "type": 0, "content": `Ref: ${p.reference} | Bulto: $${p.reference_price}`, "bold": 0, "align": 1, "size": 16 },
    "6": { "type": 0, "content": "\n\n\n", "align": 1 }
  };
  const payload = encodeURIComponent(JSON.stringify(ticket));
  window.location.href = `my.bluetoothprint.scheme://?url=https://nfm.kunturstudio.com.ar/print_helper.php?json=${payload}`;
}

$$('#btn-sync').on('click', syncData);
$$('#save-config').on('click', async () => {
  await db.config.put({ key: "dbfileurl", value: $$('#url-csv').val() });
  app.sheet.close('.config-sheet');
  syncData();
});