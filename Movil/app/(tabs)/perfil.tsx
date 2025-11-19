// Archivo: app/(tabs)/perfil.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import API_URL from "../../config/api";
import { obtenerSesion, cerrarSesion } from "../utils/session";

type Usuario = {
  id: number;
  nombre: string;
  dni: string;
  celular: string;
  cargo: string;
  usuario: string;
  foto_ruta?: string | null;
};

export default function PerfilScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  // BASE del servidor sin /api (para las fotos estáticas)
  const API_BASE = API_URL.replace(/\/api\/?$/, "");

  // Cargar datos reales de sesión
  useEffect(() => {
    const cargar = async () => {
      const ses = await obtenerSesion();
      if (!ses) {
        router.replace("/login");
        return;
      }
      setUsuario(ses);
    };

    cargar();
  }, [router]);

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    Alert.alert("Sesión cerrada", "Vuelve a iniciar sesión.");
    router.replace("/login");
  };

  const cambiarFoto = async () => {
    if (!usuario) return;

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Debes permitir acceso a tus fotos para cambiar la foto de perfil."
      );
      return;
    }

    const img = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (img.canceled) return;

    const asset = img.assets[0];

    try {
      setSubiendo(true);

      const form = new FormData();
      form.append("foto", {
        uri: asset.uri,
        name: `perfil_${usuario.id}.jpg`,
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_URL}/usuarios/${usuario.id}/foto`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        body: form,
      });

      const data = await res.json();

      if (!data.ok) {
        Alert.alert("Error", data.message || "No se pudo actualizar la foto");
        return;
      }

      const nuevaRuta =
        data.foto_ruta || data.foto || data.path || usuario.foto_ruta;

      // Actualizamos el usuario en memoria con la nueva ruta
      setUsuario({ ...usuario, foto_ruta: nuevaRuta });

      Alert.alert("Éxito", "Foto de perfil actualizada.");
    } catch (error) {
      console.log("ERROR cambiando foto:", error);
      Alert.alert("Error", "No se pudo cambiar la foto.");
    } finally {
      setSubiendo(false);
    }
  };

  if (!usuario) {
    return (
      <View style={styles.center}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  const inicial = usuario.nombre?.[0]?.toUpperCase() || "U";

  // Construimos una URL robusta para la foto, según cómo venga guardada
  let fotoUri: string | null = null;
  if (usuario.foto_ruta && usuario.foto_ruta !== "") {
    let p = usuario.foto_ruta.replace(/\\/g, "/"); // por si viene con backslashes de Windows

    if (p.startsWith("http")) {
      // Ya es una URL completa
      fotoUri = p;
    } else if (p.startsWith("uploads/")) {
      // Ej: uploads/users/archivo.jpg
      fotoUri = `${API_BASE}/${p}`;
    } else if (p.startsWith("users/")) {
      // Ej: users/archivo.jpg => la carpeta real es /uploads/users
      fotoUri = `${API_BASE}/uploads/${p}`;
    } else {
      // Solo nombre de archivo => asumimos /uploads/users
      fotoUri = `${API_BASE}/uploads/users/${p}`;
    }
  }

  return (
    <View style={styles.container}>
      {/* FOTO + BOTÓN */}
      <View style={styles.fotoBox}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <Text style={styles.fotoInicial}>{inicial}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={cambiarFoto}
          disabled={subiendo}
        >
          <Text style={styles.botonSecundarioTexto}>
            {subiendo ? "Subiendo..." : "Cambiar foto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DATOS */}
      <View style={styles.datosBox}>
        <Text style={styles.nombre}>{usuario.nombre.toUpperCase()}</Text>
        <Text style={styles.item}>DNI: {usuario.dni}</Text>
        <Text style={styles.item}>Celular: {usuario.celular}</Text>
        <Text style={styles.item}>Cargo: {usuario.cargo}</Text>
        <Text style={styles.item}>Usuario: {usuario.usuario}</Text>
      </View>

      {/* CERRAR SESIÓN */}
      <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
        <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------- ESTILOS ----------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f6f6f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  fotoBox: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },

  foto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#ddd",
  },

  fotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#999",
    justifyContent: "center",
    alignItems: "center",
  },

  fotoInicial: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
  },

  botonSecundario: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#007bff",
    borderRadius: 6,
  },

  botonSecundarioTexto: {
    color: "#fff",
    fontSize: 14,
  },

  datosBox: { marginTop: 10 },

  nombre: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  item: { fontSize: 16, marginBottom: 4 },

  botonCerrar: {
    marginTop: 30,
    backgroundColor: "#cc0000",
    paddingVertical: 10,
    borderRadius: 6,
  },

  botonCerrarTexto: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
