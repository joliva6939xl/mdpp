// Archivo: app/(tabs)/historial.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import API_URL from "../../config/api";
import { obtenerSesion } from "../utils/session";

type ParteResumen = {
  id: number;
  sector: string | null;
  parte_fisico: string | null;
  fecha: string | null;
  hora: string | null;
  sumilla: string | null;
};

export default function HistorialScreen() {
  const router = useRouter();
  const [partes, setPartes] = useState<ParteResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const u = await obtenerSesion();
        if (!u) {
          setCargando(false);
          Alert.alert("Sesión", "Debes iniciar sesión nuevamente.");
          router.replace("/login" as any);
          return;
        }

        const resp = await fetch(`${API_URL}/partes?usuario_id=${u.id}`);
        const json = await resp.json();

        if (!resp.ok || !json.ok) {
          Alert.alert(
            "Error",
            json.message || "No se pudieron cargar los partes."
          );
          setCargando(false);
          return;
        }

        setPartes(json.data || []);
      } catch (error) {
        console.error("Error cargando historial:", error);
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [router]);

  const renderItem = ({ item }: { item: ParteResumen }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/parte/${item.id}` as any)}
    >
      <Text style={styles.cardTitulo}>
        Parte #{item.id} {item.parte_fisico ? `- ${item.parte_fisico}` : ""}
      </Text>
      <Text style={styles.cardSub}>
        {item.fecha || ""} {item.hora || ""}
      </Text>
      <Text style={styles.cardSub}>Sector: {item.sector || "-"}</Text>
      <Text style={styles.cardSumilla} numberOfLines={2}>
        {item.sumilla || "(Sin sumilla)"}
      </Text>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando historial...</Text>
      </View>
    );
  }

  if (!partes.length) {
    return (
      <View style={styles.center}>
        <Text>No hay partes registrados para este usuario.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={partes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  cardTitulo: { fontSize: 16, fontWeight: "bold" },
  cardSub: { fontSize: 14, color: "#555" },
  cardSumilla: { marginTop: 5, fontSize: 14 },
});
