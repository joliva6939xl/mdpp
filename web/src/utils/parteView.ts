import type { ParteVirtual } from "../types/partes";

// Incidencia (normalmente viene en sumilla)
export const getIncidenciaMostrada = (
  p: ParteVirtual,
  fallback: string = "-"
) => {
  const val =
    p.sumilla ||
    p.incidencia ||
    p.incidencia_nombre ||
    p.incidencia_detalle ||
    p.tipo ||
    p.descripcion ||
    "";
  return val ? String(val) : fallback;
};

// Origen de atención (normalmente viene en asunto)
export const getOrigenMostrado = (p: ParteVirtual, fallback: string = "-") => {
  const val =
    p.asunto ||
    p.origen_atencion ||
    p.origenAtencion ||
    p.origen_atencion_nombre ||
    "";
  return val ? String(val) : fallback;
};
