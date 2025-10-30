const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    },
    porcentaje_avaluo: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Categoria', categoriaSchema);
