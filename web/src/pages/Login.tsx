// Archivo: mdpp/web/src/pages/Login.tsx
// Implementación de la autenticación real contra la API de administradores

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api'; // <--- URL base de tu API

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // Función de login real (async)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    if (!usuario || !contrasena) {
      alert('Por favor, ingresa el usuario y la contraseña.');
      setCargando(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: usuario, // El backend espera 'nombre_usuario'
          password: contrasena,    // El backend espera 'password'
        }),
      });

      const data = await response.json();
      
      if (!response.ok || data.ok === false) {
        // Manejo de errores 404, 401, etc.
        alert(`Error de Login: ${data.message || 'Credenciales inválidas o error de servidor.'}`);
        return;
      }
      
      // *** LOGIN EXITOSO ***
      
      // 1. Guardar Token (para futuras solicitudes autenticadas)
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', data.usuario.nombre);

      console.log(`Login exitoso para: ${data.usuario.nombre}. Token guardado.`);
      
      // 2. Redirigir al perfil, enviando el nombre de usuario
      navigate('/perfil', { 
        replace: true,
        state: { username: data.usuario.nombre }
      }); 

    } catch (error) {
      console.error('Error de conexión con la API:', error);
      alert('No se pudo conectar con el servidor. Revisa la consola y asegúrate que el backend esté corriendo en el puerto 4000.');
    } finally {
      setCargando(false);
    }
  };

  // Definición de estilos
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
    },
    card: {
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      width: '350px',
      display: 'flex',
      flexDirection: 'column', 
      gap: '15px',
    },
    title: {
      textAlign: 'center', 
      marginBottom: '20px',
      color: '#003366',
    },
    input: {
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '16px',
      width: '100%',
      boxSizing: 'border-box',
    },
    button: {
      padding: '10px',
      backgroundColor: cargando ? '#ccc' : '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: cargando ? 'not-allowed' : 'pointer',
      marginTop: '10px',
      width: '100%',
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
          {cargando ? 'INGRESANDO...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}