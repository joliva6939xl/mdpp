// Archivo: app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Login */}
      <Stack.Screen name="login/index" options={{ headerShown: false }} />
      <Stack.Screen name="login/register" options={{ title: "Crear Usuario" }} />

      {/* Tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Detalle de Parte */}
      <Stack.Screen name="parte/[id]" options={{ title: "Detalle del Parte" }} />
    </Stack>
  );
}
