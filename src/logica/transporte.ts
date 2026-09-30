/* La capa de red: sala.ts habla con esto, esto habla con Supabase.

   Una fila por sala en la tabla `salas` (ver supabase.sql), con el objeto Sala
   entero guardado en la columna `datos`. `sala.fusionar()` ya sabe reconciliar
   dos copias de una sala, así que aquí no hay que inventar un protocolo de
   mensajes: solo publicar la sala completa y avisar cuando llegue una nueva.

   Sin `cliente` (llaves de Supabase no configuradas) todo se comporta como el
   stub original: sin servidor, sin romper nada. */

import { cliente } from './supabase';
import type { Sala } from './sala';

export type Transporte = {
  disponible: boolean;
  publicar(sala: Sala): void;
  suscribir(codigo: string, cb: (sala: Sala) => void): () => void;
  buscarSala(codigo: string): Promise<Sala | null>;
};

export const transporte: Transporte = {
  disponible: !!cliente,

  publicar(sala) {
    if (!cliente) return;
    // async/try-catch en vez de .then/.catch: el builder de Supabase es
    // PromiseLike, no Promise, y no expone .catch en su tipo.
    (async () => {
      try {
        const { error } = await cliente.from('salas').upsert({ codigo: sala.codigo, datos: sala });
        if (error) console.warn('[transporte] publicar falló:', error.message);
      } catch (e) {
        // Sin esto, un fallo de RED (no de Supabase) se perdía en silencio.
        console.warn('[transporte] publicar: error de red:', e instanceof Error ? e.message : e);
      }
    })();
  },

  suscribir(codigo, cb) {
    if (!cliente) return () => {};
    const conexion = cliente;
    const canal = conexion
      .channel(`sala:${codigo}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salas', filter: `codigo=eq.${codigo}` },
        (payload) => {
          if (__DEV__) console.log('[transporte] evento recibido para', codigo);
          const fila = payload.new as { datos?: Sala } | undefined;
          if (fila?.datos) cb(fila.datos);
        }
      )
      .subscribe((estado, error) => {
        // Log siempre (no solo en error): sin esto no hay forma de saber si el
        // canal llegó a conectar de verdad en un dispositivo dado.
        if (__DEV__) console.log('[transporte] canal', codigo, estado, error?.message ?? '');
      });
    return () => { conexion.removeChannel(canal); };
  },

  async buscarSala(codigo) {
    if (!cliente) return null;
    const { data, error } = await cliente
      .from('salas')
      .select('datos')
      .eq('codigo', codigo)
      .maybeSingle();
    if (error) {
      if (__DEV__) console.warn('[transporte] buscarSala falló:', error.message);
      return null;
    }
    return (data?.datos as Sala) ?? null;
  },
};
