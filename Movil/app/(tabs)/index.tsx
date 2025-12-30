import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
// Usamos MaterialIcons para iconos más específicos y profesionales en el dashboard
import { MaterialIcons } from '@expo/vector-icons'; 

export default function MenuPrincipalScreen() {
  const router = useRouter();

  const contactarSoporte = () => {
    const telefono = "999999999";
    const mensaje = "Hola, necesito soporte con el aplicativo de Vigilancia.";
    
    if (Platform.OS === 'web') {
      const opcion = window.confirm("¿Contactar por WhatsApp?\n(Cancelar para llamar)");
      if (opcion) {
        window.open(`https://wa.me/51${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
      } else {
        window.open(`tel:${telefono}`);
      }
    } else {
      Alert.alert(
        "Soporte Técnico",
        "Selecciona una opción:",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Llamar 📞", onPress: () => Linking.openURL(`tel:${telefono}`) },
          { text: "WhatsApp 💬", onPress: () => Linking.openURL(`whatsapp://send?phone=51${telefono}&text=${encodeURIComponent(mensaje)}`) }
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Fondo decorativo superior (opcional, para dar elegancia) */}
      <View style={styles.topDecoration} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ENCABEZADO DE BIENVENIDA */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>Operador de Vigilancia</Text>
          <Text style={styles.subTitle}>Seleccione una opción para continuar</Text>
        </View>

        {/* GRILLA DE 4 BOTONES */}
        <View style={styles.grid}>
          
          {/* --- BOTÓN 1: NUEVO PARTE --- */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(tabs)/nuevo')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}> 
               {/* Fondo Azul Claro */}
               <MaterialIcons name="post-add" size={38} color="#0284C7" /> 
               {/* Icono Azul Oscuro */}
            </View>
            <Text style={styles.cardTitle}>Nuevo Parte</Text>
            <Text style={styles.cardDesc}>Registrar incidencia</Text>
          </TouchableOpacity>

          {/* --- BOTÓN 2: HISTORIAL --- */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(tabs)/historial')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
               {/* Fondo Verde Claro */}
               <MaterialIcons name="history" size={38} color="#16A34A" />
               {/* Icono Verde Oscuro */}
            </View>
            <Text style={styles.cardTitle}>Historial</Text>
            <Text style={styles.cardDesc}>Ver reportes pasados</Text>
          </TouchableOpacity>

          {/* --- BOTÓN 3: PERFIL --- */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(tabs)/perfil')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
               {/* Fondo Gris Claro */}
               <MaterialIcons name="person" size={38} color="#475569" />
               {/* Icono Gris Oscuro */}
            </View>
            <Text style={styles.cardTitle}>Mi Perfil</Text>
            <Text style={styles.cardDesc}>Datos de usuario</Text>
          </TouchableOpacity>

          {/* --- BOTÓN 4: SOPORTE TÉCNICO --- */}
          <TouchableOpacity 
            style={[styles.card, styles.cardSupport]} 
            onPress={contactarSoporte}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
               {/* Fondo Rojo Claro */}
               <MaterialIcons name="headset-mic" size={38} color="#DC2626" />
               {/* Icono Rojo Oscuro */}
            </View>
            <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Soporte</Text>
            <Text style={styles.cardDesc}>Ayuda técnica</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Decoración azul superior para darle un toque "App"
  topDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#0a7ea4',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  scrollContent: { 
    padding: 20, 
    paddingTop: 60, // Espacio para bajar el contenido sobre la decoración
    flexGrow: 1, 
  },
  
  header: { 
    marginBottom: 40, 
    alignItems: 'center',
    // Fondo blanco suave para el texto del header
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    elevation: 4, // Sombra
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  welcomeText: { fontSize: 14, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  userName: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'center' },
  subTitle: { fontSize: 13, color: '#94a3b8' },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: 16 
  },
  
  card: {
    width: '47%', // Dos columnas
    backgroundColor: '#fff',
    borderRadius: 24, // Bordes más redondeados (estilo moderno)
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
    // Sombra suave y elegante
    elevation: 2,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  
  cardSupport: {
    borderColor: '#FECACA', // Borde rojizo suave para soporte
  },
  
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35, // Círculo perfecto
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  cardDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: '500' }
});