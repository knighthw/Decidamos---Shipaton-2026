import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colores, espacio } from '../tema';

export function Cabecera({ titulo, onVolver }: { titulo: string; onVolver?: () => void }) {
  return (
    <View style={e.base}>
      {onVolver && (
        <Pressable onPress={onVolver} style={e.volver} hitSlop={10}>
          <Text style={e.flecha}>←</Text>
        </Pressable>
      )}
      <Text style={e.titulo}>{titulo}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  volver: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo2,
  },
  flecha: { fontSize: 17, color: colores.tinta },
  titulo: { fontSize: 17, fontWeight: '700', color: colores.tinta },
});
