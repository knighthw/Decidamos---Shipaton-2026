import {
  useState, useCallback, useEffect, useImperativeHandle, forwardRef,
} from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate,
  interpolateColor, runOnJS, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { vibrarSuave, vibrarGolpe } from '../logica/vibrar';
import type { Opcion } from '../logica/opciones';
import { colores, radios, sombras, degradados, espacio } from '../tema';

const ANCHO = Dimensions.get('window').width;
const UMBRAL = 110;          // el mismo del prototipo web

export type MazoHandle = { lanzar: (leGusta: boolean) => void };

type Props = {
  opciones: Opcion[];
  indice: number;
  onVotar: (leGusta: boolean) => void;
};

/* El swipe del prototipo, rehecho con gestos nativos.
   Mecánica: arrastrar con rotación proporcional, sellos SÍ/NO que aparecen según
   la dirección, umbral de 110px y salida volando al superarlo. Encima se añade
   tinte de color, borde reactivo, háptica al cruzar y entrada animada por tarjeta. */
export const Mazo = forwardRef<MazoHandle, Props>(function Mazo(
  { opciones, indice, onVotar }, ref,
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const saliendo = useSharedValue(false);
  const cruzado = useSharedValue(false);
  const aparicion = useSharedValue(0);
  const [bloqueado, setBloqueado] = useState(false);

  // Cada vez que entra una tarjeta nueva al frente, aparece con un pequeño impulso
  useEffect(() => {
    aparicion.value = 0;
    aparicion.value = withTiming(1, { duration: 260 });
  }, [indice]);

  const votar = useCallback((leGusta: boolean) => {
    setBloqueado(false);
    x.value = 0;
    y.value = 0;
    saliendo.value = false;
    cruzado.value = false;
    onVotar(leGusta);
  }, [onVotar]);

  /* Lanza la tarjeta fuera de la pantalla y registra el voto al terminar */
  const lanzar = useCallback((leGusta: boolean) => {
    if (saliendo.value) return;
    saliendo.value = true;
    setBloqueado(true);
    vibrarGolpe();
    x.value = withTiming((leGusta ? 1 : -1) * ANCHO * 1.5, { duration: 320 }, (fin) => {
      if (fin) runOnJS(votar)(leGusta);
    });
    y.value = withTiming(-60, { duration: 320 });
  }, [votar]);

  useImperativeHandle(ref, () => ({ lanzar }), [lanzar]);

  const gesto = Gesture.Pan()
    .enabled(!bloqueado)
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
      const pasa = Math.abs(x.value) > UMBRAL;
      if (pasa && !cruzado.value) {
        cruzado.value = true;
        runOnJS(vibrarSuave)();
      } else if (!pasa && cruzado.value) {
        cruzado.value = false;
      }
    })
    .onEnd(() => {
      if (Math.abs(x.value) > UMBRAL) {
        runOnJS(lanzar)(x.value > 0);
      } else {
        cruzado.value = false;
        x.value = withSpring(0, { damping: 18 });
        y.value = withSpring(0, { damping: 18 });
      }
    });

  const estiloFrente = useAnimatedStyle(() => {
    const entra = aparicion.value;
    return {
      opacity: entra,
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: 0.94 + 0.06 * entra },
        { rotate: `${x.value / 18}deg` },
      ],
    };
  });

  // El borde de la tarjeta del frente vira a verde o rojo según hacia dónde va
  const estiloBorde = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      x.value,
      [-UMBRAL, 0, UMBRAL],
      [colores.no, colores.linea, colores.si],
    ),
  }));

  const estiloSi = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, UMBRAL], [0, 1], Extrapolation.CLAMP),
  }));
  const estiloNo = useAnimatedStyle(() => ({
    opacity: interpolate(-x.value, [0, UMBRAL], [0, 1], Extrapolation.CLAMP),
  }));

  // Un lavado de color sobre la tarjeta que se intensifica con el arrastre
  const lavadoSi = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, UMBRAL * 1.2], [0, 0.2], Extrapolation.CLAMP),
  }));
  const lavadoNo = useAnimatedStyle(() => ({
    opacity: interpolate(-x.value, [0, UMBRAL * 1.2], [0, 0.2], Extrapolation.CLAMP),
  }));

  /* Las de atrás asoman un poco, como en el prototipo */
  const estiloSegunda = useAnimatedStyle(() => {
    const avance = interpolate(Math.abs(x.value), [0, UMBRAL], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [
        { scale: 0.95 + 0.05 * avance },
        { translateY: 12 - 12 * avance },
      ],
    };
  });

  const visibles = opciones.slice(indice, indice + 3);
  if (!visibles.length) return <View style={e.mazo} />;

  return (
    <View style={e.mazo}>
      {visibles.map((op, i) => {
        const real = indice + i;
        if (i === 0) {
          return (
            <GestureDetector gesture={gesto} key={op.id}>
              <Animated.View style={[e.carta, sombras.tarjeta, estiloBorde, estiloFrente, { zIndex: 10 }]}>
                <Tarjeta opcion={op} indice={real} />
                <Animated.View style={[e.lavado, { backgroundColor: colores.si }, lavadoSi]} pointerEvents="none" />
                <Animated.View style={[e.lavado, { backgroundColor: colores.no }, lavadoNo]} pointerEvents="none" />
                <Animated.View style={[e.sello, e.selloSi, estiloSi]} pointerEvents="none">
                  <Text style={[e.selloTexto, { color: colores.si }]}>SÍ</Text>
                </Animated.View>
                <Animated.View style={[e.sello, e.selloNo, estiloNo]} pointerEvents="none">
                  <Text style={[e.selloTexto, { color: colores.no }]}>NO</Text>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          );
        }
        return (
          <Animated.View key={op.id} pointerEvents="none"
            style={[e.carta, sombras.tarjeta, { zIndex: 10 - i },
              i === 1 ? estiloSegunda : { transform: [{ scale: 0.9 }, { translateY: 24 }] }]}>
            <Tarjeta opcion={op} indice={real} />
          </Animated.View>
        );
      }).reverse()}
    </View>
  );
});

/* Dos zonas, igual que en el prototipo: color con el emoji arriba, texto abajo */
function Tarjeta({ opcion, indice }: { opcion: Opcion; indice: number }) {
  const tono = degradados.tarjeta[indice % degradados.tarjeta.length];
  return (
    <>
      <LinearGradient colors={tono as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={e.visual}>
        <View style={e.emojiBadge}>
          <Text style={e.emoji}>{opcion.emoji}</Text>
        </View>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)']}
          style={e.visualBrillo} pointerEvents="none"
        />
      </LinearGradient>
      <View style={e.cuerpo}>
        <Text style={e.titulo}>{opcion.titulo}</Text>
        <Text style={e.descripcion}>{opcion.descripcion}</Text>
        <View style={e.tags}>
          {opcion.tags.map((t) => (
            <View key={t} style={e.tag}><Text style={e.tagTexto}>{t}</Text></View>
          ))}
        </View>
      </View>
    </>
  );
}

export { UMBRAL };

const e = StyleSheet.create({
  mazo: { flex: 1, minHeight: 0 },
  carta: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colores.fondo,
    borderRadius: radios.grande,
    borderWidth: 1.5, borderColor: colores.linea,
    overflow: 'hidden',
  },
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  visualBrillo: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%',
  },
  emojiBadge: {
    width: 132, height: 132, borderRadius: 66,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    ...sombras.suave,
  },
  emoji: { fontSize: 78, lineHeight: 88 },
  cuerpo: { padding: espacio.l, gap: espacio.s },
  titulo: { fontSize: 25, fontWeight: '800', letterSpacing: -0.6, color: colores.tinta },
  descripcion: { fontSize: 15, color: colores.tinta2, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colores.fondo2, borderRadius: radios.redondo,
    borderWidth: 1, borderColor: colores.linea,
    paddingVertical: 5, paddingHorizontal: 11,
  },
  tagTexto: { fontSize: 11.5, fontWeight: '700', color: colores.tinta2 },
  lavado: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radios.grande,
  },
  sello: {
    position: 'absolute', top: 26,
    borderWidth: 4, borderRadius: radios.chico,
    paddingVertical: 6, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,.94)',
    ...sombras.suave,
  },
  selloSi: { left: 22, borderColor: colores.si, transform: [{ rotate: '-14deg' }] },
  selloNo: { right: 22, borderColor: colores.no, transform: [{ rotate: '14deg' }] },
  selloTexto: { fontSize: 28, fontWeight: '900', letterSpacing: 2 },
});
