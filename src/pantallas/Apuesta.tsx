import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import { jugadorActivo, ponerActivo, ponerRelevo } from '../logica/relevo';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

/* Lo que se apuesta depende de dónde se venga: del match se elige una de las 5
   opciones; entrando directo al modo pelea, se escribe a mano. */
export function Apuesta({ ir }: { ir: Ir }) {
  const sala = useSala();
  const [elegida, setElegida] = useState<string | null>(null);
  const [libre, setLibre] = useState('');

  /* Remoto: si el otro confirma su apuesta mientras yo esperaba (o si la mía ya
     estaba puesta desde antes, caso del anfitrión), saltar solo a personajes. */
  useEffect(() => {
    if (sala && !Sala.esLocal() && Sala.apuestasListas()) ir('personajes');
  }, [sala?.apuestas.p1, sala?.apuestas.p2]);

  if (!sala) return null;

  const desdeMatch = sala.proposito === 'match' && sala.opciones.length > 0;
  const yo = Sala.esLocal() ? jugadorActivo() : Sala.obtenerMisIds()[0];
  const quien = sala.participantes.find((p) => p.id === yo)!;
  /* Si el otro ya dijo lo suyo, se enseña: se compite contra algo concreto */
  const rival = sala.participantes.find((p) => p.id !== yo);
  const rivalApuesta = rival ? sala.apuestas[rival.id] : undefined;
  const texto2 = desdeMatch ? elegida : libre.trim();
  /* En remoto, si ya tengo apuesta puesta (la mía propia o la del anfitrión al
     crear la sala) no hay nada que llenar: solo toca esperar al otro. */
  const yaAposte = !Sala.esLocal() && !!sala.apuestas[yo];

  function confirmar() {
    if (!texto2) return;
    Sala.apostar(yo, texto2);

    if (Sala.apuestasListas()) {
      ponerActivo('p1');
      ir('personajes');
      return;
    }
    if (!Sala.esLocal()) return; // remoto: el effect de arriba avisa cuando el otro termine

    const otro = sala!.participantes.find((p) => p.id !== yo)!;
    ponerActivo(otro.id);
    ponerRelevo({
      aQuien: otro.id, nombre: otro.nombre,
      texto: 'Elige qué quieres defender, sin que el otro mire.', destino: 'apuesta',
    });
    ir('relevo');
  }

  return (
    <Pantalla>
      <Cabecera titulo={Sala.esLocal() ? `${quien.nombre}: ¿qué defiendes?` : '¿Qué defiendes?'} />
      {yaAposte ? (
        <View style={e.esperando}>
          <Text style={e.esperandoTexto}>
            Ya elegiste. Esperando a {rival?.nombre ?? 'la otra persona'}…
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
          {rival && rivalApuesta && (
            <View style={e.rival}>
              <Text style={e.rivalEtiqueta}>{rival.nombre} defiende</Text>
              <Text style={e.rivalTexto}>{rivalApuesta}</Text>
            </View>
          )}

          <Text style={texto.pista}>
            {desdeMatch
              ? 'Elige la opción que vas a defender. Si ganas, esa gana.'
              : 'Escribe qué quieres hacer. Si ganas la pelea, eso hacen.'}
          </Text>

          {desdeMatch ? sala.opciones.map((op) => (
            <Pressable key={op.id} onPress={() => setElegida(op.titulo)}
              style={[e.opcion, elegida === op.titulo && e.opcionElegida]}>
              <Text style={e.opcionEmoji}>{op.emoji}</Text>
              <Text style={e.opcionTitulo}>{op.titulo}</Text>
            </Pressable>
          )) : (
            <View style={e.campo}>
              <Text style={texto.etiqueta}>Tu propuesta</Text>
              <TextInput style={e.input} value={libre} onChangeText={setLibre}
                placeholder="Ej: pedir sushi" placeholderTextColor={colores.tinta3}
                maxLength={60} autoFocus />
            </View>
          )}
        </ScrollView>
      )}
      {!yaAposte && (
        <Boton variante="pelea" deshabilitado={!texto2} onPress={confirmar}>Confirmar</Boton>
      )}
    </Pantalla>
  );
}

const e = StyleSheet.create({
  cuerpo: { gap: espacio.s, paddingBottom: espacio.m },
  esperando: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.m },
  esperandoTexto: { fontSize: 15, fontWeight: '600', color: colores.tinta2, textAlign: 'center' },
  rival: {
    backgroundColor: colores.azulSuave, borderRadius: radios.medio,
    borderLeftWidth: 4, borderLeftColor: colores.azul,
    padding: 13, gap: 2, marginBottom: espacio.xs,
  },
  rivalEtiqueta: { fontSize: 12, fontWeight: '700', color: colores.azul },
  rivalTexto: { fontSize: 15.5, fontWeight: '700', color: colores.tinta },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderWidth: 1.5, borderColor: colores.linea, borderRadius: 15,
    padding: 13, backgroundColor: colores.fondo,
  },
  opcionElegida: { borderColor: colores.azul, backgroundColor: '#f7f3ff' },
  opcionEmoji: { fontSize: 24 },
  opcionTitulo: { fontSize: 15, fontWeight: '700', color: colores.tinta, flex: 1 },
  campo: { gap: 7, marginTop: espacio.s },
  input: {
    fontSize: 15, color: colores.tinta, backgroundColor: colores.fondo2,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
});
