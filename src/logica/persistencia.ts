/* Guarda la sala en el teléfono para que no se pierda si se cierra la app.
   Aparte de sala.ts a propósito: así la lógica queda pura y se puede probar en Node.

   AsyncStorage es asíncrono (localStorage no lo era), así que el patrón cambia: la sala
   vive en memoria como fuente de verdad y esto solo hace una copia de seguridad. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sala } from './sala';
import type { IdJugador } from './battle';

const CLAVE = 'decidamos:sala';
const VIDA_MS = 24 * 60 * 60 * 1000;   // una sala de ayer ya no interesa

export type SalaGuardada = { sala: Sala; misIds: IdJugador[]; modo: 'local' | 'remoto' };

export async function guardar(datos: SalaGuardada): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // Sin espacio o sin permisos: la partida sigue en memoria, solo se pierde al cerrar
  }
}

export async function cargar(): Promise<SalaGuardada | null> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as SalaGuardada;
    if (!datos?.sala) return null;
    const edad = Date.now() - (datos.sala.actualizada ?? 0);
    if (edad > VIDA_MS) { await limpiar(); return null; }
    return datos;
  } catch {
    return null;
  }
}

export async function limpiar(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLAVE);
  } catch { /* nada que hacer */ }
}
