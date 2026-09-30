import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pantalla } from '../componentes/Pantalla';
import { Boton } from '../componentes/Boton';
import { BannerAnuncio, ALTO_BANNER } from '../componentes/BannerAnuncio';
import { BotonRecompensa } from '../componentes/BotonRecompensa';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import type { OpcionClasificada } from '../logica/sala';
import { ponerActivo } from '../logica/relevo';
import { mostrarIntersticial } from '../logica/anuncios';
import { colores, radios, degradados, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

export function Resultados({ ir }: { ir: Ir }) {
  const sala = useSala();
  const [altoBanner, setAltoBanner] = useState(ALTO_BANNER);

  // Al terminar la ronda de match: intersticial (no-op si el usuario es Pro)
  useEffect(() => { mostrarIntersticial(); }, []);

  if (!sala) return null;
  const { matches, casi, descartadas } = Sala.calcularResultados();

  const veredicto = matches.length === 1
    ? { etiqueta: 'Ya está decidido', emoji: matches[0].emoji, titulo: matches[0].titulo,
        sub: 'Es la única opción en la que coincidieron. No le den más vueltas.' }
    : matches.length > 1
    ? { etiqueta: `${matches.length} coincidencias`, emoji: '🎉', titulo: 'Tienen varias opciones',
        sub: `A los dos les gustaron ${matches.length}. Si no se deciden, peleen por ellas.` }
    : { etiqueta: 'Sin acuerdo', emoji: '😅', titulo: 'No hubo match esta vez',
        sub: casi.length > 0
          ? 'Ninguna les gustó a los dos, pero algunas convencieron a uno.'
          : 'Ninguna de las 5 les convenció.' };

  const reto = matches.length > 1
    ? `Hicieron match en ${matches.length} opciones. ¿No se deciden?`
    : matches.length === 1 ? '¿Alguno no está del todo convencido?'
    : 'No hubo match. ¿Y si lo resuelven a la mala?';

  return (
    <Pantalla>
      <Text style={e.tituloPantalla}>Resultados</Text>
      {/* Todo va dentro del scroll: si los botones se quedan fijos abajo, la lista
          de opciones se aplasta y las tarjetas salen cortadas por la mitad. */}
      <ScrollView contentContainerStyle={e.cuerpo}>
        <LinearGradient colors={degradados.veredicto as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={e.veredicto}>
          <Text style={e.veredictoEtiqueta}>{veredicto.etiqueta.toUpperCase()}</Text>
          <Text style={e.veredictoEmoji}>{veredicto.emoji}</Text>
          <Text style={e.veredictoTitulo}>{veredicto.titulo}</Text>
          <Text style={e.veredictoSub}>{veredicto.sub}</Text>
        </LinearGradient>

        {/* Justo bajo la decisión, que es cuando apetece discutirla */}
        <View style={e.reto}>
          <Text style={e.retoTexto}>{reto}</Text>
          <Boton variante="pelea" onPress={() => {
            ponerActivo('p1');
            Sala.irAApostar();
            ir('apuesta');
          }}>⚔️  Peleen por el mejor plan</Boton>
        </View>

        {matches.length > 0 && <Seccion titulo="Match ✨" opciones={matches} sala={sala} />}
        {casi.length > 0 && <Seccion titulo="Casi — solo a uno le gustó" opciones={casi} sala={sala} />}
        {descartadas.length > 0 && (
          <Seccion titulo={`Descartadas (${descartadas.length})`} opciones={descartadas} sala={sala} />
        )}

        <BotonRecompensa />
        <Boton variante="fantasma" onPress={() => { Sala.reset(); ir('inicio'); }}>
          Nueva decisión
        </Boton>

        {/* Hueco del alto real del banner: como va superpuesto, sin esto taparía
            el último botón al bajar del todo. Se mide en vez de fijarlo porque
            depende del ancho del teléfono y de la barra de gestos. */}
        <View style={{ height: altoBanner + espacio.s }} />
      </ScrollView>

      <BannerAnuncio
        onQuitar={() => ir('paywall', { volver: 'resultados' })}
        onAlto={setAltoBanner}
      />
    </Pantalla>
  );
}

function Seccion({ titulo, opciones, sala }:
  { titulo: string; opciones: OpcionClasificada[]; sala: NonNullable<ReturnType<typeof Sala.obtenerSala>> }) {
  const [a, b] = sala.participantes;
  return (
    <View style={e.seccion}>
      <Text style={e.seccionTitulo}>{titulo.toUpperCase()}</Text>
      {opciones.map((op) => (
        <View key={op.id} style={[e.item,
          op.tipo === 'match' && e.itemMatch,
          op.tipo === 'descartada' && e.itemDescartada]}>
          <Text style={e.itemEmoji}>{op.emoji}</Text>
          <View style={e.itemTexto}>
            <Text style={[e.itemTitulo, op.tipo === 'descartada' && e.tachado]}>{op.titulo}</Text>
            <Text style={[e.itemMeta, op.tipo === 'match' && e.itemMetaMatch]}>
              {op.tipo === 'match' ? '✓ A los dos les gustó'
                : op.tipo === 'casi' ? `Solo a ${op.quienDijoSi}`
                : 'A nadie le convenció'}
            </Text>
          </View>
          <View style={e.votos}>
            {[a, b].filter(Boolean).map((p) => (
              <View key={p.id} style={[e.voto, { backgroundColor: p.votos[op.id] ? colores.si : colores.no }]}>
                <Text style={e.votoLetra}>{p.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const e = StyleSheet.create({
  tituloPantalla: { fontSize: 17, fontWeight: '700', color: colores.tinta },
  cuerpo: { gap: espacio.m, paddingBottom: espacio.m },
  veredicto: {
    borderRadius: radios.medio, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: colores.linea,
  },
  veredictoEtiqueta: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: colores.rojo },
  veredictoEmoji: { fontSize: 44, marginVertical: 4 },
  veredictoTitulo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colores.tinta, textAlign: 'center' },
  veredictoSub: { fontSize: 13.5, color: colores.tinta2, textAlign: 'center', marginTop: 5, lineHeight: 19 },
  seccion: { gap: 8 },
  seccionTitulo: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.7, color: colores.tinta3 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colores.linea, borderRadius: 15,
    padding: 13, backgroundColor: colores.fondo,
  },
  itemMatch: { borderColor: colores.si, backgroundColor: colores.siSuave },
  itemDescartada: { opacity: 0.55 },
  itemEmoji: { fontSize: 26 },
  itemTexto: { flex: 1, gap: 2 },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: colores.tinta },
  tachado: { textDecorationLine: 'line-through' },
  itemMeta: { fontSize: 12.5, color: colores.tinta3 },
  itemMetaMatch: { color: '#0f7a45', fontWeight: '600' },
  votos: { flexDirection: 'row', gap: 5 },
  voto: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  votoLetra: { fontSize: 11, fontWeight: '700', color: '#fff' },
  reto: {
    backgroundColor: colores.azulSuave, borderWidth: 1, borderColor: colores.azulBorde,
    borderRadius: radios.medio, padding: espacio.m, gap: 11,
  },
  retoTexto: { fontSize: 14, color: colores.tinta2, textAlign: 'center', lineHeight: 20 },
});
