import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { obtenerSesion, cerrarSesion } from '../../utils/session';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : 'http://10.0.2.2:4000/api';

export default function PerfilScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const cargar = async () => {
                const session = await obtenerSesion();
                if (isActive) {
                    if (session && session.usuario) {
                        setUser(session.usuario);
                    }
                    setLoading(false);
                }
            };
            cargar();
            return () => { isActive = false; };
        }, [])
    );

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso', 'Se requiere acceso a la galería.');

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            subirFoto(result.assets[0].uri);
        }
    };

    const subirFoto = async (uri: string) => {
        if (!user || !user.id) return;
        setUploading(true);
        
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'photo.jpg';
            const type = `image/${filename.split('.').pop()}`;

            if (Platform.OS === 'web') {
                // Enfoque para la web: convertir URI a Blob
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('foto', blob, filename);
            } else {
                // Enfoque para móvil (React Native)
                // @ts-ignore
                formData.append('foto', { uri, name: filename, type });
            }

            const response = await fetch(`${API_URL}/usuarios/${user.id}/foto`, {
                method: 'PUT',
                body: formData,
                headers: {
                    // 'Content-Type' es añadido por el navegador/cliente cuando usas FormData
                    // pero si lo necesitas explícitamente, asegúrate de no poner un boundary
                },
            });

            const json = await response.json();

            if (response.ok) {
                Alert.alert("Éxito", "Foto de perfil actualizada correctamente.");
                setUser((currentUser: any) => ({ ...currentUser, foto_ruta: json.usuario.foto_ruta }));
            } else {
                const errorMessage = json.message || "No se pudo subir la foto.";
                Alert.alert("Error", errorMessage);
            }
        } catch (error: any) {
            console.error("Error al subir la foto:", error);
            Alert.alert("Error de Conexión", "No se pudo conectar al servidor. Inténtalo de nuevo.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0056b3" /></View>;

    // DATOS DE SEGURIDAD (Evita error charAt)
    const userData = user || { usuario: 'Invitado', nombre: 'Invitado', cargo: '-', dni: '-', celular: '-' };
    const nombreMostrar = userData.nombre || userData.usuario || 'A';
    const inicial = nombreMostrar.charAt(0).toUpperCase();

    const fotoUrl = userData.foto_ruta 
        ? (userData.foto_ruta.startsWith('http') ? userData.foto_ruta : `${API_URL.replace('/api', '')}/${userData.foto_ruta}`)
        : null;

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <View style={styles.headerContainer}>
                   <View style={styles.avatarContainer}>
                       {fotoUrl ? (
                           <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
                       ) : (
                           <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{inicial}</Text>
                           </View>
                       )}
                       <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={uploading}>
                           {uploading ? <ActivityIndicator size="small" color="#fff"/> : <IconSymbol name="camera.fill" size={20} color="#fff" />}
                       </TouchableOpacity>
                   </View>
                   <ThemedText type="title" style={styles.username}>{userData.nombre}</ThemedText>
                   <ThemedText style={styles.role}>{userData.cargo}</ThemedText>
                </View>
            }>
            <ThemedView style={styles.contentContainer}>
                <View style={styles.section}>
                    <ThemedText type="subtitle">Mis Datos</ThemedText>
                    <FilaInfo label="Usuario" value={userData.usuario} icon="person.fill" />
                    <FilaInfo label="DNI" value={userData.dni} icon="creditcard.fill" />
                    <FilaInfo label="Celular" value={userData.celular} icon="phone.fill" />
                </View>

                <TouchableOpacity style={styles.btnLogout} onPress={async () => { await cerrarSesion(); router.replace('/login'); }}>
                    <Text style={{color:'#fff', fontWeight:'bold'}}>CERRAR SESIÓN</Text>
                </TouchableOpacity>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const FilaInfo = ({ label, value, icon }: any) => (
    <View style={styles.infoRow}>
        <IconSymbol name={icon} size={20} color="#666" />
        <View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || '-'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    avatarContainer: { marginBottom: 10, position: 'relative' },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, color: '#0056b3', fontWeight: 'bold' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0056b3', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    role: { color: '#e0e0e0', fontSize: 16 },
    contentContainer: { padding: 20, gap: 20 },
    section: { backgroundColor: '#fff', borderRadius: 10, padding: 15, gap: 10, elevation: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
    label: { fontSize: 12, color: '#999' },
    value: { fontSize: 16, color: '#333' },
    btnLogout: { backgroundColor: '#dc3545', padding: 15, borderRadius: 10, alignItems: 'center' }
});