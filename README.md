# Decidamos

App para dos personas indecisas. Escriben su dilema, la app propone cinco opciones y cada
quien las desliza tipo Tinder: derecha si es buena idea, izquierda si no. Al final se ve en
cuáles coincidieron.

Y si aun así no se deciden, **pelean por ello**. Cada quien defiende un plan y elige uno de
cuatro animales, con cuatro habilidades y una pasiva propia. El que gana impone su decisión.

Hecha con React Native y Expo (SDK 54), en TypeScript. Presentada al RevenueCat Shipaton 2026.

---

## Cómo funciona

1. **El dilema.** Uno escribe qué hay que decidir, por ejemplo "no sabemos qué cenar".
2. **Las opciones.** Un modelo de lenguaje devuelve cinco ideas concretas. Si la IA no está
   disponible, hay bancos de opciones locales por tema, así que la app nunca se queda sin nada
   que proponer.
3. **El swipe.** Cada quien vota las cinco, sin ver los votos del otro. Se puede jugar en un
   solo celular, pasándoselo por turnos, o en dos celulares con el código de la sala.
4. **Los resultados.** Lo que ambos quisieron, lo que quedó a medias y lo que descartaron.
5. **La pelea.** Opcional. Combate por rondas simultáneas con sprites en pixel art; gana un
   plan, no una persona.

## Arrancar

Hace falta **Node 20.19 o superior**.

```bash
npm install
cp .env.example .env     # rellena las variables que quieras usar
npx expo start --go      # y escanea el QR con Expo Go
```

Todas las variables son opcionales: sin ellas la app funciona en modo degradado, con opciones
locales en vez de IA, compras simuladas y sin salas a distancia.

> **Sobre Expo Go.** El proyecto está en SDK 54. Si la Expo Go de la tienda ya va por una
> versión mayor, dará un error de incompatibilidad. Se resuelve instalando la Expo Go de SDK 54
> desde expo.dev/go, o compilando un build de desarrollo con
> `npx eas build --profile development`.

## Variables de entorno

| Variable | Para qué | Sin ella |
|---|---|---|
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | Generar las opciones con IA | Se usan los bancos locales |
| `EXPO_PUBLIC_OPENROUTER_MODEL` | Elegir el modelo | Se usa el que trae por defecto |
| `EXPO_PUBLIC_SUPABASE_URL` | Salas entre dos celulares | Se juega pasándose el celular |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Lo mismo | Igual |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Compras reales | Compras simuladas |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Compras reales en iOS | Igual |
| `EXPO_PUBLIC_ADMOB_BANNER` | Anuncio de banner | Se usa la unidad de prueba de Google |
| `EXPO_PUBLIC_ADMOB_INTERSTICIAL` | Anuncio entre pantallas | Igual |
| `EXPO_PUBLIC_ADMOB_RECOMPENSADO` | Anuncio con recompensa | Igual |

Las variables que empiezan por `EXPO_PUBLIC_` se incrustan en el paquete al compilar, así que
son visibles para quien descargue la app. Ahí solo van llaves públicas de cliente. Nada
privado, como la cuenta de servicio de Google Play, vive en este repositorio.

Para las salas hace falta además crear la tabla en tu propio proyecto de Supabase, pegando
[`src/logica/supabase.sql`](src/logica/supabase.sql) en su editor de SQL.

## Estructura

```
src/logica/       las reglas, sin React: se ejecutan en Node y son lo que prueban los tests
src/pantallas/    una pantalla por archivo
src/componentes/  lo compartido entre pantallas
src/tema.ts       colores, espacios y tipografía
pruebas/          los tests
assets/sprites/   el pixel art, recortado al encuadre de cada animal
```

La regla del proyecto es que la lógica no sepa nada de la interfaz. `battle.ts` y `sala.ts`
no importan React, y por eso se pueden probar en un segundo.

### El motor de combate

Es determinista. El daño es

```
daño = poder · (ataqueEfectivo / defensaEfectivo) / K + 2
```

donde ataque y defensa incluyen los *stat stages* acumulados en la pelea. Todo el azar sale de
un generador con semilla, así que la misma semilla y las mismas jugadas dan siempre la misma
pelea. Eso es lo que permite que dos celulares se mantengan sincronizados sin enviarse el
resultado: se envía la sala, no lo que pasó.

## Pruebas

```bash
npx tsc --noEmit                      # tipos
npx tsc -p tsconfig.pruebas.json      # compila la lógica para Node
node pruebas/motor.mjs                # el motor de combate, incluidas 300 peleas seguidas
node pruebas/sala.mjs                 # el flujo de la sala, en un celular y en dos

npx expo start --web                  # en otra terminal
node pruebas/ui.mjs                   # recorre la app entera en el navegador con Playwright
```

`pruebas/ui.mjs` juega un match completo y una pelea completa contra la app de verdad, sin
mocks. Es lo que ha cazado los peores fallos del proyecto.

## Monetización

Gratis con anuncios, y una compra única que los quita y desbloquea todos los personajes.
Va por RevenueCat sobre Google Play.

La capa de compras tiene dos modos y elige sola: si falta el módulo nativo o la llave, simula
la compra y guarda el estado en el teléfono, para poder seguir trabajando en Expo Go y en web.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
