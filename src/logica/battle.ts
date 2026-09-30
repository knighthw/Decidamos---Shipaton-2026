/* Motor de combate del modo Pelea.
   Sin DOM: se copia tal cual al portar, igual que personajes.ts.

   Toda la mecánica vive detrás de la interfaz de abajo. Las pantallas nunca calculan
   daño: solo pintan las vidas y la lista de `eventos` que devuelve resolverRonda().

   SISTEMA: simultáneo, estilo Pokémon. Los dos eligen habilidad; cuando ambos eligieron
   se resuelve la ronda. El más rápido golpea primero (el Águila, por su pasiva, siempre
   golpea primero en la ronda 1). Cada animal tiene una pasiva siempre activa.

   FÓRMULA DE DAÑO (adaptada de Pokémon, sin niveles ni tipos):
     dano = poder · (ataqueEf / defensaEf) / K + 2
   donde ataqueEf y defensaEf incluyen los "stages" (-6..+6) acumulados en la pelea.
   Luego: varianza ±7,5 %, crítico (8 %, o 11 % para el Águila) ×1,5, esquive, escudo,
   y las pasivas del que recibe (Coraza, Piel venenosa, Aguante).

   DETERMINISMO: el motor no usa Math.random(). Todo el azar sale de un PRNG sembrado
   con la semilla de la pelea más un contador que vive en el estado. Con la misma
   semilla y las mismas jugadas, dos dispositivos llegan al mismo resultado. */

import { buscarPersonaje, buscarHabilidad, type Habilidad } from './personajes';

export type IdJugador = 'p1' | 'p2';

const K = 1.15;                 // constante de normalización del daño
const TOPE_RONDAS = 40;         // si nadie cae, gana quien esté mejor de vida

export type Luchador = {
  personaje: string;
  vida: number;
  vidaMax: number;
  jugada: string | null;
  recargas: Record<string, number>;
  veneno: { dano: number; rondas: number } | null;
  stageAtk: number;              // nivel de Ataque, -6..+6
  stageDef: number;              // nivel de Defensa, -6..+6
  defensasSeguidas: number;      // cuántas rondas seguidas usó escudo/esquive
  pasivaUsada: boolean;          // para el Aguante del Oso (una vez por pelea)
};

export type Evento = {
  tipo: string;
  quien: IdJugador;
  texto: string;
  cantidad?: number;
  critico?: boolean;
  habilidad?: string;
  atacante?: IdJugador;
};

export type EstadoPelea = {
  semilla: number;
  paso: number;
  ronda: number;
  jugadores: Record<IdJugador, Luchador>;
  eventos: Evento[];
  ganador: IdJugador | null;
  terminada: boolean;
  /* Qué habilidad usó cada uno en la última ronda resuelta. Las jugadas se limpian
     al cerrar la ronda, así que sin esto la interfaz no puede saber quién atacó para
     animarlo: los eventos no bastan, porque si el rival esquiva no se genera evento
     de daño y el atacante se quedaría quieto habiendo atacado. */
  ultimasJugadas?: Partial<Record<IdJugador, string>>;
};

/* Una habilidad más si se puede usar ahora o cuántas rondas le faltan */
export type HabilidadDisponible = Habilidad & { disponible: boolean; espera: number };

type Defensa = { escudo: number; esquivar: number; reflejo: number };

/* ===== Azar reproducible ===== */
function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Consume un número aleatorio y avanza el contador guardado en el estado. */
function azar(estado: EstadoPelea): number {
  estado.paso += 1;
  return mulberry32(estado.semilla + estado.paso * 2654435761)();
}

export function nuevaSemilla(): number {
  return Math.floor(Math.random() * 2147483647);
}

/* ===== Utilidades ===== */
const acotar = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/* Multiplicador de un "stage" de Pokémon: 0 → x1, +2 → x2, -2 → x0.5, ±6 → x4 / x0.25 */
function multEstadio(s: number): number {
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

function esDefensiva(hab: Habilidad | null): boolean {
  return !!hab && ((hab.escudo || 0) > 0 || (hab.esquivar || 0) > 0);
}

/* ===== Creación ===== */
function nuevoLuchador(idPersonaje: string): Luchador {
  const p = buscarPersonaje(idPersonaje)!;
  return {
    personaje: p.id,
    vida: p.vida,
    vidaMax: p.vida,
    jugada: null,
    recargas: {},
    veneno: null,
    stageAtk: 0,
    stageDef: 0,
    defensasSeguidas: 0,
    pasivaUsada: false,
  };
}

export function crear({ personajeA, personajeB, semilla }:
    { personajeA: string; personajeB: string; semilla?: number }): EstadoPelea {
  return {
    semilla: semilla ?? nuevaSemilla(),
    paso: 0,
    ronda: 1,
    jugadores: {
      p1: nuevoLuchador(personajeA),
      p2: nuevoLuchador(personajeB),
    },
    eventos: [],
    ganador: null,
    terminada: false,
  };
}

/* ===== Consultas para la interfaz ===== */

/* Las 4 habilidades del personaje, marcando cuáles se pueden usar ahora. */
export function habilidades(estado: EstadoPelea, idJugador: IdJugador): HabilidadDisponible[] {
  const luchador = estado.jugadores[idJugador];
  const personaje = buscarPersonaje(luchador.personaje)!;
  return personaje.habilidades.map((h) => {
    const espera = luchador.recargas[h.id] || 0;
    return { ...h, disponible: espera === 0, espera };
  });
}

export function yaJugo(estado: EstadoPelea, idJugador: IdJugador): boolean {
  return estado.jugadores[idJugador].jugada !== null;
}

export function rondaLista(estado: EstadoPelea): boolean {
  return yaJugo(estado, 'p1') && yaJugo(estado, 'p2');
}

export function terminada(estado: EstadoPelea): { ganador: IdJugador | null } | false {
  return estado.terminada ? { ganador: estado.ganador } : false;
}

/* ===== Jugadas ===== */
export function registrarJugada(estado: EstadoPelea, idJugador: IdJugador, idHabilidad: string): boolean {
  if (estado.terminada) return false;
  const luchador = estado.jugadores[idJugador];
  if (luchador.jugada) return false;                 // ya eligió esta ronda
  if ((luchador.recargas[idHabilidad] || 0) > 0) return false;
  if (!buscarHabilidad(luchador.personaje, idHabilidad)) return false;
  luchador.jugada = idHabilidad;
  return true;
}

/* ===== Resolución de la ronda ===== */

function evento(eventos: Evento[], tipo: string, quien: IdJugador, texto: string, extra: Partial<Evento> = {}) {
  eventos.push({ tipo, quien, texto, ...extra });
}

/* Prepara defensas y curas, que se aplican antes de los golpes. */
function aplicarPropios(estado: EstadoPelea, idJugador: IdJugador, eventos: Evento[]): Defensa {
  const luchador = estado.jugadores[idJugador];
  const personaje = buscarPersonaje(luchador.personaje)!;
  const hab = buscarHabilidad(luchador.personaje, luchador.jugada!)!;

  if (hab.limpiar && luchador.veneno) {
    luchador.veneno = null;
    evento(eventos, 'limpiar', idJugador, `${personaje.nombre} se quitó el veneno de encima.`);
  }

  if (hab.curar) {
    const antes = luchador.vida;
    luchador.vida = Math.min(luchador.vidaMax, luchador.vida + hab.curar);
    const curado = luchador.vida - antes;
    if (curado > 0) {
      evento(eventos, 'curar', idJugador,
        `${personaje.nombre} recuperó ${curado} de vida.`, { cantidad: curado });
    }
  }

  const decay = Math.pow(1 / 3, luchador.defensasSeguidas);
  return {
    escudo: (hab.escudo || 0) * decay,
    esquivar: (hab.esquivar || 0) * decay,
    reflejo: hab.reflejo || 0,
  };
}

/* Un golpe de `atacante` sobre `defensor`. Devuelve el daño aplicado. */
function golpear(estado: EstadoPelea, atacante: IdJugador, defensor: IdJugador,
                 defensaRival: Defensa, eventos: Evento[]): number {
  const luchador = estado.jugadores[atacante];
  const rival = estado.jugadores[defensor];
  const personaje = buscarPersonaje(luchador.personaje)!;
  const personajeRival = buscarPersonaje(rival.personaje)!;
  const hab = buscarHabilidad(luchador.personaje, luchador.jugada!)!;

  if (!hab.dano) return 0;

  const atkEf = personaje.ataque * multEstadio(acotar(luchador.stageAtk, -6, 6));
  const defEf = personajeRival.defensa * multEstadio(acotar(rival.stageDef, -6, 6));
  let dano = hab.dano * (atkEf / defEf) / K + 2;

  // Varianza de ±7,5 % y crítico
  dano *= 0.85 + azar(estado) * 0.15;
  const critProb = personaje.pasiva === 'ojoDeHalcon' ? 0.11 : 0.08;
  const critico = azar(estado) < critProb;
  if (critico) dano *= 1.5;

  // Esquive del rival (anula el golpe entero)
  if (defensaRival.esquivar && azar(estado) < defensaRival.esquivar) {
    evento(eventos, 'esquivar', defensor,
      `${personajeRival.nombre} esquivó ${hab.nombre}.`);
    return 0;
  }

  // Escudo del rival
  const preEscudo = dano;
  dano *= 1 - (defensaRival.escudo || 0);
  const bloqueado = preEscudo - dano;

  // Coraza: reduce el daño recibido
  if (personajeRival.pasiva === 'coraza') dano *= 0.87;

  dano = Math.max(1, Math.round(dano));
  rival.vida = Math.max(0, rival.vida - dano);

  evento(eventos, 'dano', defensor,
    `${personaje.nombre} usó ${hab.nombre}${critico ? ' — ¡crítico!' : ''} y quitó ${dano}.`,
    { cantidad: dano, critico, habilidad: hab.id, atacante });

  // Reflejo del Caparazón: devuelve parte de lo que el escudo bloqueó
  if (defensaRival.reflejo && bloqueado > 0 && luchador.vida > 0) {
    const r = Math.round(bloqueado * defensaRival.reflejo);
    if (r > 0) {
      luchador.vida = Math.max(0, luchador.vida - r);
      evento(eventos, 'reflejo', atacante,
        `El Caparazón le devolvió ${r} a ${personaje.nombre}.`, { cantidad: r });
    }
  }

  // Púas de la Coraza: devuelve un % de cada golpe
  if (personajeRival.pasiva === 'coraza' && luchador.vida > 0) {
    const r = Math.round(dano * 0.15);
    if (r > 0) {
      luchador.vida = Math.max(0, luchador.vida - r);
      evento(eventos, 'pua', atacante,
        `Las púas de la Coraza le hicieron ${r} a ${personaje.nombre}.`, { cantidad: r });
    }
  }

  // Aguante del defensor
  if (personajeRival.pasiva === 'aguante' && !rival.pasivaUsada
      && rival.vida > 0 && rival.vida < 0.33 * rival.vidaMax) {
    rival.stageAtk = acotar(rival.stageAtk + 2, -6, 6);
    rival.pasivaUsada = true;
    evento(eventos, 'aguante', defensor, `¡${personajeRival.nombre} entra en Aguante! Pega más fuerte.`);
  }

  // Piel venenosa del defensor
  if (personajeRival.pasiva === 'pielVenenosa' && rival.vida > 0) {
    const r = Math.ceil(dano * 0.08);
    if (r > 0) luchador.vida = Math.max(0, luchador.vida - r);
    if (!luchador.veneno && azar(estado) < 0.30) {
      luchador.veneno = { dano: 6, rondas: 2 };
      evento(eventos, 'veneno', atacante,
        `La piel de ${personajeRival.nombre} envenenó a ${personaje.nombre}.`);
    }
  }

  return dano;
}

/* Efectos que la habilidad deja puestos después de golpear. */
function aplicarSecuelas(estado: EstadoPelea, idJugador: IdJugador, idRival: IdJugador, eventos: Evento[]) {
  const luchador = estado.jugadores[idJugador];
  const rival = estado.jugadores[idRival];
  const personaje = buscarPersonaje(luchador.personaje)!;
  const personajeRival = buscarPersonaje(rival.personaje)!;
  const hab = buscarHabilidad(luchador.personaje, luchador.jugada!)!;

  if (hab.veneno && rival.vida > 0) {
    rival.veneno = { ...hab.veneno };
    evento(eventos, 'veneno', idRival, `${personajeRival.nombre} quedó envenenado.`);
  }
  if (hab.bajaAtaque && rival.vida > 0) {
    rival.stageAtk = acotar(rival.stageAtk - hab.bajaAtaque, -6, 6);
    evento(eventos, 'stage-baja', idRival, `${personajeRival.nombre} pega más flojo.`);
  }
  if (hab.subeAtaque) {
    luchador.stageAtk = acotar(luchador.stageAtk + hab.subeAtaque, -6, 6);
    evento(eventos, 'stage-sube', idJugador, `${personaje.nombre} afila el golpe.`);
  }
  if (hab.recarga) {
    luchador.recargas[hab.id] = hab.recarga + 1; // +1 porque al cerrar la ronda se descuenta
  }
}

/* Veneno, vencimiento de recargas y racha de defensas, al cerrar la ronda. */
function cerrarRonda(estado: EstadoPelea, eventos: Evento[]) {
  (['p1', 'p2'] as IdJugador[]).forEach((id) => {
    const luchador = estado.jugadores[id];
    const hab = luchador.jugada
      ? buscarHabilidad(luchador.personaje, luchador.jugada)
      : null;

    if (luchador.veneno && luchador.vida > 0) {
      luchador.vida = Math.max(0, luchador.vida - luchador.veneno.dano);
      evento(eventos, 'dano-veneno', id,
        `El veneno le quitó ${luchador.veneno.dano} a ${buscarPersonaje(luchador.personaje)!.nombre}.`,
        { cantidad: luchador.veneno.dano });
      luchador.veneno.rondas -= 1;
      if (luchador.veneno.rondas <= 0) luchador.veneno = null;
    }

    Object.keys(luchador.recargas).forEach((idHab: string) => {
      luchador.recargas[idHab] -= 1;
      if (luchador.recargas[idHab] <= 0) delete luchador.recargas[idHab];
    });

    luchador.defensasSeguidas = esDefensiva(hab) ? luchador.defensasSeguidas + 1 : 0;
    luchador.jugada = null;
  });
}

/* Quién gana si los dos caen, o si se llega al tope de rondas: primero por vida antes
   de la ronda, luego a suerte. Un empate dejaría la decisión sin dueño. */
function desempatar(estado: EstadoPelea, vidasPrevias: Record<IdJugador, number>): IdJugador {
  if (vidasPrevias.p1 !== vidasPrevias.p2) {
    return vidasPrevias.p1 > vidasPrevias.p2 ? 'p1' : 'p2';
  }
  return azar(estado) < 0.5 ? 'p1' : 'p2';
}

export function resolverRonda(estado: EstadoPelea): { estado: EstadoPelea; eventos: Evento[] } {
  if (estado.terminada || !rondaLista(estado)) {
    return { estado, eventos: [] };
  }

  const eventos: Evento[] = [];
  const vidasPrevias = { p1: estado.jugadores.p1.vida, p2: estado.jugadores.p2.vida };

  // 1. Defensas y curas de los dos, antes de repartir golpes
  const defensa = {
    p1: aplicarPropios(estado, 'p1', eventos),
    p2: aplicarPropios(estado, 'p2', eventos),
  };

  // 2. Orden: el Águila (Ojo de halcón) va primero en la ronda 1; si no, el más rápido
  const pers1 = buscarPersonaje(estado.jugadores.p1.personaje)!;
  const pers2 = buscarPersonaje(estado.jugadores.p2.personaje)!;
  const aguila1 = pers1.pasiva === 'ojoDeHalcon';
  const aguila2 = pers2.pasiva === 'ojoDeHalcon';

  let primero: IdJugador;
  if (estado.ronda === 1 && aguila1 !== aguila2) {
    primero = aguila1 ? 'p1' : 'p2';
  } else if (pers1.velocidad !== pers2.velocidad) {
    primero = pers1.velocidad > pers2.velocidad ? 'p1' : 'p2';
  } else {
    primero = azar(estado) < 0.5 ? 'p1' : 'p2';
  }
  const segundo: IdJugador = primero === 'p1' ? 'p2' : 'p1';

  golpear(estado, primero, segundo, defensa[segundo], eventos);
  aplicarSecuelas(estado, primero, segundo, eventos);

  // El segundo solo responde si sigue en pie
  if (estado.jugadores[segundo].vida > 0) {
    golpear(estado, segundo, primero, defensa[primero], eventos);
    aplicarSecuelas(estado, segundo, primero, eventos);
  } else {
    evento(eventos, 'caido', segundo,
      `${buscarPersonaje(estado.jugadores[segundo].personaje)!.nombre} cayó antes de responder.`);
  }

  // 3. Veneno, recargas y racha de defensas
  estado.ultimasJugadas = {
    p1: estado.jugadores.p1.jugada ?? undefined,
    p2: estado.jugadores.p2.jugada ?? undefined,
  };
  cerrarRonda(estado, eventos);

  // 4. ¿Terminó?
  const caido1 = estado.jugadores.p1.vida <= 0;
  const caido2 = estado.jugadores.p2.vida <= 0;
  if (caido1 || caido2) {
    estado.terminada = true;
    estado.ganador = caido1 && caido2 ? desempatar(estado, vidasPrevias)
                   : caido1 ? 'p2' : 'p1';
  } else if (estado.ronda >= TOPE_RONDAS) {
    estado.terminada = true;
    const f1 = estado.jugadores.p1.vida / estado.jugadores.p1.vidaMax;
    const f2 = estado.jugadores.p2.vida / estado.jugadores.p2.vidaMax;
    estado.ganador = f1 === f2 ? desempatar(estado, vidasPrevias) : f1 > f2 ? 'p1' : 'p2';
    evento(eventos, 'tope', estado.ganador, 'La pelea se alargó: gana quien aguantó mejor.');
  } else {
    estado.ronda += 1;
  }

  estado.eventos = eventos;
  return { estado, eventos };
}
