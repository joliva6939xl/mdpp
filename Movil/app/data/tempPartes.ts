// Archivo: app/data/tempPartes.ts

export type MultimediaItem = {
  tipo: 'image' | 'video';
  url: string;
};

// 1. Actualizamos el Tipo para incluir multimedia
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
  multimedia?: MultimediaItem[]; // <--- Nuevo campo opcional
};

// 2. Base de datos con DATOS DE PRUEBA (Para que no te salga "No encontrado")
let partes: ParteVirtual[] = [
  {
    id: 1,
    sector: "Sector 1",
    parteFisico: "PF-001",
    zona: "NORTE",
    turno: "M",
    lugar: "Av. Principal 123",
    fecha: "2024-03-20",
    hora: "10:00",
    unidadTipo: "Camioneta",
    unidadNumero: "CN-01",
    placa: "ABC-123",
    conductor: "Juan Perez",
    dniConductor: "12345678",
    sumilla: "Choque Leve",
    asunto: "Incidente vehicular",
    ocurrencia: "Detalle de la ocurrencia...",
    supZonal: "Sup. A",
    supGeneral: "Gral. B",
    createdAt: new Date().toISOString(),
    multimedia: [
      { tipo: 'image', url: 'https://via.placeholder.com/300' },
      { tipo: 'image', url: 'https://via.placeholder.com/300/ff0000/ffffff' },
      { tipo: 'video', url: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
      { tipo: 'image', url: 'https://via.placeholder.com/300/00ff00/000000' },
      { tipo: 'image', url: 'https://via.placeholder.com/300/0000ff/ffffff' },
    ]
  }
];

let nextId = 2; // Empezamos en 2 porque ya existe el 1

export function addParte(data: Omit<ParteVirtual, "id" | "createdAt">): ParteVirtual {
  const nuevo: ParteVirtual = {
    id: nextId++,
    createdAt: new Date().toISOString(),
    ...data,
  };
  partes.push(nuevo);
  return nuevo;
}

export function getPartes(): ParteVirtual[] {
  return [...partes].reverse();
}

export function getParteById(id: number | string): ParteVirtual | undefined {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  return partes.find((p) => p.id === numericId);
}

export function clearPartes() {
  partes = [];
  nextId = 1;
}

export default {
  addParte,
  getPartes,
  getParteById,
  clearPartes,
};