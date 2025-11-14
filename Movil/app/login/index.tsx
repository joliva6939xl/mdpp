// Archivo: app/login/index.tsx
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { getSession, saveSession } from "../utils/auth";
import { findUser } from "../utils/userCache";

export default function LoginScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [dni, setDni] = useState("");

  // Si ya hay sesión guardada, entrar directo al perfil
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.replace("/(tabs)/perfil");
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {
    const user = findUser(usuario) || findUser(dni);

    if (!user) {
      alert("Usuario no encontrado (recuerda: cache temporal)");
      return;
    }

    await saveSession(user);

    router.replace("/(tabs)/perfil");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>BIENVENIDO A SERENO MDPP 👮‍♂️</Text>

      <Text style={styles.label}>USUARIO 💁‍♂️</Text>
      <TextInput
        style={styles.input}
        placeholder="INGRESA EL USUARIO"
        value={usuario}
        onChangeText={setUsuario}
      />

      <Text style={styles.label}>CONTRASEÑA🔒</Text>
      <TextInput
        style={styles.input}
        placeholder="INGRESA TU CONTRASEÑA"
        value={dni}
        onChangeText={setDni}
        keyboardType="numeric"
      />

      <View style={{ height: 20 }} />

      <Button title="Iniciar Sesión" onPress={handleLogin} />

      <View style={{ height: 20 }} />

      <TouchableOpacity onPress={() => router.push("/login/register")}>
        <Text style={styles.link}>¿Eres nuevo? Crea tu usuario aquí</Text>
      </TouchableOpacity>
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
  label: { fontSize: 16, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  link: {
    color: "blue",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
