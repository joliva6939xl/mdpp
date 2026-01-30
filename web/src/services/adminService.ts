/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = "http://localhost:4000/api";

// ==========================================
// 1. DEFINICIÓN DE TIPOS
// ==========================================

export type UserTarget = "APP" | "ADMIN";
export type ActionType = "BLOCK" | "UNBLOCK";

export interface UsuarioSistema {
  id: number;
  usuario: string; 
  nombre: string;
  rol: string;
  dni?: string;
  estado: "ACTIVO" | "BLOQUEADO";
  bloqueo_motivo?: string;
  creado_en?: string;
  tipo_tabla: UserTarget;
}

export interface Parte {
  id: number;
  parte_fisico: string;
  fecha: string;
  hora: string;
  zona: string;
  sumilla: string;
  estado: string;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  message?: string;
  data?: T;
  
  // Propiedades variables del backend
  usuarios?: T;
  partes?: T;
  parte?: T;
  detalle?: T;
  stats?: T;
  error?: string;
  
  // Campos normalizados
  user?: any;       
  usuario?: any;
  archivos?: any[];
}

export interface UsuarioPayload {
  id: number;
  tipo: UserTarget;
}

export interface ServiceResponse<T = any> {
  resp: Response | null;
  json: ApiResponse<T>;
  success: boolean;
}

// ==========================================
// 2. CORE: HTTP CLIENT (Con soporte de Signal)
// ==========================================

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

// ✅ Modificado para aceptar AbortSignal
export async function requestJson<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any,
  isFormData: boolean = false,
  signal?: AbortSignal // <--- Nuevo parámetro para cancelar peticiones
): Promise<ServiceResponse<T>> {
  
  const config: RequestInit = {
    method,
    headers: getHeaders(isFormData),
    signal // <--- Se pasa al fetch nativo
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const resp = await fetch(`${API_URL}${endpoint}`, config);
    let json: ApiResponse<T>;
    
    try {
      json = await resp.json();
    } catch {
      json = { ok: false, message: "Error crítico: Respuesta inválida del servidor." };
    }
    
    const isSuccess = resp.ok && (json.ok !== false); 
    return { resp, json, success: isSuccess };

  } catch (error: any) {
    if (error.name === 'AbortError') {
       // Silenciosamente ignoramos cancelaciones
       console.log('Petición cancelada:', endpoint);
       throw error; 
    }
    console.error(`🚨 Error [${method} ${endpoint}]:`, error);
    return {
      resp: null,
      json: { ok: false, message: "Error de conexión." },
      success: false,
    };
  }
}

// ==========================================
// 3. SERVICIO DE USUARIOS
// ==========================================

// ✅ Acepta signal opcional
export const obtenerUsuariosSistema = async (tipo: UserTarget, signal?: AbortSignal) => {
  // Rutas en ESPAÑOL (Backend)
  const endpoint = tipo === "ADMIN" ? "/admin/usuarios-admin" : "/admin/usuarios-app";
  
  const { resp, json, success } = await requestJson<UsuarioSistema[]>(endpoint, "GET", null, false, signal);
  const lista = json.usuarios || json.data || [];
  if (Array.isArray(lista)) {
    lista.forEach((u: any) => u.tipo_tabla = tipo);
    json.usuarios = lista;
  }
  return { resp, json, success };
};

// ✅ Acepta signal opcional
export const obtenerUsuarioDetallesAdmin = async (id: number, signal?: AbortSignal) => {
  // Ruta en ESPAÑOL (Backend)
  const res = await requestJson<any>(`/admin/usuario-details/${id}`, "GET", null, false, signal);
  res.json.data = res.json.user || res.json.usuario || res.json.data;
  return res;
};

export const crearUsuarioSistema = async (data: any, target: UserTarget) => {
  // Rutas de creación
  const endpoint = target === "APP" ? "/auth/register" : "/admin/register-admin";
  return await requestJson(endpoint, "POST", data);
};

// ---------------------------------------------------------
// 3.1 ACCIONES CRÍTICAS
// ---------------------------------------------------------

export const eliminarUsuariosSeleccionados = async (usuarios: UsuarioPayload[]) => {
  if (!usuarios.length) return { success: false, json: { ok: false, message: "Sin selección" }, resp: null };
  return await requestJson("/admin/delete-usuarios", "DELETE", { usuarios });
};

export const eliminarUsuario = async (id: number, tipo: UserTarget) => {
  return await requestJson("/admin/delete-usuarios", "DELETE", { 
      usuarios: [{ id, tipo }] 
  });
};

export const bloqueoUsuarios = async (ids: number[], accion: ActionType, motivo?: string) => {
  return await requestJson("/admin/toggle-bloqueo", "POST", { 
    ids, 
    accion, 
    motivo: motivo || "Gestión administrativa" 
  });
};

// Wrappers individuales
export const bloquearUsuario = async (id: number, motivo?: string) => bloqueoUsuarios([id], "BLOCK", motivo);
export const desbloquearUsuario = async (id: number) => bloqueoUsuarios([id], "UNBLOCK");


// ==========================================
// 4. SERVICIO DE PARTES
// ==========================================

export const obtenerUsuarioPartesAdmin = async (userId: number) => {
  const { json, ...rest } = await requestJson<Parte[]>(`/admin/usuario-partes/${userId}`, "GET");
  const lista = json.partes || json.data || [];
  json.data = lista;
  return { json, ...rest };
};

export const obtenerPartePorIdAdmin = async (id: number) => {
  const { json, ...rest } = await requestJson<any>(`/partes/${id}`, "GET");
  const base = json.parte || json.data || json.detalle;
  if (base) {
    base.fotos = base.fotos || [];
    base.videos = base.videos || [];
    if (Array.isArray(json.archivos)) {
       json.archivos.forEach((a: any) => {
           if (a.tipo === 'foto') base.fotos.push(a.ruta);
           if (a.tipo === 'video') base.videos.push(a.ruta);
       });
    }
    json.data = base; 
  }
  return { json, ...rest };
};

export const listarPartes = async (filtros = "") => requestJson(`/partes${filtros}`, "GET");
export const crearParte = async (formData: FormData) => requestJson("/partes", "POST", formData, true);
export const cerrarParte = async (id: number, horaFin?: string) => requestJson(`/partes/cerrar/${id}`, "PUT", { hora_fin: horaFin });
export const actualizarParte = async (id: number, data: any) => requestJson(`/partes/${id}`, "PUT", data);

// ==========================================
// 5. REPORTES
// ==========================================

export const obtenerEstadisticas = async (f: string, t: string) => {
    const { json, ...rest } = await requestJson(`/partes/callcenter/stats?fecha=${f}&turno=${t}`, "GET");
    if (json.stats && !json.data) json.data = json.stats;
    return { json, ...rest };
};

export const obtenerMetricasZonales = async () => {
    const { json, ...rest } = await requestJson("/partes/metricas/zonales", "GET");
    if (json.stats && !json.data) json.data = json.stats;
    return { json, ...rest };
};

// ==========================================
// 6. EXPORT UNIFICADO
// ==========================================

export const adminService = {
  requestJson,
  obtenerUsuariosSistema,
  obtenerUsuarioDetallesAdmin,
  crearUsuarioSistema,
  eliminarUsuario,
  eliminarUsuariosSeleccionados,
  bloquearUsuario,
  desbloquearUsuario,
  bloqueoUsuarios,
  obtenerUsuarioPartesAdmin,
  obtenerPartePorIdAdmin,
  listarPartes,
  crearParte,
  cerrarParte,
  actualizarParte,
  obtenerEstadisticas,
  obtenerMetricasZonales
};

export default adminService;