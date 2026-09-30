import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { Boton } from '../componentes/Boton';
import * as Sala from '../logica/sala';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

const MENSAJES: Record<string, string> = {
  'sin-servidor': 'No se pudo conectar. Revisa tu internet e intenta de nuevo.',
  'no-encontrada': 'No hay ninguna sala activa con ese código.',
  'sala-llena': 'Esa sala ya tiene dos personas.',
};

export function Entrar({ ir }: { ir: Ir }) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    const n = nombre.trim();
    const c = codigo.trim().toUpperCase();
    if (!n) { setError('Escribe tu nombre.'); return; }
    if (c.length !== 4) { setError('El código tiene 4 letras.'); return; }

    setEntrando(true);
    setError(null);
    const resultado = await Sala.entrarConCodigo(c, n.slice(0, 16));
    setEntrando(false);
    if (resultado.error) {
      setError(MENSAJES[resultado.error] ?? 'Algo falló. Intenta de nuevo.');
      return;
    }
    ir('sala');
  }

  return (
    <Pantalla>
      <Cabecera titulo="Entrar a una sala" onVolver={() => ir('inicio')} />
      <View style={e.cuerpo}>
        <Text style={texto.etiqueta}>Tu nombre</Text>
        <TextInput
          style={e.input} value={nombre} onChangeText={setNombre}
          placeholder="Cómo te van a ver" placeholderTextColor={colores.tinta3}
          maxLength={16} autoFocus
        />

        <Text style={texto.etiqueta}>Código de la sala</Text>
        <TextInput
          style={[e.input, e.codigo]} value={codigo}
          onChangeText={(v) => setCodigo(v.toUpperCase().slice(0, 4))}
          placeholder="ABCD" placeholderTextColor={colores.tinta3}
          autoCapitalize="characters" maxLength={4}
          onSubmitEditing={entrar}
        />

        {error && <Text style={e.error}>{error}</Text>}
      </View>
      <Boton onPress={entrar} deshabilitado={entrando}>
        {entrando ? 'Entrando…' : 'Entrar'}
      </Boton>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  cuerpo: { flex: 1, gap: espacio.s, paddingTop: espacio.s },
  input: {
    fontSize: 16, color: colores.tinta, backgroundColor: colores.fondo2,
    borderRadius: radios.medio, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: espacio.m,
  },
  codigo: {
    fontSize: 28, fontWeight: '800', letterSpacing: 8, textAlign: 'center',
  },
  error: { color: colores.rojo, fontSize: 13.5, textAlign: 'center' },
});
