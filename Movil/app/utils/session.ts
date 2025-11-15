// Archivo: app/utils/session.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESION_KEY = "mdpp_usuario";

export async function guardarSesion(usuario: any) {
  try {
    await AsyncStorage.setItem(SESION_KEY, JSON.stringify(usuario));
  } catch (error) {
    console.error("Error guardando sesión:", error);
  }
}

export async function obtenerSesion() {
  try {
    const data = await AsyncStorage.getItem(SESION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo sesión:", error);
    return null;
  }
}

export async function cerrarSesion() {
  try {
    await AsyncStorage.removeItem(SESION_KEY);
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
}
