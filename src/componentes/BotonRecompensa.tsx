import { useState } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { verAnuncioRecompensado, MINUTOS_RECOMPENSA } from '../logica/anuncios';
import { useMostrarAnuncios } from '../logica/useMonetizacion';
import { colores, radios } from '../tema';

/* "Mira un anuncio y quítalos un rato" — anuncio recompensado con la recompensa
   concedida por RevenueCat (ver logica/anuncios.ts). Se oculta si ya eres Pro. */
export function BotonRecompensa() {
  const mostrar = useMostrarAnuncios();
  const [ocupado, setOcupado] = useState(false);
  if (!mostrar) return null;

  const onPress = async () => {
    if (ocupado) return;
    setOcupado(true);
    await verAnuncioRecompensado();
    setOcupado(false);
  };

  return (
    <Pressable onPress={onPress} disabled={ocupado} style={e.boton}>
      {ocupado
        ? <ActivityIndicator size="small" color={colores.celeste} />
        : (
          <Text style={e.texto}>
            ▶  Mira un anuncio y quítalos {Math.round(MINUTOS_RECOMPENSA / 60) || 1} h
          </Text>
        )}
    </Pressable>
  );
}

const e = StyleSheet.create({
  boton: {
    alignItems: 'center', justifyContent: 'center',
    minHeight: 40, paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: radios.redondo,
    borderWidth: 1, borderColor: colores.celeste,
    backgroundColor: '#f7f0ff',
  },
  texto: { fontSize: 13, fontWeight: '700', color: colores.celeste },
});
