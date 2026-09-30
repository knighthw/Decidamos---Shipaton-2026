// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/* AdMob es solo-nativo: importa codegenNativeComponent, que no existe en web, y
   rompe el bundle entero (la app no arrancaba en el navegador). El try/catch de
   anuncios.ts no basta porque Metro resuelve los require al empaquetar, no en
   ejecución, así que hay que decírselo aquí.

   Con `type: 'empty'` el módulo queda vacío en web; anuncios.ts lo detecta y se
   comporta como si no hubiera SDK. En Android e iOS no cambia nada.
   Doc: https://docs.expo.dev/versions/v54.0.0/config/metro/ */
const SOLO_NATIVOS = ['react-native-google-mobile-ads'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && SOLO_NATIVOS.some((m) => moduleName === m || moduleName.startsWith(`${m}/`))) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
