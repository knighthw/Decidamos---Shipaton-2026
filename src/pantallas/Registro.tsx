import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import * as Cuenta from '../logica/cuenta';
import { colores, radios, espacio, texto } from '../tema';

/* Crear cuenta. Se guarda en este celular (ver cuenta.ts): la pantalla lo dice en
   vez de prometer una cuenta que todavía no viaja a ningún servidor. */
export function Registro({ irAAcceso }: { irAAcceso: () => void }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const crear = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    const r = await Cuenta.registrar({ nombre, correo, clave });
    setOcupado(false);
    if (!r.ok) setError(r.error);
    // Si se crea, queda la sesión abierta y App pasa al inicio
  };

  return (
    <Pantalla fondo="formulario">
      <Cabecera titulo="Nueva cuenta" onVolver={irAAcceso} />
      <KeyboardAvoidingView style={e.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={e.flex} contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
          <View style={e.campo}>
            <Text style={texto.etiqueta}>¿Cómo te llamas?</Text>
            <TextInput
              style={e.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              placeholderTextColor={colores.tinta3}
              maxLength={16}
              accessibilityLabel="Nombre"
            />
            <Text style={texto.pista}>Es el nombre que verá la otra persona en las salas.</Text>
          </View>

          <View style={e.campo}>
            <Text style={texto.etiqueta}>Correo</Text>
            <TextInput
              style={e.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="tu@correo.com"
              placeholderTextColor={colores.tinta3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Correo"
            />
          </View>

          <View style={e.campo}>
            <Text style={texto.etiqueta}>Contraseña</Text>
            <TextInput
              style={e.input}
              value={clave}
              onChangeText={setClave}
              placeholder="Al menos 6 caracteres"
              placeholderTextColor={colores.tinta3}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="Contraseña"
              onSubmitEditing={crear}
            />
            <Text style={texto.pista}>
              Se guarda solo en este celular, así que no uses una contraseña que uses en
              otro sitio.
            </Text>
          </View>

          {error && <Text style={e.error}>{error}</Text>}

          <Boton onPress={crear} deshabilitado={ocupado}>
            {ocupado ? 'Creando…' : 'Crear cuenta'}
          </Boton>

          <Pressable onPress={irAAcceso} style={e.enlace} hitSlop={8}>
            <Text style={e.enlaceTexto}>Ya tengo cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  flex: { flex: 1 },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  campo: { gap: 7 },
  input: {
    fontSize: 15, color: colores.tinta,
    backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,.9)',
  },
  error: {
    fontSize: 13, fontWeight: '600', color: colores.rojoContraste,
    backgroundColor: colores.rojoSuave, borderRadius: radios.chico,
    borderWidth: 1, borderColor: colores.rojoBorde,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  enlace: { alignSelf: 'center', paddingVertical: 6 },
  enlaceTexto: { fontSize: 14, fontWeight: '700', color: colores.azul },
});
