// Archivo: app/parte/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import API_URL from "../../config/api";

type ParteDetalle = {
  id: number;
  sector?: string | null;
  parte_fisico?: string | null;
  zona?: string | null;
  turno?: string | null;
  lugar?: string | null;
  fecha?: string | null;
  hora?: string | null;
  fecha_hora?: string | null;
  unidad_tipo?: string | null;
  unidad_numero?: string | null;
  placa?: string | null;
  conductor?: string | null;
  dni_conductor?: string | null;
  sumilla?: string | null;
  asunto?: string | null;
  ocurrencia?: string | null;
  jefe_operaciones?: string | null;
  supervisor_zonal?: string | null;
  supervisor_general?: string | null;
  fotos?: string[] | null;
  videos?: string[] | null;
};

export default function ParteDetalleScreen() {
  const { id } = useLocalSearchParams();
  const [parte, setParte] = useState<ParteDetalle | null>(null);
  const [fotoVisible, setFotoVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${API_URL}/partes/${id}`);
        const data = await res.json();

        if (data.ok) {
          const parteData = data.parte || data.data || data;
          setParte(parteData);
        }
      } catch (e) {
        console.log("Error cargando parte:", e);
      }
    };

    if (id) {
      cargar();
    }
  }, [id]);

  if (!parte) {
    return (
      <View style={styles.center}>
        <Text>Cargando parte...</Text>
      </View>
    );
  }

  const fechaMostrar =
    parte.fecha_hora ||
    (parte.fecha && parte.hora ? `${parte.fecha} ${parte.hora}` : parte.fecha || "-");

  const unidadMostrar = `${parte.unidad_tipo ?? ""} ${parte.unidad_numero ?? ""}`.trim();
  const baseRuta = `${API_URL}/uploads/partes/${parte.id}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        SEGURIDAD CIUDADANA{"\n"}MUNICIPALIDAD DE PUENTE PIEDRA
      </Text>

      <Text style={styles.titulo}>PARTE #{parte.id}</Text>

      <View style={styles.box}>
        <Text style={styles.item}>N° Parte Físico: {parte.parte_fisico || "-"}</Text>
        <Text style={styles.item}>Sector: {parte.sector || "-"}</Text>
        <Text style={styles.item}>Zona: {parte.zona || "-"}</Text>
        <Text style={styles.item}>Turno: {parte.turno || "-"}</Text>
        <Text style={styles.item}>Lugar: {parte.lugar || "-"}</Text>
        <Text style={styles.item}>Fecha/Hora: {fechaMostrar}</Text>

        <Text style={styles.item}>Unidad: {unidadMostrar || "-"}</Text>
        <Text style={styles.item}>Placa: {parte.placa || "-"}</Text>
        <Text style={styles.item}>Conductor: {parte.conductor || "-"}</Text>
        <Text style={styles.item}>DNI Conductor: {parte.dni_conductor || "-"}</Text>

        <Text style={styles.subtitulo}>Sumilla:</Text>
        <Text style={styles.texto}>{parte.sumilla || "-"}</Text>

        <Text style={styles.subtitulo}>Asunto:</Text>
        <Text style={styles.texto}>{parte.asunto || "-"}</Text>

        <Text style={styles.subtitulo}>Ocurrencia:</Text>
        <Text style={styles.texto}>{parte.ocurrencia || "-"}</Text>

        <Text style={styles.subtitulo}>Supervisor Zonal:</Text>
        <Text style={styles.texto}>{parte.supervisor_zonal || "-"}</Text>

        <Text style={styles.subtitulo}>Supervisor General:</Text>
        <Text style={styles.texto}>{parte.supervisor_general || "-"}</Text>

        <Text style={styles.subtitulo}>Jefe de operaciones:</Text>
        <Text style={styles.texto}>{parte.jefe_operaciones || "-"}</Text>
      </View>

      {/* FOTOS */}
      {parte.fotos && parte.fotos.length > 0 && (
        <View>
          <Text style={styles.seccion}>Fotos</Text>
          <View style={styles.fila}>
            {parte.fotos.map((f, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setFotoSeleccionada(`${baseRuta}/${f}`);
                  setFotoVisible(true);
                }}
              >
                <Image
                  source={{ uri: `${baseRuta}/${f}` }}
                  style={styles.fotoMini}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* VIDEOS */}
      {parte.videos && parte.videos.length > 0 && (
        <View>
          <Text style={styles.seccion}>Videos</Text>
          {parte.videos.map((v, i) => (
            <Video
              key={i}
              source={{ uri: `${baseRuta}/${v}` }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              style={styles.video}
            />
          ))}
        </View>
      )}

      {/* MODAL FOTO */}
      <Modal visible={fotoVisible} transparent>
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.cerrar}
            onPress={() => setFotoVisible(false)}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>Cerrar</Text>
          </TouchableOpacity>

          {fotoSeleccionada && (
            <Image source={{ uri: fotoSeleccionada }} style={styles.fotoGrande} />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { textAlign: "center", fontWeight: "bold", fontSize: 20 },
  titulo: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 22,
    marginVertical: 15,
  },
  box: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  item: { fontSize: 16, marginBottom: 6 },
  subtitulo: { marginTop: 10, fontWeight: "bold", fontSize: 16 },
  texto: { fontSize: 15 },
  seccion: { marginTop: 25, fontWeight: "bold", fontSize: 19, marginBottom: 10 },
  fila: { flexDirection: "row", flexWrap: "wrap" },
  fotoMini: {
    width: 100,
    height: 100,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
  },
  video: {
    width: "100%",
    height: 260,
    backgroundColor: "#000",
    borderRadius: 6,
    marginBottom: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  cerrar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    position: "absolute",
    top: 40,
    right: 20,
  },
  fotoGrande: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
});
