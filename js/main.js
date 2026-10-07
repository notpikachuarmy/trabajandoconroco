/* ==========================================================
   MAIN — une todas las piezas y controla el flujo del día.
   No hace falta tocar este archivo.
   ========================================================== */

(async () => {
  const canvas = document.getElementById("pared");
  let estado;
  let herramienta = "pico";
  let ultimoGolpe = 0;

  const restantes = () => CONFIG.modoPruebas ? Infinity : CONFIG.intentosDiarios - estado.intentosUsados;
  const partidaActiva = () => estado.partida && !estado.partida.terminada && !estado.ganado;

  function horaVictoria() {
    try {
      return new Date().toLocaleString("es-ES", {
        timeZone: CONFIG.zonaHoraria, weekday: "long", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return new Date().toLocaleString("es-ES"); }
  }

  function comprobarConfig() {
    const problemas = [];
    if (!Array.isArray(OBJETOS) || !OBJETOS.length) problemas.push("La lista de objetos (data/objetos.js) está vacía.");
    else if (!Excavacion.buscarObjeto(OBJETO_OBJETIVO))
      problemas.push(`El objeto objetivo "${OBJETO_OBJETIVO}" no existe en data/objetos.js. Revisa que el id esté bien escrito.`);
    const ids = OBJETOS.map(o => o.id);
    const repetidos = ids.filter((id, k) => ids.indexOf(id) !== k);
    if (repetidos.length) problemas.push(`Hay ids repetidos en data/objetos.js: ${[...new Set(repetidos)].join(", ")}.`);
    if (problemas.length) Interfaz.avisoConfig(problemas.join(" "));
  }

  function pintarTodo() {
    Interfaz.pintarIntentos(estado.intentosUsados);
    Interfaz.pintarEstabilidad(estado.ganado ? null : estado.partida);
    Interfaz.pintarBolsa(estado.bolsa);
  }

  /* Pared decorativa para el fondo cuando no se está excavando */
  function paredDeAdorno() {
    const p = Excavacion.crear();
    p.objetos = [];
    return p;
  }

  /* ---------- Qué se ve al cargar la página ---------- */
  function decidirPantalla() {
    const p = estado.partida;
    if (estado.ganado) {
      Render.usarPartida(p || paredDeAdorno());
      const enterrado = p && p.objetos.find(o => o.id === OBJETO_OBJETIVO);
      if (enterrado) Render.efectoVictoria(enterrado);
      Interfaz.pantallaVictoria(enterrado, estado.ganadoA);
    } else if (partidaActiva()) {
      Render.usarPartida(p);
      Interfaz.ocultarPantalla();
    } else if (p && p.terminada) {
      Render.usarPartida(p);
      Interfaz.pantallaFin(p.motivo, p.objetos.filter(o => o.encontrado), estado.intentosUsados, empezar);
    } else if (restantes() > 0) {
      Render.usarPartida(paredDeAdorno());
      Interfaz.pantallaInicio(estado.intentosUsados, empezar);
    } else {
      Render.usarPartida(paredDeAdorno());
      Interfaz.pantallaSinIntentos();
    }
    pintarTodo();
    tic();
  }

  /* ---------- Empezar una excavación ---------- */
  function empezar() {
    if (estado.ganado || restantes() <= 0) return;
    estado.intentosUsados++;                 // el intento se gasta al empezar
    estado.partida = Excavacion.crear();
    Almacen.guardar(estado);
    Render.usarPartida(estado.partida);
    Interfaz.ocultarPantalla();
    Audio8.reproducir("inicio");
    pintarTodo();
  }

  /* ---------- Golpear ---------- */
  function golpe(ev) {
    if (!partidaActiva()) return;
    const ahora = performance.now();
    if (ahora - ultimoGolpe < 90) return;
    ultimoGolpe = ahora;

    const c = Render.casillaDesdeEvento(ev);
    if (!c) return;
    const r = Excavacion.golpear(estado.partida, c.x, c.y, herramienta);
    if (!r) return;

    Render.efectoGolpe(c.x, c.y, r, herramienta);
    Audio8.reproducir(r.golpeDuro && !r.afectadas.length ? "rocaDura" : herramienta);
    Audio8.vibrar(herramienta === "martillo" ? 30 : 15);
    if (r.brillos.length) Audio8.reproducir("brillo");

    r.encontrados.forEach(o => {
      estado.bolsa.push({ id: o.id, tamano: o.tamano });
      if (o.id !== OBJETO_OBJETIVO) {
        Audio8.reproducir("objeto");
        Interfaz.aviso(`¡${Interfaz.nombreDe(o.id)}!`, o.id);
      }
    });

    if (r.motivo) terminar(r.motivo);
    Almacen.guardar(estado);
    pintarTodo();
  }

  function terminar(motivo) {
    const p = estado.partida;
    if (motivo === "objetivo") {
      estado.ganado = true;
      estado.ganadoA = horaVictoria();
      const enterrado = p.objetos.find(o => o.id === OBJETO_OBJETIVO);
      Render.efectoVictoria(enterrado);
      Interfaz.iniciarTextos(true);
      Audio8.reproducir("objetivo");
      Audio8.vibrar([60, 40, 60, 40, 160]);
      setTimeout(() => Interfaz.pantallaVictoria(enterrado, estado.ganadoA), 1300);
      return;
    }
    const encontrados = p.objetos.filter(o => o.encontrado);
    const sinIntentos = restantes() <= 0;
    if (motivo === "derrumbe") {
      Render.efectoDerrumbe();
      Audio8.reproducir("derrumbe");
      Audio8.vibrar(250);
    }
    setTimeout(() => {
      Interfaz.pantallaFin(motivo, encontrados, estado.intentosUsados, empezar);
      if (sinIntentos) Audio8.reproducir("sinIntentos");
      tic();
    }, motivo === "derrumbe" ? 1100 : 700);
  }

  /* ---------- Reloj del reinicio diario ---------- */
  function tic() {
    if (Almacen.fechaHoy() !== estado.fecha) { location.reload(); return; }
    Interfaz.pintarCuentaAtras(Almacen.segundosHastaReinicio());
  }

  /* ---------- Herramientas ---------- */
  function elegirHerramienta(clave) {
    if (!CONFIG.herramientas[clave] || clave === herramienta) return;
    herramienta = clave;
    Render.ponerHerramienta(clave);
    document.querySelectorAll("[data-herramienta]").forEach(b => {
      const activa = b.dataset.herramienta === clave;
      b.classList.toggle("activa", activa);
      b.setAttribute("aria-checked", activa);
    });
    Audio8.reproducir("boton");
  }

  /* ---------- Arranque ---------- */
  Audio8.precargar();
  await Sprites.cargarTodos();
  Render.iniciar(canvas);
  comprobarConfig();
  estado = Almacen.cargar();
  Interfaz.iniciarTextos(estado.ganado);
  decidirPantalla();
  setInterval(tic, 1000);

  canvas.addEventListener("pointerdown", ev => { ev.preventDefault(); golpe(ev); });
  canvas.addEventListener("pointermove", ev => {
    Render.ponerFoco(ev.pointerType === "mouse" && partidaActiva() ? Render.casillaDesdeEvento(ev) : null);
  });
  canvas.addEventListener("pointerleave", () => Render.ponerFoco(null));
  canvas.addEventListener("contextmenu", ev => ev.preventDefault());

  document.querySelectorAll("[data-herramienta]").forEach(b =>
    b.addEventListener("click", () => elegirHerramienta(b.dataset.herramienta)));
  document.addEventListener("keydown", ev => {
    if (ev.key === "1") elegirHerramienta("pico");
    if (ev.key === "2") elegirHerramienta("martillo");
  });

  const botonSonido = document.getElementById("boton-sonido");
  const pintarSonido = () => {
    const s = Audio8.estaSilenciado();
    botonSonido.textContent = s ? "Sonido: no" : "Sonido: sí";
    botonSonido.setAttribute("aria-pressed", s);
  };
  pintarSonido();
  botonSonido.addEventListener("click", () => { Audio8.alternarSilencio(); pintarSonido(); });

  if (CONFIG.modoPruebas) {
    const reset = document.getElementById("boton-reset");
    reset.hidden = false;
    reset.addEventListener("click", () => { Almacen.borrar(); location.reload(); });
  }
})();
