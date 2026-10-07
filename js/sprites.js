/* ==========================================================
   SPRITES — carga las imágenes de data/objetos.js.
   Si una imagen falta, dibuja una de repuesto para que el
   juego siga funcionando. No hace falta tocar este archivo.
   ========================================================== */

const Sprites = (() => {
  const imagenes = {};   // "ID" o "ID@tamano" → imagen o canvas
  const mascaras = {};   // "ID@tamano" → [true/false] por casilla

  function cargarImagen(ruta) {
    return new Promise(resolve => {
      if (!ruta) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { console.warn(`Sprite no encontrado: ${ruta}`); resolve(null); };
      img.src = ruta;
    });
  }

  /* Dibujo de repuesto: una gema del color del objeto con su inicial */
  function repuesto(obj) {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    g.fillStyle = "#2b1d14";
    g.beginPath(); g.arc(16, 16, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = obj.color || "#cccccc";
    g.beginPath(); g.arc(16, 16, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)";
    g.fillRect(9, 8, 4, 3);
    g.fillStyle = "#2b1d14";
    g.font = "bold 13px sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText((obj.nombre || obj.id).charAt(0), 16, 18);
    return c;
  }

  async function cargarTodos() {
    const tareas = [];
    OBJETOS.forEach(obj => {
      tareas.push(cargarImagen(obj.sprite).then(img => { imagenes[obj.id] = img || repuesto(obj); }));
      const extra = obj.spritesPorTamano || {};
      Object.keys(extra).forEach(tam => {
        tareas.push(cargarImagen(extra[tam]).then(img => { if (img) imagenes[`${obj.id}@${tam}`] = img; }));
      });
    });
    await Promise.all(tareas);
  }

  function obtener(id, tamano) {
    return imagenes[`${id}@${tamano}`] || imagenes[id] || null;
  }

  /* Qué casillas ocupa de verdad el objeto (según la transparencia
     de su imagen). Así una estrella no obliga a limpiar las esquinas. */
  function mascara(id, tamano, n) {
    const clave = `${id}@${tamano}`;
    if (mascaras[clave]) return mascaras[clave];
    let res = new Array(n * n).fill(true);
    const img = obtener(id, tamano);
    if (img && n > 1) {
      try {
        const res32 = 8; // píxeles de muestreo por casilla
        const c = document.createElement("canvas");
        c.width = c.height = n * res32;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, c.width, c.height);
        const datos = g.getImageData(0, 0, c.width, c.height).data;
        res = res.map((_, i) => {
          const cx = i % n, cy = Math.floor(i / n);
          let opacos = 0;
          for (let y = 0; y < res32; y++) {
            for (let x = 0; x < res32; x++) {
              const px = ((cy * res32 + y) * c.width + (cx * res32 + x)) * 4;
              if (datos[px + 3] > 40) opacos++;
            }
          }
          return opacos / (res32 * res32) > 0.12;
        });
        if (!res.some(Boolean)) res = res.map(() => true);
      } catch (e) {
        // Si el navegador no deja leer la imagen (p. ej. abriendo el
        // archivo sin servidor), se usa el cuadrado completo.
        res = new Array(n * n).fill(true);
      }
    }
    mascaras[clave] = res;
    return res;
  }

  return { cargarTodos, obtener, mascara };
})();
