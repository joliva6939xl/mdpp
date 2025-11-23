import AsyncStorage from '@react-native-async-storage/async-storage';

export const guardarSesion = async (token: string, usuario: any) => {
    try {
        if (!token || !usuario) return; 
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(usuario));
    } catch (error) {
        console.error("Error guardando sesión:", error);
    }
};

export const obtenerSesion = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');

        // Si el dato está corrupto o vacío, retornamos nulo
        if (!userDataString || userDataString === "undefined") {
            return { token: null, usuario: null };
        }

        const usuario = JSON.parse(userDataString);
        return { token, usuario };
    } catch (error) {
        // CORRECCIÓN: Usamos la variable 'error' en el log
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