const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Ruta para registrar usuario
router.post("/register", authController.register);

// Ruta para el login de usuarios
router.post("/login", authController.login);

// Ruta para la solicitud de restablecimiento de contraseña
router.post("/forgot-password", authController.forgotPassword);

// Ruta para restablecer la contraseña
router.post("/reset-password", authController.resetPassword);

router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error al destruir la sesión:', err);
        return res.status(500).json({ message: 'Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid'); // Asegúrate de limpiar la cookie de la sesión
      return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
  } else {
    return res.status(400).json({ message: 'No hay sesión activa' });
  }
});


module.exports = router;
