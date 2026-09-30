/* La sala: participantes, votos, apuestas y arbitraje de la pelea.
   Viene de js/room.js del prototipo web, con dos cambios importantes:

   1. NO toca el almacenamiento. En la web la sala vivía en localStorage porque eso era
      lo que permitía que dos pestañas se vieran; en el móvil eso no existe. Aquí la sala
      vive en memoria y de guardarla se encarga persistencia.ts. Así este archivo queda
      puro y se puede probar en Node sin simular nada.
   2. La sincronización entre dispositivos sale a transporte.ts. Hoy no hay servidor, así
      que `fusionar` no llega a ejecutarse — se conserva porque es exactamente la lógica
      que hará falta el día que lo haya, y ya está probada.

   El reparto de roles se mantiene: el ANFITRIÓN es el árbitro de la pelea. */

import { type Opcion } from './opciones';
import * as Battle from './battle';
import type { EstadoPelea, IdJugador } from './battle';
import { transporte } from './transporte';

export type Participante = {
  id: IdJugador;
  nombre: string;
  anfitrion: boolean;
  votos: Record<string, boolean>;
};

export type EstadoSala =
  | 'esperando' | 'votando' | 'terminada'
  | 'apostando' | 'eligiendo' | 'peleando' | 'veredicto';

export type Sala = {
  codigo: string;
  dilema: string;
  proposito: 'match' | 'pelea';
  estado: EstadoSala;
  participantes: Participante[];
  opciones: Opcion[];
  turnoLocal: number;
  apuestas: Partial<Record<IdJugador, string>>;
  personajes: Partial<Record<IdJugador, string>>;
  pelea: { estado: EstadoPelea; ganador?: IdJugador | null } | null;
  generacion: number;
  actualizada?: number;
};

export type OpcionClasificada = Opcion & {
  tipo: 'match' | 'casi' | 'descartada';
  quienDijoSi: string | null;
};

const ORDEN_ESTADO: Record<EstadoSala, number> = {
  esperando: 0, votando: 1, terminada: 2,
  apostando: 3, eligiendo: 4, peleando: 5, veredicto: 6,
};

let sala: Sala | null = null;
let misIds: IdJugador[] = [];
let modo: 'local' | 'remoto' = 'local';
const oyentes: Array<() => void> = [];
let dejarDeEscuchar: (() => void) | null = null;

/* ===== Suscripción: la interfaz se entera de cada cambio ===== */
export function suscribir(cb: () => void): () => void {
  oyentes.push(cb);
  return () => {
    const i = oyentes.indexOf(cb);
    if (i >= 0) oyentes.splice(i, 1);
  };
}

/* Marca de la última sala que publicamos nosotros, para reconocer nuestro propio
   eco cuando el servidor nos lo devuelve (Supabase reenvía también tus cambios). */
let ultimaPublicacion = 0;

/* `publicar` en false = el cambio VINO de la red, así que no hay que devolverlo:
   sin este freno, cada evento recibido disparaba una publicación nueva, que
   volvía como evento, que publicaba otra vez… un bucle infinito de dos
   escrituras por segundo que saturaba el canal y hacía perder eventos al otro. */
function avisar(publicar = true) {
  const marca = Date.now();
  if (sala) sala.actualizada = marca;
  if (publicar && sala && transporte.disponible) {
    ultimaPublicacion = marca;
    transporte.publicar(sala);
  }
  oyentes.slice().forEach((cb) => cb());
}

/* Empieza a escuchar los cambios de esta sala en Supabase. Reemplaza cualquier
   suscripción anterior — nunca hay que escuchar dos salas a la vez. */
function escuchar(codigo: string) {
  dejarDeEscuchar?.();
  dejarDeEscuchar = transporte.disponible ? transporte.suscribir(codigo, fusionar) : null;
}

/* ===== Consultas ===== */
export const obtenerSala = () => sala;
export const obtenerModo = () => modo;
export const obtenerMisIds = () => misIds;
export const soyArbitro = () => misIds.includes('p1');
/* Con un solo celular este cliente controla a los dos jugadores */
export const esLocal = () => misIds.length > 1;

/* ===== Crear y entrar ===== */
function generarCodigo(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O para no confundir
  let codigo = '';
  for (let i = 0; i < 4; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
  return codigo;
}

export function crearSala(nombreAnfitrion: string, dilema: string,
                          proposito: 'match' | 'pelea' = 'match'): Sala {
  sala = {
    codigo: generarCodigo(),
    dilema,
    proposito,
    estado: 'esperando',
    participantes: [{ id: 'p1', nombre: nombreAnfitrion, anfitrion: true, votos: {} }],
    opciones: [],
    turnoLocal: 0,
    apuestas: {},
    personajes: {},
    pelea: null,
    generacion: 0,
  };
  misIds = ['p1'];
  modo = 'local';
  escuchar(sala.codigo);
  avisar();
  return sala;
}

/* "Se unió en este dispositivo": se van pasando el celular */
export function unirseLocal(nombre: string): Participante | null {
  if (!sala || sala.participantes.length >= 2) return null;
  const p: Participante = { id: 'p2', nombre, anfitrion: false, votos: {} };
  sala.participantes.push(p);
  misIds = ['p1', 'p2'];
  modo = 'local';
  avisar();
  return p;
}

/* Entrar con código desde otro dispositivo. */
export async function entrarConCodigo(
  codigo: string, nombre: string
): Promise<{ ok?: true; error?: string }> {
  if (!transporte.disponible) return { error: 'sin-servidor' };

  const remota = await transporte.buscarSala(codigo.trim().toUpperCase());
  if (!remota) return { error: 'no-encontrada' };
  if (remota.participantes.length >= 2) return { error: 'sala-llena' };

  sala = remota;
  sala.participantes.push({ id: 'p2', nombre, anfitrion: false, votos: {} });
  misIds = ['p2'];
  modo = 'remoto';
  escuchar(sala.codigo);
  avisar();
  return { ok: true };
}

/* ===== Partida ===== */
export const puedeIniciar = () =>
  !!sala && sala.participantes.length === 2 && sala.estado === 'esperando';

export function iniciar(opciones: Opcion[]): Sala | null {
  if (!sala) return null;
  sala.opciones = opciones;
  sala.estado = 'votando';
  const mio = sala.participantes.findIndex((p) => p.id === misIds[0]);
  sala.turnoLocal = mio === -1 ? 0 : mio;
  sala.participantes.forEach((p) => { p.votos = {}; });
  avisar();
  return sala;
}

export function registrarVoto(idParticipante: IdJugador, idOpcion: string, leGusta: boolean) {
  if (!sala) return;
  const p = sala.participantes.find((x) => x.id === idParticipante);
  if (!p) return;
  p.votos[idOpcion] = leGusta;
  avisar();
}

export function participanteActual(): Participante {
  if (!sala) throw new Error('no hay sala');
  // En remoto cada quien vota lo suyo; turnoLocal solo aplica al celular compartido
  if (modo === 'remoto') {
    return sala.participantes.find((p) => p.id === misIds[0]) || sala.participantes[0];
  }
  return sala.participantes[sala.turnoLocal] || sala.participantes[0];
}

export function otroParticipante(): Participante | null {
  if (!sala) return null;
  return sala.participantes.find((p) => !misIds.includes(p.id)) || null;
}

export function terminoDeVotar(participante: Participante | null | undefined): boolean {
  if (!participante || !sala) return false;
  return sala.opciones.length > 0 &&
         sala.opciones.every((o) => participante.votos[o.id] !== undefined);
}

export const todosTerminaron = () =>
  !!sala && sala.participantes.length === 2 && sala.participantes.every(terminoDeVotar);

/* Quién sigue después de que el jugador actual terminó sus 5 tarjetas.
   'siguiente' → en este dispositivo le toca al otro
   'esperar'   → el otro está votando en su propia pantalla
   'terminado' → ya votaron los dos */
export function avanzarTurno(): 'siguiente' | 'esperar' | 'terminado' {
  if (!sala) return 'terminado';
  if (todosTerminaron()) {
    sala.estado = 'terminada';
    avisar();
    return 'terminado';
  }
  const pendienteMio = sala.participantes.findIndex(
    (p) => misIds.includes(p.id) && !terminoDeVotar(p)
  );
  if (pendienteMio !== -1) {
    sala.turnoLocal = pendienteMio;
    avisar();
    return 'siguiente';
  }
  return 'esperar';
}

/* Cruza los votos de ambos: cada opción queda como match, casi o descartada */
export function calcularResultados() {
  if (!sala) return { matches: [], casi: [], descartadas: [], todas: [] };
  const [a, b] = sala.participantes;
  const clasificadas: OpcionClasificada[] = sala.opciones.map((op) => {
    const votoA = a?.votos[op.id];
    const votoB = b?.votos[op.id];
    const tipo: OpcionClasificada['tipo'] =
      votoA && votoB ? 'match' : votoA || votoB ? 'casi' : 'descartada';
    const quienDijoSi = votoA ? a.nombre : votoB ? b.nombre : null;
    return { ...op, tipo, quienDijoSi };
  });
  return {
    matches: clasificadas.filter((o) => o.tipo === 'match'),
    casi: clasificadas.filter((o) => o.tipo === 'casi'),
    descartadas: clasificadas.filter((o) => o.tipo === 'descartada'),
    todas: clasificadas,
  };
}

export const reiniciarVotacion = (nuevasOpciones: Opcion[]) => iniciar(nuevasOpciones);

/* ===== Modo Pelea ===== */
export function irAApostar() {
  if (!sala) return;
  sala.estado = 'apostando';
  avisar();
}

export function apostar(idParticipante: IdJugador, texto: string) {
  if (!sala) return;
  sala.apuestas[idParticipante] = texto;
  if (apuestasListas()) sala.estado = 'eligiendo';
  avisar();
}

export const apuestasListas = () => !!(sala && sala.apuestas.p1 && sala.apuestas.p2);

export function elegirPersonaje(idParticipante: IdJugador, idAnimal: string) {
  if (!sala) return;
  sala.personajes[idParticipante] = idAnimal;
  if (personajesListos() && soyArbitro()) iniciarPelea();
  else avisar();
}

export const personajesListos = () => !!(sala && sala.personajes.p1 && sala.personajes.p2);

/* El árbitro crea la pelea con una semilla, y a partir de ahí resuelve él */
export function iniciarPelea() {
  if (!sala || !personajesListos()) return null;
  if (sala.pelea) return sala.pelea;
  sala.pelea = {
    estado: Battle.crear({
      personajeA: sala.personajes.p1!,
      personajeB: sala.personajes.p2!,
      semilla: Battle.nuevaSemilla(),
    }),
  };
  sala.estado = 'peleando';
  avisar();
  return sala.pelea;
}

export function jugar(idParticipante: IdJugador, idHabilidad: string): boolean {
  if (!sala || !sala.pelea) return false;
  const ok = Battle.registrarJugada(sala.pelea.estado, idParticipante, idHabilidad);
  if (ok) {
    arbitrar();
    avisar();
  }
  return ok;
}

/* Solo hace algo en el dispositivo del árbitro: si los dos ya jugaron, resuelve */
export function arbitrar(): boolean {
  if (!sala || !sala.pelea || !soyArbitro()) return false;
  if (!Battle.rondaLista(sala.pelea.estado)) return false;

  Battle.resolverRonda(sala.pelea.estado);
  const fin = Battle.terminada(sala.pelea.estado);
  if (fin) {
    sala.pelea.ganador = fin.ganador;
    sala.estado = 'veredicto';
  }
  return true;
}

export const estadoPelea = (): EstadoPelea | null => (sala && sala.pelea ? sala.pelea.estado : null);

/* Quién ganó y, sobre todo, qué decisión se impone */
export function resultadoPelea() {
  if (!sala || !sala.pelea || !sala.pelea.ganador) return null;
  const idGanador = sala.pelea.ganador;
  const idPerdedor: IdJugador = idGanador === 'p1' ? 'p2' : 'p1';
  const ganador = sala.participantes.find((p) => p.id === idGanador);
  const perdedor = sala.participantes.find((p) => p.id === idPerdedor);
  return {
    idGanador,
    nombre: ganador ? ganador.nombre : '',
    nombrePerdedor: perdedor ? perdedor.nombre : '',
    decision: sala.apuestas[idGanador] ?? '',
    decisionPerdedora: sala.apuestas[idPerdedor] ?? '',
    personaje: sala.personajes[idGanador]!,
    personajePerdedor: sala.personajes[idPerdedor]!,
    gane: misIds.includes(idGanador),
  };
}

/* Revancha: mismas apuestas, se vuelven a elegir animales */
export function revancha() {
  if (!sala) return;
  sala.generacion += 1;
  sala.personajes = {};
  sala.pelea = null;
  sala.estado = 'eligiendo';
  avisar();
}

export function reset() {
  dejarDeEscuchar?.();
  dejarDeEscuchar = null;
  sala = null;
  misIds = [];
  modo = 'local';
  avisar();
}

/* Restaura una sala guardada (persistencia.ts) o recibida por red */
export function restaurar(guardada: Sala, ids: IdJugador[], modoSala: 'local' | 'remoto') {
  sala = guardada;
  misIds = ids;
  modo = modoSala;
  avisar();
}

/* ===== Fusión, para cuando exista el servidor =====
   Hoy nada la llama: sin transporte remoto no llegan salas de fuera. Se conserva
   porque es la lógica que hará falta y ya está probada en el prototipo web. */
export function fusionar(remota: Sala) {
  if (!sala || remota.codigo !== sala.codigo) return;
  // Nuestro propio eco: ya tenemos ese estado, no hay nada que reconciliar.
  if (remota.actualizada && remota.actualizada === ultimaPublicacion) return;

  const misVotos: Partial<Record<IdJugador, Record<string, boolean>>> = {};
  misIds.forEach((id) => {
    const p = sala!.participantes.find((x) => x.id === id);
    if (p) misVotos[id] = p.votos;
  });

  /* ¿Traigo yo algo que en el servidor todavía no está? Pasa cuando el otro
     publicó su sala entera con una copia vieja de mis votos y la pisó: la
     fusión local lo recupera, pero si nadie lo devuelve, el servidor se queda
     con la versión incompleta y el voto se pierde de verdad. */
  let aportoAlgo = false;

  const nueva: Sala = { ...remota };
  nueva.participantes = remota.participantes.map((p) => {
    const mios = misVotos[p.id];
    if (!mios) return p;
    const fusionados = { ...p.votos, ...mios };
    if (Object.keys(fusionados).length > Object.keys(p.votos ?? {}).length) aportoAlgo = true;
    return { ...p, votos: fusionados };
  });
  misIds.forEach((id) => {
    if (!nueva.participantes.some((p) => p.id === id)) {
      const mio = sala!.participantes.find((p) => p.id === id);
      if (mio) { nueva.participantes.push(mio); aportoAlgo = true; }
    }
  });

  // Una revancha del otro lado es lo único que puede hacer retroceder el estado
  const revanchaRemota = (remota.generacion || 0) > (sala.generacion || 0);
  if (!revanchaRemota && ORDEN_ESTADO[sala.estado] > ORDEN_ESTADO[nueva.estado]) {
    nueva.estado = sala.estado;
  }
  if (!nueva.opciones || !nueva.opciones.length) nueva.opciones = sala.opciones;
  nueva.turnoLocal = sala.turnoLocal;

  nueva.apuestas = { ...(remota.apuestas || {}) };
  nueva.personajes = { ...(remota.personajes || {}) };
  if (!revanchaRemota) {
    misIds.forEach((id) => {
      if (sala!.apuestas[id]) nueva.apuestas[id] = sala!.apuestas[id];
      if (sala!.personajes[id]) nueva.personajes[id] = sala!.personajes[id];
    });
  }
  nueva.pelea = revanchaRemota ? remota.pelea : fusionarPelea(sala.pelea, remota.pelea);

  /* Si este dispositivo solo controla a un participante y la sala fusionada ya
     trae dos, el segundo entró desde OTRO celular (no por unirseLocal) — pasa
     a modo remoto para que participanteActual() deje de alternar turnoLocal. */
  if (modo === 'local' && misIds.length === 1 && nueva.participantes.length === 2) {
    modo = 'remoto';
  }

  sala = nueva;
  /* Lo que resuelve el árbitro (cerrar la votación, armar la pelea, resolver una
     ronda) SÍ es un cambio propio que el otro necesita, así que eso se publica.
     El resto vino de fuera: se avisa a la interfaz y nada más. */
  if (soyArbitro()) {
    /* Nadie vuelve a llamar a avanzarTurno() después de que cada uno terminó lo
       suyo: sin esto, si los dos acaban sus 5 sin haber recibido todavía los
       votos del otro, los dos se quedan en "esperando al otro" para siempre. */
    if (sala.estado === 'votando' && todosTerminaron()) {
      sala.estado = 'terminada';
      avisar();
      return;
    }
    if (personajesListos() && !sala.pelea) { iniciarPelea(); return; }  // iniciarPelea ya avisa
    if (sala.pelea && arbitrar()) { avisar(); return; }
  }
  avisar(aportoAlgo);
}

/* Manda la copia del árbitro, salvo la jugada propia de esta ronda */
function fusionarPelea(mia: Sala['pelea'], remota: Sala['pelea']): Sala['pelea'] {
  if (!mia && !remota) return null;
  if (!mia) return remota;
  if (!remota) return mia;

  const base = soyArbitro() ? mia : remota;
  const otra = soyArbitro() ? remota : mia;
  const copia: NonNullable<Sala['pelea']> = JSON.parse(JSON.stringify(base));

  if (copia.estado && otra.estado && copia.estado.ronda === otra.estado.ronda) {
    (['p1', 'p2'] as IdJugador[]).forEach((id) => {
      const origen = misIds.includes(id) ? mia : otra;
      const jugada = origen?.estado?.jugadores?.[id]?.jugada;
      if (jugada && !copia.estado.jugadores[id].jugada) {
        copia.estado.jugadores[id].jugada = jugada;
      }
    });
  }
  return copia;
}
