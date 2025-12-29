// Archivo: Movil/app/(tabs)/index.tsx
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  View,
  Modal,
  FlatList,
  Image,
  KeyboardAvoidingView,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location"; // ✅ IMPORT AGREGADO: Para usar el GPS
import { obtenerSesion } from "../../utils/session";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAlert } from "../../context/GlobalAlert";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:4000/api"
    : "http://10.0.2.2:4000/api";

type Participante = {
  nombre: string;
  dni: string;
};

type SelectorItem = string;

// ✅ COMPONENTES FUERA (evita que el TextInput pierda foco al escribir)
type SectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};
const Section: React.FC<SectionProps> = ({ title, subtitle, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
    {children}
  </View>
);

type FieldLabelProps = { text: string; required?: boolean };
const FieldLabel: React.FC<FieldLabelProps> = ({ text, required }) => (
  <Text style={styles.label}>
    {text} {required ? <Text style={styles.req}>*</Text> : null}
  </Text>
);

type SelectorProps = {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
  required?: boolean;
};
const Selector: React.FC<SelectorProps> = ({
  label,
  value,
  onPress,
  placeholder = "Seleccionar",
  required,
}) => (
  <TouchableOpacity style={styles.selector} onPress={onPress} activeOpacity={0.9}>
    <FieldLabel text={label} required={required} />
    <View style={styles.selectorRow}>
      <Text style={[styles.selectorText, !value ? styles.placeholder : null]}>
        {value || placeholder}
      </Text>
      <Text style={styles.selectorArrow}>⌄</Text>
    </View>
  </TouchableOpacity>
);

export default function CrearParteScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const sectores = useMemo(
    () => Array.from({ length: 13 }, (_, i) => String(i + 1)),
    []
  );

  const LISTAS = useMemo(
    () => ({
      sector: sectores, // ✅ 1..13
      zona: ["norte", "centro", "sur"], // ✅ cambio solicitado
      turno: ["DIA  06:00 AM - 18:00 PM", "NOCHE 18:00 PM - 06:00 AM"],
      unidad_tipo: ["OMEGA", "ALFA"],
      incidencia: [
        "ROBO A TRANSEUNTE",
        "CONSUMIDORES DE SUSTANCIAS TOXICAS",
        "HERIDOS POR ARMA DE FUEGO",
        "HERIDOS POR ARMA BLANCA",
        "CHOQUE VEHICULAR",
        "USURPACION O INVASION DE TERRENO",
        "ROBO DE VEHICULOS,VIVIENDAS Y OTROS",
        "VIOLENCIA FAMILIAR",
        "PERSONAS SOSPECHOSAS",
        "DESASTRES NATURALES",
        "ALTERACION DEL ORDEN PUBLICO",
        "ACCIDENTES CON MATERIALES PELIGROSOS",
        "APOYO A EMERGENCIAS MEDICAS",
        "PROTECCION ESCOLAR",
        "OTROS NO ESPECIFICADOS",
      ],
      asunto: [
        "PATRULLAJE",
        "ALERTA RADIAL",
        "CENTRAL DE CAMARAS",
        "OPERATIVO",
        "LLAMADA PNP",
      ],
    }),
    [sectores]
  );

  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  // ✅ NUEVO: Estado para la ubicación GPS
  const [ubicacion, setUbicacion] = useState<{ lat: string; lng: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);

  const [form, setForm] = useState({
    parte_fisico: "",
    fecha: new Date().toISOString().split("T")[0],
    hora: new Date().toLocaleTimeString("es-PE", { hour12: false }).slice(0, 5),
    hora_fin: "",
    sector: "",
    zona: "",
    turno: "",
    lugar: "",
    unidad_tipo: "",
    unidad_numero: "",
    placa: "",
    conductor: "",
    dni_conductor: "",
    sumilla: "",
    asunto: "",
    ocurrencia: "",
    sup_zonal: "",
    sup_general: "",
  });

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorCampo, setSelectorCampo] =
    useState<keyof typeof form | null>(null);
  const [selectorTitulo, setSelectorTitulo] = useState("");
  const [selectorOpciones, setSelectorOpciones] = useState<SelectorItem[]>([]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const abrirSelector = (
    campo: keyof typeof form,
    titulo: string,
    opciones: string[]
  ) => {
    setSelectorCampo(campo);
    setSelectorTitulo(titulo);
    setSelectorOpciones(opciones);
    setSelectorVisible(true);
  };

  const seleccionarOpcion = (val: string) => {
    if (selectorCampo) handleChange(selectorCampo, val);
    setSelectorVisible(false);
  };

  // ✅ NUEVO: Función para obtener coordenadas GPS
  const obtenerUbicacion = async () => {
    setLoadingGPS(true);
    try {
      // 1. Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          title: "Permiso denegado",
          message: "Se requiere acceso a la ubicación para geolocalizar el parte.",
          type: "error",
        });
        setLoadingGPS(false);
        return;
      }

      // 2. Obtener posición actual (precisión alta)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUbicacion({
        lat: String(location.coords.latitude),
        lng: String(location.coords.longitude),
      });

      showAlert({
        title: "Ubicación obtenida",
        message: "Coordenadas GPS adjuntadas correctamente.",
        type: "success",
      });
    } catch (error) {
      console.log(error);
      showAlert({
        title: "Error GPS",
        message: "No se pudo obtener la ubicación. Verifique su GPS.",
        type: "error",
      });
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleFilePick = async () => {
    const permission =
      Platform.OS === "web"
        ? { granted: true }
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({
        title: "Permiso denegado",
        message: "Se requiere acceso a la galería para adjuntar evidencias.",
        type: "error",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setArchivos((prev) => [...prev, ...result.assets]);
    }
  };

  const agregarParticipante = () => {
    setParticipantes((prev) => [...prev, { nombre: "", dni: "" }]);
  };

  const cambiarParticipante = (
    index: number,
    campo: keyof Participante,
    valor: string
  ) => {
    setParticipantes((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const enviarParte = async () => {
    if (!form.parte_fisico || !form.sumilla) {
      showAlert({
        title: "Faltan datos",
        message: "N° Parte y la Incidencia son obligatorios.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const session = await obtenerSesion();
      if (!session?.usuario?.id) {
        showAlert({
          title: "Error",
          message: "Sesión inválida.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      let horaInicio = form.hora;
      if (!horaInicio) {
        horaInicio = new Date()
          .toLocaleTimeString("es-PE", { hour12: false })
          .slice(0, 5);
      }

      const horaFin = form.hora_fin.trim();

      const formData = new FormData();
      formData.append("parte_fisico", form.parte_fisico);
      formData.append("fecha", form.fecha);
      formData.append("hora", horaInicio);
      formData.append("hora_fin", horaFin);
      formData.append("sector", form.sector);
      formData.append("zona", form.zona);
      formData.append("turno", form.turno);
      formData.append("lugar", form.lugar);
      formData.append("unidad_tipo", form.unidad_tipo);
      formData.append("unidad_numero", form.unidad_numero);
      formData.append("placa", form.placa);
      formData.append("conductor", form.conductor);
      formData.append("dni_conductor", form.dni_conductor);
      formData.append("sumilla", form.sumilla);
      formData.append("asunto", form.asunto);
      formData.append("ocurrencia", form.ocurrencia);
      formData.append("sup_zonal", form.sup_zonal);
      formData.append("sup_general", form.sup_general);
      formData.append("usuario_id", String(session.usuario.id));
      formData.append("participantes", JSON.stringify(participantes));

      // ✅ NUEVO: Agregar Latitud y Longitud si existen
      if (ubicacion) {
        formData.append("latitud", ubicacion.lat);
        formData.append("longitud", ubicacion.lng);
      }

      for (let index = 0; index < archivos.length; index++) {
        const file = archivos[index];
        const isVideo = file.type === "video";
        const tipoMime = isVideo ? "video/mp4" : "image/jpeg";
        const ext = isVideo ? ".mp4" : ".jpg";
        const fileName = `evidencia_${index}${ext}`;

        if (Platform.OS === "web") {
          try {
            const resp = await fetch(file.uri);
            const blob = await resp.blob();
            formData.append("evidencia", blob, fileName);
          } catch {
            // ignorar
          }
        } else {
          // @ts-expect-error - FormData RN
          formData.append("evidencia", {
            uri: file.uri,
            name: fileName,
            type: tipoMime,
          });
        }
      }

      const response = await fetch(`${API_URL}/partes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          title: "Éxito",
          message: "Parte registrado correctamente.",
          type: "success",
        });

        // Resetear formulario
        setForm({
          parte_fisico: "",
          fecha: new Date().toISOString().split("T")[0],
          hora: "",
          hora_fin: "",
          sector: "",
          zona: "",
          turno: "",
          lugar: "",
          unidad_tipo: "",
          unidad_numero: "",
          placa: "",
          conductor: "",
          dni_conductor: "",
          sumilla: "",
          asunto: "",
          ocurrencia: "",
          sup_zonal: "",
          sup_general: "",
        });
        setArchivos([]);
        setParticipantes([]);
        setUbicacion(null); // ✅ Resetear ubicación

        router.push("/(tabs)/historial");
      } else {
        showAlert({
          title: "Error",
          message: data.message || "No se pudo guardar el parte.",
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);
      showAlert({
        title: "Error",
        message: "Fallo de conexión con el servidor.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOpcion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => seleccionarOpcion(item)}
      activeOpacity={0.9}
    >
      <Text style={styles.modalItemText}>{item}</Text>
      <Text style={styles.modalChevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Nuevo Parte Virtual
            </ThemedText>
            <Text style={styles.headerHint}>
              Municipalidad de Puente Piedra • Vigilancia
            </Text>
          </View>

          <Section
            title="Datos principales"
            subtitle="Complete lo esencial para registrar el parte."
          >
            <View style={styles.field}>
              <FieldLabel text="N° Parte Físico" required />
              <TextInput
                style={styles.input}
                placeholder="Ej: 000123"
                value={form.parte_fisico}
                onChangeText={(t) => handleChange("parte_fisico", t)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.col, styles.colLeft]}>
                <View style={styles.field}>
                  <FieldLabel text="Fecha" />
                  <TextInput
                    style={styles.input}
                    value={form.fecha}
                    onChangeText={(t) => handleChange("fecha", t)}
                  />
                </View>
              </View>

              <View style={[styles.col, styles.colRight]}>
                <View style={styles.field}>
                  <FieldLabel text="Hora inicio" />
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    value={form.hora}
                    onChangeText={(t) => handleChange("hora", t)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel text="Hora fin (opcional)" />
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={form.hora_fin}
                onChangeText={(t) => handleChange("hora_fin", t)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.col, styles.colLeft]}>
                <Selector
                  label="Sector"
                  value={form.sector}
                  onPress={() =>
                    abrirSelector("sector", "Selecciona Sector", LISTAS.sector)
                  }
                  placeholder="1 al 13"
                />
              </View>

              <View style={[styles.col, styles.colRight]}>
                <Selector
                  label="Zona"
                  value={form.zona}
                  onPress={() =>
                    abrirSelector("zona", "Selecciona Zona", LISTAS.zona)
                  }
                  placeholder="Norte / Centro / Sur"
                />
              </View>
            </View>

            <Selector
              label="Turno"
              value={form.turno}
              onPress={() =>
                abrirSelector("turno", "Selecciona Turno", LISTAS.turno)
              }
            />

            <View style={styles.field}>
              <FieldLabel text="Lugar" />
              <TextInput
                style={styles.input}
                placeholder="Dirección / referencia del hecho"
                value={form.lugar}
                onChangeText={(t) => handleChange("lugar", t)}
              />
            </View>
          </Section>

          <Section
            title="Unidad / Conductor"
            subtitle="Información del vehículo y personal a cargo."
          >
            <View style={styles.row}>
              <View style={[styles.col, styles.colLeft]}>
                <Selector
                  label="Tipo de unidad"
                  value={form.unidad_tipo}
                  onPress={() =>
                    abrirSelector(
                      "unidad_tipo",
                      "Tipo de unidad",
                      LISTAS.unidad_tipo
                    )
                  }
                />
              </View>

              <View style={[styles.col, styles.colRight]}>
                <View style={styles.field}>
                  <FieldLabel text="N° unidad" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 12"
                    value={form.unidad_numero}
                    onChangeText={(t) => handleChange("unidad_numero", t)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.col, styles.colLeft]}>
                <View style={styles.field}>
                  <FieldLabel text="Placa" />
                  <TextInput
                    style={styles.input}
                    placeholder="ABC-123"
                    value={form.placa}
                    onChangeText={(t) => handleChange("placa", t)}
                  />
                </View>
              </View>

              <View style={[styles.col, styles.colRight]}>
                <View style={styles.field}>
                  <FieldLabel text="Conductor" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del conductor"
                    value={form.conductor}
                    onChangeText={(t) => handleChange("conductor", t)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel text="DNI Conductor" />
              <TextInput
                style={styles.input}
                placeholder="DNI"
                value={form.dni_conductor}
                onChangeText={(t) => handleChange("dni_conductor", t)}
                keyboardType="numeric"
              />
            </View>
          </Section>

          <Section
            title="Incidencia / Informe"
            subtitle="Tipo de incidencia y descripción detallada."
          >
            <Selector
              label="Incidencia"
              required
              value={form.sumilla}
              onPress={() =>
                abrirSelector(
                  "sumilla",
                  "Selecciona Incidencia",
                  LISTAS.incidencia
                )
              }
            />

            <Selector
              label="Origen de atención"
              value={form.asunto}
              onPress={() =>
                abrirSelector("asunto", "Origen de atención", LISTAS.asunto)
              }
            />

            <View style={styles.field}>
              <FieldLabel text="Detalle de ocurrencia" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describa con claridad lo ocurrido (qué, quién, dónde, cuándo)."
                value={form.ocurrencia}
                onChangeText={(t) => handleChange("ocurrencia", t)}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel text="Supervisor Zonal" />
              <TextInput
                style={styles.input}
                placeholder="Supervisor Zonal"
                value={form.sup_zonal}
                onChangeText={(t) => handleChange("sup_zonal", t)}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel text="Supervisor General" />
              <TextInput
                style={styles.input}
                placeholder="Supervisor General"
                value={form.sup_general}
                onChangeText={(t) => handleChange("sup_general", t)}
              />
            </View>
          </Section>

          <Section
            title="Participantes (opcional)"
            subtitle="Agregar personas involucradas o intervenidas."
          >
            <TouchableOpacity
              style={styles.softButton}
              onPress={agregarParticipante}
              activeOpacity={0.9}
            >
              <View style={styles.softButtonIcon}>
                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
              </View>
              <Text style={styles.softButtonText}>Agregar participante</Text>
            </TouchableOpacity>

            {participantes.map((p, index) => (
              <View key={index} style={[styles.cardInner, styles.mt12]}>
                <Text style={styles.miniTitle}>Participante #{index + 1}</Text>

                <View style={styles.field}>
                  <FieldLabel text="Nombres completos" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre y apellidos"
                    value={p.nombre}
                    onChangeText={(t) =>
                      cambiarParticipante(index, "nombre", t)
                    }
                  />
                </View>

                <View style={styles.field}>
                  <FieldLabel text="DNI" />
                  <TextInput
                    style={styles.input}
                    placeholder="DNI"
                    keyboardType="numeric"
                    value={p.dni}
                    onChangeText={(t) => cambiarParticipante(index, "dni", t)}
                  />
                </View>
              </View>
            ))}
          </Section>

          {/* ✅ NUEVA SECCIÓN: UBICACIÓN GPS */}
          <Section title="Ubicación (GPS)" subtitle="Adjunte la ubicación actual del incidente.">
            <TouchableOpacity
              style={[
                styles.softButton,
                ubicacion ? { backgroundColor: "#ecfccb", borderColor: "#84cc16" } : null
              ]}
              onPress={obtenerUbicacion}
              disabled={loadingGPS}
              activeOpacity={0.9}
            >
              <View style={[styles.softButtonIcon, ubicacion ? { backgroundColor: "#65a30d" } : null]}>
                {loadingGPS ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name={ubicacion ? "checkmark.circle.fill" : "location.fill"} size={18} color="#fff" />
                )}
              </View>
              <View>
                <Text style={styles.softButtonText}>
                  {ubicacion ? "Ubicación Adjuntada" : "Obtener Ubicación GPS"}
                </Text>
                {ubicacion && (
                  <Text style={{ fontSize: 10, color: "#4d7c0f", fontWeight: "700" }}>
                    Lat: {ubicacion.lat.slice(0, 7)}... Lon: {ubicacion.lng.slice(0, 7)}...
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Section>

          <Section title="Evidencias" subtitle="Adjunte fotos o videos relacionados al parte.">
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleFilePick}
              activeOpacity={0.9}
            >
              <View style={styles.primaryIcon}>
                <IconSymbol
                  name="chevron.left.forwardslash.chevron.right"
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.primaryButtonText}>Agregar evidencia</Text>
            </TouchableOpacity>

            {archivos.length > 0 && (
              <ScrollView
                horizontal
                style={styles.mt12}
                showsHorizontalScrollIndicator={false}
              >
                {archivos.map((file, index) => (
                  <View key={index} style={styles.previewItem}>
                    <Image source={{ uri: file.uri }} style={styles.previewImage} />
                    <Text style={styles.previewLabel}>
                      {file.type === "video" ? "Video" : "Foto"} {index + 1}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </Section>

          <TouchableOpacity
            style={[styles.saveButton, loading ? styles.saveButtonDisabled : null]}
            onPress={enviarParte}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Parte</Text>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectorTitulo}</Text>

            <FlatList
              data={selectorOpciones}
              keyExtractor={(item) => item}
              renderItem={renderOpcion}
              initialNumToRender={12}
              maxToRenderPerBatch={18}
              windowSize={10}
              removeClippedSubviews
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectorVisible(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

/** ✅ Tipado explícito: cada estilo sabe si es View/Text/Image */
type Styles = {
  container: ViewStyle;
  scrollContent: ViewStyle;

  header: ViewStyle;
  title: TextStyle;
  headerHint: TextStyle;

  card: ViewStyle;
  cardHeader: ViewStyle;
  cardInner: ViewStyle;
  cardTitle: TextStyle;
  cardSubtitle: TextStyle;

  row: ViewStyle;
  col: ViewStyle;
  colLeft: ViewStyle;
  colRight: ViewStyle;

  field: ViewStyle;

  label: TextStyle;
  req: TextStyle;

  input: TextStyle;
  textArea: TextStyle;

  selector: ViewStyle;
  selectorRow: ViewStyle;
  selectorText: TextStyle;
  placeholder: TextStyle;
  selectorArrow: TextStyle;

  miniTitle: TextStyle;

  softButton: ViewStyle;
  softButtonIcon: ViewStyle;
  softButtonText: TextStyle;

  primaryButton: ViewStyle;
  primaryIcon: ViewStyle;
  primaryButtonText: TextStyle;

  mt12: ViewStyle;

  previewItem: ViewStyle;
  previewImage: ImageStyle;
  previewLabel: TextStyle;

  saveButton: ViewStyle;
  saveButtonDisabled: ViewStyle;
  saveButtonText: TextStyle;

  modalOverlay: ViewStyle;
  modalContainer: ViewStyle;
  modalTitle: TextStyle;
  modalItem: ViewStyle;
  modalItemText: TextStyle;
  modalChevron: TextStyle;
  modalCloseBtn: ViewStyle;
  modalCloseText: TextStyle;

  spacer: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#F3F6FA" },
  scrollContent: { padding: 14, paddingBottom: 30 },

  header: { marginTop: 6, marginBottom: 12, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", color: "#0f172a" },
  headerHint: { marginTop: 6, fontSize: 12, fontWeight: "800", color: "#64748b" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardHeader: { marginBottom: 10 },
  cardInner: {
    backgroundColor: "#FBFDFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6EDF5",
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0f172a", letterSpacing: 0.4 },
  cardSubtitle: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#64748b", lineHeight: 16 },

  row: { flexDirection: "row", alignItems: "flex-start" },
  col: { flex: 1 },
  colLeft: { marginRight: 6 },
  colRight: { marginLeft: 6 },

  field: { marginBottom: 12 },

  label: { fontSize: 12, fontWeight: "900", color: "#334155", marginBottom: 6 },
  req: { color: "#dc2626", fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: "#DCE7F3",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  textArea: { minHeight: 110, textAlignVertical: "top", lineHeight: 20 },

  selector: {
    borderWidth: 1,
    borderColor: "#DCE7F3",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  selectorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectorText: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  placeholder: { color: "#94a3b8", fontWeight: "800" },
  selectorArrow: { fontSize: 18, fontWeight: "900", color: "#0a7ea4" },

  miniTitle: { fontSize: 12, fontWeight: "900", color: "#0f172a", marginBottom: 10 },

  softButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE7F3",
    backgroundColor: "#F8FBFF",
  },
  softButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  softButtonText: { fontSize: 14, fontWeight: "900", color: "#0f172a" },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryIcon: { marginRight: 10 },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  mt12: { marginTop: 12 },

  previewItem: { marginRight: 10, alignItems: "center" },
  previewImage: { width: 92, height: 92, borderRadius: 14, backgroundColor: "#e2e8f0" },
  previewLabel: { marginTop: 6, fontSize: 12, fontWeight: "900", color: "#334155" },

  saveButton: {
    marginTop: 14,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.75 },
  saveButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
    maxHeight: "78%",
    borderWidth: 1,
    borderColor: "#E6EDF5",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: { fontSize: 14, fontWeight: "900", color: "#0f172a" },
  modalChevron: { fontSize: 20, fontWeight: "900", color: "#0a7ea4" },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  spacer: { height: 28 },
});