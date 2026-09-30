import { View, Text, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMostrarAnuncios } from '../logica/useMonetizacion';
import { anunciosNativos, UNIDADES } from '../logica/anuncios';
import { colores, radios, espacio } from '../tema';

/* Carga perezosa del componente nativo: en Expo Go / web no existe. */
let BannerAd: any = null;
let BannerAdSize: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-google-mobile-ads');
  BannerAd = m.BannerAd;
  BannerAdSize = m.BannerAdSize;
} catch {
  BannerAd = null;
}

/* Alto de partida para reservar el hueco antes de la primera medición. El alto
   real se mide y se avisa por onAlto, porque no es fijo: el banner adaptativo de
   AdMob mide distinto según el ancho del teléfono, y encima hay que sumarle la
   barra de gestos, que varía en cada móvil. */
export const ALTO_BANNER = 56;

type Props = {
  onQuitar?: () => void;
  /* Avisa cuánto ocupa de verdad, para que quien lo pinta reserve ese hueco */
  onAlto?: (alto: number) => void;
};

/* Banner de anuncio, pegado abajo y por encima del contenido.

   Va sobre el área segura, no sobre el borde físico de la pantalla: anclado a
   bottom: 0 a secas, la barra de navegación de Android le tapaba media franja.
   El truco es que el contenedor sí llegue hasta abajo (para que el fondo cubra
   ese hueco) pero su contenido se levante con paddingBottom. */
export function BannerAnuncio({ onQuitar, onAlto }: Props) {
  const mostrar = useMostrarAnuncios();
  const bordes = useSafeAreaInsets();

  const medir = (ev: LayoutChangeEvent) => onAlto?.(ev.nativeEvent.layout.height);

  if (!mostrar) {
    onAlto?.(0);
    return null;
  }

  const relleno = { paddingBottom: bordes.bottom };

  if (anunciosNativos() && BannerAd) {
    return (
      <View style={[e.fijo, e.real, relleno]} onLayout={medir}>
        <BannerAd
          unitId={UNIDADES.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    );
  }

  return (
    <View style={[e.fijo, e.contenedor, relleno]} onLayout={medir}>
      <View style={e.marca}><Text style={e.marcaTexto}>ANUNCIO</Text></View>
      <Text style={e.relleno}>Tu anuncio aquí</Text>
      {onQuitar && (
        <Pressable onPress={onQuitar} hitSlop={8} style={e.quitar}>
          <Text style={e.quitarTexto}>Quitar ✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  /* Pegado abajo y por encima de todo: el contenido pasa por debajo al hacer scroll */
  fijo: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20 },
  real: {
    alignItems: 'center', justifyContent: 'center', minHeight: ALTO_BANNER,
    backgroundColor: colores.fondo,   // tapa el contenido que pasa por detrás
  },
  contenedor: {
    minHeight: ALTO_BANNER,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colores.fondo2,
    borderTopWidth: 1, borderTopColor: colores.linea,
    paddingHorizontal: espacio.s, paddingVertical: espacio.s,
  },
  marca: {
    position: 'absolute', left: 8, top: 6,
    backgroundColor: colores.linea, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  marcaTexto: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: colores.tinta3 },
  relleno: { fontSize: 13, fontWeight: '600', color: colores.tinta3 },
  quitar: { position: 'absolute', right: 8, top: 6 },
  quitarTexto: { fontSize: 11, fontWeight: '700', color: colores.tinta3 },
});
