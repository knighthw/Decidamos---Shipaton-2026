import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import { Avatar } from '../componentes/Avatar';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import { ponerActivo, ponerRelevo } from '../logica/relevo';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

export function SalaEspera({ ir }: { ir: Ir }) {
  const sala = useSala();
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState('');

  /* Remoto y no soy el anfitrión: cuando él le da a Iniciar, a mí me llega el
     cambio de estado por Realtime — no hay celular que me pasen, hay que saltar
     solo a donde le tocó saltar a él. */
  useEffect(() => {
    if (!sala || Sala.esLocal() || Sala.soyArbitro()) return;
    if (sala.estado === 'apostando' || sala.estado === 'eligiendo') ir('apuesta');
    else if (sala.estado === 'votando') ir('swipe');
  }, [sala?.estado]);

  if (!sala) return null;

  const lleno = sala.participantes.length >= 2;
  /* El botón de Iniciar es cosa de UNA sola persona: en local, la única que hay;
     en remoto, el anfitrión. Sin este freno, el que entró con código también
     podía tocarlo y disparaba su propia generación de opciones en paralelo. */
  const puedoIniciar = Sala.esLocal() || Sala.soyArbitro();

  function agregar() {
    const n = nombre.trim();
    if (!n) return;
    Sala.unirseLocal(n.slice(0, 16));
    setNombre('');
    setAgregando(false);
  }

  function iniciar() {
    ponerActivo('p1');
    if (sala!.proposito === 'pelea') {
      Sala.irAApostar();
      if (!Sala.esLocal()) { ir('apuesta'); return; }
      /* Local: el anfitrión ya dijo lo suyo al crear la sala, así que solo falta
         el otro — se le pasa el celular en vez de volver a preguntarle lo mismo. */
      const otro = sala!.participantes.find((p) => p.id !== 'p1')!;
      ponerActivo(otro.id);
      ponerRelevo({
        aQuien: otro.id, nombre: otro.nombre,
        texto: 'Escribe qué quieres hacer tú, sin que el otro mire.', destino: 'apuesta',
      });
      ir('relevo');
      return;
    }
    // La generación real (IA, con banco local de respaldo) pasa en la pantalla
    // "Generando": ahí sí hay tiempo de sobra para esperar la respuesta de red.
    ir('generando');
  }

  return (
    <Pantalla>
      <Cabecera titulo="Sala de espera" onVolver={() => ir('dilema')} />
      <ScrollView contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
        <Text style={e.eco}>
          {sala.proposito === 'pelea'
            ? `${sala.participantes[0].nombre} defiende: “${sala.dilema}”`
            : `“${sala.dilema}”`}
        </Text>

        <View style={e.codigoCaja}>
          <Text style={e.codigoEtiqueta}>Código de la sala</Text>
          <Text style={e.codigo}>{sala.codigo}</Text>
          <Text style={e.codigoNota}>
            Compártelo para que la otra persona entre desde su propio celular
          </Text>
        </View>

        <Text style={texto.etiqueta}>Participantes</Text>
        <View style={e.lista}>
          {sala.participantes.map((p, i) => (
            <View key={p.id} style={e.participante}>
              <Avatar nombre={p.nombre} segundo={i === 1} />
              <Text style={e.nombre}>{p.nombre}</Text>
              {p.anfitrion && (
                <View style={e.etiquetaHost}><Text style={e.etiquetaHostTexto}>Anfitrión</Text></View>
              )}
            </View>
          ))}
        </View>

        {!lleno && !agregando && (
          <Boton variante="contorno" onPress={() => setAgregando(true)}>
            + Agregar a la otra persona
          </Boton>
        )}
        {!lleno && agregando && (
          <View style={e.formAgregar}>
            <TextInput style={e.input} value={nombre} onChangeText={setNombre}
              placeholder="Nombre de la otra persona" placeholderTextColor={colores.tinta3}
              maxLength={16} autoFocus onSubmitEditing={agregar} />
            <Boton onPress={agregar} estilo={e.botonEntrar}>Listo</Boton>
          </View>
        )}

        <View style={e.nota}>
          <Text style={e.notaTexto}>
            {Sala.esLocal()
              ? '📱 Se juega en este celular: cada quien mira sus opciones por turnos y se lo van pasando.'
              : '📱 Cada quien juega desde su propio celular.'}
          </Text>
        </View>
      </ScrollView>

      {puedoIniciar ? (
        <Boton deshabilitado={!lleno} onPress={iniciar}>Iniciar</Boton>
      ) : (
        <View style={e.esperandoAnfitrion}>
          <Text style={e.esperandoAnfitrionTexto}>Esperando a que el anfitrión inicie…</Text>
        </View>
      )}
    </Pantalla>
  );
}

const e = StyleSheet.create({
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  eco: {
    backgroundColor: colores.fondo2, borderLeftWidth: 3, borderLeftColor: colores.rojo,
    borderTopRightRadius: radios.chico, borderBottomRightRadius: radios.chico,
    padding: 13, fontSize: 14.5, fontStyle: 'italic', color: colores.tinta2,
  },
  codigoCaja: {
    borderWidth: 1.5, borderColor: colores.linea, borderRadius: radios.medio,
    padding: espacio.m, alignItems: 'center', backgroundColor: colores.fondo,
  },
  codigoEtiqueta: { fontSize: 12, fontWeight: '600', color: colores.tinta3 },
  codigo: { fontSize: 40, fontWeight: '800', letterSpacing: 7, color: colores.tinta, marginVertical: 4 },
  codigoNota: { fontSize: 11.5, color: colores.tinta3, textAlign: 'center' },
  lista: { gap: 8 },
  participante: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colores.fondo2, borderRadius: 14, padding: 11,
  },
  nombre: { fontSize: 14.5, fontWeight: '600', color: colores.tinta, flex: 1 },
  etiquetaHost: { backgroundColor: '#fff1ee', borderRadius: radios.redondo, paddingVertical: 4, paddingHorizontal: 9 },
  etiquetaHostTexto: { fontSize: 11, fontWeight: '700', color: colores.rojo },
  formAgregar: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, fontSize: 15, color: colores.tinta, backgroundColor: colores.fondo2,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  botonEntrar: { paddingHorizontal: 18 },
  nota: { backgroundColor: '#f2f0ff', borderRadius: radios.chico, padding: 13 },
  notaTexto: { fontSize: 12.5, color: colores.tinta2, lineHeight: 19 },
  esperandoAnfitrion: { paddingVertical: espacio.m, alignItems: 'center' },
  esperandoAnfitrionTexto: { fontSize: 14, fontWeight: '600', color: colores.tinta2 },
});
