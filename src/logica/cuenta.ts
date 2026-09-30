/* ─────────────────────────────────────────────────────────────────────────────
   Cuentas (provisional, todo en el teléfono)

   No hay servidor todavía, así que el registro y el inicio de sesión viven en
   AsyncStorage: las cuentas creadas en este celular solo existen en este celular.
   Cuando haya servidor, estas cuatro funciones (registrar, entrar, salir, cargar)
   pasan a ser llamadas de red y el resto de la app no se entera.

   La clave NO se guarda tal cual, pero tampoco está protegida de verdad: la huella
   de abajo es una función corta y pública, no criptografía. Sirve para que la clave
   no se lea de un vistazo en el almacenamiento del teléfono, nada más. La
   comprobación en serio es cosa del servidor, así que nadie debería reutilizar aquí
   una clave que use en otro sitio.
   ──────────────────────────────────────────────────────────────────────────── */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_CUENTAS = 'decidamos:cuentas';
const CLAVE_SESION = 'decidamos:sesion';

export type Usuario = {
  correo: string;
  nombre: string;
  creado: number;
};

type Registro = Usuario & { huella: string; sal: string };

export type Resultado = { ok: true; usuario: Usuario } | { ok: false; error: string };

/* La cuenta con la que se puede entrar mientras no haya servidor. Se muestra en la
   pantalla de acceso a propósito: es de prueba y está pensada para compartirse. */
export const CUENTA_PRUEBA = {
  correo: 'prueba@decidamos.app',
  clave: 'decidamos',
  nombre: 'Cuenta de prueba',
} as const;

const MIN_CLAVE = 6;

let cuentas: Registro[] = [];
let sesion: Usuario | null = null;
let cargada = false;
const oyentes: Array<() => void> = [];

// ─── Utilidades ──────────────────────────────────────────────────────────────

/* Huella de la clave. Repetir el recorrido varias veces no la hace segura; solo
   evita guardar la clave en claro. Ver la nota de arriba. */
function huella(clave: string, sal: string): string {
  let h = 2166136261;
  const mezcla = `${sal}:${clave}:${sal}`;
  for (let vuelta = 0; vuelta < 200; vuelta++) {
    for (let i = 0; i < mezcla.length; i++) {
      h ^= mezcla.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return (h >>> 0).toString(36);
}

const nuevaSal = () => Math.random().toString(36).slice(2, 10);

const normalizar = (correo: string) => correo.trim().toLowerCase();

/* Validación deliberadamente laxa: algo antes de la arroba, algo después y un punto.
   Ser más estricto solo sirve para rechazar correos raros que sí existen. */
const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo);

const soloUsuario = ({ correo, nombre, creado }: Registro): Usuario => ({ correo, nombre, creado });

function avisar() {
  oyentes.slice().forEach((cb) => cb());
}

async function guardarCuentas() {
  try {
    await AsyncStorage.setItem(CLAVE_CUENTAS, JSON.stringify(cuentas));
  } catch {
    // Sin espacio: la cuenta vale para esta sesión y se pierde al cerrar
  }
}

// ─── Consultas ───────────────────────────────────────────────────────────────

export function obtener(): Usuario | null {
  return sesion;
}

/** false mientras no se ha leído el disco: la app no sabe aún si hay sesión. */
export function estaCargada(): boolean {
  return cargada;
}

export function suscribir(cb: () => void): () => void {
  oyentes.push(cb);
  return () => {
    const i = oyentes.indexOf(cb);
    if (i >= 0) oyentes.splice(i, 1);
  };
}

// ─── Arranque ────────────────────────────────────────────────────────────────

/* Se llama una vez al abrir la app: lee las cuentas y la sesión abierta, y se
   asegura de que la cuenta de prueba exista siempre. */
export async function cargar(): Promise<void> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE_CUENTAS);
    const guardadas = crudo ? (JSON.parse(crudo) as Registro[]) : [];
    if (Array.isArray(guardadas)) {
      cuentas = guardadas.filter((c) => c?.correo && c?.huella && c?.sal);
    }
  } catch {
    cuentas = [];
  }

  if (!cuentas.some((c) => c.correo === CUENTA_PRUEBA.correo)) {
    const sal = nuevaSal();
    cuentas.push({
      correo: CUENTA_PRUEBA.correo,
      nombre: CUENTA_PRUEBA.nombre,
      creado: Date.now(),
      sal,
      huella: huella(CUENTA_PRUEBA.clave, sal),
    });
    await guardarCuentas();
  }

  try {
    const correo = await AsyncStorage.getItem(CLAVE_SESION);
    const cuenta = correo ? cuentas.find((c) => c.correo === correo) : undefined;
    sesion = cuenta ? soloUsuario(cuenta) : null;
  } catch {
    sesion = null;
  }

  cargada = true;
  avisar();
}

// ─── Acciones ────────────────────────────────────────────────────────────────

export async function registrar(
  { nombre, correo, clave }: { nombre: string; correo: string; clave: string },
): Promise<Resultado> {
  const n = nombre.trim();
  const c = normalizar(correo);

  if (n.length < 2) return { ok: false, error: 'Escribe tu nombre.' };
  if (!correoValido(c)) return { ok: false, error: 'Ese correo no parece válido.' };
  if (clave.length < MIN_CLAVE) {
    return { ok: false, error: `La contraseña necesita al menos ${MIN_CLAVE} caracteres.` };
  }
  if (cuentas.some((x) => x.correo === c)) {
    return { ok: false, error: 'Ya hay una cuenta con ese correo en este celular.' };
  }

  const sal = nuevaSal();
  const cuenta: Registro = { correo: c, nombre: n, creado: Date.now(), sal, huella: huella(clave, sal) };
  cuentas.push(cuenta);
  await guardarCuentas();
  return abrirSesion(cuenta);
}

export async function entrar(correo: string, clave: string): Promise<Resultado> {
  const c = normalizar(correo);
  const cuenta = cuentas.find((x) => x.correo === c);

  /* El mismo mensaje si no existe la cuenta o si la clave no cuadra: así no se
     puede averiguar qué correos están registrados probando uno a uno. */
  const generico = 'Correo o contraseña incorrectos.';
  if (!c || !clave) return { ok: false, error: 'Completa el correo y la contraseña.' };
  if (!cuenta || cuenta.huella !== huella(clave, cuenta.sal)) {
    return { ok: false, error: generico };
  }
  return abrirSesion(cuenta);
}

async function abrirSesion(cuenta: Registro): Promise<Resultado> {
  sesion = soloUsuario(cuenta);
  try {
    await AsyncStorage.setItem(CLAVE_SESION, cuenta.correo);
  } catch {
    // La sesión vale para este rato; al cerrar la app habrá que entrar de nuevo
  }
  avisar();
  return { ok: true, usuario: sesion };
}

export async function salir(): Promise<void> {
  sesion = null;
  try {
    await AsyncStorage.removeItem(CLAVE_SESION);
  } catch {
    // Da igual: en memoria ya no hay sesión
  }
  avisar();
}

/* Borra la cuenta de este celular (no hay servidor donde borrarla también). */
export async function eliminar(): Promise<void> {
  if (!sesion) return;
  cuentas = cuentas.filter((c) => c.correo !== sesion!.correo);
  await guardarCuentas();
  sesion = null;
  try {
    await AsyncStorage.removeItem(CLAVE_SESION);
  } catch {
    // Da igual: en memoria ya no hay sesión
  }
  avisar();
}

/* Cambiar el nombre visible. El correo no se toca: identifica la cuenta. */
export async function cambiarNombre(nombre: string): Promise<Resultado> {
  const n = nombre.trim();
  if (n.length < 2) return { ok: false, error: 'Escribe tu nombre.' };
  if (!sesion) return { ok: false, error: 'No hay ninguna sesión abierta.' };

  const cuenta = cuentas.find((c) => c.correo === sesion!.correo);
  if (!cuenta) return { ok: false, error: 'No hay ninguna sesión abierta.' };

  cuenta.nombre = n;
  await guardarCuentas();
  sesion = soloUsuario(cuenta);
  avisar();
  return { ok: true, usuario: sesion };
}
