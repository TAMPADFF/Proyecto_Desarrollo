require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("./src/models/usuario");

async function crearAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Conectado a MongoDB Atlas");

    // Verifica si ya existe
    const existe = await Usuario.findOne({ correo: "admin@admin.com" });
    if (existe) {
      console.log("⚠️ Ya existe el usuario administrador");
      return process.exit();
    }

    const hash = await bcrypt.hash("54321", 10);
    const nuevo = new Usuario({
      nombre: "Administrador General",
      correo: "admin@admin.com",
      telefono: "555-0000",
      direccion: "Oficina Central",
      clave: hash,
      rol: "administrador"
    });

    await nuevo.save();
    console.log("✅ Admin creado correctamente");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

crearAdmin();
