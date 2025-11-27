import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    TextInput, 
    TouchableOpacity, 
    Text, 
    Alert, 
    ActivityIndicator, 
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { guardarSesion } from '../../utils/session'; 

// ⚠️ Usamos localhost para solucionar errores de conexión en Web/Emulador
const API_URL = 'http://localhost:4000/api'; 

export default function LoginScreen() {
    const router = useRouter();
    
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!usuario || !password) {
            Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }

        try {
            setLoading(true);
            console.log("🔵 Conectando a:", `${API_URL}/auth/login`);

            const response = await fetch(`${API_URL}/auth/login`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario: usuario.trim(),   
                    contraseña: password.trim() 
                })
            });

            const textResponse = await response.text();
            let data;
            
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                // ⚠️ CORRECCIÓN: Usamos 'e' para loguear y evitar warning
                console.error("Error parseando JSON:", e);
                console.log("Respuesta cruda:", textResponse);
                Alert.alert("Error", "El servidor no respondió correctamente.");
                setLoading(false);
                return;
            }

            if (response.ok) {
                console.log("✅ Login exitoso. Redirigiendo...");
                
                await guardarSesion(data.token, data.usuario);
                
                router.replace('/(tabs)'); 
            } else {
                Alert.alert("Acceso Denegado", data.message || "Revise sus credenciales.");
            }

        } catch (error) {
            console.error("Error Login:", error);
            const mensajeError = Platform.OS === 'web' 
                ? "Verifique que el Backend (PC 1) esté corriendo."
                : "No se pudo conectar. Cambie la API_URL a la IP de su PC.";
            
            Alert.alert("Error de Conexión", mensajeError);
        } finally {
            setLoading(false);
        }
    };

    const irARegistro = () => {
        router.push('/login/register'); 
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>👮 MDPP</Text>
                    <Text style={styles.subtitle}>Sistema de Partes Virtuales</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Usuario</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su usuario"
                        value={usuario}
                        onChangeText={setUsuario}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Contraseña / DNI</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={irARegistro} style={styles.registerLink}>
                        <Text style={styles.registerText}>¿No tienes cuenta? Regístrate aquí</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoText: { fontSize: 40, fontWeight: 'bold', color: '#0056b3' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
    formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3 },
    label: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#0056b3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { backgroundColor: '#a0c4ff' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    registerLink: { marginTop: 20, alignItems: 'center' },
    registerText: { color: '#0056b3', fontSize: 14 }
});