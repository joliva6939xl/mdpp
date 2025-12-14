// mdpp/web/src/services/callcenterService.ts
const BASE_URL = "http://localhost:4000";

export type ZonaMacro = "NORTE" | "CENTRO" | "SUR" | "OTROS";

export interface IncidenciaConteo {
  incidencia: string;
  total: number;
}

export interface ZonaConteo {
  total: number;
  incidencias: IncidenciaConteo[];
}

export interface ConteoIncidenciasResponse {
  ok: boolean;
  total_general: number;
  zonas: Record<ZonaMacro, ZonaConteo>;
  incidencias_total: IncidenciaConteo[];
  message?: string;
}

export async function obtenerConteoIncidencias(): Promise<ConteoIncidenciasResponse> {
  const resp = await fetch(`${BASE_URL}/api/callcenter/conteo-incidencias`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await resp.json()) as ConteoIncidenciasResponse;

  if (!resp.ok) {
    return {
      ok: false,
      total_general: 0,
      zonas: {
        NORTE: { total: 0, incidencias: [] },
        CENTRO: { total: 0, incidencias: [] },
        SUR: { total: 0, incidencias: [] },
        OTROS: { total: 0, incidencias: [] },
      },
      incidencias_total: [],
      message: json?.message || "Error en conteo.",
    };
  }

  return json;
}
