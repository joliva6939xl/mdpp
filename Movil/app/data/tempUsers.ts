// Archivo: app/data/tempUsers.ts

// Base de datos TEMPORAL en memoria (se borra al cerrar el servidor)
let users: any[] = [];

// Agregar usuario temporal
export function addUser(user: any) {
  users.push(user);
}

// Buscar usuario por nombre, DNI o usuario
export function findUser(identifier: string) {
  return users.find(
    (u) =>
      u.nombre === identifier ||
      u.dni === identifier ||
      u.usuario === identifier
  );
}

// Obtener todos los usuarios (solo para debug si lo necesitas)
export function getAllUsers() {
  return users;
}

// Export default por si en algún lado lo importaste así
export default {
  addUser,
  findUser,
  getAllUsers,
};
