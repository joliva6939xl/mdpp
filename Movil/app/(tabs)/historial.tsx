import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  StatusBar,
  ScrollView,
  FlatList
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { obtenerSesion } from "../../utils/session";

// URL Dinámica
const API_URL = Platform.OS === "web" 
  ? "http://localhost:4000/api" 
  : "http://10.0.2.2:4000/api";

export default function HistorialScreen() {
  const router = useRouter();
  
  // Estados
  const [partes, setPartes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- FUNCIÓN DE CARGA (CORREGIDO ERROR DE DEPENDENCIA) ---
  // Envolvemos en useCallback para que React no se queje
  const fetchPartes = useCallback(async (pagina = 1, isRefreshing = false) => {
    try {
      if (pagina === 1 && !isRefreshing) setLoading(true);
      
      const session = await obtenerSesion();
      
      // ✅ CORREGIDO ERROR DE TYPESCRIPT (Validamos usuario)
      if (!session || !session.usuario || !session.usuario.id) return;

      const response = await fetch(`${API_URL}/partes?usuario_id=${session.usuario.id}&page=${pagina}&limit=10`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPartes(data.partes);
        setTotalPages(data.total_pages);
        setPage(pagina);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Dependencias vacías porque API_URL es constante

  // Recargar al entrar (Ahora sí incluye la dependencia correcta)
  useFocusEffect(
    useCallback(() => {
      fetchPartes(1);
    }, [fetchPartes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPartes(1, true);
  };

  // --- HELPER PARA PARTICIPANTES ---
  const renderParticipantes = (raw: any) => {
    try {
        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (typeof raw === 'string' && raw.trim() !== '') {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
        }
        if (!arr || arr.length === 0) return null;

        return arr.map((pt: any) => {
            const nombre = pt?.nombre || "Desconocido";
            const cargo = pt?.cargo ? `[${pt.cargo.toUpperCase()}]` : "";
            return `${nombre} ${cargo}`;
        }).join(', ');
    } catch { return null; }
  };

  // --- COMPONENTE DE TARJETA (ITEM) ---
  const renderItem = ({ item }: { item: any }) => {
    const esCerrado = !!item.hora_fin;
    const listaParticipantes = renderParticipantes(item.participantes);

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/parte/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* 1. HORA FLOTANTE */}
        <View style={styles.timeTag}>
            <Ionicons name="time" size={12} color="#0F172A" />
            <Text style={styles.timeText}>{item.hora || "--:--"}</Text>
        </View>

        {/* 2. CABECERA: ID */}
        <View style={styles.cardHeader}>
          <View>
             <Text style={styles.cardIdLabel}>ID OPERATIVO</Text>
             <Text style={styles.cardId}>#{item.id.toString().padStart(6, '0')}</Text>
          </View>
        </View>

        {/* 3. ESTADO (BADGE) */}
        <View style={[styles.statusBadge, esCerrado ? styles.bgClosed : styles.bgOpen]}>
            {/* ✅ CORREGIDO ERROR DE ESTILO (styles.statusText agregado abajo) */}
            <Text style={[styles.statusText, esCerrado ? styles.textClosed : styles.textOpen]}>
              {esCerrado ? "● CERRADO" : "● EN PROCESO"}
            </Text>
        </View>

        {/* 4. DATOS PRINCIPALES */}
        <View style={styles.cardBody}>
            <Text style={styles.sumillaTitle} numberOfLines={1}>
                {item.sumilla || "SIN CLASIFICACIÓN"}
            </Text>
            
            <View style={styles.rowInfo}>
                <Text style={styles.labelBold}>FÍSICO:</Text>
                <Text style={styles.valueText}>{item.parte_fisico || "---"}</Text>
            </View>
            
            <View style={styles.rowInfo}>
                <Text style={styles.labelBold}>FECHA:</Text>
                <Text style={styles.valueText}>{item.fecha}</Text>
            </View>

            {/* 5. PARTICIPANTES */}
            {listaParticipantes && (
                <View style={styles.participantsBox}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
                        <MaterialIcons name="groups" size={14} color="#64748B" />
                        <Text style={styles.partLabel}>PERSONAL:</Text>
                    </View>
                    <Text style={styles.partText} numberOfLines={2}>
                        {listaParticipantes}
                    </Text>
                </View>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={styles.screenHeader}>
         <Text style={styles.screenTitle}>REGISTRO DE OPERACIONES</Text>
         <Text style={styles.screenSubtitle}>Auditoría de Partes</Text>
      </View>

      {/* LISTA */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
            <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      ) : (
        <View style={{flex: 1}}>
            <FlatList
                data={partes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0F172A"]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Sin registros encontrados</Text>
                    </View>
                }
            />

            {/* PAGINACIÓN NUMÉRICA */}
            <View style={styles.paginationBar}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageScroll}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <TouchableOpacity 
                            key={num} 
                            style={[styles.pageNumber, num === page && styles.pageActive]} 
                            onPress={() => fetchPartes(num)}
                        >
                            <Text style={[styles.pageText, num === page && styles.pageTextActive]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                 </ScrollView>
            </View>
        </View>
      )}

      {/* BOTÓN FLOTANTE: VOLVER AL INICIO */}
      <TouchableOpacity 
        style={styles.floatingHomeButton} 
        onPress={() => router.push('/(tabs)')} 
        activeOpacity={0.9}
      >
        <Ionicons name="home" size={20} color="#FFFFFF" />
        <Text style={styles.floatingHomeText}>VOLVER AL INICIO</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- ESTILOS SISIFO (Enterprise) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  
  // HEADER
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center'
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2
  },

  listContent: { padding: 16, paddingBottom: 100 },
  
  // CARD
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  
  // HORA
  timeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  cardHeader: { marginBottom: 8 },
  cardIdLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  cardId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
  },
  
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 12,
  },
  // ✅ ESTILO AGREGADO PARA CORREGIR EL ERROR 2
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },

  bgClosed: { backgroundColor: '#ECFDF5' },
  bgOpen: { backgroundColor: '#FEF3C7' },
  textClosed: { color: '#059669' },
  textOpen: { color: '#D97706' },

  cardBody: { marginTop: 4 },
  sumillaTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  
  rowInfo: { flexDirection: 'row', marginBottom: 2 },
  labelBold: { fontSize: 12, fontWeight: '700', color: '#64748B', width: 60 },
  valueText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  participantsBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  partLabel: { fontSize: 10, fontWeight: '800', color: '#475569', marginLeft: 4 },
  partText: { fontSize: 11, color: '#334155', fontWeight: '500', marginTop: 2, lineHeight: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontWeight: '600' },

  paginationBar: {
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  pageScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  pageNumber: {
    minWidth: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  pageActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  pageText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  pageTextActive: { color: '#FFFFFF' },

  floatingHomeButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999
  },
  floatingHomeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 8,
    letterSpacing: 1
  }
});