import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { guardarSesion } from "../../utils/session";

// URL Dinámica (Ajustar según entorno)
const API_URL = Platform.OS === "web" 
  ? "http://localhost:4000/api" 
  : "http://10.0.2.2:4000/api";

// ✅ 1. FUNCIÓN AUXILIAR DE ALERTAS (Vital para Web/Móvil)
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
  
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ 2. LÓGICA DE LOGIN ROBUSTA
  const handleLogin = async () => {
    if (!usuario || !contrasena) {
      showAlert("Campos incompletos", "Por favor ingrese usuario y contraseña");
      return;
    }

    setLoading(true);
    try {
      console.log(`🔵 Conectando a: ${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            usuario: usuario.trim(), // Limpiamos espacios accidentales
            contrasena: contrasena.trim() 
        }),
      });

      // 🛡️ PARSEO MANUAL DE RESPUESTA
      // Esto evita que la app falle si el servidor devuelve HTML o texto plano
      const textResponse = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Error parseando JSON:", e);
        showAlert("Error Crítico", "El servidor no respondió correctamente. Contacte a soporte.");
        setLoading(false);
        return;
      }

      // 🛡️ MANEJO DE ERRORES Y BLOQUEOS (Lógica 403)
      if (!response.ok || data.ok === false) {
        const message: string = typeof data?.message === 'string' ? data.message : 'Credenciales incorrectas.';

        // Detectar Usuario Bloqueado / Vacaciones
        if (response.status === 403 && message.toUpperCase().includes('BLOQUEADO')) {
            const motivo = message.split(':').slice(1).join(':').trim();
            const textoMotivo = motivo || 'Sin motivo especificado.';
            
            showAlert(
                '⛔ ACCESO DENEGADO',
                `Tu usuario está bloqueado.\nMotivo: ${textoMotivo}`
            );
        } else {
            showAlert('Acceso Denegado', message);
        }
        return;
      }

      // ✅ ÉXITO
      console.log("✅ Login exitoso. Redirigiendo...");
      await guardarSesion(data.token, data.usuario);
      
      // 🚀 REDIRECCIÓN AL DASHBOARD PRINCIPAL
      router.replace("/(tabs)"); 

    } catch (error) {
      console.error("Error login:", error);
      const msg = Platform.OS === 'web' 
        ? "No se pudo conectar. Verifique que el Backend esté corriendo." 
        : "Error de conexión. Verifique su internet o la IP del servidor.";
      showAlert("Error de Conexión", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* 1. ENCABEZADO DE MARCA (SISIFO) */}
      <View style={styles.headerContainer}>
        <View style={styles.logoPlaceholder}>
            <Ionicons name="shield-checkmark-sharp" size={42} color="#0F172A" />
        </View>
        <Text style={styles.brandName}>SISIFO</Text>
        <Text style={styles.brandSlogan}>GESTOR DE PARTES VIRTUALES</Text>
      </View>

      {/* 2. TARJETA DE LOGIN */}
      <View style={styles.card}>
        <Text style={styles.loginTitle}>Acceso Autorizado</Text>
        <Text style={styles.loginSubtitle}>Ingrese sus credenciales operativas</Text>

        {/* INPUT USUARIO */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>ID DE USUARIO</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej. OPERADOR_01"
              placeholderTextColor="#94A3B8"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* INPUT CONTRASEÑA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 5}}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTÓN DE ACCESO */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
          )}
        </TouchableOpacity>

        {/* LINK REGISTRO */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push("/login/register")}>
            <Text style={styles.linkText}>Solicitar nueva cuenta de acceso</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. PIE DE PÁGINA */}
      <View style={styles.footer}>
        <Text style={styles.copyright}>© 2026 SISIFO SYSTEMS. Enterprise Edition.</Text>
        <Text style={styles.version}>v1.5.0 Stable</Text>
      </View>

    </KeyboardAvoidingView>
  );
}

// --- ESTILOS EMPRESARIALES (SLATE THEME) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50 (Fondo limpio)
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  
  // HEADER
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: "#E2E8F0", // Slate 200
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0F172A", // Slate 900
    letterSpacing: 5, // Espaciado premium
  },
  brandSlogan: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B", // Slate 500
    letterSpacing: 2,
    marginTop: 6,
    textTransform: "uppercase",
  },

  // CARD
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 4, 
    paddingVertical: 36,
    paddingHorizontal: 28,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: 'center',
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  loginSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: "500"
  },

  // INPUTS
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569", // Slate 600
    marginBottom: 8,
    letterSpacing: 1,
    marginLeft: 2
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1", // Slate 300
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },

  // BOTÓN
  loginButton: {
    backgroundColor: "#0F172A", // Azul Marino muy oscuro
    height: 54,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1.5,
  },

  // FOOTER LINKS
  footerLinks: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // BOTTOM COPYRIGHT
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  copyright: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 0.5
  },
  version: {
    fontSize: 9,
    color: "#CBD5E1",
    marginTop: 4,
  }
});