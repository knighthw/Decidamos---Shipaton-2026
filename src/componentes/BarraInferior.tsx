import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, espacio } from '../tema';
import type { NombrePantalla } from '../navegacion';

/* Alto de la barra sin contar el margen del sistema. Lo usa Pantalla.tsx para
   reservar sitio y que la barra no tape el último botón. */
export const ALTO_BARRA = 62;

type Pestana = {
  id: NombrePantalla;
  icono: string;
  etiqueta: string;   // no se ve: es para los lectores de pantalla
};

const PESTANAS: Pestana[] = [
  { id: 'inicio',      icono: '💡', etiqueta: 'Decidir juntos' },
  { id: 'inicioPelea', icono: '⚔️', etiqueta: 'Pelear por una decisión' },
  { id: 'ajustes',     icono: '⚙️', etiqueta: 'Configuración' },
];

/* Sin texto bajo los iconos, así que la pestaña activa tiene que notarse:
   se le pone fondo, el icono a tamaño completo y una marca encima. */
export function BarraInferior({ activa, ir }:
  { activa: NombrePantalla; ir: (p: NombrePantalla) => void }) {
  const bordes = useSafeAreaInsets();

  return (
    <View style={[e.base, { paddingBottom: Math.max(bordes.bottom, 8) }]}>
      {PESTANAS.map((p) => {
        const esActiva = p.id === activa;
        return (
          <Pressable
            key={p.id}
            onPress={() => ir(p.id)}
            accessibilityRole="tab"
            accessibilityLabel={p.etiqueta}
            accessibilityState={{ selected: esActiva }}
            style={({ pressed }) => [e.pestana, pressed && e.pulsada]}
          >
            <View style={[e.hueco, esActiva && e.huecoActivo]}>
              <Text style={[e.icono, !esActiva && e.iconoApagado]}>{p.icono}</Text>
            </View>
            <View style={[e.marca, esActiva && e.marcaActiva]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const e = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 8,
    backgroundColor: colores.fondo,
    borderTopWidth: 1,
    borderTopColor: colores.linea,
  },
  pestana: { alignItems: 'center', gap: 5, paddingHorizontal: espacio.l, minHeight: 46 },
  pulsada: { opacity: 0.6 },
  hueco: {
    width: 46, height: 34,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 999,
  },
  huecoActivo: { backgroundColor: colores.fondo2 },
  icono: { fontSize: 23 },
  iconoApagado: { opacity: 0.4 },
  marca: { width: 18, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  marcaActiva: { backgroundColor: colores.rojo },
});
