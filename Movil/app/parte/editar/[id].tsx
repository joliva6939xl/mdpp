// Archivo: app/parte/editar/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import API_URL from "../../../config/api";
import { obtenerSesion } from "../../utils/session";

type UnidadTipo = "OMEGA" | "ALFA" | null;

type ParteDetalle = {
  id: number;
  usuario_id: number;
  sector: string | null;
  parte_fisico: string | null;
  zona: string | null;
  turno: string | null;
  lugar: string | null;
  fecha: string | null;
  hora: string | null;
  unidad_tipo: string | null;
  unidad_numero: string | null;
  placa: string | null;
  conductor: string | null;
  dni_conductor: string | null;
  sumilla: string | null;
  asunto: string | null;
  ocurrencia: string | null;
  sup_zonal: string | null;
  sup_general: string | null;
  creado_en?: string | null;
};

export default function EditarParteScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const parteId = params.id as string; // forzamos a string

  const [usuarioActual, setUsuarioActual] = useState<any | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

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

  useEffect(() => {
    async function cargar() {
      try {
        const sesion = await obtenerSesion();
        if (!sesion) {
          Alert.alert("Sesión", "Debes iniciar sesión nuevamente.");
          router.replace("/login/index" as any);
          return;
        }
        setUsuarioActual(sesion);

        if (!parteId) {
          Alert.alert("Error", "No se pudo identificar el parte.");
          router.back();
          return;
        }

        const resp = await fetch(`${API_URL}/partes/${parteId}`);
        const json = await resp.json();

        if (!resp.ok || !json.ok || !json.data) {
          Alert.alert("Error", json.message || "No se pudo cargar el parte.");
          router.back();
          return;
        }

        const parte: ParteDetalle = json.data;

        // Validar que el usuario sea el creador (extra al backend)
        if (parte.usuario_id !== sesion.id) {
          Alert.alert(
            "No autorizado",
            "Solo el creador del parte puede editarlo."
          );
          router.back();
          return;
        }

        setSector(parte.sector || "");
        setNumeroParteFisico(parte.parte_fisico || "");
        setZona(parte.zona || "");
        setTurno(parte.turno || "");
        setLugar(parte.lugar || "");
        setFecha(parte.fecha || "");
        setHora(parte.hora || "");
        setUnidad((parte.unidad_tipo as UnidadTipo) || null);
        setUnidadNumero(parte.unidad_numero || null);
        setPlaca(parte.placa || "");
        setConductor(parte.conductor || "");
        setDniConductor(parte.dni_conductor || "");
        setSumilla(parte.sumilla || "");
        setAsunto(parte.asunto || "");
        setOcurrencia(parte.ocurrencia || "");
        setSupZonal(parte.sup_zonal || "");
        setSupGeneral(parte.sup_general || "");
      } catch (error) {
        console.error("Error cargando parte para edición:", error);
        Alert.alert("Error", "No se pudo conectar con el servidor.");
        router.back();
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [parteId, router]);

  const handleSeleccionarUnidadNumero = (num: number) => {
    setUnidadNumero(String(num));
  };

  const handleGuardarCambios = async () => {
    if (!usuarioActual) {
      Alert.alert(
        "Sesión",
        "No se encontró una sesión activa. Inicia sesión nuevamente."
      );
      return;
    }

    if (!parteId) {
      Alert.alert("Error", "No se pudo identificar el parte.");
      return;
    }

    try {
      setEnviando(true);

      const body = {
        usuario_id: usuarioActual.id,
        sector,
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
      };

      console.log("Actualizando parte:", parteId, body);

      const resp = await fetch(`${API_URL}/partes/${parteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await resp.json().catch(() => null);
      console.log("Respuesta actualizar parte:", resp.status, json);

      if (!resp.ok || !json || json.ok === false) {
        const msg =
          (json && json.message) ||
          `Error ${resp.status}. Revisa la consola del backend.`;
        Alert.alert("No se pudo editar", msg);
        return;
      }

      Alert.alert("Parte actualizado", "El parte fue editado correctamente.", [
        {
          text: "OK",
          onPress: () => router.replace(`/parte/${parteId}` as any),
        },
      ]);
    } catch (error) {
      console.error("Error en handleGuardarCambios:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando parte para edición...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Editar Parte #{parteId}</Text>

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

      <View style={{ marginTop: 20, marginBottom: 30 }}>
        <Button
          title={enviando ? "GUARDANDO CAMBIOS..." : "GUARDAR CAMBIOS"}
          onPress={handleGuardarCambios}
          disabled={enviando}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
