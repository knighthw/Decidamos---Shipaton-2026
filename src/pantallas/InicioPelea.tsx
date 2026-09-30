import { View, Text, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import { PERSONAJES } from '../logica/personajes';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

/* Portada del modo pelea. El camino que abre es el mismo de siempre:
   Dilema con propósito 'pelea'. */
export function InicioPelea({ ir }: { ir: Ir }) {
  return (
    <Pantalla conBarra>
      <View style={e.centro}>
        <Text style={e.emoji}>⚔️</Text>
        <Text style={e.titulo}>Modo Pelea</Text>
        <Text style={e.lema}>
          Cuando no se ponen de acuerdo, que gane el mejor.
        </Text>

        <View style={e.animales}>
          {PERSONAJES.map((p) => (
            <Text key={p.id} style={e.animal}>{p.emoji}</Text>
          ))}
        </View>

        <View style={e.pasos}>
          {['Cada quien dice qué quiere hacer',
            'Eligen un animal con 4 habilidades',
            'El que gana impone su decisión'].map((t, i) => (
            <View key={t} style={e.paso}>
              <View style={e.pasoNum}><Text style={e.pasoNumTexto}>{i + 1}</Text></View>
              <Text style={e.pasoTexto}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <Boton variante="pelea" onPress={() => ir('dilema', { proposito: 'pelea' })}>
        Crear sala de pelea
      </Boton>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.s },
  emoji: { fontSize: 58 },
  titulo: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: colores.azul },
  lema: { ...texto.cuerpo, textAlign: 'center', maxWidth: 280 },
  animales: {
    flexDirection: 'row', gap: 4, marginTop: espacio.m,
    backgroundColor: colores.azulSuave, borderRadius: radios.redondo,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  animal: { fontSize: 26 },
  pasos: { marginTop: espacio.l, gap: 11, alignSelf: 'stretch', paddingHorizontal: espacio.m },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  pasoNum: {
    width: 25, height: 25, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colores.azulSuave,
  },
  pasoNumTexto: { fontSize: 13, fontWeight: '700', color: colores.azul },
  pasoTexto: { fontSize: 14, color: colores.tinta2, flex: 1 },
});
