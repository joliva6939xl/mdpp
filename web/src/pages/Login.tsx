import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:4000/api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    if (!usuario || !contrasena) {
      alert("Por favor, ingresa el usuario y la contraseña.");
      setCargando(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: usuario,
          password: contrasena,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        usuario?: { id: number; nombre: string; rol: string };
      };

      if (!response.ok || data.ok === false) {
        alert(`Error de Login: ${data.message || "Credenciales inválidas."}`);
        return;
      }

      // ✅ SIN TOKEN: guardamos solo datos mínimos
      localStorage.removeItem("adminToken"); // por si quedó de antes
      localStorage.setItem("adminUser", data.usuario?.nombre || "ADMIN");
      localStorage.setItem("adminRole", data.usuario?.rol || "ADMIN");
      localStorage.setItem("adminId", String(data.usuario?.id || ""));

      navigate("/perfil", {
        replace: true,
        state: { username: data.usuario?.nombre || "ADMIN" },
      });
    } catch (error) {
      console.error("Error de conexión con la API:", error);
      alert(
        "No se pudo conectar con el servidor. Asegúrate que el backend esté en el puerto 4000."
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
    },
    card: {
      padding: "40px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      width: "350px",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    title: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#003366",
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
      marginTop: "10px",
      width: "100%",
    },
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h2 style={styles.title}>INICIAR SESIÓN MDPP</h2>

        <input
          type="text"
          placeholder="Usuario (ADMIN)"
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
