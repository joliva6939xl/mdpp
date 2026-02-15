import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Platform,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { obtenerSesion } from "../../utils/session";

export default function DashboardScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos del usuario
  const cargarDatos = async () => {
    const session = await obtenerSesion();
    if (session) {
      setUsuario(session);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  }, []);

  // Función para soporte
  const handleSoporte = () => {
    if (Platform.OS === 'web') alert("Soporte Técnico: Contacte a sistemas@sisifo.com");
    else Alert.alert("Soporte Técnico", "Línea directa de IT: Anexo 404\nCorreo: sistemas@sisifo.com");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* 1. HEADER OPERATIVO */}
      <View style={styles.header}>
        <View>
            <Text style={styles.systemName}>SISIFO V1.5</Text>
            <Text style={styles.systemStatus}>● SISTEMA ONLINE</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push("/(tabs)/perfil")}>
            <Ionicons name="person-circle-outline" size={36} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* 2. TARJETA DE BIENVENIDA (ESTILO CREDENCIAL) */}
        <View style={styles.welcomeCard}>
            <View style={styles.userInfo}>
                <Text style={styles.welcomeLabel}>OPERADOR ACTIVO</Text>
                <Text style={styles.userName}>
                    {usuario ? usuario.nombre : "CARGANDO..."}
                </Text>
                <Text style={styles.userRole}>
                    {usuario ? (usuario.cargo || "SIN ASIGNAR").toUpperCase() : "..."}
                </Text>
            </View>
            <View style={styles.idBadge}>
                <Ionicons name="qr-code-outline" size={24} color="#64748B" />
            </View>
        </View>

        <Text style={styles.sectionTitle}>MÓDULOS DE ACCIÓN</Text>

        {/* 3. LISTA DE ACCIONES (Diseño Industrial) */}
        <View style={styles.grid}>
            
            {/* NUEVO PARTE */}
            <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => router.push("/(tabs)/nuevo")}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: "#0F172A" }]}>
                    <Ionicons name="add" size={28} color="#FFF" />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>NUEVO PARTE</Text>
                    <Text style={styles.cardSubtitle}>Registrar incidencia</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {/* HISTORIAL */}
            <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => router.push("/(tabs)/historial")}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0" }]}>
                    <Ionicons name="time-outline" size={28} color="#0F172A" />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>HISTORIAL</Text>
                    <Text style={styles.cardSubtitle}>Auditoría de reportes</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {/* PERFIL */}
            <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => router.push("/(tabs)/perfil")}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0" }]}>
                    <Ionicons name="id-card-outline" size={28} color="#0F172A" />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>MI PERFIL</Text>
                    <Text style={styles.cardSubtitle}>Datos y credenciales</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {/* SOPORTE */}
            <TouchableOpacity 
                style={[styles.actionCard, { marginTop: 10 }]} 
                onPress={handleSoporte}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: "#FEE2E2", borderColor: "#FECaca", borderWidth: 1 }]}>
                    <Ionicons name="headset" size={24} color="#DC2626" />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, { color: "#DC2626" }]}>SOPORTE TÉCNICO</Text>
                    <Text style={styles.cardSubtitle}>Reportar fallo de sistema</Text>
                </View>
            </TouchableOpacity>

        </View>

        {/* 4. FOOTER INFORMATIVO */}
        <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
                ÚLTIMA SINCRONIZACIÓN: {new Date().toLocaleTimeString()}
            </Text>
            <Text style={styles.footerText}>SEGURIDAD: ENCRIPTADO (TLS 1.3)</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// --- ESTILOS SISIFO (Enterprise UI) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
  },
  
  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50, // Ajuste para status bar
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  systemName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 2,
  },
  systemStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981", // Verde esmeralda (Online)
    marginTop: 4,
    letterSpacing: 0.5,
  },
  profileIcon: {
    padding: 4,
  },

  scrollContent: {
    padding: 20,
  },

  // WELCOME CARD
  welcomeCard: {
    backgroundColor: "#0F172A", // Slate 900 (Tarjeta oscura)
    borderRadius: 12,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    color: "#94A3B8", // Slate 400
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  userRole: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
  },
  idBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 8,
  },

  // SECTION TITLE
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // GRID ACCIONES
  grid: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  // FOOTER
  footerInfo: {
    marginTop: 40,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    color: "#CBD5E1", // Slate 300
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});