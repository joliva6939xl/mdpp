// Movil/app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { AlertProvider } from "../context/GlobalAlert";

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack>
        <Stack.Screen
          name="login/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="login/register"
          options={{ title: "Registro" }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="parte/[id]"
          options={{ title: "Detalle Parte" }}
        />
        <Stack.Screen
          name="parte/editar/[id]"
          options={{ title: "Editar Parte" }}
        />
        <Stack.Screen
          name="parte/multimedia/[id]"
          options={{ title: "Multimedia" }}
        />
      </Stack>
    </AlertProvider>
  );
}
