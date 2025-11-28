// Archivo: app/utils/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveSession(user: any) {
  await AsyncStorage.setItem("session", JSON.stringify(user));
}

export async function getSession() {
  const data = await AsyncStorage.getItem("session");
  return data ? JSON.parse(data) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem("session");
}
