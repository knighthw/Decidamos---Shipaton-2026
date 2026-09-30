import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import { PERSONAJES, buscarPersonaje } from '../logica/personajes';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import { jugadorActivo, ponerActivo, ponerRelevo } from '../logica/relevo';
import { colores, radios, espacio } from '../tema';
import type { Ir } from '../navegacion';

const TOPES = {
  vida: Math.max(...PERSONAJES.map((p) => p.vida)),
  ataque: Math.max(...PERSONAJES.map((p) => p.ataque)),
  defensa: Math.max(...PERSONAJES.map((p) => p.defensa)),
  velocidad: Math.max(...PERSONAJES.map((p) => p.velocidad)),
};

export function Personajes({ ir }: { ir: Ir }) {
  const sala = useSala();
  const [elegido, setElegido] = useState<string | null>(null);

  /* Remoto: en cuanto el árbitro arma la pelea con los dos luchadores, saltar
     solo — ninguno de los dos tiene que tocar nada más. */
  useEffect(() => {
    if (sala && !Sala.esLocal() && sala.estado === 'peleando') ir('pelea');
  }, [sala?.estado]);

  if (!sala) return null;

  const yo = Sala.esLocal() ? jugadorActivo() : Sala.obtenerMisIds()[0];
  const quien = sala.participantes.find((p) => p.id === yo)!;
  const animal = elegido ? buscarPersonaje(elegido) : null;
  const yaElegi = !Sala.esLocal() && !!sala.personajes[yo];

  function confirmar() {
    if (!elegido) return;
    Sala.elegirPersonaje(yo, elegido);

    if (Sala.personajesListos() && Sala.estadoPelea()) {
      ponerActivo('p1');
      ir('pelea');
      return;
    }
    if (!Sala.esLocal()) return; // remoto: el effect de arriba avisa cuando arme la pelea

    const otro = sala!.participantes.find((p) => p.id !== yo)!;
    ponerActivo(otro.id);
    ponerRelevo({
      aQuien: otro.id, nombre: otro.nombre,
      texto: 'Elige tu luchador.', destino: 'personajes',
    });
    ir('relevo');
  }

  if (yaElegi) {
    return (
      <Pantalla>
        <Cabecera titulo="Elige tu luchador" />
        <View style={e.esperando}>
          <Text style={e.esperandoTexto}>Ya elegiste. Esperando al otro…</Text>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Cabecera titulo={Sala.esLocal() ? `${quien.nombre}: elige luchador` : 'Elige tu luchador'} />
      <ScrollView contentContainerStyle={e.cuerpo}>
        <View style={e.grid}>
          {PERSONAJES.map((p) => (
            <Pressable key={p.id} onPress={() => setElegido(p.id)}
              style={[e.animal, elegido === p.id && e.animalElegido]}>
              <Text style={e.animalEmoji}>{p.emoji}</Text>
              <Text style={e.animalNombre}>{p.nombre}</Text>
            </Pressable>
          ))}
        </View>

        {animal && (
          <View style={e.ficha}>
            <View style={e.fichaCabecera}>
              <Text style={e.fichaEmoji}>{animal.emoji}</Text>
              <View style={e.flex}>
                <Text style={e.fichaNombre}>{animal.nombre}</Text>
                <Text style={e.fichaFrase}>{animal.frase}</Text>
              </View>
            </View>

            <View style={e.stats}>
              <Barra nombre="Vida" valor={animal.vida} tope={TOPES.vida} />
              <Barra nombre="Fuerza" valor={animal.ataque} tope={TOPES.ataque} />
              <Barra nombre="Defensa" valor={animal.defensa} tope={TOPES.defensa} />
              <Barra nombre="Rapidez" valor={animal.velocidad} tope={TOPES.velocidad} />
            </View>

            <View style={e.pasiva}>
              <Text style={e.pasivaEtiqueta}>PASIVA</Text>
              <Text style={e.pasivaTexto}>{animal.pasivaTexto}</Text>
            </View>

            <View style={e.habilidades}>
              {animal.habilidades.map((h) => (
                <View key={h.id} style={e.hab}>
                  <Text style={e.habEmoji}>{h.emoji}</Text>
                  <View style={e.flex}>
                    <Text style={e.habNombre}>{h.nombre}</Text>
                    <Text style={e.habTexto}>{h.texto}</Text>
                  </View>
                  {h.dano > 0 && (
                    <View style={e.habDano}>
                      <Text style={e.habDanoTexto}>{h.dano}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Boton variante="pelea" deshabilitado={!elegido} onPress={confirmar}>
        {animal ? `Elegir a ${animal.nombre}` : 'Elegir'}
      </Boton>
    </Pantalla>
  );
}

function Barra({ nombre, valor, tope }: { nombre: string; valor: number; tope: number }) {
  return (
    <View style={e.stat}>
      <Text style={e.statNombre}>{nombre}</Text>
      <View style={e.statBarra}>
        <View style={[e.statRelleno, { width: `${(valor / tope) * 100}%` }]} />
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  flex: { flex: 1 },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  esperando: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.m },
  esperandoTexto: { fontSize: 15, fontWeight: '600', color: colores.tinta2, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  animal: {
    width: '31.5%', alignItems: 'center', gap: 3,
    borderWidth: 1.5, borderColor: colores.linea, borderRadius: 16,
    paddingVertical: 12, backgroundColor: colores.fondo,
  },
  animalElegido: { borderColor: colores.azul, backgroundColor: '#f7f3ff' },
  animalEmoji: { fontSize: 34 },
  animalNombre: { fontSize: 12.5, fontWeight: '700', color: colores.tinta },
  ficha: { backgroundColor: colores.fondo2, borderRadius: radios.medio, padding: 15, gap: 12 },
  fichaCabecera: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  fichaEmoji: { fontSize: 38 },
  fichaNombre: { fontSize: 18, fontWeight: '800', color: colores.tinta },
  fichaFrase: { fontSize: 13, fontStyle: 'italic', color: colores.tinta3 },
  stats: { gap: 6 },
  pasiva: { backgroundColor: '#f3ecff', borderRadius: 11, padding: 10, gap: 2 },
  pasivaEtiqueta: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colores.azul },
  pasivaTexto: { fontSize: 12.5, color: colores.tinta2, lineHeight: 17 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statNombre: { width: 62, fontSize: 12, fontWeight: '600', color: colores.tinta2 },
  statBarra: { flex: 1, height: 7, backgroundColor: colores.linea, borderRadius: radios.redondo, overflow: 'hidden' },
  statRelleno: { height: '100%', backgroundColor: colores.azul, borderRadius: radios.redondo },
  habilidades: { gap: 7 },
  hab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colores.fondo, borderRadius: 11, padding: 10,
  },
  habEmoji: { fontSize: 16 },
  habNombre: { fontSize: 13, fontWeight: '700', color: colores.tinta },
  habTexto: { fontSize: 12, color: colores.tinta3, lineHeight: 16 },
  habDano: { backgroundColor: '#f3ecff', borderRadius: radios.redondo, paddingVertical: 2, paddingHorizontal: 8 },
  habDanoTexto: { fontSize: 11.5, fontWeight: '700', color: colores.azul },
});
