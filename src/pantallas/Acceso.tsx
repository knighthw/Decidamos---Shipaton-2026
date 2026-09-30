import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import * as Cuenta from '../logica/cuenta';
import { colores, radios, espacio, texto } from '../tema';

/* Iniciar sesión. Mientras no haya servidor las cuentas viven en este celular
   (ver cuenta.ts), así que la pantalla enseña la cuenta de prueba en vez de dejar
   a nadie fuera. */
export function Acceso({ irARegistro }: { irARegistro: () => void }) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const entrar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    const r = await Cuenta.entrar(correo, clave);
    setOcupado(false);
    if (!r.ok) setError(r.error);
    // Si entra, la sesión cambia y App deja de mostrar esta pantalla
  };

  const usarPrueba = () => {
    setCorreo(Cuenta.CUENTA_PRUEBA.correo);
    setClave(Cuenta.CUENTA_PRUEBA.clave);
    setError(null);
  };

  return (
    <Pantalla fondo="formulario">
      <KeyboardAvoidingView style={e.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={e.flex} contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
          <View style={e.marca}>
            <Text style={e.logo}>Decidamos</Text>
            <Text style={e.lema}>Entra para decidir juntos</Text>
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
              placeholder="Tu contraseña"
              placeholderTextColor={colores.tinta3}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="Contraseña"
              onSubmitEditing={entrar}
            />
          </View>

          {error && <Text style={e.error}>{error}</Text>}

          <Boton onPress={entrar} deshabilitado={ocupado}>
            {ocupado ? 'Entrando…' : 'Entrar'}
          </Boton>

          <Pressable onPress={irARegistro} style={e.enlace} hitSlop={8}>
            <Text style={e.enlaceTexto}>No tengo cuenta, quiero crear una</Text>
          </Pressable>

          <View style={e.nota}>
            <Text style={e.notaTitulo}>Cuenta de prueba</Text>
            <Text style={e.notaTexto}>
              Todavía no hay servidor, así que las cuentas solo existen en este celular.
              Para probar, usa {Cuenta.CUENTA_PRUEBA.correo} con la contraseña{' '}
              {Cuenta.CUENTA_PRUEBA.clave}.
            </Text>
            <Pressable onPress={usarPrueba} style={e.notaBoton} hitSlop={6}>
              <Text style={e.notaBotonTexto}>Usar la cuenta de prueba</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  flex: { flex: 1 },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  campo: { gap: 7 },
  /* Campos blancos sobre el celeste, igual que en el resto de formularios */
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

  marca: { alignItems: 'center', gap: 4, paddingTop: espacio.xl, paddingBottom: espacio.s },
  /* Los dos jugadores en la marca: el nombre en rojo y el lema en azul */
  logo: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: colores.rojo },
  lema: { fontSize: 14.5, fontWeight: '600', color: colores.azul },
  nota: {
    backgroundColor: 'rgba(255,255,255,.75)', borderRadius: radios.medio,
    borderWidth: 1, borderColor: 'rgba(255,255,255,.9)',
    padding: 14, gap: 6, marginTop: espacio.s,
  },
  notaTitulo: { fontSize: 13, fontWeight: '800', color: colores.tinta },
  notaTexto: { fontSize: 12.5, color: colores.tinta2, lineHeight: 19 },
  notaBoton: { alignSelf: 'flex-start', paddingVertical: 4 },
  notaBotonTexto: { fontSize: 13, fontWeight: '700', color: colores.azul },
});
