import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { degradados, espacio } from '../tema';

const FONDOS = {
  app: degradados.app,
  arena: degradados.arena,
  portada: degradados.portada,   // del celeste al azul profundo
  formulario: degradados.formulario,
  blanco: degradados.app,
} as const;
import { ALTO_BARRA } from './BarraInferior';

type Props = {
  children: React.ReactNode;
  fondo?: 'app' | 'arena' | 'portada' | 'formulario' | 'blanco';
  /* Las pantallas con barra inferior reservan su alto para no quedar tapadas */
  conBarra?: boolean;
  estilo?: ViewStyle;
};

/* El marco de celular del prototipo aquí no existe: la app ES la pantalla.
   Lo que sí hace falta es respetar la muesca y la barra de gestos. */
export function Pantalla({ children, fondo = 'app', conBarra, estilo }: Props) {
  const bordes = useSafeAreaInsets();
  const relleno = {
    paddingTop: bordes.top + espacio.m,
    // Con barra, el margen del sistema ya lo pone la propia barra
    paddingBottom: conBarra ? ALTO_BARRA : Math.max(bordes.bottom, espacio.m),
  };

  if (fondo === 'blanco') {
    return <View style={[e.base, e.blanco, relleno, estilo]}>{children}</View>;
  }
  return (
    <LinearGradient
      colors={FONDOS[fondo] as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }} end={fondo === 'portada' ? { x: 0.3, y: 1 } : { x: 0.6, y: 1 }}
      style={[e.base, relleno, estilo]}
    >
      {children}
    </LinearGradient>
  );
}

const e = StyleSheet.create({
  base: { flex: 1, paddingHorizontal: espacio.l, gap: espacio.m },
  blanco: { backgroundColor: '#fff' },
});
