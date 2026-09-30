import { View, Text, StyleSheet } from 'react-native';
import { colores } from '../tema';

/* El color plano dice de quién es: rojo quien crea la sala, azul quien entra. */
export function Avatar({ nombre, segundo = false, tam = 32 }:
  { nombre: string; segundo?: boolean; tam?: number }) {
  const inicial = (nombre || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[
      e.base,
      { width: tam, height: tam, borderRadius: tam / 2,
        backgroundColor: segundo ? colores.azul : colores.rojo },
    ]}>
      <Text style={[e.letra, { fontSize: tam * 0.44 }]}>{inicial}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  letra: { color: '#fff', fontWeight: '700' },
});
