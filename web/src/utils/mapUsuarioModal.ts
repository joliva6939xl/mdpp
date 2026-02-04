export interface UsuarioApp {
  id: number;
  nombre: string;
  usuario: string;
  cargo: string;
  dni: string;
  celular: string;
  correo: string;
  direccion: string;
  foto_ruta: string | null;
  estado: string;
  bloqueo_motivo?: string;
  
  foto_licencia: string | null;
  motorizado: boolean;
  conductor: boolean;
  direccion_actual: string;
  
  // 🔥 ESTOS SON LOS CAMPOS QUE FALTABAN
  referencia: string;
  ubicacion_gps: string;
}

// Tipo auxiliar para evitar errores de tipo 'any'
type SafeRecord = Record<string, unknown>;

// 🟢 1. MAPEO DESDE LA TABLA (El más importante)
export const mapUsuarioTablaToModal = (input: unknown): UsuarioApp => {
  const u = (input || {}) as SafeRecord;

  // 👇 ESTO IMPRIMIRÁ EN LA CONSOLA DEL NAVEGADOR LOS DATOS REALES
  // Solo imprimimos uno para no saturar, por ejemplo el ID 32 o 33
  if (u.id === 32 || u.id === 33) {
      console.log("🔍 DEBUG MAPPER ID " + u.id, {
          nombre: u.nombre,
          referencia_DB: u.referencia, // ¿Llega esto?
          gps_DB: u.ubicacion_gps      // ¿Llega esto?
      });
  }

  return {
    id: Number(u.id),
    nombre: String(u.nombre || ""),
    usuario: String(u.usuario || ""),
    cargo: String(u.rol || u.cargo || "Agente"),
    dni: String(u.dni || "-"),
    celular: String(u.celular || "-"),
    correo: "No registrado",
    direccion: String(u.direccion || u.direccion_actual || "No registrada"),
    foto_ruta: u.foto_ruta ? String(u.foto_ruta) : null,
    estado: String(u.estado || "ACTIVO"),
    bloqueo_motivo: String(u.bloqueo_motivo || ""),
    
    foto_licencia: u.foto_licencia ? String(u.foto_licencia) : null,
    motorizado: Boolean(u.motorizado),
    conductor: Boolean(u.conductor),
    direccion_actual: String(u.direccion_actual || u.direccion || "No registrada"),
    
    // 🔥 AQUÍ ESTÁ LA CORRECCIÓN CLAVE 🔥
    // Antes quizás estaba: referencia: "" 
    // Ahora leemos DIRECTAMENTE de la base de datos (u.referencia)
    referencia: u.referencia ? String(u.referencia) : "",
    ubicacion_gps: u.ubicacion_gps ? String(u.ubicacion_gps) : ""
  };
};

// 🔵 2. MAPEO DESDE DETALLE (Por si acaso se usa en otro lado)
export const mapUsuarioDetalleToModal = (dataInput: unknown, rowDataInput?: unknown): UsuarioApp => {
  const data = (dataInput || {}) as SafeRecord;
  const rowData = (rowDataInput || {}) as SafeRecord;

  return {
    id: Number(data.id || rowData.id),
    nombre: String(data.nombre || rowData.nombre || "Sin nombre"),
    usuario: String(data.usuario || data.nombre_usuario || rowData.usuario || ""),
    cargo: String(data.cargo || data.rol || rowData.rol || "Agente"),
    dni: String(data.dni || rowData.dni || "-"),
    celular: String(data.celular || "-"),
    correo: String(data.correo || "No registrado"),
    direccion: String(data.direccion || "No registrada"),
    foto_ruta: data.foto_ruta ? String(data.foto_ruta) : null,
    estado: String(data.estado || rowData.estado || "ACTIVO"),
    bloqueo_motivo: String(data.bloqueo_motivo || rowData.bloqueo_motivo || ""),

    foto_licencia: data.foto_licencia ? String(data.foto_licencia) : null,
    motorizado: Boolean(data.motorizado),
    conductor: Boolean(data.conductor),
    direccion_actual: String(data.direccion_actual || data.direccion || "No registrada"),
    
    // 🔥 CORRECCIÓN AQUÍ TAMBIÉN
    referencia: String(data.referencia || rowData.referencia || ""),
    ubicacion_gps: String(data.ubicacion_gps || rowData.ubicacion_gps || "")
  };
};