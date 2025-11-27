// Archivo: app/parte/multimedia/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform, // Importar Platform
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Video, ResizeMode } from "expo-av";

// Corregir la definición de API_URL, eliminando la importación rota
const API_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : 'http://10.0.2.2:4000/api';

type ParteDetalle = {
  id: number;
  fotos?: string[] | null;
  videos?: string[] | null;
};

export default function MultimediaScreen() {
  const { id } = useLocalSearchParams();
  const [parte, setParte] = useState<ParteDetalle | null>(null);
  const [fotoVisible, setFotoVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const cacheBuster = `?_=${new Date().getTime()}`;
        const res = await fetch(`${API_URL}/partes/${id}${cacheBuster}`);
        const data = await res.json();
        if (data.ok) {
          setParte(data.parte);
        }
      } catch (e) {
        console.log("Error cargando parte:", e);
      }
    };

    if (id) {
      cargar();
    }
  }, [id]);

  if (!parte) {
    return (
      <View style={styles.center}>
        <Text>Cargando multimedia...</Text>
      </View>
    );
  }

  // La URL base para los archivos multimedia se construye sin /api
  const baseRuta = `${API_URL.replace('/api', '')}/uploads/partes/${parte.id}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: `Multimedia Parte #${id}` }} />
      <Text style={styles.header}>Contenido Multimedia</Text>

      {/* FOTOS */}
      {parte.fotos && parte.fotos.length > 0 && (
        <View>
          <Text style={styles.seccion}>Fotos</Text>
          <View style={styles.fila}>
            {parte.fotos.map((f, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setFotoSeleccionada(`${baseRuta}/${f}`);
                  setFotoVisible(true);
                }}
              >
                <Image
                  source={{ uri: `${baseRuta}/${f}` }}
                  style={styles.fotoMini}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* VIDEOS */}
      {parte.videos && parte.videos.length > 0 && (
        <View>
          <Text style={styles.seccion}>Videos</Text>
          {parte.videos.map((v, i) => (
            <Video
              key={i}
              source={{ uri: `${baseRuta}/${v}` }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              style={styles.video}
            />
          ))}
        </View>
      )}

      {/* MODAL FOTO */}
      <Modal visible={fotoVisible} transparent>
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.cerrar}
            onPress={() => setFotoVisible(false)}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>Cerrar</Text>
          </TouchableOpacity>

          {fotoSeleccionada && (
            <Image source={{ uri: fotoSeleccionada }} style={styles.fotoGrande} />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { textAlign: "center", fontWeight: "bold", fontSize: 20, marginBottom: 20 },
  seccion: { marginTop: 25, fontWeight: "bold", fontSize: 19, marginBottom: 10 },
  fila: { flexDirection: "row", flexWrap: "wrap" },
  fotoMini: {
    width: 100,
    height: 100,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
  },
  video: {
    width: "100%",
    height: 260,
    backgroundColor: "#000",
    borderRadius: 6,
    marginBottom: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  cerrar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    position: "absolute",
    top: 40,
    right: 20,
  },
  fotoGrande: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
});
