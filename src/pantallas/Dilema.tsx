import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import * as Sala from '../logica/sala';
import { useCuenta } from '../logica/useCuenta';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

const EJEMPLOS_MATCH = ['¿Qué cenamos hoy?', '¿A dónde viajamos?', '¿Qué película vemos?',
                        '¿Qué hacemos el sábado?', '¿Qué le regalamos?'];
/* En pelea no se pregunta el tema: se escribe directamente lo que uno defiende */
const EJEMPLOS_PELEA = ['Pedir pizza', 'Salir a caminar', 'Ver una peli en casa',
                        'Ir al cine', 'Quedarnos sin hacer nada'];

export function Dilema({ ir, proposito }: { ir: Ir; proposito: 'match' | 'pelea' }) {
  /* Quien crea la sala es quien tiene la sesión abierta: su nombre viene puesto y
     se puede cambiar, por si el celular lo usa otra persona. */
  const { usuario } = useCuenta();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [dilema, setDilema] = useState('');
  const listo = nombre.trim().length > 0 && dilema.trim().length > 0;
  const esPelea = proposito === 'pelea';
  const ejemplos = esPelea ? EJEMPLOS_PELEA : EJEMPLOS_MATCH;

  return (
    <Pantalla fondo="formulario">
      <Cabecera
        titulo={esPelea ? 'Nueva pelea' : 'Nueva decisión'}
        onVolver={() => ir('inicio')}
      />
      <KeyboardAvoidingView style={e.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={e.flex} contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
          <View style={e.campo}>
            <Text style={texto.etiqueta}>¿Cómo te llamas?</Text>
            <TextInput style={e.input} value={nombre} onChangeText={setNombre}
              placeholder="Tu nombre" placeholderTextColor={colores.tinta3} maxLength={16} />
          </View>

          <View style={e.campo}>
            <Text style={texto.etiqueta}>
              {esPelea ? '¿Qué quieres hacer tú?' : '¿Qué tienen que decidir?'}
            </Text>
            <TextInput style={[e.input, e.area]} value={dilema} onChangeText={setDilema}
              placeholder={esPelea ? 'Ej: pedir sushi' : 'Ej: no sabemos qué cenar hoy'}
              placeholderTextColor={colores.tinta3}
              maxLength={esPelea ? 60 : 140} multiline />
            {esPelea && (
              <Text style={texto.pista}>
                Esto es lo que defenderás en la pelea. Si ganas, es lo que harán.
              </Text>
            )}
          </View>

          <Text style={texto.pista}>O prueba con uno de estos:</Text>
          <View style={e.chips}>
            {ejemplos.map((t) => (
              <Pressable key={t} onPress={() => setDilema(t)} style={e.chip}>
                <Text style={e.chipTexto}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Boton deshabilitado={!listo} onPress={() => {
        Sala.crearSala(nombre.trim(), dilema.trim(), proposito);
        // En pelea lo escrito ES su propuesta: no se le vuelve a preguntar después
        if (esPelea) Sala.apostar('p1', dilema.trim());
        ir('sala');
      }}>{esPelea ? 'Crear sala de pelea' : 'Crear sala'}</Boton>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  flex: { flex: 1 },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  campo: { gap: 7 },
  /* Blancos sobre el celeste: así se ve dónde se escribe sin necesidad de bordes fuertes */
  input: {
    fontSize: 15, color: colores.tinta,
    backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,.9)',
  },
  area: { minHeight: 84, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: colores.linea, borderRadius: radios.redondo,
    paddingVertical: 8, paddingHorizontal: 13, backgroundColor: colores.fondo,
  },
  chipTexto: { fontSize: 13, color: colores.tinta2 },
});
