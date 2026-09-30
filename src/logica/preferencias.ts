/* Los ajustes del usuario, guardados en el teléfono.

   Se leen mucho (cada golpe de la pelea consulta la vibración) y AsyncStorage es
   asíncrono, así que el valor vive en memoria y el disco es solo la copia: se carga
   una vez al arrancar y se escribe en segundo plano al cambiarlo. */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'decidamos:preferencias';

export type Preferencias = {
  vibracion: boolean;
};

const POR_DEFECTO: Preferencias = { vibracion: true };

let actuales: Preferencias = { ...POR_DEFECTO };
const oyentes: Array<() => void> = [];

export function obtener(): Preferencias {
  return actuales;
}

export function suscribir(cb: () => void): () => void {
  oyentes.push(cb);
  return () => {
    const i = oyentes.indexOf(cb);
    if (i >= 0) oyentes.splice(i, 1);
  };
}

function avisar() {
  oyentes.slice().forEach((cb) => cb());
}

/* Se llama una vez al arrancar la app */
export async function cargar(): Promise<void> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    if (!crudo) return;
    const guardadas = JSON.parse(crudo) as Partial<Preferencias>;
    // Solo se aceptan las claves conocidas: así una versión vieja no rompe nada
    actuales = { ...POR_DEFECTO, ...guardadas };
    avisar();
  } catch {
    // Si no se puede leer, se sigue con los valores por defecto
  }
}

export function cambiar<C extends keyof Preferencias>(clave: C, valor: Preferencias[C]) {
  actuales = { ...actuales, [clave]: valor };
  avisar();
  AsyncStorage.setItem(CLAVE, JSON.stringify(actuales)).catch(() => {
    // Sin espacio o sin permisos: el ajuste vale para esta sesión y no se guarda
  });
}
