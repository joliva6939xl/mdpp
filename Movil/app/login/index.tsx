// Archivo: app/login/index.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import API_URL from "../../config/api";
import { guardarSesion } from "../utils/session";

export default function LoginScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleLogin = async () => {
    if (!usuario || !contraseña) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        Alert.alert("Error", json.message || "Credenciales incorrectas");
        return;
      }

      // Guardar sesión real
      await guardarSesion(json.data);

      // Ir a las pestañas → Perfil (o la que quieras)
      router.replace("/(tabs)/perfil" as any);
    } catch (error) {
      console.error("Error en login:", error);
      Alert.alert("Error", "No se puede conectar con el servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar Sesión</Text>

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: joliva"
        value={usuario}
        onChangeText={setUsuario}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contraseña}
        onChangeText={setContraseña}
      />

      <View style={styles.botonContainer}>
        <Button title="INGRESAR" onPress={handleLogin} />
      </View>

      {/* Enlace para crear usuario nuevo */}
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => router.push("/login/register" as any)}
      >
        <Text style={styles.linkTexto}>
          ¿Eres nuevo? <Text style={styles.linkTextoResaltado}>Crea tu usuario aquí</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { marginTop: 10, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: "white",
  },
  botonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  linkContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  linkTexto: {
    fontSize: 14,
  },
  linkTextoResaltado: {
    color: "#007bff",
    fontWeight: "bold",
  },
});
