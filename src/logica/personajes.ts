/* Catálogo de personajes del modo Pelea.
   Datos puros, sin DOM: este archivo se copia tal cual al portar.

   CUATRO animales, cada uno con 4 habilidades propias y una PASIVA siempre activa.

   Las cuatro stats (vida · ataque · defensa · velocidad) y los números de las
   habilidades salieron de balancear por simulación: se jugaron ~5 millones de peleas
   (todos los cruces, todos los estilos de juego) y se ajustó el ataque de cada animal
   hasta que los cuatro ganan el 50 % en juego casual. En juego experto el sistema es
   un piedra-papel-tijera: Oso → Serpiente → Tortuga → Águila → Oso.

   Efectos que entiende el motor (battle.ts):
     dano        potencia de la habilidad (entra en la fórmula, NO es el daño final)
     curar       vida que recupera quien la usa
     escudo      reduce el daño recibido esta ronda, en porcentaje (0-1)
     esquivar    probabilidad de anular por completo el daño de esta ronda (0-1)
     reflejo     devuelve al atacante este % de lo que el escudo bloqueó (0-1)
     veneno      { dano, rondas } daño al rival al final de cada ronda
     bajaAtaque  baja N niveles el Ataque del rival (persistente, acumulable)
     subeAtaque  sube N niveles el Ataque propio (persistente, tipo Danza Espada)
     recarga     rondas que la habilidad queda bloqueada tras usarla
     limpiar     quita el veneno de quien la usa

   Nota sobre escudo/esquivar: si se repiten en rondas seguidas, su efecto baja a un
   tercio cada vez (como Protección en Pokémon). Cambiar de habilidad lo reinicia.

   Pasivas:
     aguante       la 1ª vez que baja del 33 % de vida: +2 de Ataque (una vez por pelea)
     coraza        recibe 13 % menos daño y devuelve el 15 % de cada golpe (púas)
     pielVenenosa  quien la golpea pierde un 8 % extra y tiene 30 % de envenenarse
     ojoDeHalcon   crítico al 11 % (no 8 %) y actúa primero en la ronda 1
*/

export type Pasiva = 'aguante' | 'coraza' | 'pielVenenosa' | 'ojoDeHalcon';

export type Habilidad = {
  id: string;
  nombre: string;
  emoji: string;
  texto: string;
  dano: number;
  curar?: number;
  escudo?: number;
  esquivar?: number;
  reflejo?: number;
  veneno?: { dano: number; rondas: number };
  bajaAtaque?: number;
  subeAtaque?: number;
  recarga?: number;
  limpiar?: boolean;
};

export type Personaje = {
  id: string;
  nombre: string;
  emoji: string;
  frase: string;
  vida: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  pasiva: Pasiva;
  pasivaTexto: string;
  habilidades: Habilidad[];
};

export const PERSONAJES: Personaje[] = [
  {
    id: 'oso',
    nombre: 'Oso',
    emoji: '🐻',
    frase: 'Lento, pero cada golpe se siente',
    vida: 108, ataque: 18, defensa: 13, velocidad: 4,
    pasiva: 'aguante',
    pasivaTexto: 'Aguante — la 1ª vez que baja del 33 % de vida, +2 de Ataque',
    habilidades: [
      { id: 'zarpazo',   nombre: 'Zarpazo',   emoji: '🐾', dano: 13,
        texto: 'Un golpe seco y directo.' },
      { id: 'embestida', nombre: 'Embestida', emoji: '💥', dano: 22, recarga: 2,
        texto: 'Devastadora, pero queda agotado dos rondas.' },
      { id: 'rugido',    nombre: 'Rugido',    emoji: '📢', dano: 7, bajaAtaque: 1,
        texto: 'El rival pega más flojo. Se puede repetir.' },
      { id: 'hibernar',  nombre: 'Hibernar',  emoji: '😴', dano: 0, curar: 12, escudo: 0.35,
        texto: 'Recupera vida y aguanta parte del daño.' },
    ],
  },

  {
    id: 'tortuga',
    nombre: 'Tortuga',
    emoji: '🐢',
    frase: 'Gana el que sigue de pie',
    vida: 135, ataque: 9, defensa: 20, velocidad: 2,
    pasiva: 'coraza',
    pasivaTexto: 'Coraza — recibe 13 % menos daño y devuelve el 15 % de cada golpe',
    habilidades: [
      { id: 'cabezazo',  nombre: 'Cabezazo',  emoji: '💢', dano: 12,
        texto: 'Sin elegancia, pero funciona.' },
      { id: 'caparazon', nombre: 'Caparazón', emoji: '🛡️', dano: 5, escudo: 0.75, reflejo: 0.5,
        texto: 'Se encierra: casi no recibe daño y devuelve la mitad de lo que bloquea.' },
      { id: 'girar',     nombre: 'Giro',      emoji: '🌀', dano: 22, recarga: 1,
        texto: 'Gira sobre sí misma. Después queda mareada.' },
      { id: 'paciencia', nombre: 'Paciencia', emoji: '🧘', dano: 0, curar: 13, escudo: 0.4, limpiar: true,
        texto: 'Se toma su tiempo: cura, aguanta y se quita el veneno.' },
    ],
  },

  {
    id: 'serpiente',
    nombre: 'Serpiente',
    emoji: '🐍',
    frase: 'No hace falta ganar rápido',
    vida: 106, ataque: 18, defensa: 14, velocidad: 7,
    pasiva: 'pielVenenosa',
    pasivaTexto: 'Piel venenosa — quien la golpea pierde un 8 % extra y 30 % de envenenarse',
    habilidades: [
      { id: 'colmillo',    nombre: 'Colmillo',    emoji: '🦷', dano: 12,
        texto: 'Una dentellada limpia.' },
      { id: 'veneno',      nombre: 'Veneno',      emoji: '🧪', dano: 4,
        veneno: { dano: 7, rondas: 3 },
        texto: 'Envenena: 7 de daño al final de las próximas 3 rondas.' },
      { id: 'constriccion',nombre: 'Constricción',emoji: '🪢', dano: 17, recarga: 1,
        texto: 'Aprieta con todo. Necesita recuperarse después.' },
      { id: 'muda',        nombre: 'Muda',        emoji: '✨', dano: 0, curar: 12, limpiar: true,
        texto: 'Cambia de piel: cura y se quita el veneno de encima.' },
    ],
  },

  {
    id: 'aguila',
    nombre: 'Águila',
    emoji: '🦅',
    frase: 'Golpea antes de que la veas',
    vida: 82, ataque: 27, defensa: 10, velocidad: 10,
    pasiva: 'ojoDeHalcon',
    pasivaTexto: 'Ojo de halcón — crítico al 11 % y actúa primero en la ronda 1',
    habilidades: [
      { id: 'picotazo', nombre: 'Picotazo', emoji: '🪶', dano: 17,
        texto: 'Preciso y muy rápido.' },
      { id: 'rasante',  nombre: 'Rasante',  emoji: '🌬️', dano: 10, esquivar: 0.55,
        texto: 'Ataca en picada y sale volando.' },
      { id: 'garras',   nombre: 'Garras',   emoji: '🦶', dano: 22, recarga: 1,
        texto: 'Se lanza con todo el peso. Luego debe remontar.' },
      { id: 'vista',    nombre: 'Vista de halcón', emoji: '👁️', dano: 0, subeAtaque: 2,
        texto: 'Encuentra el punto débil: sube tu Ataque el resto de la pelea.' },
    ],
  },
];

export function buscarPersonaje(id: string): Personaje | null {
  return PERSONAJES.find((p) => p.id === id) || null;
}

export function buscarHabilidad(idPersonaje: string, idHabilidad: string): Habilidad | null {
  const p = buscarPersonaje(idPersonaje);
  return p ? p.habilidades.find((h) => h.id === idHabilidad) || null : null;
}
