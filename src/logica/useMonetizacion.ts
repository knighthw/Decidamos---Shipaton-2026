import { useEffect, useReducer } from 'react';
import { obtenerEsPro, comprasListas, suscribirCompras } from './compras';
import { debeMostrarAnuncios } from './anuncios';

/* Igual que useSala: el estado vive fuera de React y esto solo re-renderiza
   cuando cambia (una compra, una restauración, el arranque). */
function useTicCompras() {
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => suscribirCompras(refrescar), []);
}

/** ¿El usuario tiene Decidamos Pro? */
export function useEsPro(): { esPro: boolean; listo: boolean } {
  useTicCompras();
  return { esPro: obtenerEsPro(), listo: comprasListas() };
}

/** ¿Se le muestran anuncios a este usuario? (no, si es Pro) */
export function useMostrarAnuncios(): boolean {
  useTicCompras();
  return debeMostrarAnuncios();
}
