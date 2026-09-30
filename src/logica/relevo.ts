import type { NombrePantalla } from '../navegacion';
import type { IdJugador } from './battle';

/* En un solo celular los jugadores se turnan, y entre turno y turno se pasa el
   aparato. Esto guarda a quién le toca y a dónde volver después. */
export type Relevo = {
  aQuien: IdJugador;
  nombre: string;
  texto: string;
  destino: NombrePantalla;
};

let pendiente: Relevo | null = null;
export const ponerRelevo = (r: Relevo) => { pendiente = r; };
export const tomarRelevo = () => { const r = pendiente; pendiente = null; return r; };
export const verRelevo = () => pendiente;

/* Quién tiene el celular ahora mismo (solo aplica al modo de un dispositivo) */
let activo: IdJugador = 'p1';
export const jugadorActivo = () => activo;
export const ponerActivo = (id: IdJugador) => { activo = id; };
