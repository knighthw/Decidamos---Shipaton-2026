import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { colores, radios, espacio } from '../tema';

function Punto({ retraso }: { retraso: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(retraso, withRepeat(
      withSequence(withTiming(-5, { duration: 380 }), withTiming(0, { duration: 380 })),
      -1, false));
  }, []);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[e.punto, estilo]} />;
}

/* Los tres puntitos rebotando del prototipo, para las esperas */
export function Espera({ texto, claro = false }: { texto: string; claro?: boolean }) {
  return (
    <View style={[e.base, claro && e.baseClara]}>
      <View style={e.puntos}>
        <Punto retraso={0} /><Punto retraso={130} /><Punto retraso={260} />
      </View>
      <Text style={[e.texto, claro && e.textoClaro]}>{texto}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacio.s,
    backgroundColor: colores.fondo2, borderRadius: radios.medio, padding: 15,
  },
  baseClara: { backgroundColor: 'rgba(255,255,255,.12)' },
  puntos: { flexDirection: 'row', gap: 4 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.rojo },
  texto: { fontSize: 14, fontWeight: '600', color: colores.tinta2 },
  textoClaro: { color: 'rgba(255,255,255,.85)' },
});
