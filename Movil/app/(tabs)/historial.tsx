import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { obtenerSesion } from '../../utils/session';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

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

      const response = await fetch(
        `${API_URL}/partes?usuario_id=${session.usuario.id}&page=${pagina}&limit=10`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );

      const data = await response.json();

      if (response.ok) {
        setPartes(data.partes);
        setTotalPages(data.total_pages);
        setPage(pagina);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartes(1);
  }, []);

  const irAParte = (id: number) => {
  router.push(`/parte/${id}`);
};
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Historial de Partes</ThemedText>

      {loading ? (
        <ActivityIndicator size="large" color="#0056b3" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView style={styles.lista}>
          {partes.map((p) => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => irAParte(p.id)}>
              <Text style={styles.cardTitle}>Parte #{p.id}</Text>
              <Text style={styles.cardText}>Físico: {p.parte_fisico}</Text>
              <Text style={styles.cardText}>Fecha: {p.fecha}</Text>
              <Text style={styles.cardText}>Sumilla: {p.sumilla}</Text>
            </TouchableOpacity>
          ))}

          {/* PAGINACIÓN */}
          <View style={styles.paginationContainer}>

            {/* Botón Anterior */}
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.disabled]}
              disabled={page === 1}
              onPress={() => fetchPartes(page - 1)}
            >
              <Text style={styles.pageButtonText}>◀ Anterior</Text>
            </TouchableOpacity>

            {/* Botones de páginas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.pageNumber, num === page && styles.pageActive]}
                    onPress={() => fetchPartes(num)}
                  >
                    <Text style={{ color: num === page ? '#fff' : '#0056b3', fontWeight: 'bold' }}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Botón Siguiente */}
            <TouchableOpacity
              style={[styles.pageButton, page === totalPages && styles.disabled]}
              disabled={page === totalPages}
              onPress={() => fetchPartes(page + 1)}
            >
              <Text style={styles.pageButtonText}>Siguiente ▶</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { textAlign: 'center', marginBottom: 15 },
  lista: { marginBottom: 20 },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#0056b3',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardText: { color: '#333', marginTop: 4 },

  paginationContainer: {
    marginTop: 10,
    marginBottom: 25,
    alignItems: 'center',
  },
  pageButton: {
    padding: 10,
    backgroundColor: '#0056b3',
    borderRadius: 8,
    marginBottom: 10,
  },
  pageButtonText: { color: '#fff', fontWeight: 'bold' },

  disabled: {
    opacity: 0.4,
  },
  pageNumber: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#0056b3',
    borderRadius: 6,
  },
  pageActive: {
    backgroundColor: '#0056b3',
  }
});
