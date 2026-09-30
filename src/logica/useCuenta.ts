import { useEffect, useReducer } from 'react';
import * as Cuenta from './cuenta';

/* La sesión, para las pantallas. Igual que useSala: el estado vive en el módulo y
   esto solo repinta cuando cambia. */
export function useCuenta() {
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => Cuenta.suscribir(refrescar), []);
  return { usuario: Cuenta.obtener(), cargada: Cuenta.estaCargada() };
}
