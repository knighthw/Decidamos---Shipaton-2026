import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import { tomarRelevo, verRelevo } from '../logica/relevo';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

/* La pantalla puente de "pásale el celular", que en el móvil es más necesaria
   que en la web: sin ella, el otro vería tus respuestas. */
export function Relevo({ ir }: { ir: Ir }) {
  const relevo = verRelevo();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-8, { duration: 1300 }), withTiming(0, { duration: 1300 })), -1, false);
  }, []);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  if (!relevo) return null;

  return (
    <Pantalla>
      <View style={e.centro}>
        <Animated.Text style={[e.emoji, estilo]}>📲</Animated.Text>
        <Text style={e.titulo}>Pásale el celular a {relevo.nombre}</Text>
        <Text style={e.sub}>{relevo.texto}</Text>
        <View style={e.candado}>
          <Text style={e.candadoTexto}>🔒 Sus respuestas quedan ocultas hasta el final</Text>
        </View>
      </View>
      <Boton onPress={() => { const r = tomarRelevo(); ir(r ? r.destino : 'inicio'); }}>
        Estoy listo
      </Boton>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.m },
  emoji: { fontSize: 62 },
  titulo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: colores.tinta, textAlign: 'center' },
  sub: { ...texto.cuerpo, textAlign: 'center', maxWidth: 280 },
  candado: {
    backgroundColor: colores.fondo2, borderRadius: radios.redondo,
    paddingVertical: 9, paddingHorizontal: 15, marginTop: espacio.s,
  },
  candadoTexto: { fontSize: 12.5, color: colores.tinta2 },
});
