// Archivo: app/parte/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getParteById } from "../utils/parteCache";
import type { ParteVirtual } from "../data/tempPartes";

export default function DetalleParteScreen() {
  const { id } = useLocalSearchParams();
  const [parte, setParte] = useState<ParteVirtual | null>(null);

  useEffect(() => {
    if (!id) return;
    const encontrado = getParteById(id as string);
    if (!encontrado) {
      setParte(null);
    } else {
      setParte(encontrado);
    }
  }, [id]);

  if (!parte) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Parte no encontrado</Text>
        <Text style={styles.texto}>
          Vuelve al historial y selecciona un parte válido.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>
        Detalle del Parte Virtual #{parte.id}
      </Text>

      <Text style={styles.label}>Sector:</Text>
      <Text style={styles.valor}>{parte.sector}</Text>

      <Text style={styles.label}>N° Parte Físico:</Text>
      <Text style={styles.valor}>{parte.parteFisico}</Text>

      <Text style={styles.label}>Zona:</Text>
      <Text style={styles.valor}>{parte.zona}</Text>

      <Text style={styles.label}>Turno:</Text>
      <Text style={styles.valor}>{parte.turno}</Text>

      <Text style={styles.label}>Lugar:</Text>
      <Text style={styles.valor}>{parte.lugar}</Text>

      <Text style={styles.label}>Fecha:</Text>
      <Text style={styles.valor}>{parte.fecha}</Text>

      <Text style={styles.label}>Hora:</Text>
      <Text style={styles.valor}>{parte.hora}</Text>

      <Text style={styles.label}>Unidad:</Text>
      <Text style={styles.valor}>
        {parte.unidadTipo && parte.unidadNumero
          ? `${parte.unidadTipo} ${parte.unidadNumero}`
          : "No registrada"}
      </Text>

      <Text style={styles.label}>Placa:</Text>
      <Text style={styles.valor}>{parte.placa}</Text>

      <Text style={styles.label}>Conductor:</Text>
      <Text style={styles.valor}>{parte.conductor}</Text>

      <Text style={styles.label}>DNI del Conductor:</Text>
      <Text style={styles.valor}>{parte.dniConductor}</Text>

      <View style={styles.separator} />

      <Text style={styles.label}>Sumilla:</Text>
      <Text style={styles.valor}>{parte.sumilla}</Text>

      <Text style={styles.label}>Asunto:</Text>
      <Text style={styles.valor}>{parte.asunto}</Text>

      <Text style={styles.label}>Ocurrencia:</Text>
      <Text style={styles.valor}>{parte.ocurrencia}</Text>

      <View style={styles.separator} />

      <Text style={styles.label}>JEFE DE OPERACIONES:</Text>
      <Text style={styles.valor}>MORI TRIGOSO</Text>

      <Text style={styles.label}>Supervisor Zonal:</Text>
      <Text style={styles.valor}>{parte.supZonal}</Text>

      <Text style={styles.label}>Supervisor General:</Text>
      <Text style={styles.valor}>{parte.supGeneral}</Text>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  valor: {
    fontSize: 14,
  },
  texto: { fontSize: 16, textAlign: "center" },
  separator: {
    height: 2,
    backgroundColor: "#ccc",
    marginVertical: 15,
  },
});
