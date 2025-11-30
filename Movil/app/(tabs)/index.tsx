import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { obtenerSesion } from '../../utils/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAlert } from '../../context/GlobalAlert';

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
    'VIOLENCIA FAMILIAR',
    'PERSONAS SOSPECHOSAS',
    'DESASTRES NATURALES',
    'ALTERACION DEL ORDEN PUBLICO',
    'ACCIDENTES CON MATERIALES PELIGROSOS',
    'APOYO A EMERGENCIAS MEDICAS',
    'OTROS NO ESPECIFICADOS',
  ],
  asunto: [
    'PATRULLAJE',
    'ALERTA RADIAL',
    'CENTRAL DE CAMARAS',
    'OPERATIVO',
    'LLAMADA PNP',
  ],
};

type Participante = {
  nombre: string;
  dni: string;
};

export default function CrearParteScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<any[]>([]); // Fotos/Videos
  const [participantes, setParticipantes] = useState<Participante[]>([]);

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

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorCampo, setSelectorCampo] = useState<keyof typeof form | null>(
    null
  );
  const [selectorTitulo, setSelectorTitulo] = useState('');
  const [selectorOpciones, setSelectorOpciones] = useState<string[]>([]);

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

  // Adjuntar evidencia (fotos / videos)
  const handleFilePick = async () => {
    const permission =
      Platform.OS === 'web'
        ? { granted: true }
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({
        title: 'Permiso denegado',
        message: 'Se requiere acceso a la galería para adjuntar evidencias.',
        type: 'error',
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

  // Participantes
  const agregarParticipante = () => {
    setParticipantes((prev) => [...prev, { nombre: '', dni: '' }]);
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

  // Enviar parte al backend
  const enviarParte = async () => {
    if (!form.parte_fisico || !form.sumilla) {
      showAlert({
        title: 'Faltan datos',
        message: 'N° Parte y la Incidencia son obligatorios.',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const session = await obtenerSesion();
      if (!session?.usuario?.id) {
        setLoading(false);
        showAlert({
          title: 'Error',
          message: 'Sesión inválida.',
          type: 'error',
        });
        return;
      }

      // Hora inicio
      let horaInicio = form.hora;
      if (!horaInicio) {
        horaInicio = new Date()
          .toLocaleTimeString('es-PE', { hour12: false })
          .slice(0, 5);
      }

      // Hora fin: si la escriben, se envía; si se deja vacío, se envía vacío (backend lo pone NULL)
      let horaFin = form.hora_fin.trim();

      const formData = new FormData();
      formData.append('parte_fisico', form.parte_fisico);
      formData.append('fecha', form.fecha);
      formData.append('hora', horaInicio);
      formData.append('hora_fin', horaFin);
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
      formData.append('asunto', form.asunto); // Origen de atención
      formData.append('ocurrencia', form.ocurrencia);
      formData.append('sup_zonal', form.sup_zonal);
      formData.append('sup_general', form.sup_general);
      formData.append('usuario_id', String(session.usuario.id));

      // NUEVO: participantes (array de { nombre, dni } en JSON)
      formData.append('participantes', JSON.stringify(participantes));

      // Archivos evidencia
      for (let index = 0; index < archivos.length; index++) {
        const file: any = archivos[index];
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
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          title: 'Éxito',
          message: 'Parte registrado correctamente.',
          type: 'success',
        });

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
        setParticipantes([]);

        // Ir al historial
        router.push('/(tabs)/historial');
      } else {
        showAlert({
          title: 'Error',
          message: data.message || 'No se pudo guardar el parte.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error(error);
      showAlert({
        title: 'Error',
        message: 'Fallo de conexión con el servidor.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOpcion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => seleccionarOpcion(item)}
    >
      <Text>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Nuevo Parte Virtual
        </ThemedText>

        {/* N° Parte Físico */}
        <TextInput
          style={styles.input}
          placeholder="N° Parte Físico (*)"
          value={form.parte_fisico}
          onChangeText={(t) => handleChange('parte_fisico', t)}
        />

        {/* Fecha / Hora inicio */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={form.fecha}
              onChangeText={(t) => handleChange('fecha', t)}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hora inicio</Text>
            <TextInput
              style={styles.input}
              value={form.hora}
              onChangeText={(t) => handleChange('hora', t)}
            />
          </View>
        </View>

        {/* Hora fin */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hora fin (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={form.hora_fin}
            onChangeText={(t) => handleChange('hora_fin', t)}
          />
        </View>

        {/* Sector / Zona */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              abrirSelector('sector', 'Selecciona Sector', LISTAS.sector)
            }
          >
            <Text style={styles.label}>Sector</Text>
            <Text style={styles.selectorText}>
              {form.sector || 'Seleccionar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              abrirSelector('zona', 'Selecciona Zona', LISTAS.zona)
            }
          >
            <Text style={styles.label}>Zona</Text>
            <Text style={styles.selectorText}>{form.zona || 'Seleccionar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Turno */}
        <TouchableOpacity
          style={styles.selector}
          onPress={() =>
            abrirSelector('turno', 'Selecciona Turno', LISTAS.turno)
          }
        >
          <Text style={styles.label}>Turno</Text>
          <Text style={styles.selectorText}>
            {form.turno || 'Seleccionar'}
          </Text>
        </TouchableOpacity>

        {/* Lugar */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Lugar</Text>
          <TextInput
            style={styles.input}
            placeholder="Lugar del hecho"
            value={form.lugar}
            onChangeText={(t) => handleChange('lugar', t)}
          />
        </View>

        {/* Unidad, Placa, Conductor */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              abrirSelector(
                'unidad_tipo',
                'Tipo de unidad',
                LISTAS.unidad_tipo
              )
            }
          >
            <Text style={styles.label}>Tipo Unidad</Text>
            <Text style={styles.selectorText}>
              {form.unidad_tipo || 'Seleccionar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>N° unidad</Text>
            <TextInput
              style={styles.input}
              placeholder="N° Unidad"
              value={form.unidad_numero}
              onChangeText={(t) => handleChange('unidad_numero', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Placa</Text>
            <TextInput
              style={styles.input}
              placeholder="Placa"
              value={form.placa}
              onChangeText={(t) => handleChange('placa', t)}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Conductor</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del conductor"
              value={form.conductor}
              onChangeText={(t) => handleChange('conductor', t)}
            />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>DNI Conductor</Text>
          <TextInput
            style={styles.input}
            placeholder="DNI"
            value={form.dni_conductor}
            onChangeText={(t) => handleChange('dni_conductor', t)}
            keyboardType="numeric"
          />
        </View>

        {/* 🔹 PARTICIPANTES */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Participantes (opcional)</Text>
          <TouchableOpacity
            style={styles.addParticipantButton}
            onPress={agregarParticipante}
          >
            <IconSymbol name="person.2.fill" size={18} color="#fff" />
            <Text style={styles.addParticipantButtonText}>
              Agregar participante
            </Text>
          </TouchableOpacity>
        </View>

        {participantes.map((p, index) => (
          <View style={styles.row} key={index}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombres completos"
                value={p.nombre}
                onChangeText={(t) =>
                  cambiarParticipante(index, 'nombre', t)
                }
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>DNI</Text>
              <TextInput
                style={styles.input}
                placeholder="DNI"
                keyboardType="numeric"
                value={p.dni}
                onChangeText={(t) => cambiarParticipante(index, 'dni', t)}
              />
            </View>
          </View>
        ))}

        {/* Incidencia (sumilla) */}
        <TouchableOpacity
          style={styles.selector}
          onPress={() =>
            abrirSelector('sumilla', 'Selecciona Incidencia', LISTAS.incidencia)
          }
        >
          <Text style={styles.label}>Incidencia (*)</Text>
          <Text style={styles.selectorText}>
            {form.sumilla || 'Seleccionar'}
          </Text>
        </TouchableOpacity>

        {/* Origen de atención (asunto) */}
        <TouchableOpacity
          style={styles.selector}
          onPress={() =>
            abrirSelector('asunto', 'Origen de atención', LISTAS.asunto)
          }
        >
          <Text style={styles.label}>Origen de atención</Text>
          <Text style={styles.selectorText}>
            {form.asunto || 'Seleccionar'}
          </Text>
        </TouchableOpacity>

        {/* Ocurrencia (detalle) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Detalle de ocurrencia</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe la ocurrencia"
            value={form.ocurrencia}
            onChangeText={(t) => handleChange('ocurrencia', t)}
            multiline
          />
        </View>

        {/* Supervisores */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Supervisor Zonal</Text>
          <TextInput
            style={styles.input}
            placeholder="Supervisor Zonal"
            value={form.sup_zonal}
            onChangeText={(t) => handleChange('sup_zonal', t)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Supervisor General</Text>
          <TextInput
            style={styles.input}
            placeholder="Supervisor General"
            value={form.sup_general}
            onChangeText={(t) => handleChange('sup_general', t)}
          />
        </View>

        {/* Adjuntar evidencias */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Evidencias (fotos / videos)</Text>
          <TouchableOpacity
            style={styles.addFileButton}
            onPress={handleFilePick}
          >
            <IconSymbol name="photo" size={20} color="#fff" />
            <Text style={styles.addFileButtonText}>Agregar evidencia</Text>
          </TouchableOpacity>

          {archivos.length > 0 && (
            <ScrollView horizontal style={styles.previewContainer}>
              {archivos.map((file, index) => (
                <View key={index} style={styles.previewItem}>
                  <Image
                    source={{ uri: file.uri }}
                    style={styles.previewImage}
                  />
                  <Text style={styles.previewLabel}>
                    {file.type === 'video' ? 'Video' : 'Foto'} {index + 1}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={enviarParte}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Guardar Parte</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal selector */}
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
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectorVisible(false)}
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
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 12,
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 12,
    flex: 1,
  },
  selectorText: {
    marginTop: 4,
    color: '#555',
  },
  addFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 4,
  },
  addFileButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 10,
  },
  previewItem: {
    marginRight: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  previewLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  // Participantes
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b21a8',
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 4,
  },
  addParticipantButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
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
