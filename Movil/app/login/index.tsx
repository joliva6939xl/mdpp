// Archivo: Movil/app/login/index.tsx
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { guardarSesion } from '../../utils/session';

// ⚠️ Usamos localhost para solucionar errores de conexión en Web/Emulador
// Si necesitas probar en celular físico, cambia esto por tu IP (ej. 192.168.1.X)
const API_URL = 'http://localhost:4000/api';

// Helper para mostrar alertas en móvil y en web
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // @ts-ignore
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ Nuevo estado para el "ojo"
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario || !password) {
      showAlert('Campos incompletos', 'Por favor ingrese usuario y contraseña');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 Conectando a:', `${API_URL}/auth/login`);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: usuario.trim(),
          contraseña: password.trim(),
        }),
      });

      const textResponse = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error('Error parseando JSON:', e);
        showAlert('Error', 'El servidor no respondió correctamente.');
        setLoading(false);
        return;
      }

      // 🔴 MANEJO DE ERRORES / BLOQUEO (Tu lógica original conservada)
      if (!response.ok || data.ok === false) {
        const message: string =
          typeof data?.message === 'string'
            ? data.message
            : 'Revise sus credenciales.';

        // Lógica de Usuario Bloqueado / Vacaciones
        if (response.status === 403 && message.toUpperCase().includes('USUARIO BLOQUEADO')) {
          const motivo = message.split(':').slice(1).join(':').trim();
          const textoMotivo = motivo || 'Sin motivo especificado. Contacte a su supervisor.';

          showAlert(
            'Usuario bloqueado',
            `No puedes ingresar al sistema.\nMotivo: ${textoMotivo}`
          );
        } else {
          showAlert('Acceso Denegado', message);
        }
        return;
      }

      // ✅ LOGIN OK
      console.log('✅ Login exitoso. Redirigiendo...');
      await guardarSesion(data.token, data.usuario);
      router.replace('/(tabs)');

    } catch (error) {
      console.error('Error Login:', error);
      const mensajeError =
        Platform.OS === 'web'
          ? 'Verifique que el Backend esté corriendo.'
          : 'No se pudo conectar. Verifique su conexión o la IP del servidor.';

      showAlert('Error de Conexión', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* DECORACIÓN SUPERIOR (AZUL INSTITUCIONAL) */}
      <View style={styles.headerDecoration}>
        <View style={styles.headerCurve} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* === SECCIÓN DE BRANDING (LOGO) === */}
        <View style={styles.brandContainer}>
          {/* Logo Placeholder */}
          <View style={styles.logoPlaceholderCircle}>
             <MaterialIcons name="account-balance" size={48} color="#0a7ea4" />
          </View>

          <Text style={styles.municipalityText}>MUNICIPALIDAD DISTRITAL DE</Text>
          <Text style={styles.districtText}>PUENTE PIEDRA</Text>
          <View style={styles.separator} />
          <Text style={styles.appNameText}>Sistema de Partes Virtuales</Text>
        </View>

        {/* === TARJETA DEL FORMULARIO === */}
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Iniciar Sesión</Text>
          <Text style={styles.welcomeSubtitle}>Ingresa tus credenciales</Text>

          {/* Input Usuario */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person-outline" size={24} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#94a3b8"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
            />
          </View>

          {/* Input Contraseña con Toggle */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={24} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons 
                 name={showPassword ? "eye-off-outline" : "eye-outline"} 
                 size={24} 
                 color="#64748b" 
              />
            </TouchableOpacity>
          </View>

          {/* Botón de Ingreso */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>INGRESAR</Text>
            )}
          </TouchableOpacity>

          {/* Link Registro (Manteniendo tu funcionalidad) */}
          <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/login/register')}>
            <Text style={styles.registerText}>¿No tienes cuenta? Regístrate aquí</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>© 2025 Gerencia de Seguridad Ciudadana</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 40 },

  // --- HEADER DECORATIVO ---
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: '#0a7ea4', // Azul Institucional
    zIndex: -1,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    right: -100,
    height: 100,
    backgroundColor: '#0a7ea4',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },

  // --- BRANDING ---
  brandContainer: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
  logoPlaceholderCircle: {
     width: 100,
     height: 100,
     backgroundColor: '#fff',
     borderRadius: 50,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 15,
     elevation: 6,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 5,
  },
  municipalityText: { fontSize: 13, color: '#E0F2FE', letterSpacing: 1, fontWeight: '600' },
  districtText: { fontSize: 26, color: '#fff', fontWeight: '900', textTransform: 'uppercase', marginTop: 2 },
  separator: { height: 4, width: 40, backgroundColor: '#fff', borderRadius: 2, marginVertical: 10, opacity: 0.8 },
  appNameText: { fontSize: 16, color: '#E0F2FE', fontWeight: '500' },

  // --- FORMULARIO ---
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  welcomeSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, marginTop: 4 },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0f172a', fontSize: 16, height: '100%' },
  eyeIcon: { padding: 8 },

  // Botones
  loginButton: {
    backgroundColor: '#0a7ea4',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#0a7ea4', fontSize: 14, fontWeight: '600' },

  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#94a3b8', textAlign: 'center' }
});