import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import { Avatar } from '../componentes/Avatar';
import * as Cuenta from '../logica/cuenta';
import { useCuenta } from '../logica/useCuenta';
import { useEsPro } from '../logica/useMonetizacion';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

/* El perfil de la cuenta: quién eres, qué plan tienes y salir. El correo no se
   puede cambiar porque identifica la cuenta; el nombre sí, que es el que ve la
   otra persona en las salas. */
export function Perfil({ ir }: { ir: Ir }) {
  const { usuario } = useCuenta();
  const { esPro } = useEsPro();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sin sesión no hay perfil: App ya muestra el acceso, aquí solo se evita pintar nada
  if (!usuario) return null;

  const cambiado = nombre.trim() !== usuario.nombre;

  const guardar = async () => {
    setError(null);
    setAviso(null);
    const r = await Cuenta.cambiarNombre(nombre);
    if (r.ok) setAviso('Nombre actualizado.');
    else setError(r.error);
  };

  const cerrarSesion = async () => {
    await Cuenta.salir();
    /* Se deja la app en el inicio: al volver a entrar no aparece el perfil de
       quien acaba de salir. */
    ir('inicio');
  };

  const eliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Se borra de este celular y no se puede deshacer. ¿Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => { await Cuenta.eliminar(); ir('inicio'); },
        },
      ],
    );
  };

  return (
    <Pantalla>
      <Cabecera titulo="Perfil" onVolver={() => ir('ajustes')} />
      <KeyboardAvoidingView style={e.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={e.flex} contentContainerStyle={e.cuerpo} keyboardShouldPersistTaps="handled">
          <View style={e.ficha}>
            <Avatar nombre={usuario.nombre} tam={76} />
            <Text style={e.nombre}>{usuario.nombre}</Text>
            <Text style={e.correo}>{usuario.correo}</Text>
            <View style={[e.plan, esPro && e.planPro]}>
              <Text style={[e.planTexto, esPro && e.planProTexto]}>
                {esPro ? 'Decidamos Pro' : 'Plan gratuito'}
              </Text>
            </View>
          </View>

          {!esPro && (
            <Pressable onPress={() => ir('paywall', { volver: 'perfil' })} style={e.fila} hitSlop={6}>
              <View style={e.filaTexto}>
                <Text style={e.filaNombre}>Pasar a Pro</Text>
                <Text style={e.filaDetalle}>Sin anuncios y con todos los personajes de pelea.</Text>
              </View>
              <Text style={e.flecha}>›</Text>
            </Pressable>
          )}

          <View style={e.campo}>
            <Text style={texto.etiqueta}>Tu nombre</Text>
            <TextInput
              style={e.input}
              value={nombre}
              onChangeText={(t) => { setNombre(t); setAviso(null); }}
              placeholder="Tu nombre"
              placeholderTextColor={colores.tinta3}
              maxLength={16}
              accessibilityLabel="Tu nombre"
            />
            {error ? <Text style={e.error}>{error}</Text> : null}
            {aviso ? <Text style={e.aviso}>{aviso}</Text> : null}
            <Boton variante="fantasma" deshabilitado={!cambiado} onPress={guardar}>
              Guardar el nombre
            </Boton>
          </View>

          <View style={e.campo}>
            <Text style={texto.etiqueta}>Correo</Text>
            <View style={[e.input, e.inputFijo]}>
              <Text style={e.correoFijo}>{usuario.correo}</Text>
            </View>
            <Text style={texto.pista}>
              La cuenta vive en este celular hasta que exista el servidor, así que el correo
              no se puede cambiar todavía.
            </Text>
          </View>

          <Boton variante="contorno" onPress={cerrarSesion}>Cerrar sesión</Boton>
          <Pressable onPress={eliminarCuenta} hitSlop={6}>
            <Text style={e.eliminar}>Eliminar cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  flex: { flex: 1 },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  ficha: {
    alignItems: 'center', gap: 6,
    backgroundColor: colores.fondo, borderRadius: radios.medio,
    borderWidth: 1, borderColor: colores.linea,
    paddingVertical: espacio.l, paddingHorizontal: espacio.m,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.tinta, marginTop: 4 },
  correo: { ...texto.pista, fontSize: 13 },
  plan: {
    marginTop: 6, borderRadius: radios.redondo,
    backgroundColor: colores.fondo2, paddingVertical: 5, paddingHorizontal: 12,
  },
  planPro: { backgroundColor: colores.azulSuave },
  planTexto: { fontSize: 12, fontWeight: '700', color: colores.tinta2 },
  planProTexto: { color: colores.azul },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: espacio.m,
    backgroundColor: colores.fondo, borderRadius: radios.medio,
    borderWidth: 1, borderColor: colores.linea, padding: espacio.m,
  },
  filaTexto: { flex: 1, gap: 3 },
  filaNombre: { fontSize: 15.5, fontWeight: '700', color: colores.tinta },
  filaDetalle: { ...texto.pista, lineHeight: 17 },
  flecha: { fontSize: 22, color: colores.tinta3 },
  campo: { gap: 8 },
  input: {
    fontSize: 15, color: colores.tinta,
    backgroundColor: colores.fondo,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: colores.linea,
  },
  inputFijo: { backgroundColor: colores.fondo2 },
  correoFijo: { fontSize: 15, color: colores.tinta2 },
  error: { fontSize: 13, fontWeight: '600', color: colores.rojoContraste },
  aviso: { fontSize: 13, fontWeight: '600', color: colores.si },
  eliminar: {
    fontSize: 13.5, fontWeight: '600', color: colores.rojoContraste,
    textAlign: 'center', paddingVertical: espacio.s,
  },
});
