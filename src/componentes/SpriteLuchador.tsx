import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { animacionesDe, accionDe, MS_DESCANSO } from '../logica/sprites';

/* La habilidad que acaba de usar, con un contador. Un contador y no solo el id: así
   dos rondas seguidas con la misma habilidad se distinguen y se animan las dos. */
export type Jugada = { n: number; habilidad: string | null };

type Props = {
  personaje: string;
  emoji: string;
  /* Alto del hueco; el ancho sale de la proporción del dibujo */
  alto: number;
  jugada?: Jugada;
  /* El de arriba se espeja para que los dos se miren */
  espejado?: boolean;
};

/* Qué se ve y en qué frame, en un solo estado a propósito. Con dos estados separados
   se cruzaban: al pasar de descanso (4 frames) a una acción de 2, el intervalo viejo
   llegaba a escribir un frame 3 que no existe, no se dibujaba ninguna imagen y el
   animal desaparecía justo al golpear. `habilidad` null es estar respirando. */
type Pose = { habilidad: string | null; frame: number };

export function SpriteLuchador({ personaje, emoji, alto, jugada, espejado }: Props) {
  const anim = animacionesDe(personaje);
  const [pose, setPose] = useState<Pose>({ habilidad: null, frame: 0 });
  const accion = pose.habilidad ? accionDe(personaje, pose.habilidad) : null;

  /* Una jugada nueva: se anima si tiene dibujo y se vuelve sola a descanso. Sin
     animación para esa habilidad, se queda respirando: es preferible a que el animal
     desaparezca por no haber ningún frame que pintar. */
  useEffect(() => {
    if (!jugada?.habilidad || jugada.n === 0) return;
    const nueva = accionDe(personaje, jugada.habilidad);
    if (!nueva) return;
    setPose({ habilidad: jugada.habilidad, frame: 0 });
    const fin = setTimeout(
      () => setPose({ habilidad: null, frame: 0 }),
      nueva.ms * (nueva.cuadros.length - 1) + nueva.sostener,
    );
    return () => clearTimeout(fin);
  }, [jugada?.n]);

  /* El paso de frames, tanto respirando como en una acción */
  useEffect(() => {
    if (!anim) return;
    const cuadros = accion ? accion.cuadros : anim.descanso;
    if (cuadros.length < 2) return;
    const t = setInterval(() => {
      setPose((p) => ({
        habilidad: p.habilidad,
        // La acción no da la vuelta: llega al último frame y ahí se queda
        frame: p.habilidad ? Math.min(p.frame + 1, cuadros.length - 1) : (p.frame + 1) % cuadros.length,
      }));
    }, accion ? accion.ms : MS_DESCANSO);
    return () => clearInterval(t);
  }, [pose.habilidad, anim]);

  /* Sin arte todavía: el emoji ocupa el mismo hueco */
  if (!anim) {
    return (
      <View style={[e.hueco, { height: alto, width: alto }]}>
        <Text style={{ fontSize: alto * 0.62 }}>{emoji}</Text>
      </View>
    );
  }

  const cuadros = accion ? accion.cuadros : anim.descanso;
  const visible = Math.min(pose.frame, cuadros.length - 1);
  /* Todo lo que no se está viendo, precargado e invisible, para que la primera
     acción de la pelea no llegue en blanco */
  const otros = [
    ...(accion ? anim.descanso : []),
    ...[anim.jab, ...Object.values(anim.poses ?? {})]
      .filter((a) => a && a !== accion)
      .flatMap((a) => a!.cuadros),
  ];

  const altoDibujo = alto * anim.altoRelativo;
  const ancho = altoDibujo * anim.proporcion;
  /* El lienzo reserva sitio para el puño extendido. Ese aire se descuenta con un
     margen negativo, así el puño sigue cabiendo al golpear pero la barra de vida
     queda pegada al animal. Del lado espejado, el aire cae a la izquierda. */
  const aire = altoDibujo * (anim.proporcion - anim.proporcionReposo);
  const pegar = espejado ? { marginLeft: -aire } : { marginRight: -aire };

  return (
    <View style={[e.hueco, { height: alto, width: ancho }, pegar]}>
      {/* Los animales bajos no ocupan todo el alto: apoyados en el suelo del hueco */}
      <View style={{ height: altoDibujo, width: ancho }}>
        {/* Todos los frames montados a la vez y solo uno visible: cambiar el `source`
            de una sola Image parpadea la primera vez que toca cargar cada archivo. */}
        {cuadros.map((fuente, i) => (
          <Image
            key={`${pose.habilidad ?? 'descanso'}-${i}`}
            source={fuente}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              e.sprite,
              { opacity: i === visible ? 1 : 0 },
              espejado && { transform: [{ scaleX: -1 }] },
            ]}
          />
        ))}
      </View>
      {otros.map((fuente, i) => (
        <Image key={`pre-${i}`} source={fuente} style={e.precarga} fadeDuration={0} />
      ))}
    </View>
  );
}

const e = StyleSheet.create({
  hueco: { alignItems: 'center', justifyContent: 'flex-end' },
  sprite: { position: 'absolute', width: '100%', height: '100%' },
  precarga: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
