import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import { colores, radios, sombras, espacio } from '../tema';
import { useEsPro } from '../logica/useMonetizacion';
import type { Ir } from '../navegacion';

export function Inicio({ ir }: { ir: Ir }) {
  const { esPro } = useEsPro();
  const flotar = useSharedValue(0);
  useEffect(() => {
    flotar.value = withRepeat(
      withSequence(withTiming(-8, { duration: 1700 }), withTiming(0, { duration: 1700 })),
      -1, false);
  }, []);
  const estiloCarta = useAnimatedStyle(() => ({
    transform: [{ rotate: '6deg' }, { translateX: 6 }, { translateY: flotar.value }],
  }));

  return (
    <Pantalla conBarra fondo="portada">
      <View style={e.centro}>
        {/* Dos cartas, una por jugador: la de atrás duda y la de delante decide */}
        <View style={e.logo}>
          <View style={[e.logoCarta, e.logoAtras]}><Text style={e.logoEmoji}>🤔</Text></View>
          <Animated.View style={[e.logoCarta, estiloCarta]}>
            <Text style={e.logoEmoji}>💡</Text>
          </Animated.View>
        </View>

        <Text style={e.marca}>Decidamos</Text>
        <Text style={e.lema}>Decidan juntos, sin pelear.</Text>

        <View style={e.pasos}>
          {['Escriban qué tienen que decidir',
            'Cada quien desliza 5 opciones',
            'Vean en cuáles hicieron match'].map((t, i) => (
            <View key={t} style={e.paso}>
              <View style={e.pasoNum}><Text style={e.pasoNumTexto}>{i + 1}</Text></View>
              <Text style={e.pasoTexto}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={e.acciones}>
        <Boton onPress={() => ir('dilema', { proposito: 'match' })}>Crear sala</Boton>
        <Boton variante="contorno" onPress={() => ir('entrar')}>Entrar con código</Boton>
        <Pressable onPress={() => ir('paywall', { volver: 'inicio' })} hitSlop={8} style={e.pro}>
          <Text style={e.proTexto}>
            {esPro ? 'Tienes Decidamos Pro' : 'Prueba Decidamos Pro'}
          </Text>
        </Pressable>
      </View>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.s },
  logo: { width: 96, height: 104, marginBottom: espacio.s },
  logoCarta: {
    position: 'absolute', width: 84, height: 92,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colores.fondo, borderRadius: 20,
    borderWidth: 1, borderColor: colores.linea,
    ...sombras.tarjeta,
  },
  logoAtras: {
    opacity: 0.9, borderColor: colores.azulBorde,
    transform: [{ rotate: '-10deg' }, { translateX: -8 }, { scale: 0.94 }],
  },
  logoEmoji: { fontSize: 40 },
  marca: { fontSize: 38, fontWeight: '800', letterSpacing: -1.2, color: colores.azul },
  lema: { fontSize: 15, color: colores.tinta2 },
  pasos: { marginTop: espacio.l, gap: 11, alignSelf: 'stretch', paddingHorizontal: espacio.m },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  pasoNum: {
    width: 25, height: 25, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pasoNumTexto: { fontSize: 13, fontWeight: '700', color: colores.rojo },
  pasoTexto: { fontSize: 14, color: colores.tinta2, flex: 1 },
  acciones: { gap: espacio.s },
  pro: { alignSelf: 'center', paddingVertical: 6, marginTop: 2 },
  proTexto: { fontSize: 13, fontWeight: '700', color: colores.azul },
});
