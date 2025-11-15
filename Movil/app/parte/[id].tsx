// Archivo: app/parte/[id].tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API_URL from "../../config/api";

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

export default function ParteDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parte, setParte] = useState<ParteDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDetalle() {
      try {
        const resp = await fetch(`${API_URL}/partes/${id}`);
        const json = await resp.json();

        if (!resp.ok || !json.ok) {
          console.error("Error detalle parte:", json);
          setCargando(false);
          return;
        }

        setParte(json.data);
      } catch (error) {
        console.error("Error conectando al servidor:", error);
      } finally {
        setCargando(false);
      }
    }

    if (id) {
      cargarDetalle();
    }
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando detalle...</Text>
      </View>
    );
  }

  if (!parte) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la información del parte.</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  const handleEditar = () => {
    if (!parte?.id) {
      Alert.alert("Error", "No se pudo identificar el parte a editar.");
      return;
    }
    router.push(`/parte/editar/${parte.id}` as any);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>DETALLE DEL PARTE #{parte.id}</Text>

      <Text style={styles.label}>Sector:</Text>
      <Text style={styles.valor}>{parte.sector || "-"}</Text>

      <Text style={styles.label}>N° Parte Físico:</Text>
      <Text style={styles.valor}>{parte.parte_fisico || "-"}</Text>

      <Text style={styles.label}>Zona:</Text>
      <Text style={styles.valor}>{parte.zona || "-"}</Text>

      <Text style={styles.label}>Turno:</Text>
      <Text style={styles.valor}>{parte.turno || "-"}</Text>

      <Text style={styles.label}>Lugar:</Text>
      <Text style={styles.valor}>{parte.lugar || "-"}</Text>

      <Text style={styles.label}>Fecha y hora:</Text>
      <Text style={styles.valor}>
        {(parte.fecha || "-") + " " + (parte.hora || "")}
      </Text>

      <Text style={styles.label}>Unidad:</Text>
      <Text style={styles.valor}>
        {(parte.unidad_tipo || "-") +
          " " +
          (parte.unidad_numero ? "#" + parte.unidad_numero : "")}
      </Text>

      <Text style={styles.label}>Placa:</Text>
      <Text style={styles.valor}>{parte.placa || "-"}</Text>

      <Text style={styles.label}>Conductor:</Text>
      <Text style={styles.valor}>{parte.conductor || "-"}</Text>

      <Text style={styles.label}>DNI Conductor:</Text>
      <Text style={styles.valor}>{parte.dni_conductor || "-"}</Text>

      <Text style={styles.separador}>────────────────────────────</Text>

      <Text style={styles.label}>Sumilla:</Text>
      <Text style={styles.valor}>{parte.sumilla || "-"}</Text>

      <Text style={styles.label}>Asunto:</Text>
      <Text style={styles.valor}>{parte.asunto || "-"}</Text>

      <Text style={styles.label}>Ocurrencia:</Text>
      <Text style={styles.valor}>{parte.ocurrencia || "-"}</Text>

      <Text style={styles.separador}>────────────────────────────</Text>

      <Text style={styles.label}>Jefe de Operaciones:</Text>
      <Text style={styles.valor}>MORI TRIGOSO</Text>

      <Text style={styles.label}>Supervisor Zonal:</Text>
      <Text style={styles.valor}>{parte.sup_zonal || "-"}</Text>

      <Text style={styles.label}>Supervisor General:</Text>
      <Text style={styles.valor}>{parte.sup_general || "-"}</Text>

      {/* Botón para ir a editar */}
      <View style={{ marginTop: 20 }}>
        <Button title="EDITAR PARTE" onPress={handleEditar} />
      </View>

      <View style={{ marginTop: 10, marginBottom: 20 }}>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  label: { marginTop: 10, fontWeight: "bold" },
  valor: { fontSize: 16 },
  separador: {
    marginTop: 15,
    marginBottom: 5,
    textAlign: "center",
    color: "#999",
  },
});
