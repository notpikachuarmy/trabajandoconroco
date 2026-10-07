/* ==========================================================
   SONIDOS
   ----------------------------------------------------------
   Para cambiar un sonido, pon tu archivo en assets/audio/
   y cambia aquí su ruta. Valen .wav, .mp3 y .ogg.
   Si dejas una ruta vacía ("") ese sonido no sonará.
   ========================================================== */

const SONIDOS = {
  pico:        "assets/audio/pico.wav",          // golpe con el pico
  martillo:    "assets/audio/martillo.wav",      // golpe con el martillo
  rocaDura:    "assets/audio/roca_dura.wav",     // golpe contra roca irrompible
  brillo:      "assets/audio/brillo.wav",        // aparece un destello
  objeto:      "assets/audio/objeto.wav",        // objeto desenterrado
  objetivo:    "assets/audio/objetivo.wav",      // ¡objeto objetivo encontrado!
  derrumbe:    "assets/audio/derrumbe.wav",      // la pared se derrumba
  sinIntentos: "assets/audio/sin_intentos.wav",  // no quedan intentos
  inicio:      "assets/audio/inicio.wav",        // empieza una excavación
  boton:       "assets/audio/boton.wav"          // cambiar de herramienta
};
