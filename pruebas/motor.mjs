/* El motor de combate: determinismo, catálogo y que las peleas siempre terminan.
   Se corre sobre la lógica compilada por tsconfig.pruebas.json. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Battle = require('../.tmp-pruebas/logica/battle.js');
const { PERSONAJES, buscarPersonaje } = require('../.tmp-pruebas/logica/personajes.js');

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALLA') + '  ' + m); if (!c) fallos++; };

console.log('\n== Catálogo ==');
ok(PERSONAJES.length === 4, 'hay 4 animales');
ok(PERSONAJES.every((p) => p.habilidades.length === 4), 'cada uno tiene 4 habilidades');
ok(PERSONAJES.every((p) => typeof p.defensa === 'number' && p.defensa > 0), 'todos tienen defensa');
ok(PERSONAJES.every((p) => ['aguante', 'coraza', 'pielVenenosa', 'ojoDeHalcon'].includes(p.pasiva)),
   'todos tienen una pasiva conocida');

const ids = PERSONAJES.map((p) => p.id);

/* Juega una pelea entera con una estrategia fija y determinista. */
function jugarPelea(a, b, semilla) {
  const estado = Battle.crear({ personajeA: a, personajeB: b, semilla });
  let rondas = 0;
  while (!estado.terminada && rondas < 60) {
    for (const j of ['p1', 'p2']) {
      const disp = Battle.habilidades(estado, j).filter((h) => h.disponible);
      Battle.registrarJugada(estado, j, disp[rondas % disp.length].id);
    }
    Battle.resolverRonda(estado);
    rondas++;
  }
  return { estado, rondas };
}

console.log('\n== Determinismo ==');
{
  const a = jugarPelea('oso', 'aguila', 12345);
  const b = jugarPelea('oso', 'aguila', 12345);
  ok(JSON.stringify(a.estado.jugadores) === JSON.stringify(b.estado.jugadores),
     'misma semilla + mismas jugadas → mismo resultado exacto');
  const c = jugarPelea('oso', 'aguila', 999);
  ok(JSON.stringify(a.estado.jugadores) !== JSON.stringify(c.estado.jugadores),
     'otra semilla → otro resultado');
}

console.log('\n== Todas las peleas terminan y con un solo ganador ==');
let maxRondas = 0;
for (const a of ids) for (const b of ids) {
  if (a === b) continue;
  for (let s = 0; s < 25; s++) {
    const { estado, rondas } = jugarPelea(a, b, s * 7 + 1);
    maxRondas = Math.max(maxRondas, rondas);
    if (!estado.terminada) { ok(false, `${a} vs ${b} (semilla ${s}) no terminó`); break; }
    if (estado.ganador !== 'p1' && estado.ganador !== 'p2') {
      ok(false, `${a} vs ${b} terminó sin ganador`); break;
    }
  }
}
ok(true, `las 300 peleas terminan con ganador (la más larga, ${maxRondas} rondas)`);

console.log('\n== Las pasivas se disparan ==');
{
  // Serpiente (piel venenosa) contra quien la golpee: el rival debería envenenarse alguna vez
  let venenos = 0;
  for (let s = 0; s < 40; s++) {
    const estado = Battle.crear({ personajeA: 'serpiente', personajeB: 'oso', semilla: s + 1 });
    let r = 0;
    while (!estado.terminada && r < 20) {
      Battle.registrarJugada(estado, 'p1', 'colmillo');
      Battle.registrarJugada(estado, 'p2', 'zarpazo');
      const { eventos } = Battle.resolverRonda(estado);
      if (eventos.some((e) => e.tipo === 'veneno' && e.quien === 'p2')) venenos++;
      r++;
    }
  }
  ok(venenos > 0, `Piel venenosa envenenó al Oso ${venenos} veces en 40 peleas`);

  // Águila (ojo de halcón) golpea primero en la ronda 1 aunque el rival no sea más lento
  const estado = Battle.crear({ personajeA: 'tortuga', personajeB: 'aguila', semilla: 5 });
  Battle.registrarJugada(estado, 'p1', 'cabezazo');
  Battle.registrarJugada(estado, 'p2', 'picotazo');
  const { eventos } = Battle.resolverRonda(estado);
  const primerDano = eventos.find((e) => e.tipo === 'dano');
  ok(primerDano && primerDano.atacante === 'p2', 'el Águila pega primero en la ronda 1');
}

console.log('\n== Stat stages ==');
{
  // Vista de halcón sube el Ataque del Águila y se queda
  const estado = Battle.crear({ personajeA: 'aguila', personajeB: 'tortuga', semilla: 3 });
  Battle.registrarJugada(estado, 'p1', 'vista');
  Battle.registrarJugada(estado, 'p2', 'cabezazo');
  Battle.resolverRonda(estado);
  ok(estado.jugadores.p1.stageAtk === 2, 'Vista de halcón deja stageAtk en +2');
}

console.log(fallos === 0 ? '\nTODO OK\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos ? 1 : 0);
