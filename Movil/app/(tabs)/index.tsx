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
  // Se elimina TouchableOpacity, ya no se usa
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
  
  // Se elimina handleSeleccionarUnidadNumero, ya no se usa

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
        // La columna en la BD es parte_fisico
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
        <Picker.Item label="DIA" value="DIA" />
        <Picker.Item label="NOCHE" value="NOCHE" />
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
      <Text style={styles.label}>Tipo de Unidad:</Text>
      <Picker
        selectedValue={unidad}
        onValueChange={(value: UnidadTipo) => setUnidad(value)}
        style={styles.input}
      >
        <Picker.Item label="Seleccione Tipo de Unidad" value={null} />
        <Picker.Item label="OMEGA" value="OMEGA" />
        <Picker.Item label="ALFA" value="ALFA" />
      </Picker>

      {/* Número de Unidad (solo aparece si se ha seleccionado el tipo) */}
      {unidad && (
        <>
          <Text style={styles.label}>Número de Unidad ({unidad}):</Text>
          <TextInput
            style={styles.input}
            value={unidadNumero || ""}
            onChangeText={setUnidadNumero}
            placeholder={`Número de ${unidad}`}
            keyboardType="numeric"
          />
        </>
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
      
      {/* SUMILLA (Convertido a Picker) */}
      <Text style={styles.label}>Sumilla:</Text>
      <Picker
        selectedValue={sumilla}
        onValueChange={(value) => setSumilla(String(value))}
        style={styles.input}
      >
        <Picker.Item label="Seleccione Sumilla (Incidencia)" value="" />
        <Picker.Item label="Robo a Transeúnte" value="robo a transeunte" />
        <Picker.Item label="Consumidores de Sustancias Tóxicas" value="consumidores de sustancias toxicas" />
        <Picker.Item label="Herido por Arma de Fuego / Arma Blanca" value="herido por arma de fuego /arma blanca" />
        <Picker.Item label="Choque Vehicular" value="choque vehicular" />
        <Picker.Item label="Usurpación o Invasión de Terrenos" value="usurpacion o invacion de terrenos" />
        <Picker.Item label="Robo a Vehículos" value="robo a vehiculos" />
        <Picker.Item label="Robo a Vivienda" value="robo a vivienda" />
        <Picker.Item label="Actos Obscenos" value="actos obsenos" />
        <Picker.Item label="Occiso por Arma de Fuego / Arma Blanca" value="osciso por arma de fuego / arma blanca" />
        <Picker.Item label="Muerte Natural (Occiso)" value="muerte natural (ocsiso)" />
        <Picker.Item label="Despiste/Volcadura" value="despiste/volcadura" />
        <Picker.Item label="Estafa" value="estafa" />
        <Picker.Item label="Personas o Vehículos Sospechosos" value="personas o vehiculos sospechosos" />
        <Picker.Item label="Ruidos Molestos" value="ruidos molestos" />
        <Picker.Item label="Mordedura de Can" value="mordedura de can" />
        <Picker.Item label="Alteración al Orden Público" value="alteracion al orden publico" />
        <Picker.Item label="Persona Extraviada" value="persona extraviada" />
        <Picker.Item label="Disuasión de Meretrices" value="disuacion de meretrices" />
        <Picker.Item label="Quema de Maleza/Arrojo de Basura" value="quema de maleza/arrojo de basura" />
        <Picker.Item label="Aniego" value="aniego" />
        <Picker.Item label="Retención de Delincuentes" value="retencion de delincuentes" />
        <Picker.Item label="Violencia Familiar o Sexual" value="violencia familiar o sexual" />
        <Picker.Item label="Consumidores de Alcohol" value="consumidores de alcohol" />
        <Picker.Item label="Incendio" value="incendio" />
        <Picker.Item label="Atropello/Caída de Pasajero" value="atropello/caida de pasajero" />
        <Picker.Item label="Atención Paramédica" value="atencion paramedica" />
        <Picker.Item label="Otros" value="otros" />
      </Picker>

      {/* ASUNTO (Cambiado a Origen de la Atención y convertido a Picker) */}
      <Text style={styles.label}>Origen de la atención:</Text>
      <Picker
        selectedValue={asunto}
        onValueChange={(value) => setAsunto(String(value))}
        style={styles.input}
      >
        <Picker.Item label="Seleccione Origen de la Atención" value="" />
        <Picker.Item label="Patrullaje" value="patrullaje" />
        <Picker.Item label="Alerta Radial" value="alerta radial" />
        <Picker.Item label="Central de Cámaras" value="central de camaras" />
        <Picker.Item label="Operativo" value="operativo" />
        <Picker.Item label="Llamada PNP" value="llamada pnp" />
      </Picker>

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
  // Se han eliminado los estilos de Unidad para evitar advertencias.
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