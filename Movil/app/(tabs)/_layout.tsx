// Archivo: app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { obtenerSesion } from "../../utils/session";

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
    // Si no hay sesión → al login
    return <Redirect href={"/login" as any} />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Nuevo Parte",
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
        }}
      />
    </Tabs>
  );
}
