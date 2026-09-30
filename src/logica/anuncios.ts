/* ─────────────────────────────────────────────────────────────────────────────
   Capa de anuncios (Google AdMob)

   Dos modos, elige solo:
     · REAL  — si el módulo nativo `react-native-google-mobile-ads` está presente
               (development build / APK).
     · MOCK  — si no (Expo Go, web): el intersticial es un no-op y el banner
               se pinta como placeholder (ver componentes/BannerAnuncio.tsx).

   Nunca se muestran anuncios a un usuario Pro.

   ── Puesta en marcha del modo REAL ───────────────────────────────────────────
     1. La APK ya lleva la librería (package.json) y el plugin en app.json con
        los App IDs (hoy los de test de Google).
     2. En AdMob: crea la app, saca el App ID real y las unidades (banner e
        intersticial) y sustitúyelos:
          - app.json → plugin "react-native-google-mobile-ads" → android/iosAppId
          - .env → EXPO_PUBLIC_ADMOB_BANNER / EXPO_PUBLIC_ADMOB_INTERSTICIAL
     3. Mientras tanto se usan los IDs de test (no dan ingresos pero no arriesgan
        el baneo de la cuenta).
   ──────────────────────────────────────────────────────────────────────────── */

import Constants from 'expo-constants';
import {
  obtenerEsPro, refrescarEstadoCompras, _concederProTemporalMock, enModoMock,
} from './compras';

const EN_EXPO_GO = Constants.executionEnvironment === 'storeClient';

let modulo: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  modulo = require('react-native-google-mobile-ads');
} catch {
  modulo = null;
}

/* En web el módulo llega vacío (lo stubea metro.config.js), así que no basta con
   comprobar que existe: hay que mirar que traiga de verdad lo que se va a usar. */
export const anunciosNativos = (): boolean => !EN_EXPO_GO && modulo?.default != null;

// IDs de test de Google mientras no haya cuenta de AdMob.
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTICIAL = 'ca-app-pub-3940256099942544/1033173712';

const TEST_RECOMPENSADO = 'ca-app-pub-3940256099942544/5224354917';

export const UNIDADES = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER || TEST_BANNER,
  intersticial: process.env.EXPO_PUBLIC_ADMOB_INTERSTICIAL || TEST_INTERSTICIAL,
  recompensado: process.env.EXPO_PUBLIC_ADMOB_RECOMPENSADO || TEST_RECOMPENSADO,
};

// Cuántos minutos de "sin anuncios" concede ver un anuncio recompensado.
// En modo REAL, esto lo decide la recompensa configurada en el dashboard de
// RevenueCat; este valor solo se usa para el mock.
export const MINUTOS_RECOMPENSA = 60;

let listo = false;

/* Llamar una vez al arrancar la app (App.tsx). */
export async function inicializarAnuncios(): Promise<void> {
  if (!anunciosNativos()) { listo = true; return; }
  try {
    await modulo.default().initialize();
  } catch (e) {
    if (__DEV__) console.warn('[anuncios] init AdMob falló:', e);
  }
  listo = true;
}

export function anunciosListos(): boolean { return listo; }

/* ¿Hay que mostrar publicidad? No, si el usuario es Pro. */
export function debeMostrarAnuncios(): boolean {
  return !obtenerEsPro();
}

/* Muestra un intersticial (p. ej. al terminar una ronda). No-op para Pro
   y para el modo mock. */
export async function mostrarIntersticial(): Promise<void> {
  if (!debeMostrarAnuncios()) return;

  if (!anunciosNativos()) {
    if (__DEV__) console.log('[anuncios] intersticial (mock)');
    await new Promise<void>((r) => setTimeout(r, 200));
    return;
  }

  try {
    const { InterstitialAd, AdEventType } = modulo;
    const anuncio = InterstitialAd.createForAdRequest(UNIDADES.intersticial);
    await new Promise<void>((resolve) => {
      const off1 = anuncio.addAdEventListener(AdEventType.LOADED, () => anuncio.show());
      const cerrar = () => { off1(); resolve(); };
      anuncio.addAdEventListener(AdEventType.CLOSED, cerrar);
      anuncio.addAdEventListener(AdEventType.ERROR, cerrar);
      anuncio.load();
    });
  } catch (e) {
    if (__DEV__) console.warn('[anuncios] intersticial falló:', e);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Anuncio RECOMPENSADO con verificación server-side de RevenueCat.

   Flujo REAL (react-native-purchases 10.8+):
     1. Purchases.generateRewardVerificationToken(impressionId)
     2. Se pasa el token en serverSideVerificationOptions al pedir el RewardedAd
     3. Al ganar la recompensa: Purchases.pollRewardVerification(...)
        → RevenueCat ya concedió la recompensa (un entitlement) en su servidor
     4. refrescarEstadoCompras() para que la app vea el nuevo estado

   En AdMob hay que activar "Server-side verification" en la unidad recompensada
   y apuntarla a:
     https://api.revenuecat.com/v1/incoming-webhooks/admob-ssv-rewarded
   y en RevenueCat configurar la recompensa (p. ej. entitlement "decidamos_pro" 1 h).

   Devuelve true si el usuario vio el anuncio entero y se concedió la recompensa.
   ──────────────────────────────────────────────────────────────────────────── */
export async function verAnuncioRecompensado(): Promise<boolean> {
  if (!anunciosNativos()) {
    // MOCK: simula el anuncio y concede Pro temporal localmente.
    if (__DEV__) console.log('[anuncios] recompensado (mock)');
    await new Promise<void>((r) => setTimeout(r, 1200));
    _concederProTemporalMock(MINUTOS_RECOMPENSA);
    return true;
  }

  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = modulo;
    const Purchases = require('react-native-purchases').default;

    const impressionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const token = await Purchases.generateRewardVerificationToken(impressionId);

    const anuncio = RewardedAd.createForAdRequest(UNIDADES.recompensado, {
      serverSideVerificationOptions: {
        userId: token.appUserID ?? token.userId,
        customData: token.customData,
      },
    });

    const gano = await new Promise<boolean>((resolve) => {
      let recompensado = false;
      anuncio.addAdEventListener(RewardedAdEventType.LOADED, () => anuncio.show());
      anuncio.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
        recompensado = true;
        try {
          await Purchases.pollRewardVerification(token.clientTransactionId);
        } catch (e) {
          if (__DEV__) console.warn('[anuncios] pollRewardVerification falló:', e);
        }
      });
      const cerrar = () => resolve(recompensado);
      anuncio.addAdEventListener(AdEventType.CLOSED, cerrar);
      anuncio.addAdEventListener(AdEventType.ERROR, () => resolve(false));
      anuncio.load();
    });

    if (gano) await refrescarEstadoCompras();
    return gano;
  } catch (e) {
    if (__DEV__) console.warn('[anuncios] recompensado falló:', e);
    return false;
  }
}

export { enModoMock };
