import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  View,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { obtenerSesion } from '../../utils/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:4000/api'
    : 'http://10.0.2.2:4000/api';

const LISTAS = {
  sector: ['1', '2', '3', '4', '5', '6', '7', '8'],
  zona: ['A', 'B', 'C', 'D', 'E', 'F'],
  turno: ['MAÑANA', 'TARDE', 'NOCHE'],
  unidad_tipo: ['OMEGA', 'ALFA'],
  incidencia: [
    'ROBO A TRANSEUNTE',
    'CONSUMIDORES DE SUSTANCIAS TOXICAS',
    'HERIDOS POR ARMA DE FUEGO',
    'HERIDOS POR ARMA BLANCA',
    'CHOQUE VEHICULAR',
    'USURPACION O INVASION DE TERRENO',
    'ROBO DE VEHICULOS,VIVIENDAS Y OTROS',
    'ACTOS OBSENOS',
    'OCCISO POR: ARMA DE FUEGO',
    'OCSISO POR :  ARMA BLANCA',
    'DESPISTE/VOLCADURA',
    'ESTAFA',
    'VEHICULOS,PERSONAS SOSPECHOSAS',
    'RUIDOS MOLESTOS',
    'MORDEDURA CANINA',
    'ALTERACION DEL ORDEN PUBLICO / GRESCA',
    'PERSONA EXTRAVIADA',
    'DISUACION DE MERETRICES',
    'QUEMA DE MALEZA/ ARROJO DE BASURA',
    'ANIEGO',
    'RETENCION DE DELINCUENTES',
    'VIOLENCIA FAMILIAR/SEXUAL',
    'CONSUMIDORES DE ALCHOL',
    'INCENDIO',
    'ATROPELLO/CAIDA DE PASAJERO',
    'ATENCION PARAMEDICA',
    'REFORZAMIENTO DEL PATRULLAJE',
    'APOYO AL CONTRIBUYENTE',
    'INICIO DE SERVICIO',
  ],
  asunto: [
    'PATRULLAJE',
    'ALERTA RADIAL',
    'CENTRAL DE CAMARAS',
    'OPERATIVO',
    'LLAMADA PNP',
  ],
};

export default function CrearParteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<any[]>([]); // Fotos/Videos

  const [form, setForm] = useState({
    parte_fisico: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date()
      .toLocaleTimeString('es-PE', {
        hour12: false,
      })
      .slice(0, 5), // Hora inicio
    hora_fin: '', // Hora fin (opcional)
    sector: '',
    zona: '',
    turno: '',
    lugar: '',
    unidad_tipo: '',
    unidad_numero: '',
    placa: '',
    conductor: '',
    dni_conductor: '',
    sumilla: '', // Incidencia
    asunto: '', // Origen de atención
    ocurrencia: '',
    sup_zonal: '',
    sup_general: '',
  });

  // Estado Selectores
  const [modalVisible, setModalVisible] = useState(false);
  const [campoActual, setCampoActual] = useState('');
  const [opcionesActuales, setOpcionesActuales] = useState<string[]>([]);

  const handleChange = (key: string, value: string) =>
    setForm({ ...form, [key]: value });

  const abrirSelector = (campo: string, opciones: string[]) => {
    setCampoActual(campo);
    setOpcionesActuales(opciones);
    setModalVisible(true);
  };

  const seleccionar = (val: string) => {
    handleChange(campoActual, val);
    setModalVisible(false);
  };

  // Adjuntar evidencia (fotos / videos)
  const adjuntarEvidencia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setArchivos([...archivos, ...result.assets]);
    }
  };

  const removerArchivo = (index: number) => {
    const nuevos = [...archivos];
    nuevos.splice(index, 1);
    setArchivos(nuevos);
  };

  // Enviar parte al backend
  const enviarParte = async () => {
    if (!form.parte_fisico || !form.sumilla) {
      return Alert.alert(
        'Faltan datos',
        'N° Parte y la Incidencia son obligatorios.'
      );
    }

    setLoading(true);

    try {
      const session = await obtenerSesion();
      if (!session?.usuario?.id) {
        setLoading(false);
        return Alert.alert('Error', 'Sesión inválida.');
      }

      // Hora inicio
      let horaInicio = form.hora;
      if (!horaInicio) {
        horaInicio = new Date()
          .toLocaleTimeString('es-PE', { hour12: false })
          .slice(0, 5);
      }

      // Hora fin: si la escriben, se envía; si se deja vacío, se envía null
      let horaFin = form.hora_fin.trim();

      const formData = new FormData();
      formData.append('parte_fisico', form.parte_fisico);
      formData.append('fecha', form.fecha);
      formData.append('hora', horaInicio);
      formData.append('hora_fin', horaFin); // si viene vacío, el backend lo guarda como null
      formData.append('sector', form.sector);
      formData.append('zona', form.zona);
      formData.append('turno', form.turno);
      formData.append('lugar', form.lugar);
      formData.append('unidad_tipo', form.unidad_tipo);
      formData.append('unidad_numero', form.unidad_numero);
      formData.append('placa', form.placa);
      formData.append('conductor', form.conductor);
      formData.append('dni_conductor', form.dni_conductor);
      formData.append('sumilla', form.sumilla); // Incidencia
      formData.append('asunto', form.asunto);   // Origen de atención
      formData.append('ocurrencia', form.ocurrencia);
      formData.append('sup_zonal', form.sup_zonal);
      formData.append('sup_general', form.sup_general);
      formData.append('usuario_id', String(session.usuario.id));

      // Archivos evidencia
      for (let index = 0; index < archivos.length; index++) {
        const file = archivos[index];
        const isVideo = file.type === 'video';
        const tipoMime = isVideo ? 'video/mp4' : 'image/jpeg';
        const ext = isVideo ? '.mp4' : '.jpg';
        const fileName = `evidencia_${index}${ext}`;

        if (Platform.OS === 'web') {
          try {
            const resp = await fetch(file.uri);
            const blob = await resp.blob();
            // @ts-ignore
            formData.append('evidencia', blob, fileName);
          } catch (e) {
            console.log('Error convirtiendo archivo a blob', e);
          }
        } else {
          // @ts-ignore
          formData.append('evidencia', {
            uri: file.uri,
            name: fileName,
            type: tipoMime,
          });
        }
      }

      console.log('📤 Enviando FormData a:', `${API_URL}/partes`);

      const response = await fetch(`${API_URL}/partes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          // NO pongas Content-Type aquí, fetch lo arma solo para multipart
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Parte registrado correctamente.');

        // Reseteamos formulario
        setForm({
          parte_fisico: '',
          fecha: new Date().toISOString().split('T')[0],
          hora: '',
          hora_fin: '',
          sector: '',
          zona: '',
          turno: '',
          lugar: '',
          unidad_tipo: '',
          unidad_numero: '',
          placa: '',
          conductor: '',
          dni_conductor: '',
          sumilla: '',
          asunto: '',
          ocurrencia: '',
          sup_zonal: '',
          sup_general: '',
        });
        setArchivos([]);

        // Ir al historial
        router.push('/(tabs)/historial');
      } else {
        Alert.alert('Error', data.message || 'No se pudo guardar el parte.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Fallo de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Nuevo Parte Virtual
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="N° Parte Físico (*)"
          value={form.parte_fisico}
          onChangeText={(t) => handleChange('parte_fisico', t)}
        />

        {/* FECHA + HORA INICIO */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Fecha"
            value={form.fecha}
            onChangeText={(t) => handleChange('fecha', t)}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Hora inicio"
            value={form.hora}
            onChangeText={(t) => handleChange('hora', t)}
          />
        </View>

        {/* HORA FIN */}
        <TextInput
          style={styles.input}
          placeholder="Hora fin (si ya terminó la incidencia)"
          value={form.hora_fin}
          onChangeText={(t) => handleChange('hora_fin', t)}
        />
        <Text style={{ fontSize: 12, marginBottom: 10, color: '#555' }}>
          Si dejas la hora de fin vacía, el parte se registra como ABIERTO y
          luego podrás cerrarlo desde el detalle con el botón CERRAR PARTE.
        </Text>

        {/* SELECTORES SECTOR / ZONA / TURNO */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.selector, styles.half]}
            onPress={() => abrirSelector('sector', LISTAS.sector)}
          >
            <Text
              style={form.sector ? styles.textSelected : styles.textPlaceholder}
            >
              {form.sector ? `Sector ${form.sector}` : 'Sector ▼'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selector, styles.half]}
            onPress={() => abrirSelector('zona', LISTAS.zona)}
          >
            <Text
              style={form.zona ? styles.textSelected : styles.textPlaceholder}
            >
              {form.zona ? `Zona ${form.zona}` : 'Zona ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.selector}
          onPress={() => abrirSelector('turno', LISTAS.turno)}
        >
          <Text
            style={form.turno ? styles.textSelected : styles.textPlaceholder}
          >
            {form.turno || 'Seleccionar Turno ▼'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Lugar"
          value={form.lugar}
          onChangeText={(t) => handleChange('lugar', t)}
        />

        <ThemedText type="subtitle" style={styles.st}>
          Unidad
        </ThemedText>
        <View style={styles.row}>
          {/* UNIDAD / TIPO -> DESPLEGABLE OMEGA / ALFA */}
          <TouchableOpacity
            style={[styles.selector, styles.half]}
            onPress={() => abrirSelector('unidad_tipo', LISTAS.unidad_tipo)}
          >
            <Text
              style={
                form.unidad_tipo ? styles.textSelected : styles.textPlaceholder
              }
            >
              {form.unidad_tipo || 'Unidad / Tipo ▼'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.half]}
            placeholder="N°"
            value={form.unidad_numero}
            onChangeText={(t) => handleChange('unidad_numero', t)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Placa"
          value={form.placa}
          onChangeText={(t) => handleChange('placa', t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Conductor"
          value={form.conductor}
          onChangeText={(t) => handleChange('conductor', t)}
        />
        <TextInput
          style={styles.input}
          placeholder="DNI Conductor"
          keyboardType="numeric"
          value={form.dni_conductor}
          onChangeText={(t) => handleChange('dni_conductor', t)}
        />

        <ThemedText type="subtitle" style={styles.st}>
          Detalle
        </ThemedText>

        {/* INCIDENCIA (sumilla) */}
        <TouchableOpacity
          style={styles.selector}
          onPress={() => abrirSelector('sumilla', LISTAS.incidencia)}
        >
          <Text
            style={form.sumilla ? styles.textSelected : styles.textPlaceholder}
          >
            {form.sumilla || 'Incidencia ▼'}
          </Text>
        </TouchableOpacity>

        {/* ASUNTO -> ORIGEN DE ATENCIÓN */}
        <TouchableOpacity
          style={styles.selector}
          onPress={() => abrirSelector('asunto', LISTAS.asunto)}
        >
          <Text
            style={form.asunto ? styles.textSelected : styles.textPlaceholder}
          >
            {form.asunto || 'Origen de atención ▼'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ocurrencia..."
          multiline
          numberOfLines={4}
          value={form.ocurrencia}
          onChangeText={(t) => handleChange('ocurrencia', t)}
        />

        <ThemedText type="subtitle" style={styles.st}>
          Supervisión
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Sup. Zonal"
          value={form.sup_zonal}
          onChangeText={(t) => handleChange('sup_zonal', t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Sup. General"
          value={form.sup_general}
          onChangeText={(t) => handleChange('sup_general', t)}
        />

        <ThemedText type="subtitle" style={styles.st}>
          Evidencia
        </ThemedText>
        <TouchableOpacity
          style={styles.btnEvidencia}
          onPress={adjuntarEvidencia}
        >
          <IconSymbol name="paperclip" size={20} color="#fff" />
          <Text
            style={{
              color: '#fff',
              fontWeight: 'bold',
              marginLeft: 10,
            }}
          >
            FOTOS / VIDEOS
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal style={{ marginTop: 10 }}>
          {archivos.map((f, i) => (
            <View key={i} style={{ marginRight: 10 }}>
              <Image
                source={{ uri: f.uri }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={() => removerArchivo(i)}
                style={styles.btnRemove}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={enviarParte}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>REGISTRAR PARTE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Seleccionar {campoActual.toUpperCase()}
            </Text>
            <FlatList
              data={opcionesActuales}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => seleccionar(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  title: { textAlign: 'center', marginBottom: 20 },
  st: { marginTop: 15, marginBottom: 5, color: '#0056b3' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  selector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },
  textPlaceholder: { color: '#999' },
  textSelected: { color: '#000' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#0056b3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  btnEvidencia: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRemove: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBtn: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    alignItems: 'center',
  },
});
