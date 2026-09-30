/* Recorre la app entera en el navegador: match completo y pelea completa.
   Necesita el servidor levantado (npx expo start --web) y Playwright.

   Uso:  npx expo start --web   (en otra terminal)
         node pruebas/ui.mjs
*/
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  // Playwright suele estar en la caché de npx en vez de instalado en el proyecto
  try {
    const cache = execSync('ls -d ~/.npm/_npx/*/node_modules/playwright 2>/dev/null | head -1',
      { shell: '/bin/bash' }).toString().trim();
    ({ chromium } = require(cache));
  } catch {
    console.error('Falta Playwright. Instálalo con: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const URL = process.env.URL ?? 'http://localhost:8081';
let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALLA') + '  ' + m); if (!c) fallos++; };

const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: 420, height: 880 } });
const errores = [];
p.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
p.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  /* Un 429 de OpenRouter no es un fallo nuestro: el modelo gratuito está saturado
     y ia.ts salta al siguiente. Que la app siga funcionando pese a eso es
     justamente lo que se quiere, así que no cuenta como error. */
  if (/429|404|openrouter|Failed to load resource/i.test(t)) return;
  errores.push('CONSOLE: ' + t.slice(0, 200));
});

/* Los mensajes de consola sobre recursos son genéricos ("Failed to load resource"),
   así que los fallos de red se vigilan por URL: los de OpenRouter son esperables
   (modelo gratuito saturado o retirado), los nuestros no. */
p.on('response', (r) => {
  if (r.status() < 400) return;
  if (/openrouter\.ai/.test(r.url())) return;
  errores.push(`RED ${r.status()}: ${r.url().slice(0, 90)}`);
});

const txt = () => p.evaluate(() => document.body.innerText);
const hay = async (s) => (await txt()).includes(s);
const tocar = async (etiqueta) => {
  const el = p.locator(`text="${etiqueta}"`).first();
  await el.waitFor({ state: 'visible', timeout: 20000 });
  await el.click();
  await p.waitForTimeout(450);
};

console.log('cargando (la primera vez Metro tarda)...');
await p.goto(URL, { waitUntil: 'networkidle', timeout: 240000 });
await p.waitForTimeout(5000);

/* La barra no tiene texto: se localiza por el papel de accesibilidad */
const pestanas = () => p.locator('[role="tab"]');
const tocarPestana = async (etiqueta) => {
  await p.locator(`[role="tab"][aria-label="${etiqueta}"]`).first().click();
  await p.waitForTimeout(500);
};

console.log('\n== Acceso y registro ==');
ok(await hay('Entra para decidir juntos'), 'sin sesión, la app pide entrar');
ok(await pestanas().count() === 0, 'la barra de pestañas no se ve hasta entrar');

/* Primero una cuenta nueva: es la única forma de comprobar el registro entero */
await tocar('No tengo cuenta, quiero crear una');
const correoNuevo = `prueba${Date.now()}@decidamos.app`;
await p.locator('input').nth(0).fill('Sebas');
await p.locator('input').nth(1).fill(correoNuevo);
await p.locator('input').nth(2).fill('123');
await tocar('Crear cuenta');
ok(await hay('al menos 6 caracteres'), 'una contraseña corta no crea la cuenta');
await p.locator('input').nth(2).fill('decidamos');
await tocar('Crear cuenta');
await p.waitForTimeout(700);
ok(await hay('Crear sala'), 'con la cuenta creada entra a la app');

/* El perfil vive arriba de los ajustes y desde ahí se cierra la sesión */
await tocarPestana('Configuración');
ok(await hay(correoNuevo), 'los ajustes muestran la cuenta arriba');
await tocar('Ver perfil');
ok(await hay('Plan gratuito'), 'el perfil muestra el plan');
await p.locator('input').first().fill('Sebastián');
await tocar('Guardar el nombre');
ok(await hay('Nombre actualizado'), 'el nombre se puede cambiar');
await tocar('Cerrar sesión');
await p.waitForTimeout(600);
ok(await hay('Entra para decidir juntos'), 'al cerrar sesión se vuelve al acceso');

/* Y ahora con la cuenta de prueba, la que se usa mientras no hay servidor */
await tocar('Usar la cuenta de prueba');
await tocar('Entrar');
await p.waitForTimeout(700);

console.log('\n== Arranque ==');
ok(await hay('Decidamos'), 'la app carga y muestra la marca');
ok(await hay('Crear sala'), 'están las dos entradas del match');
ok(!(await hay('Pelear por una decisión')), 'el botón de pelea ya no está en el inicio');
ok(await pestanas().count() === 3, 'la barra tiene tres pestañas');

console.log('\n== Las tres pestañas ==');
await tocarPestana('Pelear por una decisión');
ok(await hay('Modo Pelea'), 'la pestaña de pelea abre su portada');
ok(await pestanas().count() === 3, 'la barra sigue ahí');
await tocarPestana('Configuración');
ok(await hay('Vibración'), 'la pestaña de ajustes abre la configuración');

/* El Switch se renderiza como <input type="checkbox">, así que se lee con isChecked() */
const interruptor = p.locator('[role="switch"]').first();
const antesVibracion = await interruptor.isChecked();
await interruptor.click();
await p.waitForTimeout(500);
ok(await interruptor.isChecked() === !antesVibracion,
   `el interruptor de vibración cambia (${antesVibracion} → ${!antesVibracion})`);

/* Y que quede guardado, no solo en pantalla: en web AsyncStorage escribe en localStorage */
const guardado = await p.evaluate(() => {
  const clave = Object.keys(localStorage).find((k) => k.includes('decidamos:preferencias'));
  return clave ? localStorage.getItem(clave) : null;
});
ok(guardado !== null && guardado.includes(`"vibracion":${!antesVibracion}`),
   `el ajuste se guarda en el teléfono (${guardado})`);

await interruptor.click();   // se deja como estaba
await p.waitForTimeout(400);

await tocarPestana('Decidir juntos');
ok(await hay('Decidamos'), 'se vuelve al match');

console.log('\n== Match ==');
await tocar('Crear sala');
await p.locator('input').first().fill('Sebas');
await tocar('¿Qué cenamos hoy?');
await tocar('Crear sala');
ok(await hay('Código de la sala'), 'se crea la sala con su código');
ok(await pestanas().count() === 0, 'dentro de la partida la barra desaparece');

await tocar('+ Agregar a la otra persona');
await p.locator('input').last().fill('Ana');
await tocar('Listo');
ok(await hay('Ana'), 'entra la segunda persona');
await tocar('Iniciar');
/* Las opciones las pide un LLM, así que el tiempo depende de la red y de si el
   modelo está saturado: se espera al swipe en vez de a un número fijo de ms. */
const t0 = Date.now();
await p.locator('text=/Turno de/').first().waitFor({ state: 'visible', timeout: 90000 });
console.log(`         (generar las opciones tardó ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
ok(await hay('Turno de Sebas'), 'empieza el turno del primero');
ok(await pestanas().count() === 0, 'tampoco hay barra deslizando tarjetas');

// arrastre real de la primera tarjeta
const antes = (await txt()).split('\n').find((l) => /^\d\s*\/\s*5$/.test(l));
await p.mouse.move(210, 400);
await p.mouse.down();
await p.mouse.move(300, 380, { steps: 14 });
await p.waitForTimeout(300);
ok(await hay('SÍ'), 'al arrastrar a la derecha aparece el sello SÍ');
await p.mouse.move(400, 360, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(900);
const despues = (await txt()).split('\n').find((l) => /^\d\s*\/\s*5$/.test(l));
ok(antes !== despues, `el arrastre vota y pasa de tarjeta (${antes} → ${despues})`);

// arrastre corto: no debe votar
const antesCorto = despues;
await p.mouse.move(210, 400);
await p.mouse.down();
await p.mouse.move(255, 400, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(800);
ok((await txt()).includes(antesCorto), 'un arrastre corto no vota: la tarjeta vuelve');

for (let i = 0; i < 4; i++) await tocar(i === 0 ? '♥' : '✕');
ok(await hay('Pásale el celular'), 'al terminar, pide pasar el celular');
await tocar('Estoy listo');
await p.locator('text=/Turno de/').first().waitFor({ state: 'visible', timeout: 90000 });
for (let i = 0; i < 5; i++) await tocar(i === 1 ? '♥' : '✕');
await p.waitForTimeout(900);
ok(await hay('Resultados'), 'llega a los resultados');
ok(await hay('MATCH') || await hay('CASI') || await hay('DESCARTADAS'), 'las opciones quedan clasificadas');

console.log('\n== Pelea ==');
ok(await pestanas().count() === 0, 'en los resultados tampoco hay barra');
await tocar('⚔️  Peleen por el mejor plan');
ok(await hay('defiendes'), 'pide qué defiende cada quien');

/* Las opciones que se pueden defender son las líneas largas que no forman parte
   de los textos de la pantalla ni del recuadro con la apuesta del rival. */
const esOpcion = (l, excluir = []) =>
  l.length > 5 && !/defiend|Elige la opción|Confirmar|propuesta/i.test(l) && !excluir.includes(l);

const lineas = (await txt()).split('\n');
const apuesta1 = lineas.find((l) => esOpcion(l));
await tocar(apuesta1);
await tocar('Confirmar');
ok(await hay('Pásale el celular'), 'pasa el celular para que el otro apueste');
await tocar('Estoy listo');
const apuesta2 = (await txt()).split('\n').find((l) => esOpcion(l, [apuesta1]));
await tocar(apuesta2);
await tocar('Confirmar');
ok(await hay('luchador'), 'con las dos apuestas, a elegir animal');

await tocar('Serpiente');
await p.waitForTimeout(400);
ok(await hay('No hace falta ganar rápido'), 'la ficha muestra al personaje y sus habilidades');
await tocar('Elegir a Serpiente');
await tocar('Estoy listo');
await tocar('Oso');
await tocar('Elegir a Oso');
await p.waitForTimeout(700);
ok(await hay('RONDA'), 'empieza la pelea');

/* Los botones de habilidad se localizan por su línea de información. Si cambia el
   texto (pasó al rehacer el combate: "12 de daño" → "poder 13"), esto hay que
   actualizarlo, así que la prueba avisa en vez de girar en vacío hasta agotarse. */
const HABILIDAD = /poder \d|cura \d|sube tu ataque|apoyo|espera \d/;
const LIBRES = /poder \d|cura \d|sube tu ataque|apoyo/;

/* Tras elegir habilidad, la pantalla siempre acaba cambiando: o pasa el celular
   al otro, o sale el veredicto. Se espera a ese cambio en vez de a un tiempo fijo,
   porque la ronda resuelta se queda 1,5 s en pantalla para que dé tiempo a ver el
   golpe, y con esperas fijas la prueba clicaba encima de esa pausa. */
const esperarCambio = async () => {
  for (let i = 0; i < 40; i++) {
    const t = await txt();
    if (t.includes('Pásale el celular') || t.includes('LA DECISIÓN GANADORA ES')) return true;
    await p.waitForTimeout(120);
  }
  return false;
};

let vueltas = 0, sinBotones = 0;
while (vueltas < 40) {
  const t = await txt();
  if (t.includes('LA DECISIÓN GANADORA ES')) break;
  if (t.includes('Pásale el celular')) { await tocar('Estoy listo'); vueltas++; continue; }

  const botones = p.locator(`text=${HABILIDAD}`);
  if (await botones.count() === 0) {
    if (++sinBotones > 8) {
      console.log('         (no se encuentran los botones de habilidad; ¿cambió su texto?)');
      break;
    }
    await p.waitForTimeout(400); vueltas++; continue;
  }
  sinBotones = 0;
  // el primero disponible: los bloqueados dicen "espera N" y no responden
  const libres = p.locator(`text=${LIBRES}`);
  await (await libres.count() ? libres : botones).first().click();
  await esperarCambio();
  vueltas++;
}
await p.waitForTimeout(1500);

const fin = await txt();
ok(fin.includes('LA DECISIÓN GANADORA ES'), `la pelea termina en veredicto (${vueltas} vueltas)`);
const ganadora = fin.split('\n')[fin.split('\n').indexOf('LA DECISIÓN GANADORA ES') + 1];
ok([apuesta1, apuesta2].includes(ganadora), `la decisión ganadora es una de las apostadas ("${ganadora}")`);

console.log('\n== La pelea también se abre desde su pestaña ==');
await tocar('Nueva decisión');
await p.waitForTimeout(600);
ok(await pestanas().count() === 3, 'al terminar, vuelve la barra');
await tocarPestana('Pelear por una decisión');
await tocar('Crear sala de pelea');
ok(await hay('Nueva pelea'), 'la pestaña lleva al flujo de pelea');

console.log('\n== Pelea directa: al anfitrión no se le pregunta dos veces ==');
await tocar('Crear sala de pelea');
ok(await hay('¿Qué quieres hacer tú?'), 'al crear la sala se pide la propuesta, no un tema');
await p.locator('input').first().fill('Sebas');
await p.locator('textarea, input').last().fill('Ir al cine');
await tocar('Crear sala de pelea');
ok(await hay('Sebas defiende'), 'la sala muestra lo que defiende el anfitrión');

await tocar('+ Agregar a la otra persona');
await p.locator('input').last().fill('Ana');
await tocar('Listo');
await tocar('Iniciar');
await p.waitForTimeout(700);
ok(await hay('Pásale el celular a Ana'),
   'al iniciar pasa directo al segundo, sin repetirle la pregunta al anfitrión');
await tocar('Estoy listo');
ok(await hay('Ana: ¿qué defiendes?'), 'le toca a Ana');
ok(await hay('Ir al cine'), 'Ana ve contra qué compite');
await p.locator('textarea, input').last().fill('Quedarnos en casa');
await tocar('Confirmar');
ok(await hay('luchador'), 'con las dos propuestas, a elegir animal');

ok(errores.length === 0, `sin errores de consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);

console.log(fallos === 0 ? '\nTODO OK\n' : `\n${fallos} FALLOS\n`);
await navegador.close();
process.exit(fallos ? 1 : 0);
