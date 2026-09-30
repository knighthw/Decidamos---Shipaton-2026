import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colores, radios } from '../tema';

export function BarraVida({ vida, vidaMax }: { vida: number; vidaMax: number }) {
  const pct = Math.max(0, (vida / vidaMax) * 100);
  const color = pct <= 25 ? colores.no : pct <= 55 ? colores.vidaHerido : colores.si;

  const estilo = useAnimatedStyle(() => ({
    width: withTiming(`${pct}%`, { duration: 450 }),
    backgroundColor: withTiming(color, { duration: 300 }),
  }), [pct, color]);

  return (
    <View style={e.base}>
      <Animated.View style={[e.relleno, estilo]} />
    </View>
  );
}

const e = StyleSheet.create({
  base: { height: 9, backgroundColor: 'rgba(0,0,0,.32)', borderRadius: radios.redondo, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: radios.redondo },
});
