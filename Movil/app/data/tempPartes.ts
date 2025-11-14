// Archivo: app/data/tempPartes.ts

// Tipo de dato de un Parte Virtual (solo para organización)
export type ParteVirtual = {
  id: number;
  sector: string;
  parteFisico: string;
  zona: string;
  turno: string;
  lugar: string;
  fecha: string;
  hora: string;
  unidadTipo: string;
  unidadNumero: string;
  placa: string;
  conductor: string;
  dniConductor: string;
  sumilla: string;
  asunto: string;
  ocurrencia: string;
  supZonal: string;
  supGeneral: string;
  createdAt: string;
};

// Base de datos TEMPORAL EN MEMORIA
let partes: ParteVirtual[] = [];
let nextId = 1;

// Agregar un nuevo parte virtual
export function addParte(data: Omit<ParteVirtual, "id" | "createdAt">): ParteVirtual {
  const nuevo: ParteVirtual = {
    id: nextId++,
    createdAt: new Date().toISOString(),
    ...data,
  };
  partes.push(nuevo);
  return nuevo;
}

// Obtener todos los partes (últimos primero)
export function getPartes(): ParteVirtual[] {
  return [...partes].reverse();
}

// Obtener un parte por ID
export function getParteById(id: number | string): ParteVirtual | undefined {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  return partes.find((p) => p.id === numericId);
}

// Para debug opcional
export function clearPartes() {
  partes = [];
  nextId = 1;
}

// Export default por si se usa así en algún lado
export default {
  addParte,
  getPartes,
  getParteById,
  clearPartes,
};
