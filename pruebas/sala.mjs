import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sala = require('../.tmp-pruebas/logica/sala.js');
const Battle = require('../.tmp-pruebas/logica/battle.js');
const { generarOpciones } = require('../.tmp-pruebas/logica/opciones.js');

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALLA') + '  ' + m); if (!c) fallos++; };

console.log('\n== Match pasándose el celular ==');
let avisos = 0;
const cancelar = Sala.suscribir(() => avisos++);

Sala.crearSala('Sebas', '¿Qué cenamos hoy?');
ok(Sala.obtenerSala().codigo.length === 4, 'la sala nace con código de 4 letras');
ok(!Sala.puedeIniciar(), 'con un solo participante no se puede iniciar');
Sala.unirseLocal('Ana');
ok(Sala.puedeIniciar(), 'con dos sí');
ok(Sala.esLocal(), 'este cliente controla a los dos jugadores');
ok(avisos > 0, `la interfaz recibió ${avisos} avisos de cambio`);

const ops = generarOpciones(Sala.obtenerSala().dilema);
Sala.iniciar(ops);
ok(Sala.obtenerSala().opciones.length === 5, 'se reparten 5 opciones');

ops.forEach((o, i) => Sala.registrarVoto('p1', o.id, i < 2));
ok(Sala.avanzarTurno() === 'siguiente', 'tras el primero, le toca al segundo');
ok(Sala.participanteActual().nombre === 'Ana', 'el turno es de Ana');
ops.forEach((o, i) => Sala.registrarVoto('p2', o.id, i === 1 || i === 2));
ok(Sala.avanzarTurno() === 'terminado', 'con los dos listos, termina');

const r = Sala.calcularResultados();
ok(r.matches.length === 1, `1 match (${r.matches.map(o => o.titulo).join(', ')})`);
ok(r.casi.length === 2, '2 casi');
ok(r.descartadas.length === 2, '2 descartadas');
ok(r.matches.length + r.casi.length + r.descartadas.length === 5, 'las 5 quedan clasificadas');

console.log('\n== De ahí a la pelea ==');
Sala.irAApostar();
ok(Sala.obtenerSala().estado === 'apostando', 'pasa a apostando');
Sala.apostar('p1', r.matches[0].titulo);
ok(!Sala.apuestasListas(), 'falta la otra apuesta');
Sala.apostar('p2', r.casi[0].titulo);
ok(Sala.apuestasListas() && Sala.obtenerSala().estado === 'eligiendo', 'con las dos, a elegir personaje');

Sala.elegirPersonaje('p1', 'serpiente');
ok(!Sala.estadoPelea(), 'con un solo personaje no arranca');
Sala.elegirPersonaje('p2', 'oso');
ok(!!Sala.estadoPelea(), 'con los dos, el árbitro crea la pelea');
ok(Sala.obtenerSala().estado === 'peleando', 'la sala está peleando');

let rondas = 0;
while (!Sala.estadoPelea().terminada && rondas < 40) {
  for (const j of ['p1', 'p2']) {
    const disp = Battle.habilidades(Sala.estadoPelea(), j).filter(h => h.disponible);
    Sala.jugar(j, disp[rondas % disp.length].id);
  }
  rondas++;
}
ok(Sala.estadoPelea().terminada, `la pelea termina (${rondas} rondas)`);
ok(Sala.obtenerSala().estado === 'veredicto', 'la sala pasa a veredicto');

const res = Sala.resultadoPelea();
ok(res !== null, 'hay resultado');
ok([r.matches[0].titulo, r.casi[0].titulo].includes(res.decision),
   `la decisión ganadora es una de las apostadas ("${res.decision}")`);
ok(!!res.personaje && !!res.nombre, `ganó ${res.nombre} con ${res.personaje}`);

console.log('\n== Revancha ==');
const apuestaAntes = Sala.obtenerSala().apuestas.p1;
Sala.revancha();
ok(Sala.estadoPelea() === null, 'la pelea se borra');
ok(Sala.obtenerSala().apuestas.p1 === apuestaAntes, 'las apuestas se conservan');
ok(Sala.obtenerSala().estado === 'eligiendo', 'vuelve a elegir personaje');
Sala.elegirPersonaje('p1', 'tortuga');
Sala.elegirPersonaje('p2', 'aguila');
ok(Sala.estadoPelea().jugadores.p1.personaje === 'tortuga', 'arranca con los personajes nuevos');

console.log('\n== Modo pelea directo ==');
Sala.reset();
ok(Sala.obtenerSala() === null, 'reset deja la sala vacía');
Sala.crearSala('Sebas', 'qué hacemos el finde', 'pelea');
Sala.unirseLocal('Ana');
ok(Sala.obtenerSala().proposito === 'pelea', 'la sala nace con propósito de pelea');
ok(Sala.obtenerSala().opciones.length === 0, 'sin opciones: no se pasa por el swipe');

console.log('\n== Entrar con código, sin llaves de Supabase en este entorno de pruebas ==');
const intento = await Sala.entrarConCodigo('ABCD', 'Ana');
ok(intento.error === 'sin-servidor', 'lo dice claro en vez de fingir que conecta');

cancelar();
const antes = avisos;
Sala.reset();
ok(avisos === antes, 'al cancelar la suscripción dejan de llegar avisos');

/* Dos dispositivos de verdad, cada uno con su propia copia del módulo. Esto
   reproduce el fallo que aparecía jugando en celular + laptop: los dos acaban
   sus 5 tarjetas ANTES de recibir los votos del otro, así que los dos se
   quedaban en "esperando al otro" y nadie volvía a comprobar si ya estaban
   los dos listos. */
console.log('\n== Dos dispositivos: los dos acaban antes de sincronizar ==');
const ruta = require.resolve('../.tmp-pruebas/logica/sala.js');
const nuevaInstancia = () => { delete require.cache[ruta]; return require(ruta); };
const A = nuevaInstancia();   // anfitrión, controla p1
const B = nuevaInstancia();   // el que entró con código, controla p2

const opsDos = generarOpciones('¿Qué cenamos hoy?');
A.crearSala('Host', '¿Qué cenamos hoy?');
const conDos = {
  ...A.obtenerSala(),
  participantes: [
    ...A.obtenerSala().participantes,
    { id: 'p2', nombre: 'Invitada', anfitrion: false, votos: {} },
  ],
};
A.restaurar(JSON.parse(JSON.stringify(conDos)), ['p1'], 'remoto');
B.restaurar(JSON.parse(JSON.stringify(conDos)), ['p2'], 'remoto');

A.iniciar(opsDos);
B.fusionar(JSON.parse(JSON.stringify(A.obtenerSala())));
ok(B.obtenerSala().opciones.length === 5, 'al invitado le llegan las 5 opciones del anfitrión');

// Cada uno vota sus 5 SIN haber recibido los votos del otro
opsDos.forEach((o, i) => A.registrarVoto('p1', o.id, i < 2));
ok(A.avanzarTurno() === 'esperar', 'el anfitrión acaba y queda esperando');
opsDos.forEach((o, i) => B.registrarVoto('p2', o.id, i === 1 || i === 2));
ok(B.avanzarTurno() === 'esperar', 'el invitado acaba y también queda esperando');

// Recién ahora se cruzan los estados
A.fusionar(JSON.parse(JSON.stringify(B.obtenerSala())));
ok(A.obtenerSala().estado === 'terminada',
   'al recibir los votos del otro, el árbitro cierra la votación');
ok(Object.keys(A.obtenerSala().participantes.find((p) => p.id === 'p1').votos).length === 5,
   'el árbitro no pierde sus propios votos al fusionar');

B.fusionar(JSON.parse(JSON.stringify(A.obtenerSala())));
ok(B.obtenerSala().estado === 'terminada', 'y el invitado se entera de que terminó');
ok(Object.keys(B.obtenerSala().participantes.find((p) => p.id === 'p2').votos).length === 5,
   'el invitado tampoco pierde los suyos');

A.reset();
B.reset();

console.log(fallos === 0 ? '\nTODO OK\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos ? 1 : 0);
