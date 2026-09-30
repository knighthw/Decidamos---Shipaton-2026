import { useEffect, useReducer } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { Pantalla } from '../componentes/Pantalla';
import { Avatar } from '../componentes/Avatar';
import * as Preferencias from '../logica/preferencias';
import { useCuenta } from '../logica/useCuenta';
import { colores, radios, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

export function Ajustes({ ir }: { ir: Ir }) {
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => Preferencias.suscribir(refrescar), []);
  const prefs = Preferencias.obtener();
  const { usuario } = useCuenta();

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const nombre = Constants.expoConfig?.name ?? 'Decidamos';

  return (
    <Pantalla conBarra>
      <Text style={e.titulo}>Configuración</Text>

      {/* La cuenta, lo primero: quién está usando la app en este celular */}
      {usuario && (
        <Pressable onPress={() => ir('perfil')} style={e.cuenta} hitSlop={6}>
          <Avatar nombre={usuario.nombre} tam={52} />
          <View style={e.cuentaTexto}>
            <Text style={e.cuentaNombre} numberOfLines={1}>{usuario.nombre}</Text>
            <Text style={e.cuentaCorreo} numberOfLines={1}>{usuario.correo}</Text>
            <Text style={e.cuentaEnlace}>Ver perfil</Text>
          </View>
          <Text style={e.flecha}>›</Text>
        </Pressable>
      )}

      <View style={e.cuerpo}>
        <View style={e.fila}>
          <View style={e.filaTexto}>
            <Text style={e.ajusteNombre}>Vibración</Text>
            <Text style={e.ajusteDetalle}>
              El toque al deslizar una tarjeta y al recibir un golpe en la pelea.
            </Text>
          </View>
          <Switch
            value={prefs.vibracion}
            onValueChange={(v) => Preferencias.cambiar('vibracion', v)}
            trackColor={{ false: colores.linea, true: colores.rojo }}
            thumbColor="#fff"
            accessibilityLabel="Vibración"
          />
        </View>

        <Pressable onPress={() => ir('terminos')} style={e.fila} hitSlop={6}>
          <View style={e.filaTexto}>
            <Text style={e.ajusteNombre}>Términos y privacidad</Text>
            <Text style={e.ajusteDetalle}>Qué datos guarda la app y para qué.</Text>
          </View>
          <Text style={e.flecha}>›</Text>
        </Pressable>
      </View>

      <Text style={e.pie}>{nombre} · versión {version}</Text>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  titulo: { fontSize: 17, fontWeight: '700', color: colores.tinta },
  cuenta: {
    flexDirection: 'row', alignItems: 'center', gap: espacio.m,
    backgroundColor: colores.fondo, borderRadius: radios.medio,
    borderWidth: 1, borderColor: colores.linea,
    padding: espacio.m,
  },
  cuentaTexto: { flex: 1, gap: 2 },
  cuentaNombre: { fontSize: 16.5, fontWeight: '800', color: colores.tinta },
  cuentaCorreo: { ...texto.pista, fontSize: 12.5 },
  cuentaEnlace: { fontSize: 12.5, fontWeight: '700', color: colores.azul, marginTop: 2 },
  flecha: { fontSize: 22, color: colores.tinta3 },
  cuerpo: { flex: 1, gap: espacio.s },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: espacio.m,
    backgroundColor: colores.fondo, borderRadius: radios.medio,
    borderWidth: 1, borderColor: colores.linea,
    padding: espacio.m,
  },
  filaTexto: { flex: 1, gap: 3 },
  ajusteNombre: { fontSize: 15.5, fontWeight: '700', color: colores.tinta },
  ajusteDetalle: { ...texto.pista, lineHeight: 17 },
  pie: { ...texto.pista, textAlign: 'center' },
});
