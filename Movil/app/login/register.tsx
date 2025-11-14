// Archivo: app/login/register.tsx
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { addUser } from "../utils/userCache";
import API_URL from "../../config/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargos = [
    "sereno operador de campo",
    "sereno conductor",
    "sereno operador de camaras",
    "sereno motorizado",
    "sereno paramedico",
    "unidad k9",
    "amazonas",
    "DELTA",
  ];

  const handleRegister = async () => {
    if (!nombre || !dni || !cargo) {
      Alert.alert("Error", "Completa todos los campos obligatorios.");
      return;
    }

    setCargando(true);

    try {
      // Creamos el FormData para mandar al backend (multipart/form-data)
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("dni", dni);
      formData.append("celular", celular);
      formData.append("cargo", cargo);
      // En el futuro aquí agregaremos la foto:
      // formData.append("foto", { uri, name, type })

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        Alert.alert(
          "Error",
          json.message || "Error registrando usuario en el servidor."
        );
        setCargando(false);
        return;
      }

      const data = json.data;

      // Mantener SINERGIA con el login actual basado en cache:
      addUser({
        nombre: data.nombre,
        dni: data.dni,
        celular: data.celular,
        cargo: data.cargo,
        usuario: data.usuario,
        // la API devuelve la contraseña solo en desarrollo
        contraseña: json.data?.contraseña || dni,
      });

      Alert.alert(
        "Usuario creado",
        `Usuario creado en el servidor.\n\nUsuario: ${data.usuario}\nContraseña: ${
          json.data?.contraseña || dni
        }`
      );

      // Volvemos al login
      router.replace("/login");
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert(
        "Error",
        "No se pudo conectar con el servidor. Verifica que la API esté corriendo."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear Usuario</Text>

      <Text style={styles.label}>Nombre completo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Juan Oliva"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>DNI</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de DNI"
        keyboardType="numeric"
        value={dni}
        onChangeText={setDni}
      />

      <Text style={styles.label}>Celular</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de celular"
        keyboardType="phone-pad"
        value={celular}
        onChangeText={setCelular}
      />

      <Text style={styles.label}>Cargo</Text>

      <View style={styles.pickerWrapper}>
        <Picker selectedValue={cargo} onValueChange={setCargo}>
          <Picker.Item label="Seleccione su cargo" value="" />
          {cargos.map((c, i) => (
            <Picker.Item key={i} label={c} value={c} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Foto</Text>
      <Button title="Subir foto (deshabilitado en web)" disabled />

      <View style={{ height: 20 }} />

      <Button
        title={cargando ? "Creando usuario..." : "Crear Usuario"}
        onPress={handleRegister}
        disabled={cargando}
      />

      <View style={{ height: 20 }} />

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.link}>Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  label: { fontSize: 16, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    marginBottom: 15,
    overflow: "hidden",
  },
  link: {
    color: "blue",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
