// Archivo: app/(tabs)/historial.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getPartes } from "../utils/parteCache";
import type { ParteVirtual } from "../data/tempPartes";

export default function HistorialPartesScreen() {
  const router = useRouter();
  const [partes, setPartes] = useState<ParteVirtual[]>([]);

  useFocusEffect(
    useCallback(() => {
      const lista = getPartes();
      setPartes(lista);
    }, [])
  );

  const renderItem = ({ item }: { item: ParteVirtual }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/parte/${item.id}`)}
    >
      <Text style={styles.cardTitulo}>
        Parte #{item.id} - {item.sector || "Sin sector"}
      </Text>
      <Text style={styles.cardTexto}>
        Fecha: {item.fecha || "Sin fecha"} | Turno: {item.turno || "N/A"}
      </Text>
      <Text style={styles.cardTexto}>
        Unidad:{" "}
        {item.unidadTipo && item.unidadNumero
          ? `${item.unidadTipo} ${item.unidadNumero}`
          : "No registrada"}
      </Text>
      <Text style={styles.cardTexto}>
        Sumilla: {item.sumilla || "(Sin sumilla)"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Historial de Partes Virtuales</Text>

      {partes.length === 0 ? (
        <Text style={styles.vacio}>No hay partes registrados aún.</Text>
      ) : (
        <FlatList
          data={partes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  vacio: { textAlign: "center", marginTop: 20, fontSize: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  cardTitulo: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  cardTexto: { fontSize: 14 },
});
