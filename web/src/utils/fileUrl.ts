const DEFAULT_BASE_URL = "http://localhost:4000";

// Normaliza rutas para imágenes / videos
export const getFotoUrl = (ruta: string, baseUrl: string = DEFAULT_BASE_URL) => {
  if (!ruta) return "";

  const normalized = String(ruta).replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("uploads/")) {
    return `${baseUrl}/${normalized}`;
  }

  return `${baseUrl}/uploads/${normalized}`;
};
