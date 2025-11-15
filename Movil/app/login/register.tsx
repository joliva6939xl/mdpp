// Archivo: app/login/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import API_URL from "../../config/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  const [cargo, setCargo] = useState("sereno operador de campo");
  const [cargando, setCargando] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !dni || !celular || !cargo) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    setCargando(true);

    try {
      // Usamos FormData porque el backend acepta multipart/form-data
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("dni", dni);
      formData.append("celular", celular);
      formData.append("cargo", cargo);
      // En versión web no enviamos foto. En móvil real se añadirá.

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData as any,
      });

      const json = await response.json();

      console.log("RESPUESTA REGISTER:", response.status, json);

      // ⚠️ ERROR → mostrar alerta con el mensaje DEL BACKEND
      if (!response.ok || !json.ok) {
        Alert.alert("Error", json.message || "No se pudo crear el usuario.");
        setCargando(false);
        return;
      }

      // ✅ ÉXITO → mostrar usuario + contraseña (DNI)
      const creado = json.data || {};
      const usuarioGenerado = creado.usuario || "(revisar en sistema)";
      const passwordGenerada = creado.dni || creado.contrasena || dni;

      Alert.alert(
        "Usuario creado",
        `El usuario se creó correctamente.\n\nUsuario: ${usuarioGenerado}\nContraseña: ${passwordGenerada}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Volver AUTOMÁTICAMENTE al login
              router.replace("/login" as any);
            },
          },
        ]
      );

      // Limpiar formulario (por si regresa luego)
      setNombre("");
      setDni("");
      setCelular("");
      setCargo("sereno operador de campo");
    } catch (error) {
      console.error("Error registrando usuario desde APP:", error);
      Alert.alert(
        "Error",
        "No se pudo conectar con el servidor. Intenta nuevamente."
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
        placeholder="Ejemplo: Juan Oliva"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>DNI</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de DNI"
        value={dni}
        keyboardType="numeric"
        onChangeText={setDni}
      />

      <Text style={styles.label}>Celular</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de celular"
        value={celular}
        keyboardType="numeric"
        onChangeText={setCelular}
      />

      <Text style={styles.label}>Cargo</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={cargo}
          onValueChange={(value) => setCargo(value)}
        >
          <Picker.Item
            label="sereno operador de campo"
            value="sereno operador de campo"
          />
          <Picker.Item label="sereno conductor" value="sereno conductor" />
          <Picker.Item
            label="sereno operador de camaras"
            value="sereno operador de camaras"
          />
          <Picker.Item
            label="sereno motorizado"
            value="sereno motorizado"
          />
          <Picker.Item
            label="sereno paramedico"
            value="sereno paramedico"
          />
          <Picker.Item label="unidad k9" value="unidad k9" />
          <Picker.Item label="amazonas" value="amazonas" />
          <Picker.Item label="DELTA" value="DELTA" />
        </Picker>
      </View>

      <View style={styles.botonContainer}>
        <Button
          title={cargando ? "Creando..." : "CREAR USUARIO"}
          onPress={handleRegister}
          disabled={cargando}
        />
      </View>

      <TouchableOpacity onPress={() => router.replace("/login" as any)}>
        <Text style={styles.linkTexto}>Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  titulo: {
    fontSize: 24,
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
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "white",
    marginTop: 5,
    marginBottom: 15,
  },
  botonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  linkTexto: {
    textAlign: "center",
    color: "#007bff",
    fontWeight: "bold",
  },
});
