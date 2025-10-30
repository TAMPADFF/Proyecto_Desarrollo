// producto.js (Modelo)
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    categoria: { type: String, required: true },
    foto: { type: String, required: true },
    precio: { type: Number, required: true },
    estado: { type: String, default: 'en venta' }, // Estado puede ser 'en venta', 'vendido', etc.
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', productoSchema);
