// Archivo: app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import API_URL from "../../config/api";
import { obtenerSesion } from "../utils/session";

type UnidadTipo = "OMEGA" | "ALFA" | null;

export default function NuevoParteScreen() {
  const [usuarioActual, setUsuarioActual] = useState<any | null>(null);

  const [sector, setSector] = useState("");
  const [numeroParteFisico, setNumeroParteFisico] = useState("");
  const [zona, setZona] = useState("");
  const [turno, setTurno] = useState("");
  const [lugar, setLugar] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [unidad, setUnidad] = useState<UnidadTipo>(null);
  const [unidadNumero, setUnidadNumero] = useState<string | null>(null);

  const [placa, setPlaca] = useState("");
  const [conductor, setConductor] = useState("");
  const [dniConductor, setDniConductor] = useState("");

  const [sumilla, setSumilla] = useState("");
  const [asunto, setAsunto] = useState("");
  const [ocurrencia, setOcurrencia] = useState("");

  const [supZonal, setSupZonal] = useState("");
  const [supGeneral, setSupGeneral] = useState("");

  // Almacenamiento local de fotos y videos seleccionados
  const [fotos, setFotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const [enviando, setEnviando] = useState(false);

  // Cargar sesión real
  useEffect(() => {
    obtenerSesion().then((data) => {
      setUsuarioActual(data);
    });
  }, []);

  const handleSeleccionarUnidadNumero = (num: number) => {
    setUnidadNumero(String(num));
  };

  const limpiarFormulario = () => {
    setSector("");
    setNumeroParteFisico("");
    setZona("");
    setTurno("");
    setLugar("");
    setFecha("");
    setHora("");
    setUnidad(null);
    setUnidadNumero(null);
    setPlaca("");
    setConductor("");
    setDniConductor("");
    setSumilla("");
    setAsunto("");
    setOcurrencia("");
    setSupZonal("");
    setSupGeneral("");
    setFotos([]);
    setVideos([]);
  };

  // Un solo botón para seleccionar fotos y videos (solo móvil)
  const handleSeleccionarMedia = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Solo móvil",
        "Seleccionar foto / video solo estará disponible en la app móvil."
      );
      return;
    }

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Debes permitir el acceso a la galería para seleccionar fotos o videos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const assets = result.assets || [];

    const nuevasFotos: string[] = [];
    const nuevosVideos: string[] = [];

    for (const asset of assets) {
      if (asset.type === "image") {
        nuevasFotos.push(asset.uri);
      } else if (asset.type === "video") {
        nuevosVideos.push(asset.uri);
      }
    }

    if (nuevasFotos.length) {
      setFotos((prev) => [...prev, ...nuevasFotos]);
    }
    if (nuevosVideos.length) {
      setVideos((prev) => [...prev, ...nuevosVideos]);
    }

    Alert.alert(
      "Archivos seleccionados",
      `Fotos: ${nuevasFotos.length} | Videos: ${nuevosVideos.length}`
    );
  };

  const handleGuardarParte = async () => {
    if (!usuarioActual) {
      Alert.alert(
        "Sesión",
        "No se encontró una sesión activa. Inicia sesión nuevamente."
      );
      return;
    }

    try {
      setEnviando(true);

      const body = {
        usuario_id: usuarioActual.id,
        sector,
        // En el backend se está manejando como parte_fisico
        parte_fisico: numeroParteFisico || null,
        zona,
        turno,
        lugar,
        fecha,
        hora,
        unidad_tipo: unidad,
        unidad_numero: unidadNumero,
        placa: placa || null,
        conductor: conductor || null,
        dni_conductor: dniConductor || null,
        sumilla: sumilla || null,
        asunto: asunto || null,
        ocurrencia: ocurrencia || null,
        sup_zonal: supZonal || null,
        sup_general: supGeneral || null,
        // Más adelante enviaremos fotos y videos reales al backend
        // fotos,
        // videos,
      };

      console.log("Enviando parte desde APP:", body);

      const resp = await fetch(`${API_URL}/partes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await resp.json().catch(() => null);
      console.log("Respuesta crear parte:", resp.status, json);

      if (!resp.ok || !json || json.ok === false) {
        const msg =
          (json && json.message) ||
          `Error ${resp.status}. Revisa la consola del backend.`;
        Alert.alert("Error al guardar parte", msg);
        return;
      }

      Alert.alert("Parte creado", "El parte virtual se guardó correctamente.");
      limpiarFormulario();
    } catch (error) {
      console.error("Error en handleGuardarParte:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  const mediaButtonTitle =
    fotos.length || videos.length
      ? `FOTO / VIDEO (${fotos.length} foto(s), ${videos.length} video(s))`
      : "SELECCIONAR FOTO / VIDEO";

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.encabezado}>SEGURIDAD CIUDADANA</Text>
      <Text style={styles.encabezado}>MUNICIPALIDAD DE PUENTE PIEDRA</Text>

      <Text style={styles.titulo}>Nuevo Parte Virtual de Incidencia</Text>

      <Text style={styles.label}>Sector:</Text>
      <TextInput
        style={styles.input}
        value={sector}
        onChangeText={setSector}
        placeholder="Sector"
      />

      <Text style={styles.label}>N° de Parte Físico:</Text>
      <TextInput
        style={styles.input}
        value={numeroParteFisico}
        onChangeText={setNumeroParteFisico}
        placeholder="Ejemplo: 001-2025"
      />

      <Text style={styles.label}>Zona:</Text>
      <TextInput
        style={styles.input}
        value={zona}
        onChangeText={setZona}
        placeholder="Zona"
      />

      <Text style={styles.label}>Turno:</Text>
      <Picker
        selectedValue={turno}
        onValueChange={(value) => setTurno(String(value))}
        style={styles.input}
      >
        <Picker.Item label="Seleccione un turno" value="" />
        <Picker.Item label="Mañana" value="mañana" />
        <Picker.Item label="Tarde" value="tarde" />
        <Picker.Item label="Noche" value="noche" />
      </Picker>

      <Text style={styles.label}>Lugar:</Text>
      <TextInput
        style={styles.input}
        value={lugar}
        onChangeText={setLugar}
        placeholder="Lugar"
      />

      <Text style={styles.label}>Fecha:</Text>
      <TextInput
        style={styles.input}
        value={fecha}
        onChangeText={setFecha}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Hora:</Text>
      <TextInput
        style={styles.input}
        value={hora}
        onChangeText={setHora}
        placeholder="HH:MM"
      />

      {/* Unidad */}
      <Text style={styles.label}>Unidad:</Text>
      <View style={styles.unidadRow}>
        <TouchableOpacity
          style={[
            styles.unidadBtn,
            unidad === "OMEGA" && styles.unidadBtnActivo,
          ]}
          onPress={() => setUnidad("OMEGA")}
        >
          <Text style={styles.unidadTexto}>OMEGA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.unidadBtn,
            unidad === "ALFA" && styles.unidadBtnActivo,
          ]}
          onPress={() => setUnidad("ALFA")}
        >
          <Text style={styles.unidadTexto}>ALFA</Text>
        </TouchableOpacity>
      </View>

      {unidad && (
        <View style={styles.numerosGrid}>
          {Array.from({
            length: unidad === "OMEGA" ? 50 : 80,
          }).map((_, index) => {
            const num = index + 1;
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numeroBtn,
                  unidadNumero === String(num) && styles.numeroBtnActivo,
                ]}
                onPress={() => handleSeleccionarUnidadNumero(num)}
              >
                <Text>{num}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Placa:</Text>
      <TextInput
        style={styles.input}
        value={placa}
        onChangeText={setPlaca}
        placeholder="Placa"
      />

      <Text style={styles.label}>Conductor:</Text>
      <TextInput
        style={styles.input}
        value={conductor}
        onChangeText={setConductor}
        placeholder="Nombre del conductor"
      />

      <Text style={styles.label}>DNI del Conductor:</Text>
      <TextInput
        style={styles.input}
        value={dniConductor}
        onChangeText={setDniConductor}
        placeholder="DNI"
        keyboardType="numeric"
      />

      <Text style={styles.separador}>────────────────────────────</Text>

      <Text style={styles.label}>Sumilla:</Text>
      <TextInput
        style={styles.input}
        value={sumilla}
        onChangeText={setSumilla}
        placeholder="Sumilla"
      />

      <Text style={styles.label}>Asunto:</Text>
      <TextInput
        style={styles.input}
        value={asunto}
        onChangeText={setAsunto}
        placeholder="Asunto"
      />

      <Text style={styles.label}>Ocurrencia:</Text>
      <TextInput
        style={[styles.input, { height: 120 }]}
        value={ocurrencia}
        onChangeText={setOcurrencia}
        multiline
        placeholder="Describa la ocurrencia..."
      />

      <Text style={styles.separador}>────────────────────────────</Text>

      <Text style={styles.label}>Jefe de Operaciones:</Text>
      <Text style={styles.textoFijo}>MORI TRIGOSO</Text>

      <Text style={styles.label}>Supervisor Zonal:</Text>
      <TextInput
        style={styles.input}
        value={supZonal}
        onChangeText={setSupZonal}
        placeholder="Supervisor Zonal"
      />

      <Text style={styles.label}>Supervisor General:</Text>
      <TextInput
        style={styles.input}
        value={supGeneral}
        onChangeText={setSupGeneral}
        placeholder="Supervisor General"
      />

      {/* Botón único FOTO/VIDEO */}
      <View style={{ marginTop: 20 }}>
        <Button title={mediaButtonTitle} onPress={handleSeleccionarMedia} />
      </View>

      <View style={{ marginTop: 20, marginBottom: 30 }}>
        <Button
          title={enviando ? "GUARDANDO..." : "GUARDAR PARTE"}
          onPress={handleGuardarParte}
          disabled={enviando}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  encabezado: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
  titulo: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 16,
  },
  label: { marginTop: 10, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: "white",
  },
  unidadRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  unidadBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  unidadBtnActivo: {
    backgroundColor: "#2196F3",
  },
  unidadTexto: {
    color: "white",
    fontWeight: "bold",
  },
  numerosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 4,
  },
  numeroBtn: {
    width: 40,
    height: 32,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  numeroBtnActivo: {
    backgroundColor: "#2196F3",
  },
  separador: {
    marginTop: 15,
    marginBottom: 5,
    textAlign: "center",
    color: "#999",
  },
  textoFijo: {
    marginTop: 4,
    fontSize: 16,
  },
});
