/* ==========================================================
   EXCAVACIÓN — lógica de la pared: generar, golpear, comprobar.
   Los números se ajustan en config/config.js.
   No hace falta tocar este archivo.
   ========================================================== */

const Excavacion = (() => {

  const azar = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const elegir = lista => lista[Math.floor(Math.random() * lista.length)];

  function buscarObjeto(id) {
    return OBJETOS.find(o => o.id === id) || null;
  }

  function eleccionPonderada(lista) {
    const total = lista.reduce((s, o) => s + Math.max(0, o.frecuencia ?? 1), 0);
    if (total <= 0) return elegir(lista);
    let r = Math.random() * total;
    for (const o of lista) {
      r -= Math.max(0, o.frecuencia ?? 1);
      if (r <= 0) return o;
    }
    return lista[lista.length - 1];
  }

  function ladoDeTamano(tamano) {
    return CONFIG.tamanos[tamano] || 2;
  }

  /* ---------- Crear una pared nueva ---------- */
  function crear() {
    const C = CONFIG.columnas, F = CONFIG.filas;
    const ocupada = new Array(C * F).fill(false);
    const objetos = [];

    // ¿Qué objetos se entierran?
    const cantidad = azar(CONFIG.objetosPorExcavacion.min, CONFIG.objetosPorExcavacion.max);
    const elegidos = [];
    const objetivo = buscarObjeto(OBJETO_OBJETIVO);
    if (objetivo && Math.random() < CONFIG.probabilidadObjetivo) elegidos.push(objetivo);
    const resto = OBJETOS.filter(o => o.id !== OBJETO_OBJETIVO);
    while (elegidos.length < cantidad && resto.length) elegidos.push(eleccionPonderada(resto));

    // Colocarlos sin que se pisen
    elegidos.forEach(obj => {
      const tamanos = (obj.tamanos && obj.tamanos.length ? obj.tamanos : ["pequeno"])
        .filter(t => CONFIG.tamanos[t]);
      // primero un tamaño al azar; si no cabe, se prueban los demás de menor a mayor
      const orden = [elegir(tamanos), ...tamanos.slice().sort((a, b) => ladoDeTamano(a) - ladoDeTamano(b))];
      for (const tamano of orden) {
        const n = ladoDeTamano(tamano);
        if (n > C || n > F) continue;
        let colocado = false;
        for (let intento = 0; intento < 300 && !colocado; intento++) {
          const x = azar(0, C - n), y = azar(0, F - n);
          let libre = true;
          for (let dy = 0; dy < n && libre; dy++)
            for (let dx = 0; dx < n && libre; dx++)
              if (ocupada[(y + dy) * C + x + dx]) libre = false;
          if (!libre) continue;
          for (let dy = 0; dy < n; dy++)
            for (let dx = 0; dx < n; dx++) ocupada[(y + dy) * C + x + dx] = true;
          objetos.push({
            id: obj.id, tamano, n, x, y,
            mascara: Sprites.mascara(obj.id, tamano, n),
            encontrado: false
          });
          colocado = true;
        }
        if (colocado) break;
      }
    });

    // Roca dura (irrompible) en huecos libres
    const duras = new Array(C * F).fill(false);
    const formas = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1]];
    const numDuras = azar(CONFIG.rocasDuras.min, CONFIG.rocasDuras.max);
    for (let k = 0; k < numDuras; k++) {
      for (let intento = 0; intento < 100; intento++) {
        const [w, h] = elegir(formas);
        const x = azar(0, C - w), y = azar(0, F - h);
        let libre = true;
        for (let dy = 0; dy < h && libre; dy++)
          for (let dx = 0; dx < w && libre; dx++)
            if (ocupada[(y + dy) * C + x + dx]) libre = false;
        if (!libre) continue;
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++) {
            ocupada[(y + dy) * C + x + dx] = true;
            duras[(y + dy) * C + x + dx] = true;
          }
        break;
      }
    }

    // Capas de roca: valores al azar suavizados para que parezcan vetas
    const minC = Math.max(1, CONFIG.capaMin), maxC = Math.min(6, Math.max(minC, CONFIG.capaMax));
    const bruto = Array.from({ length: C * F }, () => azar(minC, maxC));
    const capas = bruto.map((v, i) => {
      const x = i % C, y = Math.floor(i / C);
      let suma = v * 2, cuenta = 2;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < C && ny < F) { suma += bruto[ny * C + nx]; cuenta++; }
      });
      return Math.max(minC, Math.min(maxC, Math.round(suma / cuenta + (Math.random() - 0.5))));
    });

    return {
      columnas: C, filas: F,
      capas, capasIniciales: capas.slice(), duras, objetos,
      desgaste: 0, estabilidad: CONFIG.estabilidadPared,
      golpes: 0,
      brillos: [],            // casillas que ya han destellado
      terminada: false, motivo: null
    };
  }

  /* ¿Qué objeto hay debajo de esta casilla? (solo cuenta su forma real) */
  function objetoEn(partida, i) {
    const x = i % partida.columnas, y = Math.floor(i / partida.columnas);
    return partida.objetos.find(o =>
      x >= o.x && x < o.x + o.n && y >= o.y && y < o.y + o.n &&
      o.mascara[(y - o.y) * o.n + (x - o.x)]
    ) || null;
  }

  function estaDescubierto(partida, o) {
    for (let dy = 0; dy < o.n; dy++)
      for (let dx = 0; dx < o.n; dx++)
        if (o.mascara[dy * o.n + dx] && partida.capas[(o.y + dy) * partida.columnas + o.x + dx] > 0) return false;
    return true;
  }

  /* ---------- Dar un golpe ---------- */
  function golpear(partida, cx, cy, claveHerramienta) {
    if (!partida || partida.terminada) return null;
    const h = CONFIG.herramientas[claveHerramienta];
    if (!h) return null;
    const C = partida.columnas, F = partida.filas;

    const zona = [[0, 0, h.centro]];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => zona.push([dx, dy, h.cruz]));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([dx, dy]) => zona.push([dx, dy, h.diagonal]));

    const afectadas = [];
    let golpeDuro = false;
    zona.forEach(([dx, dy, fuerza]) => {
      const x = cx + dx, y = cy + dy;
      if (fuerza <= 0 || x < 0 || y < 0 || x >= C || y >= F) return;
      const i = y * C + x;
      const antes = partida.capas[i];
      if (antes > 0) {
        partida.capas[i] = Math.max(0, antes - fuerza);
        afectadas.push({ i, antes, despues: partida.capas[i] });
      } else if (dx === 0 && dy === 0 && partida.duras[i]) {
        golpeDuro = true;
      }
    });

    partida.desgaste = Math.min(partida.estabilidad, partida.desgaste + h.desgaste);
    partida.golpes++;

    // Objetos que acaban de quedar al descubierto
    const encontrados = partida.objetos.filter(o => !o.encontrado && estaDescubierto(partida, o));
    encontrados.forEach(o => { o.encontrado = true; });

    // Destellos: roca a una capa de un objeto
    const brillos = [];
    if (CONFIG.pistasBrillo) {
      afectadas.forEach(({ i }) => {
        if (partida.capas[i] === 1 && !partida.brillos.includes(i)) {
          const o = objetoEn(partida, i);
          if (o && !o.encontrado) { partida.brillos.push(i); brillos.push(i); }
        }
      });
    }

    const objetivoHallado = encontrados.some(o => o.id === OBJETO_OBJETIVO);
    const todos = partida.objetos.every(o => o.encontrado);

    if (objetivoHallado) { partida.terminada = true; partida.motivo = "objetivo"; }
    else if (todos && partida.objetos.length) { partida.terminada = true; partida.motivo = "completa"; }
    else if (partida.desgaste >= partida.estabilidad) { partida.terminada = true; partida.motivo = "derrumbe"; }

    return { afectadas, encontrados, objetivoHallado, golpeDuro, brillos, motivo: partida.motivo };
  }

  return { crear, golpear, objetoEn, buscarObjeto };
})();
