import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
  Platform // <--- IMPORTANTE: Necesario para detectar si es Web o Móvil
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons"; 

import API_URL from "../../config/api";
import { guardarSesion } from '../../utils/session';

// ==========================================
// 🛠️ FUNCIÓN MÁGICA PARA PREPARAR IMÁGENES
// ==========================================
// Esta función resuelve el problema de "object Object" en la Web
const prepararImagen = async (uri: string, nombreArchivo: string) => {
  if (Platform.OS === 'web') {
    // 🌐 MODO WEB: Convierte la URI a un archivo binario (Blob/File) real
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new File([blob], nombreArchivo, { type: 'image/jpeg' });
    } catch (error) {
      console.error("Error convirtiendo imagen web:", error);
      return null;
    }
  } else {
    // 📱 MODO NATIVO (Android/iOS): Usa el objeto estándar
    return {
      uri: uri,
      name: nombreArchivo,
      type: 'image/jpeg',
    } as any;
  }
};

export default function RegisterScreen() {
  const router = useRouter();

  // Estados básicos
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  const [cargo, setCargo] = useState("sereno operador de campo");
  
  // Estados nuevos
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [gps, setGps] = useState("");
  
  // Categorías
  const [motorizado, setMotorizado] = useState(false);
  const [conductor, setConductor] = useState(false);

  // Fotos
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [fotoLicencia, setFotoLicencia] = useState<string | null>(null);

  // UI
  const [cargando, setCargando] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // 📍 FUNCIÓN: OBTENER GPS
  const obtenerUbicacion = async () => {
    setGpsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación.");
        setGpsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      setGps(coords);
      Alert.alert("Éxito", "Ubicación capturada correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación. Verifica tu GPS.");
    } finally {
      setGpsLoading(false);
    }
  };

  // 📸 FUNCIÓN: SELECCIONAR FOTO
  const pickImage = async (tipo: 'perfil' | 'licencia') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.7,
    });

    if (!result.canceled) {
      if (tipo === 'perfil') setFotoPerfil(result.assets[0].uri);
      else setFotoLicencia(result.assets[0].uri);
    }
  };

  // 🚀 FUNCIÓN: REGISTRAR (ACTUALIZADA CON FIX DE IMÁGENES)
  const handleRegister = async () => {
    if (!nombre || !dni || !celular || !cargo) {
      Alert.alert("Faltan datos", "Por favor completa Nombre, DNI, Celular y Cargo.");
      return;
    }

    setCargando(true);

    try {
      const formData = new FormData();
      
      // 1. Datos de Texto
      formData.append("nombre", nombre.toUpperCase());
      formData.append("dni", dni);
      formData.append("celular", celular);
      formData.append("cargo", cargo);
      formData.append("direccion_actual", direccion.toUpperCase());
      formData.append("referencia", referencia.toUpperCase());
      formData.append("ubicacion_gps", gps);
      formData.append("motorizado", String(motorizado));
      formData.append("conductor", String(conductor));

      // 2. Adjuntar Fotos (USANDO LA FUNCIÓN MÁGICA) 🔥
      if (fotoPerfil) {
        const archivoPerfil = await prepararImagen(fotoPerfil, `perfil_${dni}.jpg`);
        if (archivoPerfil) {
            // @ts-ignore
            formData.append("foto", archivoPerfil);
        }
      }

      if (fotoLicencia) {
        const archivoLicencia = await prepararImagen(fotoLicencia, `licencia_${dni}.jpg`);
        if (archivoLicencia) {
            // @ts-ignore
            formData.append("foto_licencia", archivoLicencia);
        }
      }

      console.log("📤 Enviando registro a:", `${API_URL}/auth/register`);

      // 3. Envío
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData as any,
        headers: {
            // ⚠️ IMPORTANTE: 'Accept' ayuda, pero NUNCA pongas 'Content-Type': 'multipart/form-data' manual
            'Accept': 'application/json', 
        }
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        Alert.alert("Error", json.message || "No se pudo crear el usuario.");
        setCargando(false);
        return;
      }

      // ✅ ÉXITO
      const usuarioGenerado = json.data?.usuario || json.usuario?.usuario;
      const passwordGenerada = dni; 

      Alert.alert(
        "¡Usuario Creado!",
        `Usuario: ${usuarioGenerado}\nContraseña: ${passwordGenerada}`,
        [
          {
            text: "Iniciar Sesión",
            onPress: async () => {
               // Auto-Login
               try {
                 const loginRes = await fetch(`${API_URL}/auth/login`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ usuario: usuarioGenerado, contrasena: passwordGenerada })
                 });
                 const loginJson = await loginRes.json();
                 
                 if (loginJson.ok) {
                   await guardarSesion(loginJson.token, loginJson.usuario);
                   router.replace('/(tabs)/perfil' as any);
                 } else {
                   router.replace("/login" as any);
                 }
               } catch {
                 router.replace("/login" as any);
               }
            }
          }
        ]
      );

    } catch (error) {
      console.error("Error App Register:", error);
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Nuevo Usuario</Text>
        <Text style={styles.subtitulo}>Complete sus datos personales</Text>

        {/* --- SECCIÓN 1: DATOS PERSONALES --- */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>👤 Datos Personales</Text>
            
            <Text style={styles.label}>Nombre Completo *</Text>
            <TextInput style={styles.input} placeholder="Juan Oliva" value={nombre} onChangeText={setNombre} />

            <View style={styles.row}>
                <View style={{flex:1, marginRight:5}}>
                    <Text style={styles.label}>DNI *</Text>
                    <TextInput style={styles.input} placeholder="12345678" keyboardType="numeric" value={dni} onChangeText={setDni} maxLength={8} />
                </View>
                <View style={{flex:1, marginLeft:5}}>
                    <Text style={styles.label}>Celular *</Text>
                    <TextInput style={styles.input} placeholder="999888777" keyboardType="numeric" value={celular} onChangeText={setCelular} maxLength={9} />
                </View>
            </View>

            <Text style={styles.label}>Cargo *</Text>
            <View style={styles.pickerWrapper}>
                <Picker selectedValue={cargo} onValueChange={setCargo}>
                <Picker.Item label="Sereno Operador de Campo" value="sereno operador de campo" />
                <Picker.Item label="Sereno Conductor" value="sereno conductor" />
                <Picker.Item label="Operador de Cámaras" value="sereno operador de camaras" />
                <Picker.Item label="Sereno Motorizado" value="sereno motorizado" />
                <Picker.Item label="Sereno Paramédico" value="sereno paramedico" />
                <Picker.Item label="Unidad K9" value="unidad k9" />
                <Picker.Item label="Amazonas" value="amazonas" />
                <Picker.Item label="Grupo DELTA" value="DELTA" />
                </Picker>
            </View>
        </View>

        {/* --- SECCIÓN 2: UBICACIÓN --- */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>📍 Ubicación Domiciliaria</Text>
            
            <Text style={styles.label}>Dirección Actual</Text>
            <TextInput style={styles.input} placeholder="Av. Principal 123" value={direccion} onChangeText={setDireccion} />

            <Text style={styles.label}>Referencia</Text>
            <TextInput style={styles.input} placeholder="Frente al parque..." value={referencia} onChangeText={setReferencia} />

            <Text style={styles.label}>Coordenadas GPS</Text>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <TextInput 
                    style={[styles.input, {flex:1, marginBottom:0, color:'#666'}]} 
                    value={gps} 
                    editable={false} 
                    placeholder="Sin capturar" 
                />
                <TouchableOpacity style={styles.gpsBtn} onPress={obtenerUbicacion} disabled={gpsLoading}>
                    {gpsLoading ? <ActivityIndicator color="#fff" /> : <Ionicons name="location" size={20} color="white" />}
                </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Presiona el botón azul para capturar tu ubicación actual.</Text>
        </View>

        {/* --- SECCIÓN 3: FOTOS Y CATEGORÍAS --- */}
        <View style={styles.card}>
             <Text style={styles.sectionTitle}>📸 Fotos y Categorías</Text>

             <View style={styles.photoRow}>
                 <TouchableOpacity style={styles.photoBox} onPress={() => pickImage('perfil')}>
                     {fotoPerfil ? <Image source={{uri: fotoPerfil}} style={styles.photoPreview} /> : <Text style={styles.photoText}>+ Foto Perfil</Text>}
                 </TouchableOpacity>

                 {(conductor || motorizado) && (
                     <TouchableOpacity style={styles.photoBox} onPress={() => pickImage('licencia')}>
                        {fotoLicencia ? <Image source={{uri: fotoLicencia}} style={styles.photoPreview} /> : <Text style={styles.photoText}>+ Licencia</Text>}
                     </TouchableOpacity>
                 )}
             </View>

             <View style={styles.switchContainer}>
                 <View style={styles.switchRow}>
                     <Text>¿Es Motorizado?</Text>
                     <Switch value={motorizado} onValueChange={setMotorizado} />
                 </View>
                 <View style={styles.switchRow}>
                     <Text>¿Es Conductor?</Text>
                     <Switch value={conductor} onValueChange={setConductor} />
                 </View>
             </View>
        </View>

        {/* BOTÓN FINAL */}
        <TouchableOpacity 
            style={[styles.btnRegistrar, cargando && {backgroundColor:'#ccc'}]} 
            onPress={handleRegister} 
            disabled={cargando}
        >
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CREAR CUENTA</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login" as any)} style={{padding:20}}>
            <Text style={styles.linkTexto}>Volver al Login</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitulo: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  
  card: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0056b3', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 14
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  
  gpsBtn: {
      backgroundColor: '#007bff',
      width: 44,
      height: 44,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10
  },
  hint: { fontSize: 11, color: '#999', marginTop: 5, fontStyle: 'italic' },

  photoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  photoBox: {
      width: 100,
      height: 100,
      backgroundColor: '#eee',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderStyle: 'dashed',
      overflow: 'hidden'
  },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { fontSize: 12, color: '#666' },

  switchContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  btnRegistrar: {
      backgroundColor: '#28a745',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkTexto: { textAlign: "center", color: "#007bff", fontWeight: "600" },
});