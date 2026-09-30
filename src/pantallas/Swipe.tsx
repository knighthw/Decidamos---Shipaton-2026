import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Avatar } from '../componentes/Avatar';
import { Mazo, type MazoHandle } from '../componentes/Mazo';
import * as Sala from '../logica/sala';
import { useSala } from '../logica/useSala';
import { jugadorActivo, ponerActivo, ponerRelevo } from '../logica/relevo';
import { colores, radios, sombras, espacio } from '../tema';
import type { Ir } from '../navegacion';

export function Swipe({ ir }: { ir: Ir }) {
  const sala = useSala();
  const [indice, setIndice] = useState(0);
  const [esperando, setEsperando] = useState(false);
  const mazo = useRef<MazoHandle>(null);

  /* Remoto: cuando el otro termina sus 5 mientras yo esperaba, el estado llega
     por Realtime y hay que saltar a resultados sin que nadie toque nada. */
  useEffect(() => {
    if (sala && sala.estado === 'terminada') ir('resultados');
  }, [sala?.estado]);

  if (!sala) return null;

  const quien = Sala.esLocal()
    ? sala.participantes.find((p) => p.id === jugadorActivo())!
    : Sala.participanteActual();
  const total = sala.opciones.length;

  const votar = useCallback((leGusta: boolean) => {
    const opcion = sala.opciones[indice];
    if (!opcion) return;
    Sala.registrarVoto(quien.id, opcion.id, leGusta);

    const siguiente = indice + 1;
    if (siguiente < total) { setIndice(siguiente); return; }

    // Terminó su ronda de 5
    const estado = Sala.avanzarTurno();
    setIndice(0);

    if (estado === 'terminado') { ir('resultados'); return; }
    if (estado === 'esperar') {
      // Remoto: no hay a quién pasarle el celular, solo queda esperar al otro
      // (el effect de arriba avisa apenas termine).
      setEsperando(true);
      return;
    }
    const siguienteJugador = Sala.participanteActual();
    ponerActivo(siguienteJugador.id);
    ponerRelevo({
      aQuien: siguienteJugador.id, nombre: siguienteJugador.nombre,
      texto: 'Te toca revisar las mismas 5 opciones.', destino: 'swipe',
    });
    ir('relevo');
  }, [indice, quien, sala, total, ir]);

  if (esperando) {
    return (
      <Pantalla>
        <View style={e.esperando}>
          <Text style={e.esperandoTexto}>Ya votaste las 5. Esperando al otro…</Text>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <View style={e.cabecera}>
        <View style={e.turno}>
          <Avatar nombre={quien.nombre} segundo={quien.id === 'p2'} />
          <Text style={e.turnoNombre}>Turno de {quien.nombre}</Text>
        </View>
        <View style={e.contadorPill}>
          <Text style={e.contador}>{Math.min(indice + 1, total)} / {total}</Text>
        </View>
      </View>

      <View style={e.segmentos}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              e.seg,
              i < indice && e.segHecho,
              i === indice && e.segActual,
            ]}
          />
        ))}
      </View>

      <Mazo ref={mazo} opciones={sala.opciones} indice={indice} onVotar={votar} />

      <View style={e.acciones}>
        <Pressable
          onPress={() => mazo.current?.lanzar(false)}
          style={({ pressed }) => [e.redondo, e.redondoNo, pressed && e.pulsado]}
        >
          <Text style={[e.icono, { color: colores.no }]}>✕</Text>
        </Pressable>
        <Pressable
          onPress={() => mazo.current?.lanzar(true)}
          style={({ pressed }) => [e.redondo, e.redondoSi, pressed && e.pulsado]}
        >
          <Text style={[e.icono, { color: colores.si }]}>♥</Text>
        </Pressable>
      </View>

      <View style={e.pista}>
        <Text style={[e.pistaLado, { color: colores.no }]}>← mala idea</Text>
        <Text style={[e.pistaLado, { color: colores.si }]}>buena idea →</Text>
      </View>
    </Pantalla>
  );
}

const e = StyleSheet.create({
  esperando: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.m },
  esperandoTexto: { fontSize: 15, fontWeight: '600', color: colores.tinta2, textAlign: 'center' },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  turno: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  turnoNombre: { fontSize: 15.5, fontWeight: '700', color: colores.tinta },
  contadorPill: {
    backgroundColor: colores.fondo, borderRadius: radios.redondo,
    paddingVertical: 5, paddingHorizontal: 12, ...sombras.suave,
  },
  contador: { fontSize: 12.5, fontWeight: '800', color: colores.tinta2, letterSpacing: 0.3 },

  segmentos: { flexDirection: 'row', gap: 6 },
  seg: {
    flex: 1, height: 5, borderRadius: radios.redondo,
    backgroundColor: colores.fondo2,
  },
  segHecho: { backgroundColor: colores.rojo },
  segActual: { backgroundColor: colores.rojoContraste },

  acciones: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
  redondo: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colores.fondo,
    borderWidth: 2,
  },
  redondoNo: {
    borderColor: colores.noSuave,
    shadowColor: colores.no, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 6,
  },
  redondoSi: {
    borderColor: colores.siSuave,
    shadowColor: colores.si, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 6,
  },
  pulsado: { transform: [{ scale: 0.92 }] },
  icono: { fontSize: 27, fontWeight: '900' },

  pista: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espacio.xs },
  pistaLado: { fontSize: 12.5, fontWeight: '700' },
});
