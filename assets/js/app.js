const app = new Framework7({ el: '#app', theme: 'ios' });
const $$ = Dom7;

const db = new Dexie("LabelGoDB");
db.version(1).stores({
  articulos: "barcode",
  config: "key"
});

// Cargar URL guardada
db.config.get("dbfileurl").then(cfg => {
  if (cfg) $$('#dbfileurl').val(cfg.value);
});

// Función de Sincronización
async function syncDatabase() {
  const url = $$('#dbfileurl').val();
  if (!url) return;

  app.preloader.show();
  try {
    const res = await fetch(url);
    const csv = await res.text();
    
    Papa.parse(csv, {
      header: false,
      skipEmptyLines: true,
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
    app.toast.create({ text: 'Error al sincronizar', color: 'red', closeTimeout: 3000 }).open();
  }
}

// Escaneo e Impresión Directa
const html5QrCode = new Html5Qrcode("reader");

$$('#btn-scan-action').on('click', () => {
  $$('#reader').show();
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 20, qrbox: { width: 250, height: 150 } },
    async (decodedText) => {
      // 1. Detener cámara de inmediato
      await html5QrCode.stop();
      $$('#reader').hide();

      // 2. Buscar producto
      const producto = await db.articulos.get({ barcode: decodedText });

      if (producto) {
        // 3. Imprimir automáticamente
        imprimirTicket(producto);
      } else {
        app.toast.create({ 
          text: `Producto ${decodedText} no encontrado`, 
          color: 'red', 
          closeTimeout: 3000 
        }).open();
      }
    }
  ).catch(err => {
    app.toast.create({ text: 'Error de cámara', color: 'red', closeTimeout: 2000 }).open();
  });
});

function imprimirTicket(p) {
  const json = {
    "0": { "type": 0, "content": p.name, "bold": 1, "align": 1, "size": 22 },
    "1": { "type": 0, "content": "\n------------------------------------------\n", "align": 1 },
    "2": { "type": 0, "content": `$${p.price}`, "bold": 1, "align": 1, "size": 65 },
    "3": { "type": 0, "content": "\n", "align": 1 },
    "4": { "type": 2, "value": p.barcode, "width": 2, "height": 70, "align": 1, "pos": 2 },
    "5": { "type": 0, "content": `Ref: ${p.internal} | Bulto: $${p.refPrice}`, "bold": 0, "align": 1, "size": 16 },
    "6": { "type": 0, "content": "\n\n\n", "align": 1 }
  };

  const payload = encodeURIComponent(JSON.stringify(json));
  // Redirección al bridge de Thermer
  window.location.href = `my.bluetoothprint.scheme://?url=https://nfm.kunturstudio.com.ar/print_helper.php?json=${payload}`;
}

// Eventos de botones
$$('#btn-sync-action').on('click', syncDatabase);
$$('#btn-save').on('click', async () => {
  await db.config.put({ key: "dbfileurl", value: $$('#dbfileurl').val() });
  app.sheet.close('.config-sheet');
  syncDatabase();
});
