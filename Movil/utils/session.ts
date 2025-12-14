import AsyncStorage from "@react-native-async-storage/async-storage";

type UsuarioSesion = Record<string, unknown> | null;

export const guardarSesion = async (token: string | null | undefined, usuario: UsuarioSesion) => {
  try {
    // ✅ Guardamos usuario SIEMPRE (aunque no exista token)
    if (usuario) {
      await AsyncStorage.setItem("userData", JSON.stringify(usuario));
    } else {
      await AsyncStorage.removeItem("userData");
    }

    // ✅ Token opcional: si viene, lo guardamos; si no, lo limpiamos
    if (token && String(token).trim().length > 0) {
      await AsyncStorage.setItem("userToken", String(token));
    } else {
      await AsyncStorage.removeItem("userToken");
    }
  } catch (error) {
    console.error("Error guardando sesión:", error);
  }
};

export const obtenerSesion = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const userDataString = await AsyncStorage.getItem("userData");

    if (!userDataString || userDataString === "undefined") {
      return { token: token || null, usuario: null };
    }

    const usuario = JSON.parse(userDataString) as UsuarioSesion;
    return { token: token || null, usuario };
  } catch (error) {
    console.log("Datos corruptos detectados, limpiando sesión. Detalles:", error);
    await AsyncStorage.clear();
    return { token: null, usuario: null };
  }
};

export const cerrarSesion = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
};
