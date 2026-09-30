import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated';
import { vibrarGolpe } from '../logica/vibrar';
import { Pantalla } from '../componentes/Pantalla';
import { BarraVida } from '../componentes/BarraVida';
import * as Sala from '../logica/sala';
import * as Battle from '../logica/battle';
import { useSala } from '../logica/useSala';
import { buscarPersonaje } from '../logica/personajes';
import { SpriteLuchador, type Jugada } from '../componentes/SpriteLuchador';
import { jugadorActivo, ponerActivo, ponerRelevo } from '../logica/relevo';
import type { IdJugador } from '../logica/battle';
import { colores, radios, espacio } from '../tema';
import type { Ir } from '../navegacion';

/* Alto de cada luchador. El de abajo es mayor: está "más cerca". */
const ALTO_RIVAL = 132;
const ALTO_MIO = 218;

/* Dónde cae el bloque de vida respecto al alto del animal. Medido sobre la
   referencia: la del rival a media altura del pecho, la tuya sobre las piernas. */
const VIDA_RIVAL = 0.41;
const VIDA_MIA = 0.55;
const MEDIO_BLOQUE = 28;   // la mitad del alto del nombre + barra + números

/* Hasta qué ronda ha visto ya cada jugador el resultado. Vive fuera del componente
   a propósito: en un solo celular la arena se desmonta en cada relevo, y un contador
   dentro volvía a cero y repetía la ronda anterior (animaciones, sacudidas y
   vibración) a quien ya la había visto, como si acabara de jugar otra vez. */
const vistas = { semilla: -1, p1: 1, p2: 1 };

export function Arena({ ir }: { ir: Ir }) {
  const sala = useSala();
  const estado = Sala.estadoPelea();
  const sacudirRival = useSharedValue(0);
  const sacudirYo = useSharedValue(0);
  /* Qué habilidad usó cada uno en la última ronda, con un contador que sube al
     resolverse: el sprite lo usa como disparo y elige la animación (jab, bloqueo…). */
  const [jugadas, setJugadas] = useState<Record<IdJugador, Jugada>>({
    p1: { n: 0, habilidad: null }, p2: { n: 0, habilidad: null },
  });
  /* Mientras se ve el resultado de la ronda no se puede jugar. Si no, tocando
     rápido se colaba una jugada de la ronda siguiente con el turno equivocado:
     al resolver, el motor limpia las jugadas y los botones se reactivaban solos. */
  const [pausa, setPausa] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El temporizador no puede sobrevivir a la pantalla: si no, vuelve a mandar
  // a relevo cuando el turno ya ha seguido su curso y descuadra la partida.
  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  const yo: IdJugador = Sala.esLocal() ? jugadorActivo() : Sala.obtenerMisIds()[0];
  const rival: IdJugador = yo === 'p1' ? 'p2' : 'p1';

  /* Una pelea nueva (o una revancha) empieza sin nada visto */
  if (estado && (vistas.semilla !== estado.semilla || estado.ronda < vistas[yo])) {
    Object.assign(vistas, { semilla: estado.semilla, p1: 1, p2: 1 });
  }
  /* El resultado de la última ronda es nuevo para quien tiene el celular si no lo vio
     ya: el primero en jugar se lo encuentra al volver, el segundo lo vio al jugar. */
  const rondaNueva = !!estado && estado.ronda > vistas[yo];

  // Animar la ronda y sacudir a quien recibió el golpe, una sola vez por jugador
  useEffect(() => {
    if (!estado || estado.ronda <= vistas[yo]) return;
    vistas[yo] = estado.ronda;

    /* Se mira la jugada y no los eventos: si el rival esquiva no hay evento de daño,
       y el atacante tiene que lanzar el golpe igual. */
    const ultimas = estado.ultimasJugadas ?? {};
    setJugadas((antes) => {
      const nuevas = { ...antes };
      (['p1', 'p2'] as IdJugador[]).forEach((id) => {
        nuevas[id] = { n: antes[id].n + 1, habilidad: ultimas[id] ?? null };
      });
      return nuevas;
    });

    estado.eventos.filter((ev) => ev.tipo === 'dano' && (ev.cantidad ?? 0) > 0).forEach((ev) => {
      const objetivo = ev.quien === yo ? sacudirYo : sacudirRival;
      objetivo.value = withSequence(
        withTiming(-9, { duration: 70 }), withTiming(7, { duration: 70 }),
        withTiming(-4, { duration: 70 }), withTiming(0, { duration: 70 }));
      if (ev.quien === yo) vibrarGolpe();
    });
  }, [estado?.ronda]);

  /* Red de seguridad. Si el que tiene el celular ya jugó y el otro no, el turno se
     quedó a medias y la pantalla se quedaría en "Esperando al rival…" para siempre,
     porque en un solo celular no hay nadie más que pueda jugar. Se repone el relevo. */
  useEffect(() => {
    if (!estado || !Sala.esLocal() || estado.terminada || pausa) return;
    if (!Battle.yaJugo(estado, yo) || Battle.yaJugo(estado, rival)) return;

    const otro = sala?.participantes.find((p) => p.id === rival);
    if (!otro) return;
    ponerActivo(rival);
    ponerRelevo({ aQuien: rival, nombre: otro.nombre, texto: 'Elige tu habilidad.', destino: 'pelea' });
    ir('relevo');
  }, [estado?.ronda, estado?.jugadores[yo].jugada, pausa]);

  // Al caer el último golpe, el veredicto
  useEffect(() => {
    if (estado?.terminada && Sala.resultadoPelea()) {
      const t = setTimeout(() => ir('veredicto'), 900);
      return () => clearTimeout(t);
    }
  }, [estado?.terminada]);

  const estiloRival = useAnimatedStyle(() => ({ transform: [{ translateX: sacudirRival.value }] }));
  const estiloYo = useAnimatedStyle(() => ({ transform: [{ translateX: sacudirYo.value }] }));

  if (!sala || !estado) return null;

  const yaJugue = Battle.yaJugo(estado, yo);
  const bloqueado = estado.terminada || yaJugue || pausa;

  function jugar(idHabilidad: string) {
    const rondaAntes = estado!.ronda;
    Sala.jugar(yo, idHabilidad);
    if (!Sala.esLocal()) return;

    const despues = Sala.estadoPelea()!;
    /* Si la ronda avanzó (o la pelea acabó) es que se resolvió con esta jugada.
       No sirve mirar si el rival "ya jugó": al resolver, el motor limpia las dos
       jugadas, así que parecía que el rival no había jugado todavía y se pasaba
       el celular al instante, sin dejar ver el golpe ni las vidas bajando. */
    const seResolvio = despues.ronda !== rondaAntes || despues.terminada;

    // ¿Falta el otro? Se le pasa el celular para que elija sin que nadie vea
    if (!seResolvio) {
      const otro = sala!.participantes.find((p) => p.id === rival)!;
      ponerActivo(rival);
      ponerRelevo({ aQuien: rival, nombre: otro.nombre, texto: 'Elige tu habilidad.', destino: 'pelea' });
      ir('relevo');
      return;
    }
    if (despues.terminada) return;   // el veredicto llega solo

    // Ronda resuelta: se ve el golpe, sin poder tocar nada, y vuelve al primero
    setPausa(true);
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      const primero = sala!.participantes.find((p) => p.id === 'p1')!;
      ponerActivo('p1');
      ponerRelevo({ aQuien: 'p1', nombre: primero.nombre, texto: 'Ronda resuelta. Sigue la pelea.', destino: 'pelea' });
      ir('relevo');
    }, 1500);
  }

  const ultimos = estado.eventos
    .filter((ev) => ['dano', 'curar', 'esquivar', 'dano-veneno', 'veneno', 'stage-baja',
                     'stage-sube', 'reflejo', 'pua', 'aguante', 'caido', 'limpiar', 'tope'].includes(ev.tipo))
    .slice(-3);

  return (
    <Pantalla fondo="arena">
      <View style={e.marcador}>
        <View style={e.ronda}><Text style={e.rondaTexto}>RONDA {estado.ronda}</Text></View>
        <Text style={e.apuestas} numberOfLines={2}>
          {sala.apuestas[yo]} <Text style={e.vs}>vs</Text> {sala.apuestas[rival]}
        </Text>
      </View>

      {/* En diagonal, como un juego de peleas por turnos: el rival arriba a la
          derecha y algo más pequeño, el tuyo abajo a la izquierda y más grande. */}
      <View style={e.arena}>
        <Animated.View style={[e.fila, estiloRival]}>
          <Vida estado={estado} id={rival} sala={sala}
            altura={ALTO_RIVAL * VIDA_RIVAL - MEDIO_BLOQUE} />
          <SpriteLuchador
            personaje={estado.jugadores[rival].personaje}
            emoji={buscarPersonaje(estado.jugadores[rival].personaje)!.emoji}
            alto={ALTO_RIVAL}
            jugada={jugadas[rival]}
            espejado
          />
        </Animated.View>

        <View style={e.log}>
          {/* Lo que ya viste se rotula como pasado, para no leerlo como una jugada nueva */}
          {ultimos.length > 0 && !rondaNueva && !estado.terminada && (
            <Text style={e.logTitulo}>RONDA ANTERIOR</Text>
          )}
          {ultimos.length > 0
            ? ultimos.map((ev, i) => (
                <Text key={i} style={[e.logLinea, ev.critico && e.logCritico]}>{ev.texto}</Text>
              ))
            : <Text style={e.logLinea}>¡Que empiece la pelea!</Text>}
        </View>

        <Animated.View style={[e.fila, estiloYo]}>
          <SpriteLuchador
            personaje={estado.jugadores[yo].personaje}
            emoji={buscarPersonaje(estado.jugadores[yo].personaje)!.emoji}
            alto={ALTO_MIO}
            jugada={jugadas[yo]}
          />
          <Vida estado={estado} id={yo} sala={sala}
            altura={ALTO_MIO * VIDA_MIA - MEDIO_BLOQUE} />
        </Animated.View>
      </View>

      {bloqueado ? (
        <Text style={e.esperando}>
          {estado.terminada ? '¡Se acabó!' : pausa ? '…' : 'Esperando al rival…'}
        </Text>
      ) : (
        <View style={e.habilidades}>
          {Battle.habilidades(estado, yo).map((h) => (
            <Pressable key={h.id} disabled={!h.disponible} onPress={() => jugar(h.id)}
              style={({ pressed }) => [e.habilidad, !h.disponible && e.habilidadApagada,
                                       pressed && h.disponible && e.habilidadPulsada]}>
              <Text style={e.habEmoji}>{h.emoji}</Text>
              <View style={e.habDatos}>
                <Text style={e.habNombre} numberOfLines={1}>{h.nombre}</Text>
                <Text style={e.habInfo}>{textoHabilidad(h)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Pantalla>
  );
}

function textoHabilidad(h: Battle.HabilidadDisponible): string {
  if (!h.disponible) return `espera ${h.espera}`;
  if (h.dano > 0) return `poder ${h.dano}`;
  if (h.curar) return `cura ${h.curar}`;
  if (h.subeAtaque) return 'sube tu ataque';
  return 'apoyo';
}

/* Barra de vida suelta, sin panel: lo que identifica a cada jugador es su color
   en el nombre. Rojo quien creó la sala, azul quien entró. */
function Vida({ estado, id, sala, altura }: {
  estado: Battle.EstadoPelea; id: IdJugador;
  sala: NonNullable<ReturnType<typeof Sala.obtenerSala>>;
  /* Píxeles desde arriba del animal, para que quede a su altura y no a sus pies */
  altura: number;
}) {
  const luchador = estado.jugadores[id];
  const p = buscarPersonaje(luchador.personaje)!;
  const participante = sala.participantes.find((x) => x.id === id);
  const suyo = id === 'p1' ? colores.rojo : colores.azul;

  const estados: string[] = [];
  if (luchador.veneno) estados.push(`🧪 ${luchador.veneno.rondas}`);
  if (luchador.stageAtk > 0) estados.push(`⬆️ Atk +${luchador.stageAtk}`);
  if (luchador.stageAtk < 0) estados.push(`⬇️ Atk ${luchador.stageAtk}`);
  if (luchador.pasivaUsada && p.pasiva === 'aguante') estados.push('💪 Aguante');

  return (
    <View style={[e.vida, { marginTop: altura }]}>
      <View style={e.vidaNombre}>
        <Text style={e.vidaPersonaje}>{p.nombre}</Text>
        <Text style={[e.vidaJugador, { color: suyo }]} numberOfLines={1}>
          {(participante?.nombre ?? '').toUpperCase()}
        </Text>
      </View>
      <BarraVida vida={luchador.vida} vidaMax={luchador.vidaMax} />
      <Text style={e.vidaNumero}>{luchador.vida} / {luchador.vidaMax}</Text>
      {estados.length > 0 && (
        <View style={e.estados}>
          {estados.map((t) => (
            <View key={t} style={e.chip}><Text style={e.chipTexto}>{t}</Text></View>
          ))}
        </View>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  marcador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ronda: { backgroundColor: 'rgba(255,255,255,.16)', borderRadius: radios.redondo, paddingVertical: 5, paddingHorizontal: 12 },
  rondaTexto: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#fff' },
  apuestas: { flex: 1, fontSize: 11.5, color: 'rgba(255,255,255,.7)', textAlign: 'right' },
  vs: { opacity: 0.5 },
  arena: { flex: 1, justifyContent: 'space-between', paddingVertical: espacio.s },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.xs },
  vida: { flex: 1, gap: 4 },
  vidaNombre: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  vidaPersonaje: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  vidaJugador: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, flexShrink: 1 },
  vidaNumero: {
    fontSize: 11.5, fontWeight: '700', color: 'rgba(255,255,255,.6)',
    fontVariant: ['tabular-nums'],
  },
  estados: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  chip: { backgroundColor: 'rgba(0,0,0,.3)', borderRadius: radios.redondo, paddingVertical: 2, paddingHorizontal: 7 },
  chipTexto: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
  log: {
    minHeight: 52, justifyContent: 'center', gap: 2,
    paddingHorizontal: espacio.s,
  },
  logLinea: {
    fontSize: 13, lineHeight: 18, textAlign: 'center',
    color: 'rgba(255,255,255,.55)',
  },
  logTitulo: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1, textAlign: 'center',
    color: 'rgba(255,255,255,.3)', marginBottom: 2,
  },
  logCritico: { color: colores.critico, fontWeight: '700' },
  habilidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habilidad: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: 'rgba(255,255,255,.95)', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12,
  },
  habilidadApagada: { opacity: 0.38 },
  habilidadPulsada: { transform: [{ scale: 0.97 }] },
  habEmoji: { fontSize: 20 },
  habDatos: { flex: 1 },
  habNombre: { fontSize: 12.5, fontWeight: '700', color: colores.tinta },
  habInfo: { fontSize: 10.5, color: colores.tinta3 },
  esperando: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,.85)', paddingVertical: 20 },
});
