// Archivo: src/index.js
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor MDPP API escuchando en http://localhost:${PORT}`);
});
