/* Banco de opciones simuladas.
   Portado tal cual del prototipo web: no toca el navegador, solo añade tipos.
   En la versión final esto lo genera la IA a partir del dilema. */

export type Opcion = {
  id: string;
  emoji: string;
  titulo: string;
  descripcion: string;
  tags: string[];
};

type OpcionBase = Omit<Opcion, 'id'>;

type Categoria = {
  claves: string[];
  opciones: OpcionBase[];
};

const CATEGORIAS: Record<string, Categoria> = {
  comida: {
    // raices, no palabras completas: "cenamos" debe caer aqui igual que "cenar"
    claves: ['comer', 'comid', 'comemos', 'cena', 'almor', 'hambre', 'restaurante',
             'desayun', 'cocin', 'antojo', 'picar', 'pedir'],
    opciones: [
      { emoji: '🍕', titulo: 'Pizza a domicilio',   descripcion: 'La opción segura. Llega caliente y no hay que lavar platos.', tags: ['Rápido', '$$'] },
      { emoji: '🌮', titulo: 'Tacos en la esquina', descripcion: 'Salir a caminar un rato y comer algo callejero.',              tags: ['Barato', 'Salir'] },
      { emoji: '🍜', titulo: 'Ramen japonés',       descripcion: 'Ese lugar que dijeron que iban a probar hace meses.',           tags: ['Nuevo', '$$$'] },
      { emoji: '🥗', titulo: 'Algo saludable',      descripcion: 'Bowl de pollo, verduras y quinoa. El cuerpo lo agradece.',      tags: ['Sano', '$$'] },
      { emoji: '🍳', titulo: 'Cocinar con lo que hay', descripcion: 'Abrir el refrigerador e improvisar. Cero pesos gastados.',   tags: ['Gratis', 'En casa'] },
      { emoji: '🍔', titulo: 'Hamburguesas',        descripcion: 'Nadie se arrepiente de una buena hamburguesa.',                 tags: ['Clásico', '$$'] },
      { emoji: '🍣', titulo: 'Sushi',               descripcion: 'Para cuando el día merece un premio.',                          tags: ['Antojo', '$$$'] },
      { emoji: '🍝', titulo: 'Pasta casera',        descripcion: 'Media hora de trabajo y alcanza para repetir.',                 tags: ['En casa', '$'] },
      { emoji: '🥟', titulo: 'Comida china',        descripcion: 'Pedir de más y comer las sobras mañana.',                       tags: ['Rápido', '$$'] },
      { emoji: '🌯', titulo: 'Lo que sobró ayer',   descripcion: 'Calentar el refractario y no pensarlo tanto.',                  tags: ['Gratis', '5 min'] },
    ],
  },

  viaje: {
    claves: ['viaj', 'vacacion', 'destino', 'playa', 'montana', 'vuelo',
             'hotel', 'escapada', 'conocer', 'turismo'],
    opciones: [
      { emoji: '🏝️', titulo: 'Escapada a la playa',   descripcion: 'Sol, nada de agenda y el celular en modo avión.',        tags: ['Descanso', '3 días'] },
      { emoji: '⛰️', titulo: 'Cabaña en la montaña',  descripcion: 'Frío, chimenea y silencio. Señal débil incluida.',        tags: ['Tranquilo', '$$'] },
      { emoji: '🏙️', titulo: 'Ciudad grande',         descripcion: 'Museos, comida rara y caminar hasta que duelan los pies.', tags: ['Activo', '$$$'] },
      { emoji: '🚗', titulo: 'Road trip sin destino', descripcion: 'Cargar el carro, elegir una carretera y ver qué pasa.',    tags: ['Aventura', 'Flexible'] },
      { emoji: '🏡', titulo: 'Quedarse en casa',      descripcion: 'Vacaciones en el sillón. Ahorrar para un viaje más grande.', tags: ['Gratis', 'Honesto'] },
      { emoji: '🎒', titulo: 'Pueblo cercano',        descripcion: 'Dos horas de camino, un fin de semana distinto.',          tags: ['Barato', '2 días'] },
      { emoji: '✈️', titulo: 'Vuelo en oferta',       descripcion: 'Buscar el vuelo más barato del mes y comprarlo sin pensar.', tags: ['Sorpresa', '$$'] },
      { emoji: '🏛️', titulo: 'Ciudad con historia',   descripcion: 'Calles viejas, museos y comer sin horario fijo.',          tags: ['Cultural', '$$'] },
      { emoji: '💧', titulo: 'Lago o río',            descripcion: 'Agua dulce, menos gente y mucho más barato que la costa.',  tags: ['Tranquilo', '$'] },
      { emoji: '🎪', titulo: 'Ir a un festival',      descripcion: 'Que el viaje gire alrededor de un evento con fecha.',      tags: ['Planeado', '$$$'] },
    ],
  },

  entretenimiento: {
    claves: ['pelicul', 'peli', 'serie', 'netflix', 'cine', 'document',
             'maraton', 'streaming', 'vemos', 'capitulo'],
    opciones: [
      { emoji: '🎬', titulo: 'Cine en casa',        descripcion: 'Proyector, palomitas y luces apagadas.',              tags: ['En casa', 'Gratis'] },
      { emoji: '😂', titulo: 'Comedia ligera',      descripcion: 'Algo que no exija concentración ni subtítulos.',       tags: ['Ligero', '90 min'] },
      { emoji: '😱', titulo: 'Terror',              descripcion: 'Para taparse los ojos y no dormir después.',           tags: ['Intenso', '2 h'] },
      { emoji: '🕵️', titulo: 'Documental de crimen', descripcion: 'Empezar uno y terminar viendo tres capítulos.',       tags: ['Adictivo', 'Serie'] },
      { emoji: '🍿', titulo: 'Ir al cine de verdad', descripcion: 'Salir de casa, pantalla grande y sonido a todo volumen.', tags: ['Salir', '$$'] },
      { emoji: '🎮', titulo: 'Videojuego en pareja', descripcion: 'Cooperativo, para no terminar peleados.',             tags: ['Juntos', 'En casa'] },
      { emoji: '📺', titulo: 'Volver a ver la favorita', descripcion: 'Cero riesgo, se sabe que es buena.',              tags: ['Seguro', 'Nostalgia'] },
      { emoji: '🎞️', titulo: 'Un clásico pendiente',  descripcion: 'Esa película que todos citan y ninguno de los dos vio.', tags: ['Cultura', '2 h'] },
      { emoji: '🎧', titulo: 'Podcast y no pantalla', descripcion: 'Escuchar algo mientras hacen otra cosa.',              tags: ['Ligero', 'Gratis'] },
      { emoji: '🌏', titulo: 'Algo en otro idioma',   descripcion: 'Cine coreano, francés o lo que sea. Con subtítulos.',  tags: ['Nuevo', '2 h'] },
    ],
  },

  plan: {
    claves: ['plan', 'salir', 'salimos', 'hacer', 'hacemos', 'finde', 'fin de semana',
             'sabado', 'domingo', 'aburrid', 'noche', 'tarde'],
    opciones: [
      { emoji: '🎳', titulo: 'Boliche',            descripcion: 'Competencia sana y música alta.',                    tags: ['Activo', '$$'] },
      { emoji: '☕', titulo: 'Café y conversación', descripcion: 'Un lugar tranquilo, sin prisa y sin celulares.',      tags: ['Tranquilo', '$'] },
      { emoji: '🥾', titulo: 'Caminata al aire libre', descripcion: 'Parque, cerro o lo que quede cerca. Aire fresco.',  tags: ['Gratis', 'Mañana'] },
      { emoji: '🎨', titulo: 'Algo creativo',      descripcion: 'Taller de cerámica, pintura o cocina. Aprender algo nuevo.', tags: ['Nuevo', '$$'] },
      { emoji: '🎤', titulo: 'Karaoke',            descripcion: 'Cantar mal sin vergüenza durante dos horas.',          tags: ['Divertido', 'Noche'] },
      { emoji: '🛋️', titulo: 'No hacer nada',      descripcion: 'Quedarse en casa sin planes. También es un plan.',     tags: ['Gratis', 'Descanso'] },
      { emoji: '🎲', titulo: 'Noche de juegos de mesa', descripcion: 'Invitar gente o jugar de a dos.',                 tags: ['En casa', 'Barato'] },
      { emoji: '🚲', titulo: 'Salir en bici',      descripcion: 'Sin ruta fija, hasta donde aguanten las piernas.',    tags: ['Gratis', 'Activo'] },
      { emoji: '🛍️', titulo: 'Mercado o feria',    descripcion: 'Curiosear puestos aunque no compren nada.',           tags: ['Mañana', '$'] },
      { emoji: '🎵', titulo: 'Música en vivo',     descripcion: 'Un bar chico con banda tocando. Sin conocerla antes.', tags: ['Noche', '$$'] },
    ],
  },

  regalo: {
    claves: ['regal', 'cumplea', 'aniversario', 'navidad', 'obsequio', 'sorpresa'],
    opciones: [
      { emoji: '🎁', titulo: 'Una experiencia juntos', descripcion: 'Un concierto, una cena o un curso. Recuerdos > objetos.', tags: ['Memorable', '$$$'] },
      { emoji: '📖', titulo: 'Algo hecho a mano',   descripcion: 'Toma tiempo, cuesta poco y se nota el cariño.',        tags: ['Personal', '$'] },
      { emoji: '💻', titulo: 'Algo tecnológico',    descripcion: 'Práctico, se usa todos los días y no falla.',          tags: ['Útil', '$$$'] },
      { emoji: '🌿', titulo: 'Algo para su casa',   descripcion: 'Una planta, una lámpara, algo que vea a diario.',      tags: ['Seguro', '$$'] },
      { emoji: '💳', titulo: 'Tarjeta de regalo',   descripcion: 'Menos romántico, cero riesgo de equivocarse.',         tags: ['Práctico', '$$'] },
      { emoji: '👕', titulo: 'Ropa o accesorio',    descripcion: 'Requiere conocer bien la talla y el gusto.',           tags: ['Riesgoso', '$$'] },
      { emoji: '🍰', titulo: 'Sorpresa en persona', descripcion: 'Aparecer con pastel sin avisar. El gesto es el regalo.', tags: ['Gratis', 'Emotivo'] },
      { emoji: '🎟️', titulo: 'Entradas a algo',     descripcion: 'Concierto, teatro o partido. Con fecha en el calendario.', tags: ['Memorable', '$$$'] },
      { emoji: '📸', titulo: 'Álbum de fotos',      descripcion: 'Imprimir los recuerdos que llevan años en el celular.',   tags: ['Personal', '$$'] },
      { emoji: '🧴', titulo: 'Algo de su rutina',   descripcion: 'Eso que usa a diario, pero de mejor calidad.',           tags: ['Útil', '$$'] },
    ],
  },

  generico: {
    claves: [],
    opciones: [
      { emoji: '✅', titulo: 'Seguir el plan original',   descripcion: 'No cambiar nada. A veces la primera idea era la buena.',   tags: ['Seguro'] },
      { emoji: '🔄', titulo: 'Probar la alternativa',     descripcion: 'Cambiar de rumbo y ver qué pasa. Siempre se puede volver.', tags: ['Cambio'] },
      { emoji: '⏳', titulo: 'Esperar una semana',        descripcion: 'Dejar que la decisión se aclare sola con un poco de tiempo.', tags: ['Paciencia'] },
      { emoji: '🤝', titulo: 'Buscar un punto medio',     descripcion: 'Un poco de cada opción, sin descartar ninguna del todo.',   tags: ['Acuerdo'] },
      { emoji: '🎲', titulo: 'Dejarlo al azar',           descripcion: 'Lanzar una moneda y respetar el resultado, pase lo que pase.', tags: ['Rápido'] },
      { emoji: '🗣️', titulo: 'Preguntarle a alguien más', descripcion: 'Una opinión externa suele ver lo que ustedes no ven.',      tags: ['Ayuda'] },
      { emoji: '❌', titulo: 'Descartar las dos',         descripcion: 'Quizá el problema es la pregunta, no la respuesta.',        tags: ['Radical'] },
      { emoji: '📝', titulo: 'Escribir pros y contras',   descripcion: 'Cada quien su lista, y después las comparan.',             tags: ['Ordenado'] },
      { emoji: '🧪', titulo: 'Probar en pequeño primero', descripcion: 'Comprometerse a medias antes de comprometerse del todo.',  tags: ['Prudente'] },
      { emoji: '⚡', titulo: 'Decidir ya, sin pensarlo',  descripcion: 'La primera respuesta que salga. Ganar tiempo vale más.',    tags: ['Rápido'] },
    ],
  },
};

/* Quita acentos y pasa a minúsculas, para que "película" y "pelicula" sean lo mismo. */

/* Quita acentos y pasa a minúsculas, para que "película" y "pelicula" sean lo mismo. */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* Devuelve el nombre de la categoría que mejor coincide con el texto del dilema. */
export function detectarCategoria(texto: string): string {
  const t = normalizar(texto);
  let mejor = 'generico';
  let mejorPuntaje = 0;

  for (const [nombre, cat] of Object.entries(CATEGORIAS)) {
    const puntaje = cat.claves.filter((clave) => t.includes(clave)).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = nombre;
    }
  }
  return mejor;
}

/* Genera 5 opciones para el dilema. `excluir` son títulos ya mostrados,
   para que "generar 5 nuevas" no repita las mismas. */
export function generarOpciones(dilema: string, excluir: string[] = []): Opcion[] {
  const categoria = detectarCategoria(dilema);
  const banco = CATEGORIAS[categoria].opciones;

  const mezclar = (arr: OpcionBase[]) => arr.slice().sort(() => Math.random() - 0.5);

  const frescas = mezclar(banco.filter((o) => !excluir.includes(o.titulo)));
  // Si el banco se agota, se repiten las ya vistas, pero siempre al final
  const repetidas = mezclar(banco.filter((o) => excluir.includes(o.titulo)));

  return [...frescas, ...repetidas]
    .slice(0, 5)
    .map((o, i) => ({ ...o, id: `op${i}-${o.titulo}` }));
}
