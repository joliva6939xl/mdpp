// Archivo: app/(tabs)/perfil.tsx
import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { obtenerSesion, cerrarSesion } from "../utils/session";
import API_URL from "../../config/api";

export default function PerfilScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any | null>(null);

  useEffect(() => {
    obtenerSesion().then(setUsuario);
  }, []);

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  // 1) Normalizamos la ruta que viene de la BD: "users\Screenshot_1_....jpg"
  const fotoRelativa = (usuario.foto_ruta || "").replace(/\\/g, "/");

  // 2) API_URL probablemente es "http://localhost:4000/api"
  //    Quitamos "/api" para obtener la URL base del servidor de archivos.
  const API_BASE = API_URL.replace(/\/api\/?$/, "");

  // 3) URL final de la imagen: "http://localhost:4000/uploads/users/....jpg"
  const fotoUrl = fotoRelativa
    ? `${API_BASE}/uploads/${fotoRelativa}`
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfil de Usuario</Text>

      <View style={styles.headerRow}>
        {/* Datos del usuario (izquierda) */}
        <View style={styles.datosCol}>
          <Text style={styles.item}>Nombre: {usuario.nombre}</Text>
          <Text style={styles.item}>DNI: {usuario.dni}</Text>
          <Text style={styles.item}>Celular: {usuario.celular}</Text>
          <Text style={styles.item}>Cargo: {usuario.cargo}</Text>
          <Text style={styles.item}>Usuario: {usuario.usuario}</Text>
        </View>

        {/* Foto del usuario (derecha) */}
        <View style={styles.fotoCol}>
          {fotoUrl && (
            <Image
              source={{ uri: fotoUrl }}
              style={styles.foto}
              resizeMode="cover"
            />
          )}
        </View>
      </View>

      <Button
        title="CERRAR SESIÓN"
        onPress={async () => {
          await cerrarSesion();
          router.replace("/login" as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  datosCol: {
    flex: 1,
    paddingRight: 10,
  },
  fotoCol: {
    width: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  foto: {
    width: 180,
    height: 180,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc", // borde suave alrededor de la foto
  },
  item: { fontSize: 18, marginTop: 8 },
});
