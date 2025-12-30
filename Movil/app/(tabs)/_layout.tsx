// Archivo: Movil/app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { obtenerSesion } from "../../utils/session";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabsLayout() {
  const [cargando, setCargando] = useState(true);
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    obtenerSesion().then((data) => {
      setLogueado(!!data);
      setCargando(false);
    });
  }, []);

  if (cargando) return null;

  if (!logueado) {
    return <Redirect href={"/login" as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        // ✅ ESTO ELIMINA LA BARRA AZUL DE ARRIBA
        headerShown: false,

        // ✅ ESTO ELIMINA LOS "BOTONCITOS" DE ABAJO
        tabBarStyle: { 
            display: 'none' 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Nuevo Parte",
          // Los iconos se quedan en el código pero no se verán porque ocultamos la barra
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="note-add" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size ?? 24} />
          ),
        }}
      />
    </Tabs>
  );
}