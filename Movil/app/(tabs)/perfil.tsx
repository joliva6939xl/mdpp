import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Platform, 
  Linking 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; 
import { obtenerSesion, cerrarSesion } from '../../utils/session';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// 1. DEFINICIÓN DE TIPOS
interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  cargo: string;
  dni: string;
  celular: string;
  correo?: string;
  direccion_actual?: string;
  referencia?: string;
  ubicacion_gps?: string;
  foto_ruta?: string | null;
  foto_licencia?: string | null;
  estado?: string;
  motorizado?: boolean;
  conductor?: boolean;
}

const API_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : 'http://10.0.2.2:4000/api';

export default function PerfilScreen() {
    const router = useRouter();
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const cargar = async () => {
                const session = await obtenerSesion();
                if (isActive) {
                    if (session && session.usuario) {
                        // ✅ CORRECCIÓN AQUÍ: Usamos 'as unknown as Usuario' para calmar a TS
                        setUser(session.usuario as unknown as Usuario);
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

        if (!result.canceled && result.assets && result.assets.length > 0) {
            subirFoto(result.assets[0].uri);
        }
    };

    const subirFoto = async (uri: string) => {
        if (!user || !user.id) return;
        setUploading(true);
        
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('foto', blob, filename);
            } else {
                // @ts-ignore: React Native necesita este formato específico
                formData.append('foto', { uri, name: filename, type });
            }

            const response = await fetch(`${API_URL}/usuarios/${user.id}/foto`, {
                method: 'PUT',
                body: formData,
                headers: {
                    // 'Content-Type': 'multipart/form-data', // NO poner esto manualmente
                },
            });

            const json = await response.json();

            if (response.ok) {
                Alert.alert("Éxito", "Foto actualizada.");
                setUser((currentUser) => {
                    if (!currentUser) return null;
                    return { ...currentUser, foto_ruta: json.usuario.foto_ruta };
                });
            } else {
                Alert.alert("Error", json.message || "No se pudo subir.");
            }
        } catch (error) {
            console.error("Error subir foto:", error);
            Alert.alert("Error", "Fallo de conexión.");
        } finally {
            setUploading(false);
        }
    };

    const abrirMapa = (gps?: string) => {
        if (!gps) return;
        const coords = gps.replace(/\s/g, '');
        const url = `https://www.google.com/maps/search/?api=1&query=${coords}`;
        Linking.openURL(url);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0056b3" /></View>;

    // Datos por defecto seguros
    const userData: Usuario = user || { 
        id: 0, 
        usuario: 'Invitado', 
        nombre: 'Invitado', 
        cargo: '-', 
        dni: '-', 
        celular: '-',
        estado: 'INACTIVO',
        motorizado: false,
        conductor: false,
        direccion_actual: '-',
        referencia: '-',
        ubicacion_gps: ''
    };

    const nombreMostrar = userData.nombre || userData.usuario || 'A';
    const inicial = nombreMostrar.charAt(0).toUpperCase();

    const getUrl = (path?: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/^uploads\//, '');
        return `${API_URL.replace('/api', '')}/uploads/${cleanPath}`;
    };

    const fotoUrl = getUrl(userData.foto_ruta);
    const licenciaUrl = getUrl(userData.foto_licencia);

    return (
      <View style={{ flex: 1 }}>
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#0f172a', dark: '#1D3D47' }}
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
                            {uploading ? <ActivityIndicator size="small" color="#fff"/> : <Ionicons name="camera" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>

                    <ThemedText type="title" style={styles.username}>{userData.nombre}</ThemedText>
                    <ThemedText style={styles.role}>{userData.cargo}</ThemedText>

                    <View style={styles.badgeRow}>
                        {userData.motorizado && (
                            <View style={styles.badge}>
                                <Ionicons name="bicycle" size={14} color="#004085" />
                                <Text style={styles.badgeText}>Motorizado</Text>
                            </View>
                        )}
                        {userData.conductor && (
                            <View style={styles.badge}>
                                <Ionicons name="car-sport" size={14} color="#004085" />
                                <Text style={styles.badgeText}>Conductor</Text>
                            </View>
                        )}
                        <View style={[styles.badge, userData.estado === 'ACTIVO' ? styles.badgeActive : styles.badgeInactive]}>
                            <Text style={[styles.badgeText, {color: userData.estado === 'ACTIVO' ? '#155724' : '#721c24'}]}>
                                {userData.estado || 'ACTIVO'}
                            </Text>
                        </View>
                    </View>
                </View>
            }>

            <ThemedView style={styles.contentContainer}>
                
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>👤 Datos Personales</ThemedText>
                    <FilaInfo label="Usuario" value={userData.usuario} icon="person" />
                    <FilaInfo label="DNI" value={userData.dni} icon="card" />
                    <FilaInfo label="Celular" value={userData.celular} icon="call" />
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>📍 Ubicación Domiciliaria</ThemedText>
                    <FilaInfo label="Dirección Actual" value={userData.direccion_actual} icon="home" />
                    <FilaInfo label="Referencia" value={userData.referencia} icon="map" />
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}><Ionicons name="location" size={20} color="#666" /></View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Ubicación GPS</Text>
                            {userData.ubicacion_gps ? (
                                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                                    <Text style={[styles.value, {fontSize:13}]}>{userData.ubicacion_gps}</Text>
                                    <TouchableOpacity onPress={() => abrirMapa(userData.ubicacion_gps)} style={styles.mapLink}>
                                        <Text style={styles.mapLinkText}>Ver Mapa</Text>
                                        <Ionicons name="open-outline" size={14} color="#0056b3" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.value}>-</Text>
                            )}
                        </View>
                    </View>
                </View>

                {(userData.conductor || userData.motorizado) && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>🆔 Documentación</ThemedText>
                        <Text style={styles.label}>Licencia de Conducir</Text>
                        {licenciaUrl ? (
                            <Image source={{ uri: licenciaUrl }} style={styles.licenciaImage} resizeMode="contain" />
                        ) : (
                            <View style={styles.noLicenciaBox}>
                                <Text style={styles.noLicenciaText}>Sin foto de licencia</Text>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity style={styles.btnLogout} onPress={async () => { await cerrarSesion(); router.replace('/login'); }}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" style={{marginRight:10}} />
                    <Text style={{color:'#fff', fontWeight:'bold'}}>CERRAR SESIÓN</Text>
                </TouchableOpacity>

                <View style={{ height: 80 }} />
            </ThemedView>
        </ParallaxScrollView>

        <TouchableOpacity 
            style={styles.floatingHomeButton} 
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.9}
        >
            <Ionicons name="home" size={22} color="#fff" />
            <Text style={styles.floatingHomeText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
}

// 2. TIPADO DE PROPS DEL COMPONENTE AUXILIAR
interface FilaInfoProps {
    label: string;
    value?: string | number | null;
    icon: keyof typeof Ionicons.glyphMap; 
}

const FilaInfo = ({ label, value, icon }: FilaInfoProps) => (
    <View style={styles.infoRow}>
        <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={{flex:1}}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || '-'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
    avatarContainer: { marginBottom: 15, position: 'relative' },
    avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff' },
    avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth:3, borderColor:'#fff' },
    avatarText: { fontSize: 45, color: '#0056b3', fontWeight: 'bold' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0056b3', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    username: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign:'center' },
    role: { color: '#cbd5e1', fontSize: 16, marginBottom: 10, textAlign:'center' },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 5, flexWrap:'wrap', justifyContent:'center' },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeActive: { backgroundColor: '#d4edda' },
    badgeInactive: { backgroundColor: '#f8d7da' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#004085' },
    contentContainer: { padding: 20, gap: 20, backgroundColor:'#f1f5f9' },
    section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 5, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:5, elevation:2 },
    sectionTitle: { fontSize: 18, marginBottom: 10, color:'#0f172a' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
    iconBox: { width:36, height:36, backgroundColor:'#f8fafc', borderRadius:8, justifyContent:'center', alignItems:'center' },
    label: { fontSize: 12, color: '#64748b', fontWeight:'600', textTransform:'uppercase' },
    value: { fontSize: 15, color: '#1e293b', fontWeight:'500' },
    mapLink: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    mapLinkText: { fontSize: 12, color: '#0056b3', fontWeight: 'bold' },
    licenciaImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor:'#f8fafc', marginTop:5 },
    noLicenciaBox: { width: '100%', height: 100, backgroundColor:'#f1f5f9', borderRadius:8, justifyContent:'center', alignItems:'center', borderStyle:'dashed', borderWidth:1, borderColor:'#cbd5e1' },
    noLicenciaText: { color:'#94a3b8', fontSize:14 },
    btnLogout: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection:'row', justifyContent:'center', marginTop:10 },
    floatingHomeButton: {
        position: 'absolute', bottom: 30, alignSelf: 'center',
        backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 28, borderRadius: 50,
        elevation: 10, zIndex: 9999,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65,
    },
    floatingHomeText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
});