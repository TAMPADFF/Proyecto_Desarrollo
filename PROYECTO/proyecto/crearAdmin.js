// crearAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("./src/models/usuario");

async function crearAdmin() {
  try {
    // Conexión a MongoDB usando la URI del archivo .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Conectado correctamente a MongoDB");

    // Verificar si ya existe un usuario administrador
    const existeAdmin = await Usuario.findOne({ rol: "administrador" });
    if (existeAdmin) {
      console.log("⚠️ Ya existe un usuario administrador registrado:");
      console.log(`   Correo: ${existeAdmin.correo}`);
      return mongoose.disconnect();
    }

    // Crear contraseña encriptada
    const passwordHash = await bcrypt.hash("admin123", 10);

    // Crear usuario administrador
    const admin = new Usuario({
      nombre: "Administrador General",
      correo: "admin@empeno.com",
      telefono: "555-0000",
      direccion: "Oficina Central",
      clave: passwordHash,
      rol: "administrador",
    });

    await admin.save();
    console.log("✅ Usuario administrador creado con éxito");
    console.log("-----------------------------------------");
    console.log("Correo: admin@empeno.com");
    console.log("Contraseña: admin123");
    console.log("Rol: administrador");
  } catch (error) {
    console.error("❌ Error al crear el administrador:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

crearAdmin();
