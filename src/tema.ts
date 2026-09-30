/* Los tokens del prototipo web, traducidos a objeto.
   Antes vivían en :root del CSS; aquí los importa cada StyleSheet. */

export const colores = {
  /* Los dos jugadores. El rojo es quien crea la sala, el azul quien entra, y esa
     pareja se repite en toda la app: avatares, votos, luchadores de la arena.
     Cuando aparecen juntos (marca, botón de pelea) representan a los dos decidiendo. */
  rojo: '#DA261C',
  rojoContraste: '#741511',
  rojoSuave: '#fdeceb',
  rojoBorde: '#f7d2cf',

  azul: '#0C1E8B',
  azulContraste: '#081456',
  azulSuave: '#eceefa',
  azulBorde: '#ccd2ef',

  celeste: '#4CC9F0',
  celesteClaro: '#d7effa',   // fondo de formularios: los campos blancos resaltan encima

  /* Sí y no se quedan en verde y rojo: es lo que se entiende sin pensar, y el
     swipe es el gesto central de la app. El rojo del "no" sí es el de la paleta. */
  si: '#12A150',
  siSuave: '#e6f6ec',
  no: '#DA261C',
  noSuave: '#fdeceb',

  /* Negros: el normal para lo neutro, y #030624 para contraste y fondos oscuros */
  negro: '#000000',
  negroContraste: '#030624',

  /* Grises con tinte azulado, derivados del negro de contraste, para que la
     escala de textos no desentone con la paleta */
  tinta: '#030624',
  tinta2: '#4a5170',
  tinta3: '#8b90a8',
  linea: '#e3e5ef',
  fondo: '#ffffff',
  fondo2: '#f5f6fb',

  /* Arena de la pelea: gris oscuro neutro, para que el rojo y el azul de los
     luchadores sean lo único con color en pantalla */
  arena1: '#3a3d44',
  arena2: '#24262b',
  vidaHerido: '#f59e0b',
  critico: '#fbbf24',
} as const;

/* Los degradados del CSS, como pares de colores para expo-linear-gradient */
export const degradados = {
  /* Fondo general: claro y con un punto de azul, para que el blanco no quede plano */
  app: ['#f7f9ff', '#eef1fb', '#e6ebf8'],
  /* La portada del match: del blanco al celeste, sin más */
  portada: ['#ffffff', '#d6f1fb', colores.celeste],
  /* Formularios: un celeste claro y parejo, para que los campos blancos destaquen */
  formulario: [colores.celesteClaro, '#cbe9f7'],

  rojo: [colores.rojo, colores.rojoContraste],
  azul: [colores.azul, colores.azulContraste],
  /* Los dos jugadores juntos: marca y todo lo que enfrenta a uno con otro */
  duelo: [colores.rojo, colores.azul],

  arena: [colores.arena1, colores.arena2],
  reto: [colores.rojoSuave, colores.azulSuave],
  veredicto: [colores.azulSuave, colores.rojoSuave],
  /* Un fondo distinto por tarjeta, para que el mazo no se vea repetido.
     Se mantienen vivos y variados: los colores de marca visten la app, no las ideas. */
  tarjeta: [
    ['#fff1ee', '#ffe0dc'],
    ['#e9eefc', '#d8e0f7'],
    ['#e8f8f0', '#d3f0e2'],
    ['#fff6e6', '#ffeac4'],
    ['#f0ecfb', '#e0d8f6'],
  ],
} as const;

export const radios = { chico: 12, medio: 18, grande: 28, redondo: 999 } as const;

export const espacio = { xs: 6, s: 10, m: 16, l: 22, xl: 30 } as const;

/* En iOS la sombra son cuatro propiedades; en Android, elevation. Hay que dar las dos. */
export const sombras = {
  tarjeta: {
    shadowColor: colores.negroContraste,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  suave: {
    shadowColor: colores.negroContraste,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  boton: {
    shadowColor: colores.rojo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  botonPelea: {
    shadowColor: colores.azul,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

export const texto = {
  titulo: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6, color: colores.tinta },
  subtitulo: { fontSize: 18, fontWeight: '700' as const, color: colores.tinta },
  cuerpo: { fontSize: 15, color: colores.tinta2, lineHeight: 22 },
  etiqueta: { fontSize: 13, fontWeight: '600' as const, color: colores.tinta2 },
  pista: { fontSize: 12.5, color: colores.tinta3 },
} as const;
