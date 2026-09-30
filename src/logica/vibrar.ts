/* El único sitio de la app que llama a expo-haptics.

   Antes cada componente lo llamaba por su cuenta con su propio chequeo de plataforma,
   así que un interruptor de ajustes solo habría apagado la mitad. Ahora todo pasa por
   aquí y la preferencia se respeta en toda la app. */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { obtener } from './preferencias';

function puedeVibrar(): boolean {
  return Platform.OS !== 'web' && obtener().vibracion;
}

/* Al pasar el umbral del swipe: un toque corto */
export function vibrarSuave() {
  if (!puedeVibrar()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/* Al recibir un golpe en la pelea: algo más contundente */
export function vibrarGolpe() {
  if (!puedeVibrar()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
