/* Deja la pelea en un estado concreto y saca fotos. Sirve para mirar la arena sin
   tener que jugar a mano cada vez.

   Uso:  npx expo start --web   (en otra terminal)
         node pruebas/foto-arena.mjs [habilidad1] [habilidad2] [animal1] [animal2]
   Ej.:  node pruebas/foto-arena.mjs Hibernar Zarpazo Oso Águila

   Guarda en /tmp/arena: descanso.png, jab.png (el instante del golpe) y tras-jab.png
*/
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  const cache = execSync('ls -d ~/.npm/_npx/*/node_modules/playwright 2>/dev/null | head -1',
    { shell: '/bin/bash' }).toString().trim();
  ({ chromium } = require(cache));
}

const [P1 = 'Zarpazo', P2 = 'Embestida', A1 = 'Oso', A2 = 'Oso'] = process.argv.slice(2);
const OUT = process.env.OUT ?? '/tmp/arena';
execSync(`rm -rf ${OUT}; mkdir -p ${OUT}`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message.slice(0, 140)));

const tocar = async (t) => {
  const el = p.locator(`text="${t}"`).first();
  await el.waitFor({ state: 'visible', timeout: 20000 });
  await el.click();
  await p.waitForTimeout(420);
};
const pestana = async (l) => {
  await p.locator(`[role="tab"][aria-label="${l}"]`).first().click();
  await p.waitForTimeout(700);
};

await p.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 240000 });
await p.waitForTimeout(5000);

// La app pide sesión: se entra con la cuenta de prueba
await tocar('Usar la cuenta de prueba');
await tocar('Entrar');
await p.waitForTimeout(700);

await pestana('Pelear por una decisión');
await tocar('Crear sala de pelea');
await p.locator('input').first().fill('Sebastian');
await p.locator('textarea, input').last().fill('Pedir pizza');
await tocar('Crear sala de pelea');
await tocar('+ Agregar a la otra persona');
await p.locator('input').last().fill('Medardo');
await tocar('Listo');
await tocar('Iniciar');
await tocar('Estoy listo');
await p.locator('textarea, input').last().fill('Sushi');
await tocar('Confirmar');
await tocar(A1); await tocar(`Elegir a ${A1}`);
await tocar('Estoy listo');
await tocar(A2); await tocar(`Elegir a ${A2}`);
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/descanso.png` });

await tocar(P1);
await tocar('Estoy listo');
await p.locator(`text="${P2}"`).first().click();
await p.waitForTimeout(160);            // dentro de la ventana del jab
await p.screenshot({ path: `${OUT}/jab.png` });
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/tras-jab.png` });

console.log(`fotos en ${OUT} · ${A1} usó ${P1}, ${A2} usó ${P2}`);
console.log('errores:', errores.length ? errores : 'ninguno');
await b.close();
