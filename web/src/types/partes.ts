export interface ParteArchivo {
  id: number;
  tipo: "foto" | "video";
  ruta: string;
  nombre_original: string;
}

export interface RawArchivoParte {
  id?: number;
  tipo?: string;
  tipo_archivo?: string;
  tipo_media?: string;
  ruta?: string;
  ruta_archivo?: string;
  path?: string;
  url?: string;
  filepath?: string;
  nombre_original?: string;
  nombre?: string;
  filename?: string;
  originalname?: string;
}

export interface ParteVirtual {
  id: number;
  usuario_id: number;

  // Campos base
  sector?: string;
  parte_fisico?: string;
  zona?: string;
  turno?: string;
  tipo?: string;
  descripcion?: string;
  ubicacion_exacta?: string;
  hora_inicio?: string;
  hora_fin?: string;
  unidad_tipo?: string;
  unidad_numero?: string;
  placa?: string;
  estado?: string;
  creado_en?: string;

  // Campos extra que usa la app
  fecha?: string;
  lugar?: string;
  conductor?: string;
  dni_conductor?: string;

  // Campos reales en tu BD/API
  sumilla?: string; // Incidencia
  asunto?: string;  // Origen de atención

  // Incidencia (otros nombres posibles)
  incidencia?: string;
  incidencia_nombre?: string;
  incidencia_detalle?: string;

  // Origen de atención (otros nombres posibles)
  origen_atencion?: string;
  origenAtencion?: string;
  origen_atencion_nombre?: string;

  ocurrencia?: string;

  // Supervisores (dos nombres posibles)
  supervisor_zonal?: string;
  supervisor_general?: string;
  sup_zonal?: string;
  sup_general?: string;

  fotos?: ParteArchivo[];
  videos?: ParteArchivo[];
}
