/* Qué animales tienen arte pixel art y cuáles siguen con su emoji.

   El oso, el águila y la tortuga están dibujados; el resto usa el emoji del
   catálogo, en el mismo hueco, así que la pantalla de pelea funciona igual con y
   sin sprite.

   Cada animal lleva todos sus frames recortados al mismo encuadre desde el original
   de 1024x1024. Así el cuerpo no salta al cambiar de pose: el jab del oso estira el
   puño 208 px a la derecha y el bloqueo de la tortuga esconde las patas, pero lo
   demás se queda en su sitio. */

import type { ImageSourcePropType } from 'react-native';
import { buscarHabilidad } from './personajes';

/* Una animación que se reproduce una vez al usar una habilidad y vuelve a descanso */
export type Accion = {
  cuadros: ImageSourcePropType[];
  /* Milisegundos por frame */
  ms: number;
  /* Cuánto se queda en el último frame antes de volver a respirar */
  sostener: number;
};

export type Animaciones = {
  descanso: ImageSourcePropType[];
  /* La animación de atacar: se usa con todo lo que no sea curarse ni tenga pose propia */
  jab?: Accion;
  /* Poses de habilidades concretas, por id de habilidad */
  poses?: Record<string, Accion>;
  /* Proporción del lienzo completo, que incluye el aire donde entra el puño */
  proporcion: number;
  /* Proporción de lo que ocupa el animal quieto. La diferencia con la anterior es
     aire a un lado; sin descontarlo, lo que venga al lado (la barra de vida) queda
     separado del dibujo por un hueco que no se ve pero se nota. */
  proporcionReposo: number;
  /* Qué parte del alto del hueco ocupa. Los animales bajos y anchos, escalados al
     alto completo, serían más anchos que la pantalla y taparían la barra de vida. */
  altoRelativo: number;
};

export const MS_DESCANSO = 180;

const OSO: Animaciones = {
  descanso: [
    require('../../assets/sprites/oso/descanso-1.png'),
    require('../../assets/sprites/oso/descanso-2.png'),
    require('../../assets/sprites/oso/descanso-3.png'),
    require('../../assets/sprites/oso/descanso-4.png'),
  ],
  jab: {
    cuadros: [
      require('../../assets/sprites/oso/jab-1.png'),
      require('../../assets/sprites/oso/jab-2.png'),
    ],
    ms: 110,
    sostener: 120,
  },
  proporcion: 712 / 704,
  proporcionReposo: 504 / 704,
  altoRelativo: 1,
};

/* Sin animación de pelea todavía: se queda respirando también cuando ataca */
const AGUILA: Animaciones = {
  descanso: [
    require('../../assets/sprites/aguila/descanso-1.png'),
    require('../../assets/sprites/aguila/descanso-2.png'),
    require('../../assets/sprites/aguila/descanso-3.png'),
    require('../../assets/sprites/aguila/descanso-4.png'),
  ],
  proporcion: 600 / 896,
  proporcionReposo: 600 / 896,   // ocupa todo el encuadre: no hay aire que descontar
  altoRelativo: 1,
};

/* Solo tiene dibujado el bloqueo: se mete en el caparazón al usar Caparazón y lo
   sostiene mientras se ve la ronda. Al atacar se queda respirando. */
const TORTUGA: Animaciones = {
  descanso: [
    require('../../assets/sprites/tortuga/descanso-1.png'),
    require('../../assets/sprites/tortuga/descanso-2.png'),
    require('../../assets/sprites/tortuga/descanso-3.png'),
    require('../../assets/sprites/tortuga/descanso-4.png'),
  ],
  poses: {
    caparazon: {
      cuadros: [require('../../assets/sprites/tortuga/bloqueo.png')],
      ms: 0,
      sostener: 1100,
    },
  },
  proporcion: 624 / 520,
  proporcionReposo: 624 / 520,
  altoRelativo: 0.72,
};

const POR_PERSONAJE: Record<string, Animaciones> = { oso: OSO, aguila: AGUILA, tortuga: TORTUGA };

export function animacionesDe(idPersonaje: string): Animaciones | null {
  return POR_PERSONAJE[idPersonaje] ?? null;
}

/* Qué animación toca al usar una habilidad, o null si se queda respirando.
   Primero la pose propia de esa habilidad; si no hay, el jab para todo lo que no
   sea curarse (hibernar, muda…). */
export function accionDe(idPersonaje: string, idHabilidad: string): Accion | null {
  const anim = animacionesDe(idPersonaje);
  if (!anim) return null;
  const propia = anim.poses?.[idHabilidad];
  if (propia) return propia;
  const hab = buscarHabilidad(idPersonaje, idHabilidad);
  return hab && !hab.curar && anim.jab ? anim.jab : null;
}
