/* ==========================================================
   ALMACÉN — guarda el progreso del día en localStorage.
   No hace falta tocar este archivo.
   ========================================================== */

const Almacen = (() => {
  const CLAVE = "trabajandoConRoco_v1";
  const CLAVE_SILENCIO = "trabajandoConRoco_silencio";

  /* Partes de la fecha y hora actuales en la zona horaria configurada */
  function partesAhora() {
    const opciones = {
      timeZone: CONFIG.zonaHoraria, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    };
    let partes;
    try {
      partes = new Intl.DateTimeFormat("en-CA", opciones).formatToParts(new Date());
    } catch (e) {
      delete opciones.timeZone; // zona horaria mal escrita: usamos la del dispositivo
      partes = new Intl.DateTimeFormat("en-CA", opciones).formatToParts(new Date());
    }
    const p = {};
    partes.forEach(x => { p[x.type] = x.value; });
    return p;
  }

  function fechaHoy() {
    const p = partesAhora();
    return `${p.year}-${p.month}-${p.day}`;
  }

  function segundosHastaReinicio() {
    const p = partesAhora();
    const transcurridos = (+p.hour) * 3600 + (+p.minute) * 60 + (+p.second);
    return Math.max(0, 86400 - transcurridos);
  }

  function estadoNuevo() {
    return {
      fecha: fechaHoy(),
      objetivo: OBJETO_OBJETIVO,
      intentosUsados: 0,
      ganado: false,
      ganadoA: null,      // hora a la que se encontró el objetivo
      bolsa: [],          // objetos encontrados hoy: [{id, tamano}]
      partida: null       // excavación en curso (para poder recargar sin perderla)
    };
  }

  function cargar() {
    let estado = null;
    try { estado = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { estado = null; }

    // Día nuevo u objetivo nuevo: se empieza de cero
    if (!estado || estado.fecha !== fechaHoy() || estado.objetivo !== OBJETO_OBJETIVO) {
      estado = estadoNuevo();
      guardar(estado);
    }
    return estado;
  }

  function guardar(estado) {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
    catch (e) { console.warn("No se pudo guardar el progreso:", e); }
  }

  function borrar() {
    try { localStorage.removeItem(CLAVE); } catch (e) {}
  }

  function silenciado() {
    try { return localStorage.getItem(CLAVE_SILENCIO) === "1"; } catch (e) { return false; }
  }
  function guardarSilencio(valor) {
    try { localStorage.setItem(CLAVE_SILENCIO, valor ? "1" : "0"); } catch (e) {}
  }

  return { cargar, guardar, borrar, fechaHoy, segundosHastaReinicio, silenciado, guardarSilencio };
})();
