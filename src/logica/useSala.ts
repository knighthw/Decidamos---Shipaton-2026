import { useEffect, useReducer } from 'react';
import * as Sala from './sala';

/* La sala vive fuera de React (es la misma lógica que en el prototipo web).
   Esto solo re-renderiza cuando cambia. */
export function useSala() {
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => Sala.suscribir(refrescar), []);
  return Sala.obtenerSala();
}
