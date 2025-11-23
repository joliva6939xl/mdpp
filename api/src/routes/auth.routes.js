const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  loginUsuario,
} = require("../controllers/auth.controller");

const { userPhotoUpload } = require("../middlewares/upload.middleware");

router.post(
  "/register",
  userPhotoUpload.single("foto"),
  registrarUsuario
);

router.post("/login", loginUsuario);

module.exports = router;
