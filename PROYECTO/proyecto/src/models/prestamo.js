const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prestamoSchema = new Schema({
    categoria: { type: String, required: true },
    descripcion: { type: String, required: true },
    valor_propuesto: { type: Number, required: true },
    tiempo: { type: String, required: true },
    fotos: String,  
    documento_tecnico: String,
    estado: { type: String, default: 'pendiente' },
    valor_evaluado: Number, 
    porcentaje_avaluo: Number,
    valor_total: Number, // Asegurarse de que el valor_total esté definido
    numero_cuotas: Number,  // Cantidad de cuotas asignadas por el evaluador
    valor_cuota: Number,  // Monto que el cliente debe pagar por cuota
    usuario: { type: String, required: true }
}, { timestamps: true });




module.exports = mongoose.model('Prestamo', prestamoSchema);
