import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Text, Alert, Platform, ActivityIndicator, View, Modal, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { obtenerSesion } from '../../utils/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : 'http://10.0.2.2:4000/api';

const LISTAS = {
    sector: ['1', '2', '3', '4', '5', '6', '7', '8'],
    zona: ['A', 'B', 'C', 'D', 'E', 'F'],
    turno: ['MAÑANA', 'TARDE', 'NOCHE']
};

export default function CrearParteScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [archivos, setArchivos] = useState<any[]>([]); // Fotos/Videos

    const [form, setForm] = useState({
        parte_fisico: '', fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-PE', { hour12: false }).slice(0,5),
        sector: '', zona: '', turno: '', lugar: '',
        unidad_tipo: '', unidad_numero: '', placa: '',
        conductor: '', dni_conductor: '',
        sumilla: '', asunto: '', ocurrencia: '',
        sup_zonal: '', sup_general: '' 
    });

    // Estado Selectores
    const [modalVisible, setModalVisible] = useState(false);
    const [campoActual, setCampoActual] = useState('');
    const [opcionesActuales, setOpcionesActuales] = useState<string[]>([]);

    const handleChange = (key: string, value: string) => setForm({ ...form, [key]: value });

    const abrirSelector = (campo: string, opciones: string[]) => {
        setCampoActual(campo);
        setOpcionesActuales(opciones);
        setModalVisible(true);
    };

    const seleccionar = (val: string) => {
        handleChange(campoActual, val);
        setModalVisible(false);
    };

    // Función: Adjuntar Evidencia
    const adjuntarEvidencia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            setArchivos([...archivos, ...result.assets]);
        }
    };

    const removerArchivo = (index: number) => {
        const nuevos = [...archivos];
        nuevos.splice(index, 1);
        setArchivos(nuevos);
    };

    // Función: Enviar (FormData)
    const enviarParte = async () => {
        if (!form.parte_fisico || !form.sumilla) return Alert.alert("Faltan datos", "N° Parte y Sumilla son obligatorios.");
        setLoading(true);

        try {
            const session = await obtenerSesion();
            if (!session?.usuario?.id) return Alert.alert("Error", "Sesión inválida.");

            // Usamos FormData para enviar Texto + Archivos
            const formData = new FormData();
            
            // Agregamos campos de texto
            Object.keys(form).forEach(key => {
                // @ts-ignore
                formData.append(key, form[key]);
            });
            // Agregamos ID usuario
            formData.append('usuario_id', String(session.usuario.id));

            // Agregamos Archivos
            archivos.forEach((file, index) => {
                const tipo = file.type === 'video' ? 'video/mp4' : 'image/jpeg';
                const ext = file.type === 'video' ? '.mp4' : '.jpg';
                // @ts-ignore
                formData.append('evidencia', {
                    uri: file.uri,
                    name: `evidencia_${index}${ext}`,
                    type: tipo
                });
            });

            console.log("📤 Enviando FormData a:", `${API_URL}/partes`);

            const response = await fetch(`${API_URL}/partes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.token}`
                    // NO AGREGAR 'Content-Type': 'multipart/form-data', fetch lo hace solo
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Éxito", "Parte registrado correctamente.");
                // Reset form
                setForm({
                    parte_fisico: '', fecha: new Date().toISOString().split('T')[0], hora: '',
                    sector: '', zona: '', turno: '', lugar: '', unidad_tipo: '', unidad_numero: '',
                    placa: '', conductor: '', dni_conductor: '', sumilla: '', asunto: '',
                    ocurrencia: '', sup_zonal: '', sup_general: ''
                });
                setArchivos([]);
                router.push('/(tabs)/historial');
            } else {
                Alert.alert("Error", data.message || "No se pudo guardar.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Fallo de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.title}>Nuevo Parte Virtual</ThemedText>

                <TextInput style={styles.input} placeholder="N° Parte Físico (*)" value={form.parte_fisico} onChangeText={(t) => handleChange('parte_fisico', t)} />
                
                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.half]} placeholder="Fecha" value={form.fecha} onChangeText={(t) => handleChange('fecha', t)} />
                    <TextInput style={[styles.input, styles.half]} placeholder="Hora" value={form.hora} onChangeText={(t) => handleChange('hora', t)} />
                </View>

                {/* SELECTORES */}
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.selector, styles.half]} onPress={() => abrirSelector('sector', LISTAS.sector)}>
                        <Text style={form.sector ? styles.textSelected : styles.textPlaceholder}>{form.sector ? `Sector ${form.sector}` : 'Sector ▼'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.selector, styles.half]} onPress={() => abrirSelector('zona', LISTAS.zona)}>
                        <Text style={form.zona ? styles.textSelected : styles.textPlaceholder}>{form.zona ? `Zona ${form.zona}` : 'Zona ▼'}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.selector} onPress={() => abrirSelector('turno', LISTAS.turno)}>
                    <Text style={form.turno ? styles.textSelected : styles.textPlaceholder}>{form.turno || 'Seleccionar Turno ▼'}</Text>
                </TouchableOpacity>

                <TextInput style={styles.input} placeholder="Lugar" value={form.lugar} onChangeText={(t) => handleChange('lugar', t)} />

                <ThemedText type="subtitle" style={styles.st}>Unidad</ThemedText>
                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.half]} placeholder="Tipo" value={form.unidad_tipo} onChangeText={(t) => handleChange('unidad_tipo', t)} />
                    <TextInput style={[styles.input, styles.half]} placeholder="N°" value={form.unidad_numero} onChangeText={(t) => handleChange('unidad_numero', t)} />
                </View>
                <TextInput style={styles.input} placeholder="Placa" value={form.placa} onChangeText={(t) => handleChange('placa', t)} />
                <TextInput style={styles.input} placeholder="Conductor" value={form.conductor} onChangeText={(t) => handleChange('conductor', t)} />
                <TextInput style={styles.input} placeholder="DNI Conductor" keyboardType="numeric" value={form.dni_conductor} onChangeText={(t) => handleChange('dni_conductor', t)} />

                <ThemedText type="subtitle" style={styles.st}>Detalle</ThemedText>
                <TextInput style={styles.input} placeholder="Sumilla (*)" value={form.sumilla} onChangeText={(t) => handleChange('sumilla', t)} />
                <TextInput style={styles.input} placeholder="Asunto" value={form.asunto} onChangeText={(t) => handleChange('asunto', t)} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Ocurrencia..." multiline numberOfLines={4} value={form.ocurrencia} onChangeText={(t) => handleChange('ocurrencia', t)} />

                <ThemedText type="subtitle" style={styles.st}>Supervisión</ThemedText>
                <TextInput style={styles.input} placeholder="Sup. Zonal" value={form.sup_zonal} onChangeText={(t) => handleChange('sup_zonal', t)} />
                <TextInput style={styles.input} placeholder="Sup. General" value={form.sup_general} onChangeText={(t) => handleChange('sup_general', t)} />

                <ThemedText type="subtitle" style={styles.st}>Evidencia</ThemedText>
                <TouchableOpacity style={styles.btnEvidencia} onPress={adjuntarEvidencia}>
                    <IconSymbol name="paperclip" size={20} color="#fff" />
                    <Text style={{color:'#fff', fontWeight:'bold', marginLeft: 10}}>FOTOS / VIDEOS</Text>
                </TouchableOpacity>

                <ScrollView horizontal style={{marginTop:10}}>
                    {archivos.map((f, i) => (
                        <View key={i} style={{marginRight:10}}>
                            <Image source={{ uri: f.uri }} style={{width:80, height:80, borderRadius:8}} />
                            <TouchableOpacity onPress={() => removerArchivo(i)} style={styles.btnRemove}><Text style={{color:'#fff', fontWeight:'bold'}}>X</Text></TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <TouchableOpacity style={styles.button} onPress={enviarParte} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>REGISTRAR PARTE</Text>}
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar {campoActual}</Text>
                        <FlatList data={opcionesActuales} keyExtractor={i => i} renderItem={({item}) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => seleccionar(item)}><Text>{item}</Text></TouchableOpacity>
                        )} />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Text style={{color:'#fff'}}>Cerrar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    title: { textAlign: 'center', marginBottom: 20 },
    st: { marginTop: 15, marginBottom: 5, color: '#0056b3' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 },
    selector: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10, justifyContent: 'center' },
    textPlaceholder: { color: '#999' },
    textSelected: { color: '#000' },
    row: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
    textArea: { height: 100, textAlignVertical: 'top' },
    button: { backgroundColor: '#0056b3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    btnEvidencia: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnRemove: { position: 'absolute', top:-5, right:-5, backgroundColor:'red', width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center'},
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 20, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    closeBtn: { marginTop: 15, padding: 10, backgroundColor: '#dc3545', borderRadius: 5, alignItems: 'center' }
});