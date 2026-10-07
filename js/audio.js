/* ==========================================================
   AUDIO — reproduce los sonidos definidos en data/sonidos.js.
   No hace falta tocar este archivo.
   ========================================================== */

const Audio8 = (() => {
  const cache = {};
  let silencio = Almacen.silenciado();

  function precargar() {
    Object.keys(SONIDOS).forEach(nombre => {
      const ruta = SONIDOS[nombre];
      if (!ruta) return;
      const audio = new Audio(ruta);
      audio.preload = "auto";
      audio.addEventListener("error", () => console.warn(`Sonido no encontrado: ${ruta}`));
      cache[nombre] = audio;
    });
  }

  function reproducir(nombre) {
    if (silencio) return;
    const base = cache[nombre];
    if (!base) return;
    // Clonamos para que se puedan solapar varios golpes seguidos
    const copia = base.cloneNode();
    copia.volume = Math.max(0, Math.min(1, CONFIG.volumen));
    copia.play().catch(() => {});
  }

  function vibrar(ms) {
    if (CONFIG.vibracion && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  function alternarSilencio() {
    silencio = !silencio;
    Almacen.guardarSilencio(silencio);
    return silencio;
  }

  return { precargar, reproducir, vibrar, alternarSilencio, estaSilenciado: () => silencio };
})();
