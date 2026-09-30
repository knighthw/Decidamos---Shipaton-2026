/* El flujo lo dirige el estado de la sala, no el usuario, así que no hace falta
   un router de archivos: basta con saber qué pantalla toca. Es la traducción
   directa del showScreen() del prototipo web. */
export type NombrePantalla =
  | 'inicio' | 'inicioPelea' | 'ajustes'          // las tres con barra inferior
  | 'entrar' | 'dilema' | 'sala' | 'generando' | 'swipe' | 'relevo'
  | 'resultados' | 'apuesta' | 'personajes' | 'pelea' | 'veredicto' | 'paywall'
  | 'perfil' | 'terminos';

/* Las pantallas principales: las únicas que muestran la barra de pestañas.
   Dentro de una partida se esconde, para no perderla de un toque accidental. */
export const RAICES = ['inicio', 'inicioPelea', 'ajustes'] as const;
export const esRaiz = (p: NombrePantalla): boolean =>
  (RAICES as readonly string[]).includes(p);

export type DatosIr = { proposito?: 'match' | 'pelea'; volver?: NombrePantalla };
export type Ir = (pantalla: NombrePantalla, datos?: DatosIr) => void;
