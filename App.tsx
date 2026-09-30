import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Sala from './src/logica/sala';
import { useSala } from './src/logica/useSala';
import { guardar, limpiar } from './src/logica/persistencia';
import { inicializarCompras } from './src/logica/compras';
import { inicializarAnuncios } from './src/logica/anuncios';
import { cargar as cargarPreferencias } from './src/logica/preferencias';
import * as Cuenta from './src/logica/cuenta';
import { useCuenta } from './src/logica/useCuenta';
import { esRaiz, type Ir, type NombrePantalla, type DatosIr } from './src/navegacion';
import { BarraInferior } from './src/componentes/BarraInferior';

import { Inicio } from './src/pantallas/Inicio';
import { InicioPelea } from './src/pantallas/InicioPelea';
import { Ajustes } from './src/pantallas/Ajustes';
import { Entrar } from './src/pantallas/Entrar';
import { Dilema } from './src/pantallas/Dilema';
import { SalaEspera } from './src/pantallas/SalaEspera';
import { Generando } from './src/pantallas/Generando';
import { Swipe } from './src/pantallas/Swipe';
import { Relevo } from './src/pantallas/Relevo';
import { Resultados } from './src/pantallas/Resultados';
import { Apuesta } from './src/pantallas/Apuesta';
import { Personajes } from './src/pantallas/Personajes';
import { Arena } from './src/pantallas/Arena';
import { Veredicto } from './src/pantallas/Veredicto';
import { Paywall } from './src/pantallas/Paywall';
import { Acceso } from './src/pantallas/Acceso';
import { Registro } from './src/pantallas/Registro';
import { Perfil } from './src/pantallas/Perfil';
import { Terminos } from './src/pantallas/Terminos';

export default function App() {
  const [pantalla, setPantalla] = useState<NombrePantalla>('inicio');
  const [proposito, setProposito] = useState<'match' | 'pelea'>('match');
  const [volverPaywall, setVolverPaywall] = useState<NombrePantalla>('inicio');
  /* Acceso y registro van en su propio estado y no en `pantalla`: son la puerta de
     la app, no un destino más al que se pueda navegar desde dentro. */
  const [puerta, setPuerta] = useState<'acceso' | 'registro'>('acceso');
  const sala = useSala();
  const { usuario, cargada } = useCuenta();

  const ir: Ir = useCallback((destino: NombrePantalla, datos?: DatosIr) => {
    if (datos?.proposito) setProposito(datos.proposito);
    if (destino === 'paywall') setVolverPaywall(datos?.volver ?? 'inicio');
    setPantalla(destino);
  }, []);

  // Los ajustes y la sesión guardados, una sola vez al arrancar
  useEffect(() => { cargarPreferencias(); }, []);
  useEffect(() => { Cuenta.cargar(); }, []);

  /* Al entrar (o volver a entrar) se empieza por el inicio, no por donde se salió.
     Depende del correo y no del usuario entero: al cambiar el nombre desde el perfil
     llega otro objeto con la misma cuenta, y eso no debe mover la navegación. */
  useEffect(() => {
    if (usuario) { setPuerta('acceso'); setPantalla('inicio'); }
  }, [usuario?.correo]);

  // Arranque de las capas de monetización (hoy mock; ver src/logica/compras.ts)
  useEffect(() => {
    inicializarCompras();
    inicializarAnuncios();
  }, []);

  // Copia de seguridad de la partida, por si se cierra la app
  useEffect(() => {
    if (sala) guardar({ sala, misIds: Sala.obtenerMisIds(), modo: Sala.obtenerModo() });
    else limpiar();
  }, [sala?.actualizada]);

  const comun = { ir, proposito };

  /* Todavía leyendo el disco: sin pantalla, para no asomar el acceso a quien ya
     tiene la sesión abierta. Es cosa de milisegundos. */
  if (!cargada) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#fff' }} />
      </SafeAreaProvider>
    );
  }

  /* Sin sesión no se entra: ni pestañas, ni salas, ni pelea */
  if (!usuario) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          {puerta === 'acceso'
            ? <Acceso irARegistro={() => setPuerta('registro')} />
            : <Registro irAAcceso={() => setPuerta('acceso')} />}
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={pantalla === 'pelea' ? 'light' : 'dark'} />
        {pantalla === 'inicio'      && <Inicio {...comun} />}
        {pantalla === 'inicioPelea' && <InicioPelea {...comun} />}
        {pantalla === 'ajustes'     && <Ajustes ir={ir} />}
        {pantalla === 'entrar'      && <Entrar {...comun} />}
        {pantalla === 'dilema'      && <Dilema {...comun} />}
        {pantalla === 'sala'        && <SalaEspera {...comun} />}
        {pantalla === 'generando'   && <Generando {...comun} />}
        {pantalla === 'swipe'       && <Swipe {...comun} />}
        {pantalla === 'relevo'      && <Relevo {...comun} />}
        {pantalla === 'resultados'  && <Resultados {...comun} />}
        {pantalla === 'apuesta'     && <Apuesta {...comun} />}
        {pantalla === 'personajes'  && <Personajes {...comun} />}
        {pantalla === 'pelea'       && <Arena {...comun} />}
        {pantalla === 'veredicto'   && <Veredicto {...comun} />}
        {pantalla === 'paywall'     && <Paywall ir={ir} volver={volverPaywall} />}
        {pantalla === 'perfil'      && <Perfil ir={ir} />}
        {pantalla === 'terminos'    && <Terminos ir={ir} />}

        {/* Solo en las tres pantallas principales: dentro de una partida estorba */}
        {esRaiz(pantalla) && <BarraInferior activa={pantalla} ir={ir} />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
