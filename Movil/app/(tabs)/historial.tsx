import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerSesion } from '../utils/session';
// ⚠️ CORRECCIÓN: Nombres de archivo en minúsculas para coincidir con tu proyecto real
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:4000/api' 
    : 'http://10.0.2.2:4000/api';

export default function HistorialScreen() {
    const [partes, setPartes] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const { usuario, token } = await obtenerSesion();

            if (!usuario || !usuario.id) {
                console.log("No hay usuario logueado o falta ID");
                return; 
            }

            console.log(`📡 Solicitando historial para ID: ${usuario.id}`);

            const response = await fetch(`${API_URL}/partes?usuario_id=${usuario.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setPartes(data.partes || []);
            } else {
                console.error("Error API:", data.message);
            }
        } catch (error) {
            console.error("Error historial:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarHistorial();
        }, [])
    );

    const renderItem = ({ item }: { item: any }) => (
        <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold">Parte #{item.id}</ThemedText>
                <ThemedText style={styles.date}>{item.fecha} {item.hora}</ThemedText>
            </View>
            <ThemedText style={styles.sumilla}>{item.sumilla || 'Sin Asunto'}</ThemedText>
            <ThemedText style={styles.location}>📍 {item.lugar || 'Ubicación no registrada'}</ThemedText>
            <ThemedText style={styles.status} onPress={() => router.push(`/parte/${item.id}`)}>
                Ver Detalles ➡
            </ThemedText>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Mis Partes</ThemedText>
            
            {loading ? (
                <ActivityIndicator size="large" color="#0056b3" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={partes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={<ThemedText style={styles.empty}>No hay partes registrados.</ThemedText>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { marginBottom: 20, textAlign: 'center' },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    date: { fontSize: 12, color: '#666' },
    sumilla: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    location: { fontSize: 14, color: '#444', marginBottom: 10 },
    status: { color: '#0056b3', fontWeight: 'bold', textAlign: 'right' }
});