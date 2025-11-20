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
  // AÑADIDO: Campo necesario para verificar la edición
  creado_en: string; 
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

        // Asume que la API devuelve 'creado_en' en formato de fecha ISO 
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
  
  // Lógica para determinar si el parte puede ser editado (menos de 10 minutos)
  const canEdit = (parte: ParteResumen): boolean => {
    // Si no hay fecha de creación (debería haberla), no se puede editar.
    if (!parte.creado_en) return false;
    
    // 10 minutos en milisegundos
    const tenMinutesInMs = 10 * 60 * 1000; 

    // Convertir la fecha de creación a milisegundos
    const creationTime = new Date(parte.creado_en).getTime();
    const now = Date.now();

    // Si el tiempo transcurrido (now - creationTime) es menor a 10 minutos, se puede editar.
    return (now - creationTime) < tenMinutesInMs;
  };

  const renderItem = ({ item }: { item: ParteResumen }) => {
    const editable = canEdit(item);

    return (
      // El componente card ahora es un View para manejar el layout de Fila
      <View style={styles.card}> 
        <TouchableOpacity
          style={styles.cardContent}
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
        
        {/* BOTÓN EDITAR CONDICIONAL */}
        {editable && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/parte/editar/${item.id}` as any)}
          >
            <Text style={styles.editButtonText}>EDITAR</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
  card: { // MODIFICADO: Contenedor principal para la fila
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
    flexDirection: 'row', // Para alinear contenido y botón en la misma fila
    justifyContent: 'space-between', // Para separar el contenido del botón
    alignItems: 'center', // Para centrar verticalmente
  },
  cardContent: { // AÑADIDO: Contenedor para el texto
    flex: 1, 
  },
  cardTitulo: { fontSize: 16, fontWeight: "bold" },
  cardSub: { fontSize: 14, color: "#555" },
  cardSumilla: { marginTop: 5, fontSize: 14 },
  editButton: { // AÑADIDO: Estilo del botón de edición
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  editButtonText: { // AÑADIDO: Estilo del texto del botón
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});