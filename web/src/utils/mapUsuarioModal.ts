import type { UsuarioSistema } from "../types/admin";

export type UsuarioApp = {
  id: number;
  nombre: string;          // ✅ requerido por tu UserDetailsModal
  cargo: string;
  usuario: string;
  dni: string;
  celular: string;
  foto_ruta?: string | null;  // ✅ el modal usa foto_ruta
};

export const mapUsuarioDetalleToModal = (
  raw: unknown,
  fallback: UsuarioSistema
): UsuarioApp => {
  const r = (raw ?? {}) as Record<string, unknown>;

  const nombre = String(
    r.nombres ??
      r.nombre ??
      fallback.nombres ??
      fallback.nombre ??
      fallback.usuario ??
      fallback.nombre_usuario ??
      "-"
  );

  return {
    id: Number(r.id ?? fallback.id),
    nombre,

    cargo: String(
      r.cargo ??
        r.rol ??
        fallback.rol ??
        "-"
    ),

    usuario: String(
      r.usuario ??
        r.nombre_usuario ??
        fallback.usuario ??
        fallback.nombre_usuario ??
        "-"
    ),

    dni: String(r.dni ?? fallback.dni ?? "-"),
    celular: String(r.celular ?? "-"),

    // ✅ que el modal reciba foto_ruta
    foto_ruta:
      (r.foto_ruta ??
        r.foto_perfil ??
        r.foto ??
        null) as string | null,
  };
};

export const mapUsuarioTablaToModal = (user: UsuarioSistema): UsuarioApp => ({
  id: user.id,
  nombre: String(user.nombres || user.nombre || user.usuario || user.nombre_usuario || "-"),
  cargo: String(user.rol || "-"),
  usuario: String(user.usuario || user.nombre_usuario || "-"),
  dni: String(user.dni || "-"),
  celular: "-",
  foto_ruta: null,
});
