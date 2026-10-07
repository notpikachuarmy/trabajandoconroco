/* ==========================================================
   OBJETOS QUE PUEDEN APARECER ENTERRADOS
   ----------------------------------------------------------
   Cada objeto va entre llaves { ... } y separado por comas.

   id         → identificador único, en MAYÚSCULAS y sin espacios.
                Es lo que escribes en OBJETO_OBJETIVO.
   nombre     → nombre que verán los jugadores.
   sprite     → ruta de la imagen (PNG con fondo transparente,
                mejor si es cuadrada: 32×32, 64×64...).
   tamanos    → tamaños en los que puede aparecer:
                "muy_pequeno", "pequeno", "mediano", "grande", "muy_grande"
   frecuencia → lo común que es. 1 = raro, 5 = muy común.
                (No afecta al objetivo: su probabilidad está en config.js)
   color      → color de los destellos y del dibujo de repuesto
                si la imagen no se encuentra.

   Opcional — una imagen distinta para cada tamaño:
   spritesPorTamano: { grande: "assets/sprites/objetos/bigpearl_grande.png" }
   ========================================================== */

const OBJETOS = [
  { id: "BIGPEARL",     nombre: "Perla Grande",     sprite: "assets/sprites/objetos/bigpearl.png",     tamanos: ["mediano", "grande"],               frecuencia: 2, color: "#efe6ff" },
  { id: "PEARL",        nombre: "Perla",            sprite: "assets/sprites/objetos/pearl.png",        tamanos: ["muy_pequeno", "pequeno"],          frecuencia: 4, color: "#efe6ff" },
  { id: "HEARTSCALE",   nombre: "Escama Corazón",   sprite: "assets/sprites/objetos/heartscale.png",   tamanos: ["muy_pequeno", "pequeno"],          frecuencia: 5, color: "#f06e96" },
  { id: "STARDUST",     nombre: "Polvoestelar",     sprite: "assets/sprites/objetos/stardust.png",     tamanos: ["pequeno"],                         frecuencia: 4, color: "#f0aa5a" },
  { id: "STARPIECE",    nombre: "Trozo Estrella",   sprite: "assets/sprites/objetos/starpiece.png",    tamanos: ["pequeno", "mediano"],              frecuencia: 2, color: "#e85c48" },
  { id: "NUGGET",       nombre: "Pepita",           sprite: "assets/sprites/objetos/nugget.png",       tamanos: ["pequeno", "mediano"],              frecuencia: 2, color: "#f5c83c" },
  { id: "REVIVE",       nombre: "Revivir",          sprite: "assets/sprites/objetos/revive.png",       tamanos: ["pequeno", "mediano"],              frecuencia: 3, color: "#fad746" },
  { id: "MAXREVIVE",    nombre: "Revivir Máximo",   sprite: "assets/sprites/objetos/maxrevive.png",    tamanos: ["mediano", "grande"],               frecuencia: 1, color: "#fad746" },
  { id: "FIRESTONE",    nombre: "Piedra Fuego",     sprite: "assets/sprites/objetos/firestone.png",    tamanos: ["mediano"],                         frecuencia: 2, color: "#f07832" },
  { id: "WATERSTONE",   nombre: "Piedra Agua",      sprite: "assets/sprites/objetos/waterstone.png",   tamanos: ["mediano"],                         frecuencia: 2, color: "#468ce6" },
  { id: "THUNDERSTONE", nombre: "Piedra Trueno",    sprite: "assets/sprites/objetos/thunderstone.png", tamanos: ["mediano"],                         frecuencia: 2, color: "#ffe650" },
  { id: "LEAFSTONE",    nombre: "Piedra Hoja",      sprite: "assets/sprites/objetos/leafstone.png",    tamanos: ["mediano"],                         frecuencia: 2, color: "#6ec850" },
  { id: "MOONSTONE",    nombre: "Piedra Lunar",     sprite: "assets/sprites/objetos/moonstone.png",    tamanos: ["mediano"],                         frecuencia: 2, color: "#dcdcf0" },
  { id: "HARDSTONE",    nombre: "Piedra Dura",      sprite: "assets/sprites/objetos/hardstone.png",    tamanos: ["pequeno", "mediano"],              frecuencia: 3, color: "#c8c8d2" },
  { id: "EVERSTONE",    nombre: "Piedra Eterna",    sprite: "assets/sprites/objetos/everstone.png",    tamanos: ["pequeno", "mediano"],              frecuencia: 3, color: "#f0f0eb" },
  { id: "HELIXFOSSIL",  nombre: "Fósil Hélix",      sprite: "assets/sprites/objetos/helixfossil.png",  tamanos: ["grande", "muy_grande"],            frecuencia: 1, color: "#e6c896" },
  { id: "DOMEFOSSIL",   nombre: "Fósil Domo",       sprite: "assets/sprites/objetos/domefossil.png",   tamanos: ["grande", "muy_grande"],            frecuencia: 1, color: "#e6c896" },
  { id: "OLDAMBER",     nombre: "Ámbar Viejo",      sprite: "assets/sprites/objetos/oldamber.png",     tamanos: ["mediano", "grande"],               frecuencia: 1, color: "#f0a028" }
];
