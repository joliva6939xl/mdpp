// Archivo: mdpp/web/src/App.tsx
// REEMPLAZA el contenido actual con este código

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile'; 
import Estadistica from './pages/Estadistica'; // <--- NUEVA IMPORTACIÓN
import Count from "./pages/Count";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta /perfil: Dashboard principal */}
        <Route path="/perfil" element={<Profile />} />
        
        {/* RUTA AÑADIDA: Pantalla de Estadísticas */}
        <Route path="/estadistica" element={<Estadistica />} />
        
        {/* Manejo de rutas no encontradas */}
        <Route path="*" element={<p style={{ textAlign: 'center', marginTop: '50px' }}>404 | Página no encontrada</p>} />
      </Routes>
      <Route path="/count" element={<Count />} />
    </BrowserRouter>
  );
}

export default App;