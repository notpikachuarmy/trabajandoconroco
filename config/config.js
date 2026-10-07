/* ==========================================================
   CONFIGURACIÓN — TRABAJANDO CON ROCO
   ----------------------------------------------------------
   Este es el archivo que vas a tocar casi siempre.
   Cambia solo lo que hay a la derecha de los dos puntos (:)
   o del signo igual (=). Respeta las comillas y las comas.
   ========================================================== */


/* ----------------------------------------------------------
   1) OBJETO OBJETIVO DEL DÍA
   Escribe el "id" de un objeto de data/objetos.js
   (en mayúsculas, entre comillas). Ejemplos:
   "BIGPEARL", "HEARTSCALE", "NUGGET", "HELIXFOSSIL"...
   ---------------------------------------------------------- */
const OBJETO_OBJETIVO = "BIGPEARL";


const CONFIG = {

  /* ---------- Textos ---------- */
  titulo: "Trabajando con Roco",
  subtitulo: "Miércoles de Minijuegos",

  /* ---------- Intentos ---------- */
  intentosDiarios: 3,              // excavaciones por persona y día
  zonaHoraria: "Europe/Madrid",    // el día se reinicia a las 00:00 de esta zona

  /* Mostrar al jugador cuál es el objeto que busca.
     false = es secreto: solo se revela cuando alguien lo encuentra. */
  mostrarObjetivo: false,

  /* MODO PRUEBAS: intentos ilimitados y botón para borrar el progreso.
     Úsalo solo para probar. ¡Ponlo en false antes de publicar! */
  modoPruebas: false,

  /* ---------- La pared ---------- */
  columnas: 15,                    // ancho de la pared en casillas
  filas: 11,                       // alto de la pared en casillas
  capaMin: 3,                      // capas de roca mínimas por casilla
  capaMax: 6,                      // capas de roca máximas por casilla (máx. 6)

  /* Resistencia de la pared. Cada golpe la desgasta;
     cuando llega a 0 se derrumba y termina el intento.
     Más alto = más fácil. */
  estabilidadPared: 45,

  /* Cuántos objetos hay enterrados en cada excavación */
  objetosPorExcavacion: { min: 3, max: 5 },

  /* Probabilidad de que el objeto objetivo esté enterrado
     en una excavación. 1 = SIEMPRE aparece (recomendado:
     así es justo y la dificultad está en desenterrarlo
     antes de que se derrumbe la pared).
     0.5 = en la mitad de las paredes, etc. */
  probabilidadObjetivo: 1,

  /* Bloques de roca dura (no se pueden romper) */
  rocasDuras: { min: 1, max: 3 },

  /* Destellos sobre la roca cuando queda muy poco para
     llegar a un objeto */
  pistasBrillo: true,

  /* ---------- Herramientas ----------
     centro:   capas que quita en la casilla tocada
     cruz:     capas que quita arriba, abajo, izquierda y derecha
     diagonal: capas que quita en las cuatro esquinas
     desgaste: cuánto daña la pared cada golpe */
  herramientas: {
    pico:     { nombre: "Pico",     centro: 2, cruz: 1, diagonal: 0, desgaste: 1 },
    martillo: { nombre: "Martillo", centro: 2, cruz: 2, diagonal: 1, desgaste: 3 }
  },

  /* ---------- Tamaños de los objetos ----------
     Cuántas casillas de lado ocupa cada tamaño.
     En data/objetos.js eliges qué tamaños puede tener cada objeto. */
  tamanos: {
    muy_pequeno: 1,
    pequeno: 2,
    mediano: 3,
    grande: 4,
    muy_grande: 5
  },

  /* ---------- Sonido y vibración ---------- */
  volumen: 0.7,          // de 0 a 1
  vibracion: true        // vibración en móviles al golpear
};
