// Archivo: mdpp/web/src/main.tsx (Verifica que se vea así)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Si tu proyecto usa un archivo CSS global

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);