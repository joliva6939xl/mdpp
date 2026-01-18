import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerSesion } from '../../utils/session';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

// COLORES
const COLORS = { primary: '#D32F2F', dark: '#111827' };

const API_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : 'http://10.0.2.2:4000/api';

export default function HistorialScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partes, setPartes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPartes = async (pagina = 1) => {
    try {
      setLoading(true);
      const session = await obtenerSesion();
      if (!session?.usuario?.id) return;
      
      const response = await fetch(`${API_URL}/partes?usuario_id=${session.usuario.id}&page=${pagina}&limit=10`,
        { headers: { Authorization: `Bearer ${session.token}` } });
      
      const data = await response.json();
      
      if (response.ok) {
        setPartes(data.partes);
        setTotalPages(data.total_pages);
        setPage(pagina);
      }
    } catch (error) { 
      console.error('Error al cargar historial:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPartes(1); }, []);
  useFocusEffect(useCallback(() => { fetchPartes(1); return () => {}; }, []));

  const irAParte = (id: number) => { router.push(`/parte/${id}`); };

  const renderParticipantesLinea = (raw: any): string => {
      try {
          let arr: any[] = [];
          if (Array.isArray(raw)) arr = raw;
          else if (typeof raw === 'string' && raw.trim() !== '') {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) arr = parsed;
          }
          if (!arr || arr.length === 0) return '';
          return arr.map((pt: any) => pt?.nombre && pt?.dni ? `${pt.nombre} (${pt.dni})` : pt?.nombre || pt?.dni || '').filter(Boolean).join(', ');
      } catch { return ''; }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Historial de Partes</ThemedText>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView style={styles.lista} contentContainerStyle={{ paddingBottom: 80 }}>
          {partes.map((p) => {
            const participantesLinea = renderParticipantesLinea(p.participantes);
            
            return (
              <TouchableOpacity key={p.id} style={styles.card} onPress={() => irAParte(p.id)} activeOpacity={0.7}>
                
                {/* CONTENEDOR DE DATOS (Con margen derecho para no chocar con la hora) */}
                <View style={{ paddingRight: 90 }}>
                    <Text style={styles.cardTitle}>Parte #{p.id}</Text>
                    
                    <Text style={styles.cardText}>
                        <Text style={styles.labelBold}>Físico: </Text>{p.parte_fisico}
                    </Text>
                    
                    <Text style={styles.cardText}>
                        <Text style={styles.labelBold}>Fecha: </Text>{p.fecha}
                    </Text>
                    
                    <Text style={styles.cardText} numberOfLines={1}>
                        <Text style={styles.labelBold}>Sumilla: </Text>{p.sumilla}
                    </Text>
                    
                    {participantesLinea !== '' && ( 
                        <Text style={styles.cardTextSmall} numberOfLines={1}>
                            Participantes: {participantesLinea}
                        </Text> 
                    )}
                </View>

                {/* ✅ ETIQUETA DE HORA (TIME TAG) */}
                <View style={styles.timeTag}>
                    {/* Icono de reloj opcional, si tu IconSymbol lo soporta usa 'clock' o similar */}
                    <Text style={{fontSize:12, marginRight:4}}>🕒</Text> 
                    <Text style={styles.timeText}>{p.hora || "--:--"}</Text>
                </View>

              </TouchableOpacity>
            );
          })}

          {/* PAGINACIÓN ROJA */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity style={[styles.pageButton, page === 1 && styles.disabled]} disabled={page === 1} onPress={() => fetchPartes(page - 1)}>
              <Text style={styles.pageButtonText}>◀ Anterior</Text>
            </TouchableOpacity>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <TouchableOpacity key={num} style={[styles.pageNumber, num === page && styles.pageActive]} onPress={() => fetchPartes(num)}>
                    <Text style={{ color: num === page ? '#fff' : COLORS.primary, fontWeight: 'bold' }}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity style={[styles.pageButton, page === totalPages && styles.disabled]} disabled={page === totalPages} onPress={() => fetchPartes(page + 1)}>
              <Text style={styles.pageButtonText}>Siguiente ▶</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* BOTÓN FLOTANTE ROJO */}
      <TouchableOpacity style={styles.floatingHomeButton} onPress={() => router.push('/(tabs)')} activeOpacity={0.9}>
        <IconSymbol name="house.fill" size={22} color="#fff" />
        <Text style={styles.floatingHomeText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#F3F6FA' },
  title: { textAlign: 'center', marginBottom: 15, color: COLORS.dark },
  lista: { marginBottom: 20 },
  
  card: {
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12,
    borderLeftWidth: 6, 
    borderLeftColor: COLORS.primary, // Borde Rojo lateral
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    shadowOffset: {width:0, height:2},
    position: 'relative', // Importante para posicionar la hora
  },
  
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  cardText: { color: '#374151', marginTop: 2, fontSize: 14 },
  labelBold: { fontWeight: '700', color: '#6B7280' },
  cardTextSmall: { color: '#6B7280', marginTop: 6, fontSize: 12, fontStyle: 'italic' },

  // ✅ ESTILOS DE LA ETIQUETA DE HORA
  timeTag: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#F3F4F6', // Gris claro de fondo
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  paginationContainer: { marginTop: 10, marginBottom: 25, alignItems: 'center' },
  pageButton: { padding: 10, backgroundColor: COLORS.primary, borderRadius: 8, marginBottom: 10 },
  pageButtonText: { color: '#fff', fontWeight: 'bold' },
  disabled: { opacity: 0.4 },
  pageNumber: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 6 },
  pageActive: { backgroundColor: COLORS.primary },

  floatingHomeButton: {
    position: 'absolute', bottom: 25, alignSelf: 'center',
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 50, elevation: 10, zIndex: 9999,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65,
  },
  floatingHomeText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 14 },
});