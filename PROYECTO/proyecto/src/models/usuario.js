const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    clave: { type: String, required: true },
    rol: { type: String, default: 'cliente' }, // Rol predeterminado como cliente
    resetPasswordToken: { type: String, default: null }, // Token de restablecimiento de contraseña
    resetPasswordExpires: { type: Date, default: null } // Fecha de caducidad del token (opcional)
});

module.exports = mongoose.model('Usuario', usuarioSchema);

