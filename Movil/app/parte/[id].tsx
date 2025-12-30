import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  ActivityIndicator,
  View,
  Image,
  Linking,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { obtenerSesion } from "../../utils/session";
import { useAlert } from "../../context/GlobalAlert";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:4000/api"
    : "http://10.0.2.2:4000/api";

const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:4000"
    : "http://10.0.2.2:4000";

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

type InfoRowProps = { label: string; value?: string | null };
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || "---"}</Text>
  </View>
);

export default function DetalleParteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [parte, setParte] = useState<any>(null);

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        const session = await obtenerSesion();
        if (!session) return;

        const response = await fetch(`${API_URL}/partes/${id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const data = await response.json();

        if (response.ok) {
          setParte(data.data);
        } else {
          showAlert({ title: "Error", message: "No se encontró el reporte.", type: "error" });
        }
      } catch (error) {
        console.error(error);
        showAlert({ title: "Error", message: "Error de conexión.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarDetalle();
    }
  }, [id, showAlert]);

  const abrirMapa = () => {
    if (!parte?.latitud || !parte?.longitud) return;
    
    const lat = parte.latitud;
    const lng = parte.longitud;
    const label = "Ubicacion";

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    
    const latLng = `${lat},${lng}`;
    
    // URL corregida anteriormente
    const url = Platform.select({
      web: `https://www.google.com/maps?q=${lat},${lng}`, 
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
        Linking.openURL(url).catch((err) => {
           console.error("Error al abrir mapa:", err);
           if (Platform.OS !== 'web') {
              Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
           }
        });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (!parte) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se encontró información para &quot;{id}&quot;.</Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Parte ${parte.parte_fisico || ''}` }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalle del Parte</Text>
          <Text style={styles.headerSubtitle}>
             {parte.fecha} • {parte.hora}
          </Text>
        </View>

        {/* DATOS PRINCIPALES */}
        <Section title="Información General">
          <InfoRow label="N° Físico" value={parte.parte_fisico} />
          <InfoRow label="Sector" value={parte.sector} />
          <InfoRow label="Zona" value={parte.zona} />
          <InfoRow label="Turno" value={parte.turno} />
          <InfoRow label="Lugar" value={parte.lugar} />
        </Section>

        {/* UNIDAD */}
        <Section title="Unidad y Personal">
          <InfoRow label="Unidad" value={`${parte.unidad_tipo} - ${parte.unidad_numero}`} />
          <InfoRow label="Placa" value={parte.placa} />
          <InfoRow label="Conductor" value={parte.conductor} />
          <InfoRow label="DNI" value={parte.dni_conductor} />
        </Section>

        {/* INCIDENCIA */}
        <Section title="Incidencia">
          <InfoRow label="Tipo" value={parte.sumilla} />
          <InfoRow label="Origen" value={parte.asunto} />
          <View style={styles.textBox}>
            <Text style={styles.textLabel}>Ocurrencia:</Text>
            <Text style={styles.textContent}>{parte.ocurrencia}</Text>
          </View>
          <InfoRow label="Sup. Zonal" value={parte.supervisor_zonal} />
          <InfoRow label="Sup. General" value={parte.supervisor_general} />
        </Section>

        {/* PARTICIPANTES */}
        {parte.participantes && parte.participantes.length > 0 && (
          <Section title="Participantes">
            {parte.participantes.map((p: any, i: number) => (
              <View key={i} style={styles.participantRow}>
                <IconSymbol name="person.fill" size={16} color="#64748b" />
                <Text style={styles.participantText}>
                  {p.nombre} (DNI: {p.dni})
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* UBICACIÓN GPS */}
        {parte.latitud && parte.longitud && (
          <Section title="Ubicación GPS" subtitle="Coordenadas registradas del incidente.">
            <View style={styles.gpsContainer}>
               <View style={styles.gpsInfo}>
                  <Text style={styles.gpsLabel}>Latitud:</Text>
                  <Text style={styles.gpsValue}>{parte.latitud}</Text>
               </View>
               <View style={styles.gpsInfo}>
                  <Text style={styles.gpsLabel}>Longitud:</Text>
                  <Text style={styles.gpsValue}>{parte.longitud}</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={styles.mapButton} 
              onPress={abrirMapa}
              activeOpacity={0.8}
            >
              <IconSymbol name="map.fill" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>Ver Ubicación en Mapa</Text>
            </TouchableOpacity>
          </Section>
        )}

        {/* EVIDENCIAS MULTIMEDIA */}
        <Section title="Evidencias Multimedia">
          <View style={styles.mediaGrid}>
            {parte.fotos && parte.fotos.map((foto: string, i: number) => (
              <View key={`img-${i}`} style={styles.mediaItem}>
                <Image
                  source={{ uri: `${BASE_URL}/uploads/${foto}` }}
                  style={{ width: 100, height: 100 }}
                  resizeMode="cover" 
                />
              </View>
            ))}
            {(!parte.fotos || parte.fotos.length === 0) && (
              <Text style={styles.noMediaText}>No hay imágenes adjuntas.</Text>
            )}
          </View>

          {/* ✅ BOTÓN DE VIDEO MEJORADO */}
          {parte.videos && parte.videos.length > 0 && (
             <TouchableOpacity 
               style={styles.videoButton} 
               onPress={() => router.push(`/parte/multimedia/${id}`)}
               activeOpacity={0.8}
             >
                <IconSymbol name="play.rectangle.fill" size={20} color="#fff" />
                <Text style={styles.videoButtonText}>
                  Ver Videos Adjuntos ({parte.videos.length})
                </Text>
             </TouchableOpacity>
          )}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

// --- ESTILOS ---
type Styles = {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorText: TextStyle;
  scrollContent: ViewStyle;
  
  header: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;

  card: ViewStyle;
  cardHeader: ViewStyle;
  cardTitle: TextStyle;
  cardSubtitle: TextStyle;

  infoRow: ViewStyle;
  infoLabel: TextStyle;
  infoValue: TextStyle;

  textBox: ViewStyle;
  textLabel: TextStyle;
  textContent: TextStyle;

  participantRow: ViewStyle;
  participantText: TextStyle;

  gpsContainer: ViewStyle;
  gpsInfo: ViewStyle;
  gpsLabel: TextStyle;
  gpsValue: TextStyle;
  mapButton: ViewStyle;
  mapButtonText: TextStyle;

  mediaGrid: ViewStyle;
  mediaItem: ViewStyle;
  mediaImage: ImageStyle;
  noMediaText: TextStyle;
  
  // Nuevos estilos para el botón de video
  videoButton: ViewStyle;
  videoButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#F3F6FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748b", fontWeight: "600" },
  errorText: { color: "#dc2626", fontWeight: "700", fontSize: 16 },

  scrollContent: { padding: 14 },

  header: { marginBottom: 16, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  headerSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 },
  cardSubtitle: { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginTop: 2 },

  infoRow: { flexDirection: "row", marginBottom: 6 },
  infoLabel: { width: 100, fontSize: 13, fontWeight: "700", color: "#64748b" },
  infoValue: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0f172a" },

  textBox: { marginTop: 4, backgroundColor: "#f8fafc", padding: 10, borderRadius: 8 },
  textLabel: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 4 },
  textContent: { fontSize: 13, color: "#334155", lineHeight: 18 },

  participantRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  participantText: { fontSize: 13, color: "#334155", fontWeight: "600" },

  gpsContainer: { flexDirection: "row", gap: 16, marginBottom: 12 },
  gpsInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  gpsLabel: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  gpsValue: { fontSize: 12, fontWeight: "600", color: "#0f172a", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaItem: { 
    width: 100, 
    height: 100, 
    borderRadius: 8, 
    overflow: "hidden", 
    backgroundColor: "#e2e8f0",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8
  },
  mediaImage: { width: 100, height: 100 }, 
  noMediaText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  
  // ✅ ESTILOS NUEVOS DEL BOTÓN VIDEO
  videoButton: {
    marginTop: 16,
    backgroundColor: "#0f172a", // Color oscuro para resaltar
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  videoButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});