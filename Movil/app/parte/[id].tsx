import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { obtenerSesion } from '../../utils/session';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:4000/api'
    : 'http://10.0.2.2:4000/api';

export default function ParteDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [parte, setParte] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [horaFinLocal, setHoraFinLocal] = useState(''); // <- aquí guardamos la hora fin que el usuario quiere

  // Cargar parte desde el backend
  const cargarParte = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const session = await obtenerSesion();

      const resp = await fetch(`${API_URL}/partes/${id}`, {
        headers: {
          Authorization: session?.token ? `Bearer ${session.token}` : '',
        },
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.log('❌ Error cargando parte:', data);
        return;
      }

      const p = data.parte || data.data || data;
      console.log('📄 Parte cargada:', p);
      setParte(p);
      setHoraFinLocal(p.hora_fin || ''); // si ya está cerrado, mostramos su hora; si no, vacío
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cerrado =
    parte?.hora_fin && String(parte.hora_fin).trim().length > 0 ? true : false;

  // Botón del reloj -> coloca la hora actual en horaFinLocal
  const ponerHoraActual = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const hora = `${hh}:${mm}`;
    console.log('⏰ Hora actual usada para cierre:', hora);
    setHoraFinLocal(hora);
  };

  // Cerrar parte usando la horaFinLocal
  const ejecutarCerrarParte = async () => {
    if (!parte) return;
    if (!horaFinLocal.trim()) {
      console.log('⚠️ No hay hora_fin para cerrar');
      return;
    }

    setCerrando(true);

    try {
      const session = await obtenerSesion();

      console.log('🔒 Enviando cierre de parte', parte.id, 'hora_fin=', horaFinLocal);

      const resp = await fetch(`${API_URL}/partes/cerrar/${parte.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session?.token ? `Bearer ${session.token}` : '',
        },
        body: JSON.stringify({ hora_fin: horaFinLocal }),
      });

      const data = await resp.json();
      console.log('📥 Respuesta cierre parte:', data);

      if (!resp.ok || !data.ok) {
        console.log('❌ No se pudo cerrar el parte');
        return;
      }

      const actualizado = data.parte || data.data || data;
      setParte(actualizado);
      setHoraFinLocal(actualizado.hora_fin || '');

    } catch (error) {
      console.error('❌ Error fetch cerrar parte:', error);
    } finally {
      setCerrando(false);
    }
  };

  const irAMultimedia = () => {
    if (!parte) return;
    router.push(`/parte/multimedia/${parte.id}`);
  };

  if (loading || !parte) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 10 }}>Cargando parte...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Parte Virtual #{parte.id}
          </ThemedText>
          <ThemedText style={styles.subTitle}>
            N° Parte Físico:{' '}
            <Text style={styles.bold}>{parte.parte_fisico}</Text>
          </ThemedText>

          <View
            style={[
              styles.estadoBadge,
              cerrado ? styles.cerrado : styles.abierto,
            ]}
          >
            <Text style={styles.estadoText}>
              {cerrado ? 'CERRADO' : 'ABIERTO'}
            </Text>
          </View>
        </View>

        {/* FECHA / HORAS */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Fecha y Horas
          </ThemedText>
          <Row label="Fecha" value={parte.fecha} />
          <Row label="Hora inicio" value={parte.hora || '-'} />
          <Row
            label="Hora fin"
            value={parte.hora_fin || (cerrado ? '-' : 'En curso')}
          />

          {/* Si está ABIERTO, mostramos controles para definir hora_fin */}
          {!cerrado && (
            <View style={{ marginTop: 10 }}>
              <ThemedText style={styles.label}>
                Hora de cierre (HH:MM)
              </ThemedText>
              <View style={styles.horaRow}>
                <TextInput
                  style={styles.horaInput}
                  placeholder="Ej: 14:30"
                  value={horaFinLocal}
                  onChangeText={setHoraFinLocal}
                />
                <TouchableOpacity
                  style={styles.btnReloj}
                  onPress={ponerHoraActual}
                >
                  <IconSymbol name="clock" size={18} color="#fff" />
                  <Text style={styles.btnRelojText}>Usar hora actual</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.horaHint}>
                Puedes escribir la hora manual o usar el botón del reloj.
              </Text>
            </View>
          )}
        </View>

        {/* UBICACIÓN / TURNO */}
        <View className="section">
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ubicación y Turno
          </ThemedText>
          <Row label="Sector" value={parte.sector} />
          <Row label="Zona" value={parte.zona} />
          <Row label="Turno" value={parte.turno} />
          <Row label="Lugar" value={parte.lugar} />
        </View>

        {/* UNIDAD / CONDUCTOR */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Unidad y Conductor
          </ThemedText>
          <Row label="Unidad / Tipo" value={parte.unidad_tipo} />
          <Row label="Unidad N°" value={parte.unidad_numero} />
          <Row label="Placa" value={parte.placa} />
          <Row label="Conductor" value={parte.conductor} />
          <Row label="DNI Conductor" value={parte.dni_conductor} />
        </View>

        {/* DETALLE / INCIDENCIA */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Detalle de la Incidencia
          </ThemedText>
          <Row label="Incidencia" value={parte.sumilla} />
          <Row label="Origen de atención" value={parte.asunto} />
          <ThemedText style={styles.label}>Ocurrencia</ThemedText>
          <ThemedText style={styles.valueBlock}>
            {parte.ocurrencia || '-'}
          </ThemedText>
        </View>

        {/* SUPERVISIÓN */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Supervisión
          </ThemedText>
          <Row label="Supervisor Zonal" value={parte.supervisor_zonal} />
          <Row label="Supervisor General" value={parte.supervisor_general} />
        </View>

        {/* BOTONES */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.btnSecundario} onPress={irAMultimedia}>
            <IconSymbol name="photo" size={18} color="#0056b3" />
            <Text style={styles.btnSecundarioText}>
              Ver contenido multimedia
            </Text>
          </TouchableOpacity>

          {/* Cerrar parte solo si está ABIERTO */}
          {!cerrado && (
            <TouchableOpacity
              style={[
                styles.btnCerrar,
                (!horaFinLocal.trim() || cerrando) && styles.btnCerrarDisabled,
              ]}
              onPress={ejecutarCerrarParte}
              disabled={!horaFinLocal.trim() || cerrando}
            >
              {cerrando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol name="lock" size={18} color="#fff" />
                  <Text style={styles.btnCerrarText}>CERRAR PARTE</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value || '-'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eef4ff',
  },
  title: { textAlign: 'center', marginBottom: 6 },
  subTitle: { textAlign: 'center', marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  estadoBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  cerrado: { backgroundColor: '#d9534f' },
  abierto: { backgroundColor: '#5cb85c' },
  estadoText: { color: '#fff', fontWeight: 'bold' },
  section: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: { marginBottom: 8, color: '#0056b3' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  value: { flex: 1, textAlign: 'right' },
  valueBlock: { marginTop: 4, lineHeight: 18 },
  buttonsContainer: { marginTop: 18, gap: 10 },
  btnSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0056b3',
    backgroundColor: '#f5f8ff',
  },
  btnSecundarioText: {
    color: '#0056b3',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  btnCerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#d9534f',
  },
  btnCerrarDisabled: {
    opacity: 0.5,
  },
  btnCerrarText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  horaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  horaInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  btnReloj: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0056b3',
  },
  btnRelojText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  horaHint: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
  },
});
