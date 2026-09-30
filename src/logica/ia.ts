/* Genera las 5 opciones de un dilema con IA (OpenRouter + Gemma), en vez del
   banco local fijo de opciones.ts. Si la IA falla o tarda demasiado —sin señal,
   límite gratuito saturado, respuesta rara— se cae al banco local: la pareja
   nunca se queda sin tarjetas que deslizar.

   La llave sale de EXPO_PUBLIC_OPENROUTER_API_KEY (ver .env.example). Al llevar
   el prefijo EXPO_PUBLIC_, Expo la incluye en el bundle de la app: correcto para
   un prototipo, pero cualquiera con el .apk podría extraerla. El día que esto
   se publique de verdad, esta llamada debe pasar por un servidor propio. */

import { generarOpciones, type Opcion } from './opciones';

const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const MODELO_PRINCIPAL = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free';
/* En proveedores distintos a propósito: cuando uno se satura, arrastra a todos sus
   modelos a la vez.

   OJO AL MANTENIMIENTO: el catálogo gratuito de OpenRouter cambia solo. minimax-m3
   desapareció (404) y liquid empezó a responder 200 con el mensaje vacío, las dos
   cosas sin avisar. Si la IA deja de funcionar, lo primero es comprobar los modelos
   uno a uno; la cascada de abajo aguanta que caiga cualquiera, pero no que caigan
   todos. Comprobados el 2026-09-08. */
const MODELOS_RESPALDO = [
  'inclusionai/ling-3.0-flash-sante:free',   // InclusionAI · ~4 s
  'nvidia/nemotron-3-super-120b-a12b:free',  // NVIDIA · ~11 s, lento pero sólido
  'google/gemma-4-31b-it:free',              // Google AI Studio · casi siempre saturado
];
/* Por intento, no para toda la cascada: antes un modelo lento se comía el tiempo
   de los demás y los dejaba sin oportunidad. */
const TIMEOUT_MS = 20000;

type OpcionIA = { emoji: string; titulo: string; descripcion: string; tags: string[] };

function construirPrompt(dilema: string, excluir: string[]): string {
  const nota = excluir.length
    ? `\nNo repitas estos títulos, ya se mostraron: ${excluir.join(', ')}.`
    : '';
  return `Eres el generador de opciones de "Decidamos", una app donde dos personas indecisas ` +
    `escriben un dilema y reciben 5 opciones para decidir juntas, deslizando cada una como en Tinder.\n\n` +
    `Dilema: "${dilema}"${nota}\n\n` +
    `Da exactamente 5 opciones concretas y variadas para resolver ese dilema. Responde SOLO con ` +
    `un array JSON, sin texto alrededor, con este formato exacto:\n` +
    `[{"emoji":"🍕","titulo":"Título corto","descripcion":"Una frase, máximo 90 caracteres.","tags":["Tag1","Tag2"]}]\n` +
    `Reglas: "emoji" es un solo emoji. "titulo" tiene 2-4 palabras. "descripcion" es una frase natural, ` +
    `sin repetir el título. "tags" son 1-2 palabras cortas (ej. "Rápido", "$$", "En casa"). Todo en español.`;
}

/* Saca el array JSON de la respuesta del modelo.

   Antes se usaba /\[[\s\S]*\]/, que es codicioso: iba del primer "[" al ÚLTIMO
   "]" de todo el texto. Si el modelo añadía una frase con corchetes después del
   JSON —"Aquí tienes [más ideas]", y lo hace pese a pedirle que no—, se llevaba esa
   basura dentro y JSON.parse petaba con "Unexpected non-whitespace character".

   Esto recorre desde el primer "[" contando corchetes y corta en el que de verdad
   cierra el array, ignorando los que estén dentro de una cadena. */
function extraerArray(texto: string): string | null {
  const inicio = texto.indexOf('[');
  if (inicio === -1) return null;

  let profundidad = 0;
  let enCadena = false;
  let escapado = false;

  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];

    if (enCadena) {
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }

    if (c === '"') enCadena = true;
    else if (c === '[') profundidad++;
    else if (c === ']') {
      profundidad--;
      if (profundidad === 0) return texto.slice(inicio, i + 1);
    }
  }
  return null;   // array sin cerrar: respuesta cortada a medias
}

async function llamarModelo(modelo: string, prompt: string, señal: AbortSignal): Promise<OpcionIA[]> {
  const respuesta = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: señal,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelo,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    }),
  });

  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const err: any = new Error(datos?.error?.message || 'Error de OpenRouter');
    err.status = datos?.error?.code || respuesta.status;
    throw err;
  }

  const contenido: string = datos.choices?.[0]?.message?.content ?? '';
  /* Los modelos gratuitos pequeños devuelven JSON roto de vez en cuando (se vio
     `"tags":["Ligero","Saludable"}]`, sin cerrar el array interno). Esos fallos se
     marcan como reintentables: no son culpa nuestra y el siguiente modelo puede
     acertar, así que la cascada debe seguir en vez de rendirse. */
  const malFormada = (mensaje: string) => {
    const e: any = new Error(mensaje);
    e.reintentable = true;
    return e;
  };

  const crudo = extraerArray(contenido);
  if (!crudo) throw malFormada('La IA no devolvió un JSON reconocible');

  let parseado: any;
  try {
    parseado = JSON.parse(crudo);
  } catch {
    throw malFormada('La IA devolvió un JSON inválido');
  }
  if (!Array.isArray(parseado) || parseado.length === 0) {
    throw malFormada('La IA devolvió una lista vacía');
  }
  return parseado;
}

/* Igual que generarOpciones(), pero pidiéndoselas a la IA primero.
   Devuelve siempre 5 Opcion completas (con id), sea cual sea el origen. */
export async function generarOpcionesIA(dilema: string, excluir: string[] = []): Promise<Opcion[]> {
  if (!API_KEY) {
    console.warn('EXPO_PUBLIC_OPENROUTER_API_KEY no configurada: usando banco local de opciones');
    return generarOpciones(dilema, excluir);
  }

  const prompt = construirPrompt(dilema, excluir);

  try {
    for (const modelo of [MODELO_PRINCIPAL, ...MODELOS_RESPALDO]) {
      // Cada modelo estrena su propio corte: si el primero agota los 20 s, los
      // siguientes siguen teniendo sus 20 s en vez de morir nada más empezar.
      const controlador = new AbortController();
      const corte = setTimeout(() => controlador.abort(), TIMEOUT_MS);
      try {
        const crudas = await llamarModelo(modelo, prompt, controlador.signal);
        return crudas.slice(0, 5).map((o, i) => ({
          id: `ia${i}-${o.titulo}`,
          emoji: o.emoji || '💡',
          titulo: o.titulo || 'Opción',
          descripcion: o.descripcion || '',
          tags: Array.isArray(o.tags) ? o.tags.slice(0, 2) : [],
        }));
      } catch (err: any) {
        // Errores del MODELO: probar el siguiente de la lista tiene sentido.
        //   429 = saturado (pasa a diario con los gratuitos)
        //   404 = el modelo ya no existe; OpenRouter retira los :free cada tanto
        //   400/503 = el proveedor lo tiene caído o no acepta la petición
        // Lo demás (401 llave inválida, JSON roto) no se arregla cambiando de modelo.
        const ERRORES_DE_MODELO = [400, 404, 429, 502, 503];
        const valeLaPenaReintentar = ERRORES_DE_MODELO.includes(err?.status)
          || err?.name === 'AbortError'      // este modelo tardó demasiado
          || err?.reintentable === true;     // respondió, pero con JSON roto
        if (!valeLaPenaReintentar) throw err;
        console.warn(`Modelo ${modelo} no disponible (${err?.status || err?.name}), probando siguiente…`);
      } finally {
        clearTimeout(corte);
      }
    }
    throw new Error('Todos los modelos de IA fallaron');
  } catch (err) {
    console.warn('Generación con IA falló, usando banco local:', err);
    return generarOpciones(dilema, excluir);
  }
}
