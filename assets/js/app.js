// Iniciamos Framework7 con estilo MD (Android)
const app = new Framework7({ 
  el: '#app', 
  theme: 'md', // Estilo Android forzado
  touch: {
    tapHold: true,
    mdTouchRipple: true // Habilita el efecto de onda al presionar
  }
});

const $$ = Dom7;

// Base de Datos
const db = new Dexie("LabelGoDB");
db.version(1).stores({ articulos: "barcode", config: "key" });

// Cargar configuración
db.config.get("dbfileurl").then(cfg => {
  if (cfg) $$('#url-csv').val(cfg.value);
});

// Función de Beep (Generada por AudioContext para no depender de archivos externos)
function playBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime); // Tono alto
  oscillator.connect(gain);
  gain.connect(context.destination);

  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

// Sincronización
async function syncData() {
  const url = $$('#url-csv').val();
  if (!url) return;

  app.preloader.show();
  try {
    const res = await fetch(url);
    const text = await res.text();
    Papa.parse(text, {
      complete: async (results) => {
        const items = results.data.map(r => ({
          barcode: r[0]?.trim(),
          internal: r[1]?.trim(),
          name: r[2]?.trim(),
          price: r[3]?.trim(),
          refPrice: r[5]?.trim()
        }));
        await db.articulos.clear();
        await db.articulos.bulkPut(items);
        app.preloader.hide();
        app.toast.create({ text: 'Base de datos actualizada', color: 'green', closeTimeout: 2000 }).open();
      }
    });
  } catch (e) {
    app.preloader.hide();
    app.toast.create({ text: 'Error de conexión', color: 'red', closeTimeout: 2500 }).open();
  }
}

// Scanner
const scanner = new Html5Qrcode("reader");

$$('#btn-scan').on('click', () => {
  $$('#reader').show();
  scanner.start(
    { facingMode: "environment" },
    { fps: 20, qrbox: { width: 250, height: 150 } },
    async (decodedText) => {
      // Éxito: Beep y detener
      playBeep();
      await scanner.stop();
      $$('#reader').hide();

      const prod = await db.articulos.get({ barcode: decodedText });
      if (prod) {
        enviarImpresion(prod);
      } else {
        app.toast.create({ text: `No encontrado: ${decodedText}`, color: 'red', closeTimeout: 3000 }).open();
      }
    }
  ).catch(() => {
    $$('#reader').hide();
    app.toast.create({ text: 'Error cámara', color: 'red' }).open();
  });
});

function enviarImpresion(p) {
  const ticket = {
    "0": { "type": 0, "content": p.name, "bold": 1, "align": 1, "size": 22 },
    "1": { "type": 0, "content": "\n------------------------------------------\n", "align": 1 },
    "2": { "type": 0, "content": `$${p.price}`, "bold": 1, "align": 1, "size": 65 },
    "3": { "type": 0, "content": "\n", "align": 1 },
    "4": { "type": 2, "value": p.barcode, "width": 2, "height": 70, "align": 1, "pos": 2 },
    "5": { "type": 0, "content": `REF: ${p.internal} | Bulto: $${p.refPrice}`, "bold": 0, "align": 1, "size": 16 },
    "6": { "type": 0, "content": "\n\n\n", "align": 1 }
  };
  const payload = encodeURIComponent(JSON.stringify(ticket));
  window.location.href = `my.bluetoothprint.scheme://?url=https://nfm.kunturstudio.com.ar/print_helper.php?json=${payload}`;
}

// Eventos
$$('#btn-sync').on('click', syncData);
$$('#save-config').on('click', async () => {
  await db.config.put({ key: "dbfileurl", value: $$('#url-csv').val() });
  app.sheet.close('.config-sheet');
  syncData();
});