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
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { obtenerSesion } from "../../utils/session";
import { useAlert } from "../../context/GlobalAlert";

const API_URL = Platform.OS === "web" ? "http://localhost:4000/api" : "http://10.0.2.2:4000/api";

type Participante = { nombre: string; dni: string; cargo: string };

// --- COMPONENTES UI ---
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const FieldLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <Text style={styles.label}>
    {text} {required && <Text style={styles.req}>*</Text>}
  </Text>
);

const Selector = ({ label, value, onPress, placeholder = "Seleccionar", required }: any) => (
  <View style={styles.fieldContainer}>
    <FieldLabel text={label} required={required} />
    <TouchableOpacity style={styles.selector} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.selectorText, !value && styles.placeholder]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#64748B" />
    </TouchableOpacity>
  </View>
);

export default function CrearParteScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  // DATOS FIJOS
  const LISTAS = useMemo(() => ({
    sector: Array.from({ length: 13 }, (_, i) => String(i + 1)),
    zona: ["NORTE", "CENTRO", "SUR"],
    turno: ["DIA (06:00 - 18:00)", "NOCHE (18:00 - 06:00)"],
    unidad_tipo: ["CAMIONETA", "MOTO", "AUTO", "A PIE"],
    incidencia: [
        "ROBO A TRANSEUNTE", "CONSUMIDORES DE SUSTANCIAS", "HERIDOS ARMA FUEGO",
        "HERIDOS ARMA BLANCA", "CHOQUE VEHICULAR", "USURPACION TERRENO",
        "ROBO VEHICULOS/VIVIENDA", "VIOLENCIA FAMILIAR", "PERSONAS SOSPECHOSAS",
        "DESASTRES NATURALES", "ALTERACION ORDEN PUBLICO", "MATERIALES PELIGROSOS",
        "APOYO MEDICO", "PROTECCION ESCOLAR", "OTROS"
    ],
    asunto: ["PATRULLAJE", "ALERTA RADIAL", "CÁMARAS", "OPERATIVO", "LLAMADA PNP"],
    cargos_participantes: ["AMAZONAS", "OPERADOR", "DELTA", "K9", "PARAMEDICA", "ALFA"],
    // OPCIONES DE MANDO
    sup_general_opts: ["SUPERVISOR GENERAL", "JEFE DE OPERACIONES"]
  }), []);

  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: string; lng: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Estado para controlar qué tipo de mando se seleccionó visualmente
  const [tipoMandoSeleccionado, setTipoMandoSeleccionado] = useState(""); 

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

  // SELECTOR MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ 
      campo: "", 
      titulo: "", 
      opciones: [] as string[],
      participantIndex: -1 
  });

  // HANDLERS
  const handleChange = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  
  const abrirSelector = (campo: string, titulo: string, opciones: string[], index: number = -1) => {
    setModalData({ campo, titulo, opciones, participantIndex: index });
    setModalVisible(true);
  };

  const seleccionarOpcion = (val: string) => {
    if (modalData.participantIndex >= 0) {
        // Lógica para Participantes
        updateParticipante(modalData.participantIndex, "cargo", val);
    } else {
        // ✅ LÓGICA ESPECIAL: SUPERVISOR GENERAL
        if (modalData.campo === "tipo_mando") {
            setTipoMandoSeleccionado(val); // Guardamos qué opción eligió visualmente
            
            if (val === "JEFE DE OPERACIONES") {
                // Automático
                handleChange("sup_general", "MORI TRIGOSO CARLOS");
            } else {
                // Manual (Limpiamos para que escriba)
                handleChange("sup_general", "");
            }
        } else {
            // Campos normales
            handleChange(modalData.campo, val);
        }
    }
    setModalVisible(false);
  };

  // GPS
  const obtenerUbicacion = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert({ title: "GPS", message: "Permiso denegado.", type: "error" });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUbicacion({ lat: String(loc.coords.latitude), lng: String(loc.coords.longitude) });
    } catch {
      showAlert({ title: "GPS", message: "Error obteniendo ubicación.", type: "error" });
    } finally {
      setLoadingGPS(false);
    }
  };

  // EVIDENCIAS
  const handleFilePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.5,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) setArchivos(prev => [...prev, ...result.assets]);
  };

  // PARTICIPANTES
  const agregarParticipante = () => setParticipantes(prev => [...prev, { nombre: "", dni: "", cargo: "" }]);
  
  const updateParticipante = (index: number, key: keyof Participante, val: string) => {
    const copy = [...participantes];
    copy[index] = { ...copy[index], [key]: val };
    setParticipantes(copy);
  };

  const eliminarParticipante = (index: number) => {
    const copy = [...participantes];
    copy.splice(index, 1);
    setParticipantes(copy);
  };

  // ENVIAR
  const enviarParte = async () => {
    if (!form.parte_fisico || !form.sumilla) {
      showAlert({ title: "Atención", message: "N° Parte e Incidencia son obligatorios.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const session = await obtenerSesion();
      if (!session || !session.usuario || !session.usuario.id) {
        showAlert({ title: "Error", message: "Sesión inválida. Reingrese.", type: "error" });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      formData.append("usuario_id", String(session.usuario.id));
      formData.append("participantes", JSON.stringify(participantes));
      
      if (ubicacion) {
        formData.append("latitud", ubicacion.lat);
        formData.append("longitud", ubicacion.lng);
      }

      for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i];
        const isVideo = file.type === "video";
        const name = `evidencia_${i}${isVideo ? ".mp4" : ".jpg"}`;
        
        if (Platform.OS === 'web') {
            const res = await fetch(file.uri);
            const blob = await res.blob();
            formData.append("evidencia", blob, name);
        } else {
            // @ts-ignore
            formData.append("evidencia", { uri: file.uri, name, type: isVideo ? "video/mp4" : "image/jpeg" });
        }
      }

      const res = await fetch(`${API_URL}/partes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        showAlert({ title: "Éxito", message: "Parte registrado ID #" + data.id, type: "success" });
        router.push("/(tabs)/historial");
      } else {
        throw new Error(data.message);
      }
    } catch (e: any) {
      console.error(e);
      showAlert({ title: "Error", message: e.message || "Fallo al enviar.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NUEVO REPORTE</Text>
        <View style={{width: 24}}/>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* SECCIÓN 1: DATOS OPERATIVOS */}
          <View style={styles.card}>
            <SectionHeader title="DATOS OPERATIVOS" />
            
            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                    <FieldLabel text="N° PARTE FÍSICO" required />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ej: 1024" 
                        value={form.parte_fisico}
                        onChangeText={t => handleChange("parte_fisico", t)}
                        keyboardType="numeric"
                    />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                    <FieldLabel text="HORA INICIO" />
                    <TextInput 
                        style={styles.input} 
                        value={form.hora}
                        onChangeText={t => handleChange("hora", t)}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                    <Selector label="SECTOR" value={form.sector} onPress={() => abrirSelector("sector", "SECTOR", LISTAS.sector)} required />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                    <Selector label="ZONA" value={form.zona} onPress={() => abrirSelector("zona", "ZONA", LISTAS.zona)} />
                </View>
            </View>

            <Selector label="TURNO" value={form.turno} onPress={() => abrirSelector("turno", "TURNO", LISTAS.turno)} />
            
            <View style={styles.fieldContainer}>
                <FieldLabel text="LUGAR / DIRECCIÓN" />
                <TextInput 
                    style={styles.input} 
                    placeholder="Referencia exacta"
                    value={form.lugar}
                    onChangeText={t => handleChange("lugar", t)}
                />
            </View>
          </View>

          {/* SECCIÓN 2: UNIDAD MÓVIL */}
          <View style={styles.card}>
            <SectionHeader title="UNIDAD MÓVIL" />
            
            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                    <Selector label="TIPO" value={form.unidad_tipo} onPress={() => abrirSelector("unidad_tipo", "TIPO UNIDAD", LISTAS.unidad_tipo)} />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                    <FieldLabel text="PLACA / INTERNO" />
                    <TextInput 
                        style={styles.input} 
                        value={form.placa}
                        onChangeText={t => handleChange("placa", t)}
                        placeholder="ABC-123"
                    />
                </View>
            </View>
            
            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                    <FieldLabel text="CONDUCTOR" />
                    <TextInput 
                        style={styles.input} 
                        value={form.conductor}
                        onChangeText={t => handleChange("conductor", t)}
                        placeholder="Nombre conductor"
                    />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                    <FieldLabel text="DNI CONDUCTOR" />
                    <TextInput 
                        style={styles.input} 
                        value={form.dni_conductor}
                        onChangeText={t => handleChange("dni_conductor", t)}
                        placeholder="DNI"
                        keyboardType="numeric"
                    />
                </View>
            </View>
          </View>

          {/* SECCIÓN 3: DETALLE INCIDENCIA */}
          <View style={styles.card}>
            <SectionHeader title="DETALLE DE INCIDENCIA" />
            
            <Selector label="TIPO DE INCIDENCIA" value={form.sumilla} onPress={() => abrirSelector("sumilla", "INCIDENCIA", LISTAS.incidencia)} required />
            <Selector label="ORIGEN (ASUNTO)" value={form.asunto} onPress={() => abrirSelector("asunto", "ORIGEN", LISTAS.asunto)} />
            
            <View style={styles.fieldContainer}>
                <FieldLabel text="OCURRENCIA (RELATO)" />
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={form.ocurrencia}
                    onChangeText={t => handleChange("ocurrencia", t)}
                    multiline
                    numberOfLines={4}
                    placeholder="Describa los hechos detalladamente..."
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.fieldContainer}>
                <FieldLabel text="SUPERVISOR ZONAL" />
                <TextInput 
                    style={styles.input} 
                    value={form.sup_zonal}
                    onChangeText={t => handleChange("sup_zonal", t)}
                    placeholder="Nombre del Sup. Zonal"
                />
            </View>

            {/* ✅ SELECCIÓN DE MANDO */}
            <Selector 
                label="SELECCIONAR MANDO" 
                value={tipoMandoSeleccionado} 
                onPress={() => abrirSelector("tipo_mando", "SELECCIONAR CARGO", LISTAS.sup_general_opts)} 
                placeholder="Seleccione cargo"
            />

            {/* ✅ CAMPO CONDICIONAL: Solo aparece si elegiste "SUPERVISOR GENERAL" */}
            {tipoMandoSeleccionado === "SUPERVISOR GENERAL" && (
                <View style={styles.fieldContainer}>
                    <FieldLabel text="NOMBRE SUPERVISOR GENERAL" />
                    <TextInput 
                        style={styles.input} 
                        value={form.sup_general}
                        onChangeText={t => handleChange("sup_general", t)}
                        placeholder="Escriba el nombre aquí..."
                        autoFocus
                    />
                </View>
            )}

            {/* ✅ CAMPO INFORMATIVO (Solo lectura): Si es JEFE DE OPERACIONES */}
            {tipoMandoSeleccionado === "JEFE DE OPERACIONES" && (
                 <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>MANDO A CARGO:</Text>
                    <Text style={styles.infoValue}>{form.sup_general}</Text>
                 </View>
            )}

          </View>

          {/* SECCIÓN 4: PARTICIPANTES */}
          <View style={styles.card}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                <Text style={styles.sectionTitle}>PARTICIPANTES</Text>
                <TouchableOpacity onPress={agregarParticipante} style={styles.addBtnSmall}>
                    <Ionicons name="add" size={16} color="#FFF" />
                    <Text style={styles.addBtnText}>AGREGAR</Text>
                </TouchableOpacity>
            </View>
            
            {participantes.map((p, i) => (
                <View key={i} style={styles.participantCard}>
                    <TouchableOpacity onPress={() => eliminarParticipante(i)} style={styles.deleteParticipant}>
                        <Ionicons name="close" size={14} color="#EF4444" />
                    </TouchableOpacity>

                    <FieldLabel text={`PARTICIPANTE #${i+1}`} />
                    
                    <TextInput 
                        style={[styles.input, {marginBottom: 8}]} 
                        placeholder="Nombre completo" 
                        value={p.nombre} 
                        onChangeText={t => updateParticipante(i, "nombre", t)} 
                    />
                    
                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 8}}>
                            <TextInput 
                                style={styles.input} 
                                placeholder="DNI" 
                                keyboardType="numeric"
                                value={p.dni} 
                                onChangeText={t => updateParticipante(i, "dni", t)} 
                            />
                        </View>
                        <View style={{flex: 1, marginLeft: 8}}>
                            <TouchableOpacity 
                                style={styles.selector} 
                                onPress={() => abrirSelector("cargo", "SELECCIONAR CARGO", LISTAS.cargos_participantes, i)}
                            >
                                <Text style={[styles.selectorText, !p.cargo && styles.placeholder]}>
                                    {p.cargo || "Cargo"}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
            
            {participantes.length === 0 && (
                <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={24} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No hay participantes registrados.</Text>
                </View>
            )}
          </View>

          {/* SECCIÓN 5: EVIDENCIAS Y GPS */}
          <View style={styles.card}>
            <SectionHeader title="EVIDENCIAS DIGITALES" />
            
            <View style={styles.row}>
                <TouchableOpacity 
                    style={[styles.actionButton, ubicacion ? styles.btnSuccess : styles.btnNeutral]} 
                    onPress={obtenerUbicacion}
                    disabled={loadingGPS}
                >
                    {loadingGPS ? <ActivityIndicator color="#0F172A"/> : <Ionicons name="location" size={20} color={ubicacion ? "#065F46" : "#0F172A"} />}
                    <Text style={[styles.actionBtnText, ubicacion ? styles.textSuccess : null]}>
                        {ubicacion ? "GPS OK" : "OBTENER GPS"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.btnNeutral]} onPress={handleFilePick}>
                    <Ionicons name="camera" size={20} color="#0F172A" />
                    <Text style={styles.actionBtnText}>FOTOS/VIDEO ({archivos.length})</Text>
                </TouchableOpacity>
            </View>

            {/* PREVISUALIZACIÓN */}
            {archivos.length > 0 && (
                <ScrollView horizontal style={{marginTop: 10}} showsHorizontalScrollIndicator={false}>
                    {archivos.map((f, i) => (
                        <Image key={i} source={{uri: f.uri}} style={styles.thumb} />
                    ))}
                </ScrollView>
            )}
          </View>

          {/* BOTÓN GUARDAR */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledBtn]} 
            onPress={enviarParte}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>GUARDAR REPORTE OFICIAL</Text>}
          </TouchableOpacity>

          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SELECTOR */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{modalData.titulo}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>
                <FlatList 
                    data={modalData.opciones}
                    keyExtractor={i => i}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => seleccionarOpcion(item)}>
                            <Text style={styles.modalItemText}>{item}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
      </Modal>

    </View>
  );
}

// --- ESTILOS EMPRESARIALES SISIFO ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
  
  scrollContent: { padding: 16 },

  // CARDS
  card: {
    backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  sectionLine: { height: 1, backgroundColor: '#F1F5F9', marginTop: 4 },
  
  // FIELDS
  fieldContainer: { marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 4, marginLeft: 2 },
  req: { color: '#EF4444' },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10,
    height: 42, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC'
  },
  textArea: { height: 80, paddingVertical: 10 },
  
  // INFO BOX (JEFE OP)
  infoBox: {
    backgroundColor: '#EFF6FF', padding: 10, borderRadius: 6, 
    borderWidth: 1, borderColor: '#BFDBFE', marginTop: 8
  },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#1E40AF', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '900', color: '#1E3A8A' },
  
  // SELECTOR
  selector: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10,
    height: 42, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  selectorText: { fontSize: 13, color: '#0F172A', fontWeight: '600' },
  placeholder: { color: '#94A3B8' },

  row: { flexDirection: 'row', marginBottom: 12 },

  // PARTICIPANTES
  participantCard: {
    backgroundColor: '#F8FAFC', padding: 10, borderRadius: 6, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0', position: 'relative'
  },
  deleteParticipant: {
    position: 'absolute', top: 5, right: 5, padding: 5, zIndex: 10
  },
  addBtnSmall: { backgroundColor: '#0F172A', flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  
  emptyBox: { alignItems: 'center', paddingVertical: 10 },
  emptyText: { fontSize: 12, color: '#CBD5E1', fontStyle: 'italic', marginTop: 4 },

  // ACTIONS
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 6, marginHorizontal: 4, borderWidth: 1
  },
  btnNeutral: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  btnSuccess: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
  textSuccess: { color: '#065F46' },
  
  thumb: { width: 60, height: 60, borderRadius: 4, marginRight: 8, backgroundColor: '#E2E8F0' },

  // SUBMIT
  submitButton: {
    backgroundColor: '#059669', paddingVertical: 16, borderRadius: 8, 
    alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:4}
  },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { fontSize: 14, color: '#334155' }
});