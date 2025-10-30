// crearUsuario.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("./src/models/usuario");

async function crearUsuario() {
  try {
    // Conexión a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Conectado correctamente a MongoDB Atlas");

    // Datos del nuevo usuario
    const nombre = "Juan Pérez";
    const correo = "cliente@correo.com";
    const telefono = "555-1234";
    const direccion = "Zona 1, Ciudad de Guatemala";
    const clavePlano = "12345";
    const rol = "cliente"; // Rol de usuario normal

    // Verificar si ya existe un usuario con ese correo
    const existeUsuario = await Usuario.findOne({ correo });
    if (existeUsuario) {
      console.log("⚠️ Ya existe un usuario con ese correo:");
      console.log(`   Correo: ${existeUsuario.correo}`);
      return mongoose.disconnect();
    }

    // Encriptar la contraseña
    const passwordHash = await bcrypt.hash(clavePlano, 10);

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      telefono,
      direccion,
      clave: passwordHash,
      rol,
    });

    // Guardar en la base de datos
    await nuevoUsuario.save();

    console.log("✅ Usuario creado exitosamente");
    console.log("---------------------------------");
    console.log(`Nombre: ${nombre}`);
    console.log(`Correo: ${correo}`);
    console.log(`Contraseña: ${clavePlano}`);
    console.log(`Rol: ${rol}`);
  } catch (error) {
    console.error("❌ Error al crear el usuario:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

crearUsuario();
