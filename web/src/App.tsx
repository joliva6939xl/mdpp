import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Estadistica from "./pages/Estadistica";
import Count from "./pages/Count"; // ✅ NUEVO

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/estadistica" element={<Estadistica />} />

        {/* ✅ NUEVO */}
        <Route path="/count" element={<Count />} />

        <Route
          path="*"
          element={
            <p style={{ textAlign: "center", marginTop: "50px" }}>
              404 | Página no encontrada
            </p>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
