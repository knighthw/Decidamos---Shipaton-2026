import { ScrollView, Text, StyleSheet } from 'react-native';
import { Pantalla } from '../componentes/Pantalla';
import { Cabecera } from '../componentes/Cabecera';
import { colores, espacio, texto } from '../tema';
import type { Ir } from '../navegacion';

/* Texto simple, sin relleno legal de plantilla: dice exactamente qué guarda la
   app y por qué, nada que no se pueda sostener. Sirve como pantalla dentro de
   la app; la URL pública que pide Play Console para anuncios/compras es aparte. */
export function Terminos({ ir }: { ir: Ir }) {
  return (
    <Pantalla>
      <Cabecera titulo="Términos y privacidad" onVolver={() => ir('ajustes')} />
      <ScrollView contentContainerStyle={e.cuerpo}>
        <Seccion titulo="Qué es Decidamos">
          Una app para decidir cosas en pareja o entre amigos: por match (swipe sobre
          opciones) o por pelea (un duelo de personajes decide). Se juega pasando el
          celular o cada quien desde el suyo, entrando con el código de la sala.
        </Seccion>

        <Seccion titulo="Tu cuenta">
          El nombre y el correo que usas para entrar se guardan solo en este celular,
          no en un servidor. Si desinstalas la app o borras sus datos, la cuenta
          desaparece. Puedes eliminarla en cualquier momento desde Perfil.
        </Seccion>

        <Seccion titulo="Las salas">
          Al crear o entrar a una sala, el código, el dilema, los nombres y los votos
          de esa partida se guardan temporalmente en un servidor (Supabase) para que
          los dos celulares se vean entre sí. No se usa para nada más que sincronizar
          esa partida.
        </Seccion>

        <Seccion titulo="Compras">
          Decidamos Pro se gestiona con RevenueCat y se cobra a través de Google Play.
          No compartimos tus datos de pago con nadie: los procesa Google Play
          directamente.
        </Seccion>

        <Seccion titulo="Anuncios">
          La versión gratuita muestra anuncios de Google AdMob, que puede usar el
          identificador de publicidad de tu Android para mostrarlos. Pasar a Pro los
          quita.
        </Seccion>

        <Seccion titulo="Lo que no hacemos">
          No vendemos tus datos a terceros ni los usamos para nada fuera de que la
          app funcione.
        </Seccion>
      </ScrollView>
    </Pantalla>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: string }) {
  return (
    <>
      <Text style={e.seccionTitulo}>{titulo}</Text>
      <Text style={e.seccionTexto}>{children}</Text>
    </>
  );
}

const e = StyleSheet.create({
  cuerpo: { gap: espacio.xs, paddingBottom: espacio.l },
  seccionTitulo: { fontSize: 14.5, fontWeight: '700', color: colores.tinta, marginTop: espacio.m },
  seccionTexto: { ...texto.pista, fontSize: 13.5, lineHeight: 19, marginTop: 3 },
});
