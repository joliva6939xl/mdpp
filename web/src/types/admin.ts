export type TipoTablaUsuario = "APP" | "ADMIN";

export interface UsuarioSistema {
  id: number;
  nombre_usuario?: string;
  rol?: string;
  nombres?: string;
  dni?: string;
  creado_en?: string;
  usuario?: string;
  nombre?: string;
  tipo_tabla: TipoTablaUsuario;
  estado?: string;
  bloqueo_motivo?: string;
}

export interface UserDetails extends UsuarioSistema {
  celular?: string;
  cargo?: string;
  direccion?: string;
  correo?: string;

  // Distintos nombres que pueden venir del backend
  foto_ruta?: string;
  foto?: string;
  fotoPerfil?: string;
  foto_perfil?: string;
}
