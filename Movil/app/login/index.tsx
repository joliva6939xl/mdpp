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
import { guardarSesion } from '../../utils/session';

// ⚠️ Usamos localhost para solucionar errores de conexión en Web/Emulador
const API_URL = 'http://localhost:4000/api';

// Helper para mostrar alertas en móvil y en web
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // En web usamos directamente window.alert
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
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario || !password) {
      showAlert('Error', 'Por favor ingrese usuario y contraseña');
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
        console.log('Respuesta cruda:', textResponse);
        showAlert('Error', 'El servidor no respondió correctamente.');
        setLoading(false);
        return;
      }

      // 🔴 MANEJO DE ERRORES / BLOQUEO
      if (!response.ok || data.ok === false) {
        const message: string =
          typeof data?.message === 'string'
            ? data.message
            : 'Revise sus credenciales.';

        // Si el backend envía: "⛔ USUARIO BLOQUEADO: VACACIONES"
        if (response.status === 403 && message.toUpperCase().includes('USUARIO BLOQUEADO')) {
          const motivo = message.split(':').slice(1).join(':').trim(); // "VACACIONES"
          const textoMotivo =
            motivo || 'Sin motivo especificado. Contacte a su supervisor.';

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
          ? 'Verifique que el Backend (PC 1) esté corriendo.'
          : 'No se pudo conectar. Cambie la API_URL a la IP de su PC.';

      showAlert('Error de Conexión', mensajeError);
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
            autoCapitalize="none"
            value={usuario}
            onChangeText={setUsuario}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading ? styles.buttonDisabled : undefined,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={irARegistro}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 40, fontWeight: 'bold', color: '#0056b3' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0056b3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { backgroundColor: '#a0c4ff' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#0056b3', fontSize: 14 },
});
