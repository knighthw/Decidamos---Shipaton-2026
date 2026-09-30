import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { Pantalla } from '../componentes/Pantalla';
import { colores, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import { generarOpcionesIA } from '../logica/ia';

// Mínimo que se ve la animación, para que no sea un parpadeo si la IA responde
// muy rápido (o si no hay llave y se cae al banco local, que es instantáneo).
const MINIMO_MS = 900;

function Bola({ retraso, color }: { retraso: number; color: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(retraso, withRepeat(
      withSequence(withTiming(-12, { duration: 420 }), withTiming(0, { duration: 420 })), -1, false));
  }, []);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[e.bola, { backgroundColor: color }, estilo]} />;
}

export function Generando({ ir }: { ir: Ir }) {
  const sala = useSala();

  useEffect(() => {
    if (!sala) return;
    let cancelado = false;
    const inicio = Date.now();

    generarOpcionesIA(sala.dilema).then((opciones) => {
      if (cancelado) return;
      const faltan = MINIMO_MS - (Date.now() - inicio);
      setTimeout(() => {
        if (cancelado) return;
        Sala.iniciar(opciones);
        ir('swipe');
      }, Math.max(faltan, 0));
    });

    return () => { cancelado = true; };
  }, [sala?.dilema]);

  return (
    <Pantalla>
      <View style={e.centro}>
        <View style={e.bolas}>
          <Bola retraso={0} color={colores.rojo} />
          <Bola retraso={130} color={colores.celeste} />
          <Bola retraso={260} color={colores.azul} />
        </View>
        <Text style={e.titulo}>Generando opciones…</Text>
        <Text style={texto.pista}>Buscando 5 ideas para ustedes</Text>
      </View>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.s },
  bolas: { flexDirection: 'row', gap: 8, marginBottom: espacio.s },
  bola: { width: 12, height: 12, borderRadius: 6 },
  titulo: { fontSize: 20, fontWeight: '700', color: colores.tinta },
});
