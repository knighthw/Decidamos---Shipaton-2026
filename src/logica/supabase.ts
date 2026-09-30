/* Cliente único de Supabase, compartido por transporte.ts.

   Sin llaves configuradas, `cliente` queda en null: transporte.ts lo detecta y
   se comporta como si no hubiera servidor (mismo patrón que compras.ts con
   RevenueCat — sin llave, modo degradado en vez de reventar). */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const cliente: SupabaseClient | null =
  URL && LLAVE
    ? createClient(URL, LLAVE, { realtime: { params: { eventsPerSecond: 10 } } })
    : null;

if (!cliente) {
  console.warn('[supabase] SIN CONFIGURAR: no se leyeron EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY del .env. El modo sala remota no va a funcionar hasta reiniciar el bundler.');
} else if (__DEV__) {
  console.log('[supabase] cliente listo, URL:', URL);
}
