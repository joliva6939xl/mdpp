import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4000/api";

type Zona = "NORTE" | "CENTRO" | "SUR";

type ConteoFila = {
  usuario: string;
  zona: Zona;
  cantidad: number;
};

type ConteoResponse = {
  ok: boolean;
  data: ConteoFila[];
  message?: string;
};

type Columna = {
  zona: Zona;
  items: { usuario: string; cantidad: number }[];
  total: number;
};

export default function Count() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConteoFila[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(`${API_BASE}/callcenter/conteo`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const json = (await resp.json()) as ConteoResponse;

        if (!alive) {
          return;
        }

        if (!resp.ok || !json.ok) {
          setError(json.message || "No se pudo obtener el conteo.");
          setRows([]);
        } else {
          setRows(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!alive) {
          return;
        }
        setError("Error de conexión con el servidor.");
        setRows([]);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, []);

  const columnas = useMemo<Columna[]>(() => {
    const zonas: Zona[] = ["NORTE", "CENTRO", "SUR"];

    const byZona: Record<Zona, { usuario: string; cantidad: number }[]> = {
      NORTE: [],
      CENTRO: [],
      SUR: [],
    };

    for (const r of rows) {
      if (r.zona === "NORTE" || r.zona === "CENTRO" || r.zona === "SUR") {
        byZona[r.zona].push({
          usuario: r.usuario,
          cantidad: Number(r.cantidad) || 0,
        });
      }
    }

    zonas.forEach((z) => {
      byZona[z].sort((a, b) => {
        if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
        return a.usuario.localeCompare(b.usuario);
      });
    });

    return zonas.map((z) => ({
      zona: z,
      items: byZona[z],
      total: byZona[z].reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0),
    }));
  }, [rows]);

  const totalGeneral = useMemo(() => {
    return columnas.reduce((acc, c) => acc + c.total, 0);
  }, [columnas]);

  return (
    <div style={{ padding: 22 }}>
      <h2 style={{ textAlign: "center", marginTop: 0 }}>
        CONTEO DE PARTES (CALL CENTER)
      </h2>

      {loading && <p style={{ textAlign: "center" }}>Cargando conteo...</p>}

      {!loading && error && (
        <p style={{ textAlign: "center", color: "crimson" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
              gap: 18,
              alignItems: "start",
              marginTop: 18,
            }}
          >
            {columnas.map((col) => (
              <div key={col.zona}>
                <div
                  style={{
                    border: "2px solid #d00",
                    borderRadius: 10,
                    minHeight: 360,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    {col.zona}
                  </div>

                  {col.items.length === 0 ? (
                    <div style={{ color: "#666" }}>Sin registros</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {col.items.map((it) => (
                        <div
                          key={`${col.zona}-${it.usuario}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px dashed rgba(0,0,0,.12)",
                            paddingBottom: 6,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{it.usuario}</span>
                          <span>{it.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: 10,
                    color: "#d00",
                    fontWeight: 700,
                  }}
                >
                  TOTAL {col.zona}: {col.total}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 30,
              textAlign: "center",
              color: "#d00",
              fontWeight: 800,
            }}
          >
            TOTAL PARTES EN LAS 3 ZONAS: {totalGeneral}
          </div>
        </>
      )}
    </div>
  );
}
