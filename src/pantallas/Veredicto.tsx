import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import * as Sala from '../logica/sala';
import { buscarPersonaje } from '../logica/personajes';
import { ponerActivo } from '../logica/relevo';
import { colores, radios, degradados, espacio } from '../tema';
import type { Ir } from '../navegacion';

export function Veredicto({ ir }: { ir: Ir }) {
  const res = Sala.resultadoPelea();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-9, { duration: 1300 }), withTiming(0, { duration: 1300 })), -1, false);
  }, []);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  if (!res) return null;
  const p = buscarPersonaje(res.personaje)!;

  return (
    <Pantalla>
      <View style={e.centro}>
        <Animated.Text style={[e.animal, estilo]}>{p.emoji}</Animated.Text>
        <Text style={e.quien}>
          {res.gane && !Sala.esLocal()
            ? `¡Ganaste con ${p.nombre}!`
            : `Ganó ${res.nombre} con ${p.nombre}`}
        </Text>

        <LinearGradient colors={degradados.veredicto as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={e.caja}>
          <Text style={e.etiqueta}>LA DECISIÓN GANADORA ES</Text>
          <Text style={e.decision}>{res.decision}</Text>
        </LinearGradient>

        <Text style={e.perdedora}>Queda descartado: {res.decisionPerdedora}</Text>
      </View>

      <View style={e.acciones}>
        <Boton variante="pelea" onPress={() => { Sala.revancha(); ponerActivo('p1'); ir('personajes'); }}>
          ⚔️  Revancha
        </Boton>
        <Boton variante="fantasma" onPress={() => { Sala.reset(); ir('inicio'); }}>
          Nueva decisión
        </Boton>
      </View>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.m },
  animal: { fontSize: 78, lineHeight: 88 },
  quien: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, color: colores.tinta, textAlign: 'center' },
  caja: {
    borderRadius: radios.medio, borderWidth: 1, borderColor: colores.azulBorde,
    paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', gap: 6, alignSelf: 'stretch',
  },
  etiqueta: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1, color: colores.azul },
  decision: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5, color: colores.tinta, textAlign: 'center' },
  perdedora: { fontSize: 13, color: colores.tinta3 },
  acciones: { gap: espacio.s },
});
