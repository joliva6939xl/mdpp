// mdpp/web/src/pages/Count.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerConteoIncidencias,
  type ConteoIncidenciasResponse,
} from "../services/callcenterService";

export default function Count() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConteoIncidenciasResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const json = await obtenerConteoIncidencias();
        if (cancelado) return;

        if (!json.ok) {
          setError(json.message || "No se pudo obtener el conteo.");
        }
        setData(json);
      } catch {
        if (!cancelado) setError("Error de conexión.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 10 }}>Conteo (CALL CENTER)</h2>

      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "#f9fafb",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        Volver
      </button>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>
      ) : (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Total general</h3>
            <p style={{ fontSize: 18, fontWeight: 800 }}>
              {data?.total_general ?? 0}
            </p>

            <h3>Incidencias (sumadas en las 3 zonas)</h3>
            {(data?.incidencias_total || []).length === 0 ? (
              <p>Sin registros.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                {(data?.incidencias_total || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "contents",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #e5e7eb",
                      }}
                    >
                      {it.incidencia}
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #e5e7eb",
                        fontWeight: 800,
                        textAlign: "right",
                      }}
                    >
                      {it.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
