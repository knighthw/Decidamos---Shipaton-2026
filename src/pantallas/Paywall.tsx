import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import { obtenerPaquetes, comprar, restaurar } from '../logica/compras';
import { useEsPro } from '../logica/useMonetizacion';
import { colores, radios, sombras, degradados, espacio } from '../tema';
import type { Ir, NombrePantalla } from '../navegacion';

const VENTAJAS = [
  { emoji: '🚫', texto: 'Sin anuncios, nunca más' },
  { emoji: '🎲', texto: 'Opciones ilimitadas por dilema' },
  { emoji: '⚔️', texto: 'Todos los personajes de pelea' },
  { emoji: '📊', texto: 'Historial de decisiones' },
];

export function Paywall({ ir, volver = 'inicio' }: { ir: Ir; volver?: NombrePantalla }) {
  const { esPro } = useEsPro();
  const PAQUETES = obtenerPaquetes();
  const [elegido, setElegido] = useState(PAQUETES[0].id);
  const [ocupado, setOcupado] = useState<null | 'comprar' | 'restaurar'>(null);

  const cerrar = () => ir(volver);

  const onComprar = async () => {
    if (ocupado) return;
    setOcupado('comprar');
    const ok = await comprar(elegido);
    setOcupado(null);
    if (ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cerrar();
    }
  };

  const onRestaurar = async () => {
    if (ocupado) return;
    setOcupado('restaurar');
    const ok = await restaurar();
    setOcupado(null);
    if (ok) cerrar();
  };

  return (
    <Pantalla>
      <Pressable onPress={cerrar} hitSlop={10} style={cerrarBtn.zona}>
        <Text style={cerrarBtn.texto}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={e.cuerpo} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={degradados.duelo as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={e.corona}>
          <Text style={e.coronaEmoji}>✨</Text>
        </LinearGradient>

        <Text style={e.titulo}>Decidamos Pro</Text>
        <Text style={e.sub}>
          {esPro ? 'Ya tienes Pro. ¡Gracias!' : 'Decidan sin límites y sin anuncios.'}
        </Text>

        <View style={e.ventajas}>
          {VENTAJAS.map((v) => (
            <View key={v.texto} style={e.ventaja}>
              <Text style={e.ventajaEmoji}>{v.emoji}</Text>
              <Text style={e.ventajaTexto}>{v.texto}</Text>
            </View>
          ))}
        </View>

        {!esPro && (
          <View style={e.paquetes}>
            {PAQUETES.map((p) => {
              const activo = p.id === elegido;
              return (
                <Pressable key={p.id} onPress={() => setElegido(p.id)}
                  style={[e.paquete, activo && e.paqueteActivo]}>
                  <View style={e.radio}>
                    {activo && <View style={e.radioPunto} />}
                  </View>
                  <View style={e.paqueteInfo}>
                    <Text style={e.paqueteTitulo}>{p.titulo}</Text>
                  </View>
                  <View style={e.paquetePrecioCol}>
                    <Text style={e.paquetePrecio}>{p.precio}</Text>
                    <Text style={e.paquetePeriodo}>{p.periodo}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {esPro ? (
        <Boton onPress={cerrar}>Volver</Boton>
      ) : (
        <View style={e.pie}>
          <Boton onPress={onComprar} deshabilitado={ocupado != null}>
            {ocupado === 'comprar' ? 'Procesando…' : 'Empezar'}
          </Boton>
          <Pressable onPress={onRestaurar} hitSlop={8} style={e.restaurar}>
            {ocupado === 'restaurar'
              ? <ActivityIndicator size="small" color={colores.tinta3} />
              : <Text style={e.restaurarTexto}>Restaurar compras</Text>}
          </Pressable>
          <Text style={e.legal}>
            Pago único: se cobra una sola vez en tu cuenta de la tienda. No hay
            renovaciones ni cargos recurrentes.
          </Text>
        </View>
      )}
    </Pantalla>
  );
}

const cerrarBtn = StyleSheet.create({
  zona: { alignSelf: 'flex-end', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: 20, color: colores.tinta3, fontWeight: '700' },
});

const e = StyleSheet.create({
  cuerpo: { alignItems: 'center', gap: espacio.s, paddingBottom: espacio.m },
  corona: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center', ...sombras.tarjeta,
  },
  coronaEmoji: { fontSize: 36 },
  titulo: { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, color: colores.tinta, marginTop: 4 },
  sub: { fontSize: 14.5, color: colores.tinta2, textAlign: 'center' },

  ventajas: { alignSelf: 'stretch', gap: 10, marginTop: espacio.m, marginBottom: espacio.s },
  ventaja: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ventajaEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  ventajaTexto: { fontSize: 15, color: colores.tinta, fontWeight: '600', flex: 1 },

  paquetes: { alignSelf: 'stretch', gap: 10, marginTop: espacio.s },
  paquete: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colores.fondo,
    borderWidth: 1.5, borderColor: colores.linea, borderRadius: radios.medio,
    padding: 15,
  },
  paqueteActivo: { borderColor: colores.rojo, backgroundColor: '#fff6f4' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colores.rojo,
    alignItems: 'center', justifyContent: 'center',
  },
  radioPunto: { width: 11, height: 11, borderRadius: 6, backgroundColor: colores.rojo },
  paqueteInfo: { flex: 1, gap: 2 },
  paqueteTitulo: { fontSize: 16, fontWeight: '700', color: colores.tinta },
  paquetePrecioCol: { alignItems: 'flex-end' },
  paquetePrecio: { fontSize: 16, fontWeight: '800', color: colores.tinta },
  paquetePeriodo: { fontSize: 11.5, color: colores.tinta3 },

  pie: { gap: 10 },
  restaurar: { alignSelf: 'center', paddingVertical: 4, minHeight: 22, justifyContent: 'center' },
  restaurarTexto: { fontSize: 13.5, fontWeight: '700', color: colores.tinta2 },
  legal: { fontSize: 10.5, color: colores.tinta3, textAlign: 'center', lineHeight: 15 },
});
