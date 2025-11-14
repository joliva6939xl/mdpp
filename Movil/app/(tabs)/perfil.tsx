// Archivo: app/(tabs)/perfil.tsx
import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";
import { clearSession, getSession } from "../utils/auth";
import { useEffect, useState } from "react";

export default function PerfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Cargar datos del usuario desde la sesión
  useEffect(() => {
    const loadUser = async () => {
      const data = await getSession();
      if (!data) {
        // Si no hay sesión, volver al login
        router.replace("/login");
        return;
      }
      setUser(data);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfil del Usuario</Text>

      <View style={styles.card}>
        <Text style={styles.itemLabel}>Nombre:</Text>
        <Text style={styles.itemValue}>{user.nombre}</Text>

        <Text style={styles.itemLabel}>DNI:</Text>
        <Text style={styles.itemValue}>{user.dni}</Text>

        <Text style={styles.itemLabel}>Celular:</Text>
        <Text style={styles.itemValue}>{user.celular || "No registrado"}</Text>

        <Text style={styles.itemLabel}>Cargo:</Text>
        <Text style={styles.itemValue}>{user.cargo}</Text>

        <Text style={styles.itemLabel}>Usuario:</Text>
        <Text style={styles.itemValue}>{user.usuario}</Text>

        <Text style={styles.itemLabel}>Contraseña:</Text>
        <Text style={styles.itemValue}>
          {user.contraseña} (Solo visible en desarrollo)
        </Text>
      </View>

      <View style={{ height: 20 }} />

      <Button title="Cerrar Sesión" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#f4f4f4",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  itemValue: {
    fontSize: 16,
    marginBottom: 5,
  },
});
