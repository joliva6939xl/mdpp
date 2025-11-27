// Archivo: app/utils/userCache.ts

// Tipo del usuario en caché (solo para desarrollo)
export type CachedUser = {
  id?: number;
  nombre: string;
  dni: string;
  celular?: string | null;
  cargo?: string | null;
  usuario: string;
  contraseña: string;
};

// Variable en memoria (se borra al recargar la app)
let currentUser: CachedUser | null = null;

// Guardar usuario (lo usa register.tsx)
export function addUser(user: CachedUser) {
  currentUser = user;
}

// Obtener usuario actual (lo usan perfil, nuevo parte, etc.)
export function getUser(): CachedUser {
  if (!currentUser) {
    // Usuario de respaldo para que la app no se rompa
    return {
      id: 1,
      nombre: "Usuario Demo",
      dni: "00000000",
      usuario: "demo",
      contraseña: "00000000",
    };
  }
  return currentUser;
}

// Limpiar usuario (para futuro logout)
export function clearUser() {
  currentUser = null;
}
