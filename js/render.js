/* ==========================================================
   RENDER — dibuja la pared, los objetos y los efectos.
   No hace falta tocar este archivo.
   ========================================================== */

const Render = (() => {
  const CELDA = 48;   // píxeles internos por casilla (se escala con CSS)

  // Colores de cada capa de roca: 1 = la más cercana al objeto
  const CAPAS = [null,
    ["#d4a466", "#e6bd84", "#a97a45"],
    ["#b98648", "#cf9e60", "#8f6334"],
    ["#9c6c3a", "#b5834d", "#764f28"],
    ["#80562f", "#986a3e", "#5f3f20"],
    ["#674428", "#7e5734", "#4b3019"],
    ["#523520", "#694630", "#3a2414"]
  ];
  const SUELO = "#2e211a";

  let canvas, ctx, partida = null;
  let losetas = [];            // losetas pre-dibujadas [capa][variante]
  let losetaDura = null, losetaDuraTapada = null, fondoSuelo = null;
  let particulas = [], destellosObj = [], temblor = 0;
  let grietas = [];
  let foco = null;             // {x,y} casilla bajo el ratón
  let herramienta = "pico";
  let derrumbe = null;         // {inicio}
  let victoria = null;         // {objeto, inicio}
  let confeti = [];

  /* Número pseudoaleatorio fijo por casilla (para que no "parpadee") */
  const hash = (x, y, s = 0) => {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };

  function nuevaLoseta(dibujar) {
    const c = document.createElement("canvas");
    c.width = c.height = CELDA;
    dibujar(c.getContext("2d"));
    return c;
  }

  function prepararLosetas() {
    losetas = [null];
    for (let capa = 1; capa <= 6; capa++) {
      const [base, luz, sombra] = CAPAS[capa];
      const variantes = [];
      for (let v = 0; v < 3; v++) {
        variantes.push(nuevaLoseta(g => {
          g.fillStyle = base; g.fillRect(0, 0, CELDA, CELDA);
          // biselado: luz arriba-izquierda, sombra abajo-derecha
          g.fillStyle = luz;   g.fillRect(0, 0, CELDA, 4); g.fillRect(0, 0, 4, CELDA);
          g.fillStyle = sombra; g.fillRect(0, CELDA - 4, CELDA, 4); g.fillRect(CELDA - 4, 0, 4, CELDA);
          // piedrecitas
          for (let k = 0; k < 4; k++) {
            const px = 6 + Math.floor(hash(capa, v, k) * (CELDA - 16));
            const py = 6 + Math.floor(hash(v, capa, k + 7) * (CELDA - 16));
            const t = 3 + Math.floor(hash(k, v, capa) * 4);
            g.fillStyle = sombra; g.fillRect(px, py + 2, t, t - 1);
            g.fillStyle = luz;    g.fillRect(px, py, t, t - 1);
          }
          // marcas de capa (más capas = más rayas)
          g.fillStyle = "rgba(0,0,0,.18)";
          for (let k = 0; k < Math.min(capa, 4); k++) g.fillRect(8 + k * 8, CELDA - 10, 4, 3);
        }));
      }
      losetas.push(variantes);
    }
    losetaDura = nuevaLoseta(g => {
      g.fillStyle = "#6c6f78"; g.fillRect(0, 0, CELDA, CELDA);
      g.fillStyle = "#9da1ab"; g.fillRect(0, 0, CELDA, 5); g.fillRect(0, 0, 5, CELDA);
      g.fillStyle = "#43454c"; g.fillRect(0, CELDA - 5, CELDA, 5); g.fillRect(CELDA - 5, 0, 5, CELDA);
      g.fillStyle = "#858892"; g.fillRect(12, 12, 10, 8); g.fillRect(26, 26, 12, 8);
    });
  }

  function prepararSuelo() {
    const C = partida.columnas, F = partida.filas;
    fondoSuelo = document.createElement("canvas");
    fondoSuelo.width = C * CELDA; fondoSuelo.height = F * CELDA;
    const g = fondoSuelo.getContext("2d");
    g.fillStyle = SUELO; g.fillRect(0, 0, fondoSuelo.width, fondoSuelo.height);
    for (let k = 0; k < C * F * 3; k++) {
      const x = Math.floor(hash(k, 3) * fondoSuelo.width), y = Math.floor(hash(7, k) * fondoSuelo.height);
      g.fillStyle = hash(k, k) > 0.5 ? "#3b2b21" : "#251a14";
      g.fillRect(x, y, 3, 3);
    }
  }

  function prepararGrietas() {
    grietas = [];
    const W = partida.columnas * CELDA, H = partida.filas * CELDA;
    const origenes = [[W * 0.18, 0], [W * 0.62, 0], [W, H * 0.3], [0, H * 0.55]];
    origenes.forEach(([x, y], k) => {
      const puntos = [[x, y]];
      let ang = Math.atan2(H / 2 - y, W / 2 - x);
      for (let s = 0; s < 9; s++) {
        ang += (Math.random() - 0.5) * 1.1;
        x += Math.cos(ang) * CELDA * 0.9; y += Math.sin(ang) * CELDA * 0.9;
        puntos.push([x, y]);
      }
      grietas.push({ puntos, umbral: k * 0.18 });
    });
  }

  function iniciar(elCanvas) {
    canvas = elCanvas;
    ctx = canvas.getContext("2d");
    prepararLosetas();
    requestAnimationFrame(bucle);
  }

  function usarPartida(p) {
    partida = p;
    particulas = []; destellosObj = []; confeti = [];
    derrumbe = null; victoria = null;
    if (!p) return;
    canvas.width = p.columnas * CELDA;
    canvas.height = p.filas * CELDA;
    prepararSuelo();
    prepararGrietas();
  }

  function casillaDesdeEvento(ev) {
    if (!partida) return null;
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / r.width * partida.columnas);
    const y = Math.floor((ev.clientY - r.top) / r.height * partida.filas);
    if (x < 0 || y < 0 || x >= partida.columnas || y >= partida.filas) return null;
    return { x, y };
  }

  /* ---------- Efectos que pide main.js ---------- */
  function efectoGolpe(cx, cy, resultado, claveHerramienta) {
    temblor = claveHerramienta === "martillo" ? 7 : 3;
    resultado.afectadas.forEach(({ i, antes }) => {
      const x = i % partida.columnas, y = Math.floor(i / partida.columnas);
      const color = CAPAS[Math.min(6, antes)][0];
      for (let k = 0; k < 4; k++) {
        particulas.push({
          x: (x + 0.5) * CELDA, y: (y + 0.5) * CELDA,
          vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1,
          t: 4 + Math.random() * 5, vida: 1, color
        });
      }
    });
    if (resultado.golpeDuro) {
      for (let k = 0; k < 6; k++) particulas.push({
        x: (cx + 0.5) * CELDA, y: (cy + 0.5) * CELDA,
        vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
        t: 3, vida: 0.6, color: "#fff6c8"
      });
    }
    resultado.encontrados.forEach(o => destellosObj.push({ o, vida: 1 }));
  }

  function efectoDerrumbe() { derrumbe = { inicio: performance.now() }; temblor = 16; }

  function efectoVictoria(objeto) {
    victoria = { objeto, inicio: performance.now() };
    const W = canvas.width;
    const colores = ["#f2b33d", "#5fc7c0", "#f06e96", "#ffffff", "#8fd16a"];
    for (let k = 0; k < 120; k++) confeti.push({
      x: Math.random() * W, y: -Math.random() * canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
      giro: Math.random() * 6, color: colores[k % colores.length]
    });
  }

  function ponerFoco(c) { foco = c; }
  function ponerHerramienta(h) { herramienta = h; }

  /* ---------- Dibujo ---------- */
  function dibujarObjeto(o, alfa = 1) {
    const img = Sprites.obtener(o.id, o.tamano);
    if (!img) return;
    ctx.globalAlpha = alfa;
    ctx.drawImage(img, o.x * CELDA, o.y * CELDA, o.n * CELDA, o.n * CELDA);
    ctx.globalAlpha = 1;
  }

  function dibujarEstrella(x, y, r, alfa) {
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.fillStyle = "#fffbe0";
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25);
    ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.25, y + r * 0.25);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25);
    ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function bucle(t) {
    requestAnimationFrame(bucle);
    if (!partida || !ctx) return;
    const C = partida.columnas, F = partida.filas;
    const W = canvas.width, H = canvas.height;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (temblor > 0.2) {
      ctx.translate((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor);
      temblor *= 0.82;
    } else temblor = 0;

    // 1) suelo y objetos
    ctx.drawImage(fondoSuelo, 0, 0);
    partida.objetos.forEach(o => dibujarObjeto(o));

    // 2) roca
    for (let i = 0; i < C * F; i++) {
      const x = i % C, y = Math.floor(i / C);
      const capa = partida.capas[i];
      if (capa > 0) {
        const v = Math.floor(hash(x, y) * 3);
        ctx.drawImage(losetas[Math.min(6, capa)][v], x * CELDA, y * CELDA);
      } else if (partida.duras[i]) {
        ctx.drawImage(losetaDura, x * CELDA, y * CELDA);
      }
    }

    // 3) destellos de pista
    partida.brillos.forEach(i => {
      if (partida.capas[i] !== 1) return;
      const x = i % C, y = Math.floor(i / C);
      const fase = (t / 600 + hash(x, y) * 6) % 2;
      if (fase < 1) dibujarEstrella((x + 0.5) * CELDA, (y + 0.5) * CELDA, 6 + Math.sin(fase * Math.PI) * 8, Math.sin(fase * Math.PI));
    });

    // 4) objetos recién encontrados: brillo blanco
    destellosObj = destellosObj.filter(d => {
      d.vida -= 0.02;
      const { o } = d;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      dibujarObjeto(o, Math.max(0, d.vida) * 0.8);
      ctx.restore();
      ctx.strokeStyle = `rgba(255,246,200,${Math.max(0, d.vida)})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x * CELDA + 2, o.y * CELDA + 2, o.n * CELDA - 4, o.n * CELDA - 4);
      return d.vida > 0;
    });

    // 5) grietas según el desgaste
    const desgaste = partida.desgaste / partida.estabilidad;
    ctx.strokeStyle = "rgba(20,10,5,.75)";
    ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    grietas.forEach(g => {
      const avance = Math.max(0, Math.min(1, (desgaste - g.umbral) / (1 - g.umbral)));
      if (avance <= 0) return;
      const tramos = (g.puntos.length - 1) * avance;
      ctx.beginPath(); ctx.moveTo(g.puntos[0][0], g.puntos[0][1]);
      for (let s = 1; s <= Math.ceil(tramos); s++) {
        const [ax, ay] = g.puntos[s - 1], [bx, by] = g.puntos[s];
        const f = Math.min(1, tramos - (s - 1));
        ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
      }
      ctx.stroke();
    });

    // 6) zona que golpeará la herramienta (ratón)
    if (foco && !partida.terminada) {
      const h = CONFIG.herramientas[herramienta];
      const marcar = (dx, dy, a) => {
        const x = foco.x + dx, y = foco.y + dy;
        if (x < 0 || y < 0 || x >= C || y >= F) return;
        ctx.fillStyle = `rgba(255,236,170,${a})`;
        ctx.fillRect(x * CELDA, y * CELDA, CELDA, CELDA);
      };
      marcar(0, 0, 0.28);
      if (h.cruz > 0) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => marcar(a, b, 0.14));
      if (h.diagonal > 0) [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => marcar(a, b, 0.08));
    }

    // 7) partículas de tierra
    particulas = particulas.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.vida -= 0.03;
      ctx.globalAlpha = Math.max(0, p.vida);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.t, p.t);
      ctx.globalAlpha = 1;
      return p.vida > 0 && p.y < H + 20;
    });

    // 8) derrumbe: cascotes cayendo
    if (derrumbe) {
      const p = Math.min(1, (t - derrumbe.inicio) / 900);
      const filas = Math.ceil(p * F);
      for (let y = 0; y < filas; y++)
        for (let x = 0; x < C; x++) {
          const v = Math.floor(hash(x, y, 9) * 3);
          ctx.globalAlpha = 0.95;
          ctx.drawImage(losetas[6][v], x * CELDA, y * CELDA);
        }
      ctx.globalAlpha = 1;
    }

    // 9) victoria: foco sobre el objetivo y confeti
    if (victoria) {
      const o = victoria.objeto;
      const p = Math.min(1, (t - victoria.inicio) / 700);
      ctx.fillStyle = `rgba(15,10,6,${0.6 * p})`;
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      const cx = (o.x + o.n / 2) * CELDA, cy = (o.y + o.n / 2) * CELDA;
      const r = (o.n * CELDA) * (0.75 + 0.05 * Math.sin(t / 200));
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      confeti.forEach(c => {
        c.x += c.vx; c.y += c.vy; c.giro += 0.2;
        if (c.y > H + 10) { c.y = -10; c.x = Math.random() * W; }
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, 8, 4 + Math.abs(Math.sin(c.giro)) * 6);
      });
    }

    ctx.restore();
  }

  return {
    iniciar, usarPartida, casillaDesdeEvento,
    efectoGolpe, efectoDerrumbe, efectoVictoria,
    ponerFoco, ponerHerramienta
  };
})();
