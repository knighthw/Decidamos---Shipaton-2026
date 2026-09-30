import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colores, radios, sombras } from '../tema';

type Props = {
  children: string;
  onPress?: () => void;
  variante?: 'primario' | 'pelea' | 'contorno' | 'fantasma';
  deshabilitado?: boolean;
  estilo?: ViewStyle;
};

/* Los botones de la app, en color plano: rojo para las acciones del match y azul
   para las de pelea, los mismos colores que identifican a cada jugador. */
export function Boton({ children, onPress, variante = 'primario', deshabilitado, estilo }: Props) {
  /* Sin degradados: cada acción lleva el color plano de su modo. El rojo para lo
     principal del match, el azul para la pelea. */
  const relleno = variante === 'primario' ? e.primarioPlano
                : variante === 'pelea'    ? e.peleaPlano
                : null;
  const sombra = variante === 'primario' ? sombras.boton
               : variante === 'pelea'    ? sombras.botonPelea
               : null;
  const enColor = variante === 'primario' || variante === 'pelea';

  return (
    <Pressable onPress={deshabilitado ? undefined : onPress} style={({ pressed }) => [
      e.base, estilo,
      enColor && !deshabilitado && [relleno, sombra],
      variante === 'contorno' && e.contorno,
      variante === 'fantasma' && e.fantasma,
      enColor && deshabilitado && e.apagado,
      pressed && !deshabilitado && e.pulsado,
    ]}>
      <Text style={[
        e.texto,
        enColor && !deshabilitado && e.textoClaro,
        variante === 'contorno' && e.textoContorno,
        deshabilitado && e.textoApagado,
      ]}>{children}</Text>
    </Pressable>
  );
}

const e = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: radios.medio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarioPlano: { backgroundColor: colores.rojo },
  peleaPlano: { backgroundColor: colores.azul },
  contorno: {
    backgroundColor: colores.fondo,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colores.linea,
  },
  fantasma: { backgroundColor: colores.fondo, borderWidth: 1, borderColor: colores.linea },
  apagado: { backgroundColor: colores.linea },
  pulsado: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  texto: { fontSize: 16, fontWeight: '700', color: colores.tinta2 },
  textoClaro: { fontSize: 16, fontWeight: '700', color: '#fff' },
  textoContorno: { fontSize: 14, color: colores.tinta2 },
  textoApagado: { color: colores.tinta3 },
});
