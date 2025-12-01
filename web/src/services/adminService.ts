// Archivo: mdpp/web/src/services/adminService.ts
// Servicios para la consola web de administración (usuarios y partes)

const API_URL = "http://localhost:4000/api";

export interface UsuarioPayload {
  id: number;
  tipo: string; // "APP" | "ADMIN"
}

interface BaseResponse {
  ok: boolean;
  message?: string;
}

// ====== RESPUESTAS TIPADAS ======

// Listar usuarios (APP o ADMIN)
export interface UsuariosSistemaResponse extends BaseResponse {
  usuarios: Record<string, unknown>[];
}

// Eliminar usuarios
export interface DeleteUsuariosResponse extends BaseResponse {
  deletedCount?: number;
}

// Bloquear / desbloquear usuarios
export type ToggleBloqueoResponse = BaseResponse;

// Detalle de parte
export interface ParteDetalleResponse extends BaseResponse {
  // El backend puede devolver muchos nombres distintos, por eso declaramos todos como opcionales
  parte?: Record<string, unknown>;
  data?: Record<string, unknown>;
  parteVirtual?: Record<string, unknown>;
  parte_detalle?: Record<string, unknown>;
  detalle?: Record<string, unknown>;

  // Archivos / multimedia
  archivos?: Record<string, unknown>[];
  media?: Record<string, unknown>[];
  multimedia?: Record<string, unknown>[];
  archivos_parte?: Record<string, unknown>[];
  parte_archivos?: Record<string, unknown>[];
}

// Detalle de usuario
export interface UsuarioDetallesResponse extends BaseResponse {
  user?: Record<string, unknown>;
  usuario?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

// Partes de un usuario
export interface UsuarioPartesResponse extends BaseResponse {
  partes?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  rows?: Record<string, unknown>[];
  lista?: Record<string, unknown>[];
}

// ====== HELPER GENÉRICO ======

async function requestJson<T extends BaseResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<{ resp: Response; json: T }> {
  const resp = await fetch(`${API_URL}${endpoint}`, options);

  let json: T;
  try {
    json = (await resp.json()) as T;
  } catch {
    // Si la respuesta no es JSON válido (por ejemplo, HTML de error),
    // devolvemos un objeto base para evitar el SyntaxError.
    json = { ok: false, message: "Respuesta no válida del servidor." } as T;
  }

  return { resp, json };
}

// =================== USUARIOS ===================

// Obtiene la lista de usuarios APP o ADMIN
export async function obtenerUsuariosSistema(
  tipoVista: "APP" | "ADMIN"
): Promise<{ resp: Response; json: UsuariosSistemaResponse }> {
  const endpoint =
    tipoVista === "APP" ? "/admin/usuarios-app" : "/admin/usuarios-admin";

  return requestJson<UsuariosSistemaResponse>(endpoint);
}

// Elimina usuarios seleccionados (APP o ADMIN)
// Backend: DELETE /api/admin/delete-usuarios
export async function eliminarUsuariosSeleccionados(
  users: UsuarioPayload[]
): Promise<{ resp: Response; json: DeleteUsuariosResponse }> {
  return requestJson<DeleteUsuariosResponse>("/admin/delete-usuarios", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users }),
  });
}

// Bloquea / Desbloquea usuarios seleccionados
// Backend: POST /api/admin/toggle-bloqueo
export async function bloqueoUsuarios(
  users: UsuarioPayload[],
  accion: "BLOQUEAR" | "DESBLOQUEAR",
  motivo: string
): Promise<{ resp: Response; json: ToggleBloqueoResponse }> {
  return requestJson<ToggleBloqueoResponse>("/admin/toggle-bloqueo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      users,
      accion,
      motivo,
    }),
  });
}

// =================== PARTES ===================

// Detalle de un parte
// Backend: GET /api/partes/:id
export async function obtenerPartePorIdAdmin(
  parteId: number
): Promise<{ resp: Response; json: ParteDetalleResponse }> {
  return requestJson<ParteDetalleResponse>(`/partes/${parteId}`);
}

// Detalle de usuario APP o ADMIN
// Backend: GET /api/admin/usuario-details/:id
export async function obtenerUsuarioDetallesAdmin(
  userId: number
): Promise<{ resp: Response; json: UsuarioDetallesResponse }> {
  return requestJson<UsuarioDetallesResponse>(`/admin/usuario-details/${userId}`);
}

// Partes de un usuario APP
// Backend: GET /api/admin/usuario-partes/:id
export async function obtenerUsuarioPartesAdmin(
  userId: number
): Promise<{ resp: Response; json: UsuarioPartesResponse }> {
  return requestJson<UsuarioPartesResponse>(`/admin/usuario-partes/${userId}`);
}
