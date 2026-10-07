/* ==========================================================
   INTERFAZ — textos, marcadores, avisos y pantallas.
   No hace falta tocar este archivo.
   ========================================================== */

const Interfaz = (() => {
  const $ = id => document.getElementById(id);
  const urls = {};

  /* URL de la imagen de un objeto (sirve también para el dibujo de repuesto) */
  function urlSprite(id, tamano) {
    const clave = `${id}@${tamano || ""}`;
    if (urls[clave]) return urls[clave];
    const img = Sprites.obtener(id, tamano);
    let url = "";
    if (img instanceof HTMLImageElement) url = img.src;
    else if (img && img.toDataURL) url = img.toDataURL();
    urls[clave] = url;
    return url;
  }

  const escapar = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function nombreDe(id) {
    const o = Excavacion.buscarObjeto(id);
    return o ? o.nombre : id;
  }

  function iniciarTextos(revelado = false) {
    $("titulo").textContent = CONFIG.titulo;
    $("subtitulo").textContent = CONFIG.subtitulo;
    document.title = `${CONFIG.titulo} – ${CONFIG.subtitulo}`;
    $("nombre-pico").textContent = CONFIG.herramientas.pico.nombre;
    $("nombre-martillo").textContent = CONFIG.herramientas.martillo.nombre;

    const lienzo = $("objetivo-sprite");
    const g = lienzo.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 64, 64);
    const objetivo = Excavacion.buscarObjeto(OBJETO_OBJETIVO);
    if ((CONFIG.mostrarObjetivo || revelado) && objetivo) {
      const img = Sprites.obtener(objetivo.id);
      if (img) g.drawImage(img, 6, 6, 52, 52);
      $("objetivo-nombre").textContent = objetivo.nombre;
    } else {
      g.fillStyle = "#6b5435";
      g.font = "bold 40px 'Pixelify Sans', monospace";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("?", 32, 35);
      $("objetivo-nombre").textContent = "Secreto";
    }
  }

  function pintarIntentos(usados) {
    const cont = $("intentos-pips");
    if (CONFIG.modoPruebas) {
      cont.innerHTML = `<span class="libreta__valor">∞</span>`;
      return;
    }
    const total = CONFIG.intentosDiarios;
    cont.innerHTML = "";
    for (let k = 0; k < total; k++) {
      const pip = document.createElement("span");
      pip.className = "pip" + (k < usados ? " gastado" : "");
      cont.appendChild(pip);
    }
    cont.setAttribute("aria-label", `Te quedan ${Math.max(0, total - usados)} de ${total}`);
  }

  function pintarEstabilidad(partida) {
    const relleno = $("estabilidad-relleno");
    const resto = partida ? 1 - partida.desgaste / partida.estabilidad : 1;
    relleno.style.width = `${Math.max(0, resto * 100)}%`;
    relleno.classList.toggle("media", resto <= 0.5 && resto > 0.2);
    relleno.classList.toggle("baja", resto <= 0.2);
  }

  function pintarBolsa(bolsa) {
    const lista = $("bolsa-lista");
    if (!bolsa.length) {
      lista.innerHTML = `<li class="bolsa__vacia" style="background:none;border:0">Todavía no has desenterrado nada.</li>`;
      return;
    }
    const cuenta = {};
    bolsa.forEach(b => { cuenta[b.id] = (cuenta[b.id] || 0) + 1; });
    lista.innerHTML = Object.keys(cuenta).map(id => `
      <li class="${id === OBJETO_OBJETIVO ? "es-objetivo" : ""}">
        <img src="${urlSprite(id)}" alt="">${escapar(nombreDe(id))}${cuenta[id] > 1 ? ` ×${cuenta[id]}` : ""}
      </li>`).join("");
  }

  function pintarCuentaAtras(segundos) {
    const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
    const m = String(Math.floor(segundos % 3600 / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    $("cuenta-atras").textContent = `${h}:${m}:${s}`;
    const enPantalla = document.querySelector("[data-cuenta]");
    if (enPantalla) enPantalla.textContent = `${h}:${m}:${s}`;
  }

  function aviso(texto, id) {
    const el = document.createElement("div");
    el.className = "aviso";
    el.innerHTML = `${id ? `<img src="${urlSprite(id)}" alt="">` : ""}<span>${escapar(texto)}</span>`;
    $("avisos").appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function avisoConfig(texto) {
    const el = $("aviso-config");
    el.textContent = texto;
    el.hidden = false;
  }

  /* ---------- Pantallas sobre la pared ---------- */
  function mostrarPantalla(html, opciones = {}) {
    const p = $("pantalla");
    p.className = "pantalla" + (opciones.transparente ? " pantalla--transparente" : "");
    p.innerHTML = html;
    p.hidden = false;
    $("pared").classList.add("bloqueada");
    const boton = p.querySelector("[data-accion]");
    if (boton && opciones.alPulsar) boton.addEventListener("click", opciones.alPulsar);
    if (boton) setTimeout(() => boton.focus({ preventScroll: true }), 50);
  }

  function ocultarPantalla() {
    const p = $("pantalla");
    p.hidden = true;
    p.innerHTML = "";
    $("pared").classList.remove("bloqueada");
  }

  function listaMini(objetos) {
    if (!objetos.length) return `<p class="detalle">No has llegado a desenterrar nada esta vez.</p>`;
    return `<ul class="mini-lista">${objetos.map(o =>
      `<li><img src="${urlSprite(o.id, o.tamano)}" alt="">${escapar(nombreDe(o.id))}</li>`).join("")}</ul>`;
  }

  function textoBotonExcavar(usados) {
    return CONFIG.modoPruebas
      ? "Empezar excavación"
      : `Empezar excavación (${usados + 1} de ${CONFIG.intentosDiarios})`;
  }

  function pantallaInicio(usados, alPulsar) {
    mostrarPantalla(`
      <div class="tarjeta">
        <h2>Hay algo en esta pared</h2>
        <p>Toca la roca para excavar. Cada golpe la agrieta: si se derrumba, se acaba la excavación.</p>
        ${CONFIG.mostrarObjetivo ? "" : `<p class="detalle">El objetivo de hoy es secreto. Sabrás cuál era cuando lo desentierres.</p>`}
        <button class="boton" data-accion>${textoBotonExcavar(usados)}</button>
      </div>`, { alPulsar });
  }

  function pantallaFin(motivo, encontrados, usados, alPulsar) {
    const quedan = CONFIG.modoPruebas || usados < CONFIG.intentosDiarios;
    const titulo = motivo === "completa" ? "Pared vaciada" : "La pared se ha derrumbado";
    const intro = motivo === "completa"
      ? "Has sacado todo lo que había, pero el objetivo no estaba aquí."
      : "Se acabó esta excavación sin dar con el objetivo.";
    const pie = quedan
      ? `<button class="boton" data-accion>${CONFIG.modoPruebas ? "Nueva excavación" : `Nueva excavación (${usados + 1} de ${CONFIG.intentosDiarios})`}</button>`
      : `<p><strong>Has usado tus ${CONFIG.intentosDiarios} excavaciones de hoy.</strong></p>
         <p class="detalle">Podrás volver a excavar en <span data-cuenta>--:--:--</span></p>`;
    mostrarPantalla(`
      <div class="tarjeta">
        <h2>${titulo}</h2>
        <p>${intro}</p>
        ${listaMini(encontrados)}
        ${pie}
      </div>`, { alPulsar, transparente: motivo === "completa" });
  }

  function pantallaSinIntentos() {
    mostrarPantalla(`
      <div class="tarjeta">
        <h2>Por hoy has terminado</h2>
        <p>Has usado tus ${CONFIG.intentosDiarios} excavaciones de hoy sin encontrar el objetivo.</p>
        <p class="detalle">Podrás volver a excavar en <span data-cuenta>--:--:--</span></p>
      </div>`);
  }

  function pantallaVictoria(objetoEnterrado, ganadoA) {
    const obj = Excavacion.buscarObjeto(OBJETO_OBJETIVO);
    const tamano = objetoEnterrado ? objetoEnterrado.tamano : undefined;
    mostrarPantalla(`
      <div class="tarjeta tarjeta--victoria">
        <img class="tarjeta__sprite" src="${urlSprite(OBJETO_OBJETIVO, tamano)}" alt="">
        <h2>¡Has encontrado el objetivo!</h2>
        <p><strong>${escapar(obj ? obj.nombre : OBJETO_OBJETIVO)}</strong> era el objeto de hoy. Has ganado el minijuego.</p>
        <p class="detalle">Haz una captura de pantalla y compártela en la comunidad.</p>
        <span class="tarjeta__sello">${escapar(ganadoA || "")}</span>
      </div>`, { transparente: true });
  }

  return {
    iniciarTextos, pintarIntentos, pintarEstabilidad, pintarBolsa, pintarCuentaAtras,
    aviso, avisoConfig, ocultarPantalla,
    pantallaInicio, pantallaFin, pantallaSinIntentos, pantallaVictoria, nombreDe
  };
})();
