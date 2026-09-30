/* ─────────────────────────────────────────────────────────────────────────────
   Capa de compras (RevenueCat)

   Funciona en dos modos y elige solo:
     · REAL  — si el módulo nativo `react-native-purchases` está presente
               (development build / APK) y hay una API key configurada.
     · MOCK  — si no (Expo Go, web, sin API key): simula la compra y guarda
               el estado Pro en AsyncStorage, para poder seguir maquetando.

   El resto de la app no se entera: siempre usa useEsPro(), comprar(), restaurar().

   ── Puesta en marcha del modo REAL ───────────────────────────────────────────
     1. La APK ya lleva `react-native-purchases` (ver package.json + eas build).
     2. En RevenueCat: crea el proyecto, un entitlement llamado "decidamos_pro" y una
        offering "default" con los paquetes. Copia las API keys (Project settings
        → API keys → App-specific, empiezan por `appl_` / `goog_`).
     3. Ponlas en .env:
          EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
          EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
     4. Los identificadores de PAQUETES de abajo deben coincidir con los
        `identifier` de los packages de la offering "default".
   ──────────────────────────────────────────────────────────────────────────── */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// El entitlement que marca al usuario como premium en RevenueCat.
export const DERECHO_PRO = 'decidamos_pro';
// El identificador de la offering a mostrar.
export const OFERTA = 'default';

// En Expo Go no hay módulos nativos: siempre modo mock, pase lo que pase.
const EN_EXPO_GO = Constants.executionEnvironment === 'storeClient';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

// Carga perezosa del SDK nativo: en Expo Go / web no existe y no debe romper.
let Purchases: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases').default;
} catch {
  Purchases = null;
}

/** true = estamos simulando (Expo Go, sin SDK nativo, o sin API key). */
export const enModoMock = (): boolean => EN_EXPO_GO || !Purchases || !API_KEY;

export type Paquete = {
  id: string;               // debe coincidir con package.identifier en RevenueCat
  titulo: string;
  precio: string;           // en REAL se reemplaza por product.priceString (localizado)
  periodo: string;
};

/* Fallback: solo se usa en modo mock y para pintar algo mientras carga la
   offering real. En modo REAL este id se ignora — obtenerPaquetes() usa los
   identifiers que devuelve RevenueCat. Se mantiene igual al producto del
   dashboard para que no parezca que hay dos nomenclaturas distintas. */
export const PAQUETES: Paquete[] = [
  { id: 'lifetime', titulo: 'Para siempre', precio: '$19.99', periodo: 'pago único' },
];

// ─── Estado en memoria + notificación ────────────────────────────────────────
const CLAVE_MOCK = 'decidamos:pro';

let esPro = false;
let proHasta = 0;                          // ms epoch; >now = Pro temporal (recompensa por anuncio)
let listo = false;
let paquetesReales: any[] | null = null;   // Package[] de RevenueCat cuando hay SDK
const oyentes = new Set<() => void>();

function avisar() { oyentes.forEach((f) => f()); }

/* Llamar una vez al arrancar la app (App.tsx). */
export async function inicializarCompras(): Promise<void> {
  if (enModoMock()) {
    try { esPro = (await AsyncStorage.getItem(CLAVE_MOCK)) === '1'; } catch { esPro = false; }
    listo = true;
    avisar();
    return;
  }

  try {
    Purchases.configure({ apiKey: API_KEY });
    Purchases.addCustomerInfoUpdateListener((info: any) => {
      esPro = info?.entitlements?.active?.[DERECHO_PRO] != null;
      avisar();
    });
    const info = await Purchases.getCustomerInfo();
    esPro = info?.entitlements?.active?.[DERECHO_PRO] != null;

    const offerings = await Purchases.getOfferings();
    paquetesReales = offerings?.all?.[OFERTA]?.availablePackages
      ?? offerings?.current?.availablePackages
      ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[compras] init RevenueCat falló:', e);
  }
  listo = true;
  avisar();
}

/** Paquetes a mostrar: los reales de RevenueCat si los hay, si no el fallback. */
export function obtenerPaquetes(): Paquete[] {
  if (paquetesReales?.length) {
    return paquetesReales.map((p) => ({
      id: p.identifier,
      titulo: p.product?.title ?? p.identifier,
      precio: p.product?.priceString ?? '',
      periodo: p.packageType ?? '',
    }));
  }
  return PAQUETES;
}

/* Compra un paquete por su identifier. Devuelve true si el usuario queda Pro. */
export async function comprar(paqueteId: string): Promise<boolean> {
  if (enModoMock()) {
    await esperar(900);
    void paqueteId;
    esPro = true;
    try { await AsyncStorage.setItem(CLAVE_MOCK, '1'); } catch { /* da igual */ }
    avisar();
    return esPro;
  }

  try {
    const pkg = (paquetesReales ?? []).find((p) => p.identifier === paqueteId);
    if (!pkg) return esPro;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    esPro = customerInfo?.entitlements?.active?.[DERECHO_PRO] != null;
  } catch (e: any) {
    if (!e?.userCancelled && __DEV__) console.warn('[compras] compra falló:', e);
  }
  avisar();
  return esPro;
}

/* "Restaurar compras" — obligatorio en las tiendas. */
export async function restaurar(): Promise<boolean> {
  if (enModoMock()) {
    await esperar(700);
    try { esPro = (await AsyncStorage.getItem(CLAVE_MOCK)) === '1'; } catch { /* */ }
    avisar();
    return esPro;
  }

  try {
    const info = await Purchases.restorePurchases();
    esPro = info?.entitlements?.active?.[DERECHO_PRO] != null;
  } catch (e) {
    if (__DEV__) console.warn('[compras] restaurar falló:', e);
  }
  avisar();
  return esPro;
}

/* Vuelve a leer el estado desde RevenueCat. Llamar después de que se conceda
   una recompensa server-side (p. ej. tras ver un anuncio recompensado). */
export async function refrescarEstadoCompras(): Promise<void> {
  if (enModoMock()) return;
  try {
    const info = await Purchases.getCustomerInfo();
    esPro = info?.entitlements?.active?.[DERECHO_PRO] != null;
    avisar();
  } catch (e) {
    if (__DEV__) console.warn('[compras] refrescar falló:', e);
  }
}

/* Modo mock: simula que una recompensa concedió Pro temporal (X minutos). */
export function _concederProTemporalMock(minutos = 60): void {
  proHasta = Date.now() + minutos * 60_000;
  avisar();
}

/* Solo para desarrollo / demo en modo mock: volver a estado no-Pro. */
export async function _resetProMock(): Promise<void> {
  if (!enModoMock()) return;
  esPro = false;
  proHasta = 0;
  try { await AsyncStorage.removeItem(CLAVE_MOCK); } catch { /* */ }
  avisar();
}

export function obtenerEsPro(): boolean {
  return esPro || Date.now() < proHasta;
}
export function comprasListas(): boolean { return listo; }

export function suscribirCompras(f: () => void): () => void {
  oyentes.add(f);
  return () => { oyentes.delete(f); };
}

function esperar(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
