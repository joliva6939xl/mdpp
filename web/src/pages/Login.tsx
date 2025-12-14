// Archivo: mdpp/web/src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:4000/api";

type LoginResponse = {
  ok?: boolean;
  message?: string;
  token?: string;
  usuario?: Record<string, unknown>;
  user?: Record<string, unknown>;
  admin?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

function pickUserName(raw: Record<string, unknown> | null, fallback: string) {
  if (!raw) return fallback;

  const nombre =
    (raw["nombre"] as string | undefined) ||
    (raw["nombres"] as string | undefined) ||
    (raw["nombre_usuario"] as string | undefined) ||
    (raw["usuario"] as string | undefined);

  return (typeof nombre === "string" && nombre.trim().length > 0)
    ? nombre.trim()
    : fallback;
}

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCargando(true);

    if (!usuario.trim() || !contrasena.trim()) {
      setErrorMsg("Por favor, ingresa el usuario y la contraseña.");
      setCargando(false);
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: usuario.trim(),
          password: contrasena.trim(),
        }),
      });

      const data = (await resp.json()) as LoginResponse;

      if (!resp.ok || data.ok === false) {
        setErrorMsg(data.message || "Credenciales inválidas o error de servidor.");
        return;
      }

      // ✅ Soporta cualquier forma: usuario / user / admin / data
      const rawUser =
        (data.usuario ?? data.user ?? data.admin ?? data.data ?? null) as
          | Record<string, unknown>
          | null;

      const nombreMostrado = pickUserName(rawUser, usuario.trim());

      // ✅ Token opcional (si viene lo guardamos, si no, lo limpiamos)
      if (typeof data.token === "string" && data.token.trim().length > 0) {
        localStorage.setItem("adminToken", data.token);
      } else {
        localStorage.removeItem("adminToken");
      }

      // ✅ Guardamos el nombre para mostrar en el panel
      localStorage.setItem("adminUser", nombreMostrado);

      // ✅ Navegación correcta
      navigate("/perfil", {
        replace: true,
        state: { username: nombreMostrado },
      });
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(
        "No se pudo conectar con el servidor. Verifica que la API esté corriendo en el puerto 4000."
      );
    } finally {
      setCargando(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      padding: "16px",
    },
    card: {
      padding: "40px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      width: "360px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    },
    title: {
      textAlign: "center",
      marginBottom: "10px",
      color: "#003366",
    },
    error: {
      background: "#ffe9ea",
      border: "1px solid #ffb3b7",
      color: "#b00020",
      padding: "10px",
      borderRadius: "6px",
      fontSize: "14px",
    },
    input: {
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "16px",
      width: "100%",
      boxSizing: "border-box",
    },
    button: {
      padding: "10px",
      backgroundColor: cargando ? "#ccc" : "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: "16px",
      cursor: cargando ? "not-allowed" : "pointer",
      marginTop: "6px",
      width: "100%",
    },
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h2 style={styles.title}>INICIAR SESIÓN MDPP</h2>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          disabled={cargando}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          disabled={cargando}
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={cargando}>
          {cargando ? "INGRESANDO..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
