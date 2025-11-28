// Movil/app/parte/multimedia/[id].tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Video, ResizeMode } from "expo-av";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:4000/api"
    : "http://10.0.2.2:4000/api";

// BASE_URL = http://localhost:4000
const BASE_URL = API_URL.replace("/api", "");

type ParteMultimedia = {
  id: number;
  fotos?: string[];
  videos?: string[];
};

export default function MultimediaParteScreen() {
  const { id } = useLocalSearchParams();
  const [parte, setParte] = useState<ParteMultimedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${API_URL}/partes/${id}`);
        const data = await res.json();

        if (data.ok) {
          const p: ParteMultimedia = data.parte || data.data || data;
          console.log("📸 Parte multimedia cargada:", p);
          setParte(p);
        } else {
          console.log("⚠️ Error desde API multimedia:", data);
        }
      } catch (e) {
        console.log("❌ Error cargando multimedia:", e);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargar();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Cargando multimedia...</Text>
      </View>
    );
  }

  if (!parte) {
    return (
      <View style={styles.center}>
        <Text>No se encontró información del parte.</Text>
      </View>
    );
  }

  const fotos = parte.fotos || [];
  const videos = parte.videos || [];

  const buildUrl = (ruta: string) => {
    const limpia = ruta.replace(/\\/g, "/");
    return `${BASE_URL}/uploads/${limpia}`;
  };

  const numeroParte = parte.id || id;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Multimedia Parte #${numeroParte}`,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Contenido Multimedia</Text>

        {fotos.length === 0 && videos.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No hay fotos ni videos asociados a este parte.
          </Text>
        )}

        {/* FOTOS */}
        {fotos.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subtitulo}>Fotos</Text>
            {fotos.map((ruta, index) => (
              <Image
                key={`${ruta}-${index}`}
                source={{ uri: buildUrl(ruta) }}
                style={styles.foto}
              />
            ))}
          </View>
        )}

        {/* VIDEOS */}
        {videos.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subtitulo}>Videos</Text>
            {videos.map((ruta, index) => (
              <View key={`${ruta}-${index}`} style={styles.videoItem}>
                <Text style={{ marginBottom: 4 }}>Video {index + 1}:</Text>
                <Video
                  source={{ uri: buildUrl(ruta) }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}  // 👈 aquí el cambio
                  isLooping={false}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 10,
  },
  subtitulo: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  foto: {
    width: "100%",
    height: 220,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    resizeMode: "cover",
  },
  videoItem: {
    marginBottom: 16,
  },
  video: {
    width: "100%",
    height: 240,
    backgroundColor: "#000",
    borderRadius: 8,
  },
});
