// Archivo: app/utils/userCache.ts
// Este archivo solo reexporta lo que está en app/data/tempUsers.ts
// así cualquier import (nuevo o viejo) usa el mismo caché en memoria.

export { addUser, findUser, getAllUsers } from "../data/tempUsers";
