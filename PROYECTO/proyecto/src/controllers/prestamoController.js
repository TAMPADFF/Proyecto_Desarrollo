const Prestamo = require("../models/prestamo");
const path = require("path");

// Crear una solicitud de préstamo
exports.crearSolicitud = async (req, res) => {
  try {
    const { categoria, descripcion, valor_propuesto, tiempo } = req.body;

    const fotos =
      req.files && req.files["fotos"] ? req.files["fotos"][0].path : null;
    const documento_tecnico =
      req.files && req.files["documento_tecnico"]
        ? req.files["documento_tecnico"][0].path
        : null;

    // Verificar si la sesión está disponible
    if (!req.session || !req.session.userCorreo) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Crear una nueva solicitud de préstamo con el correo del usuario
    const prestamo = new Prestamo({
      categoria,
      descripcion,
      valor_propuesto: parseInt(valor_propuesto),
      tiempo,
      fotos,
      documento_tecnico,
      usuario: req.session.userCorreo, // Usar el correo del usuario desde la sesión
    });

    await prestamo.save();
    res.status(201).json({ message: "Solicitud creada exitosamente" });
  } catch (err) {
    console.log("Error al procesar la solicitud:", err);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

// Obtener productos en venta (filtro por estado)
exports.obtenerProductosEnVenta = async (req, res) => {
  try {
    const productos = await Producto.find({ estado: 'en venta' });
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos en venta:', error);
    res.status(500).json({ message: 'Error al obtener productos en venta' });
  }
};


// Obtener los detalles de una solicitud por su ID
exports.obtenerDetallesSolicitud = async (req, res) => {
  try {
    const prestamoId = req.params.id;
    const prestamo = await Prestamo.findById(prestamoId);

    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    res.status(200).json(prestamo);
  } catch (err) {
    console.log('Error al obtener los detalles del préstamo:', err);
    res.status(500).json({ message: 'Error al obtener los detalles del préstamo' });
  }
};

// Obtener todas las solicitudes
exports.obtenerSolicitudes = async (req, res) => {
  try {
    const prestamos = await Prestamo.find();
    res.status(200).json(prestamos);
  } catch (err) {
    console.log('Error al obtener las solicitudes:', err);
    res.status(500).json({ message: 'Error al obtener las solicitudes' });
  }
};

// Obtener préstamos por usuario (correo en sesión) y que estén aprobados y pendientes
exports.obtenerPrestamosPorUsuario = async (req, res) => {
  try {
    const userCorreo = req.session.userCorreo;
    console.log('userCorreo en sesión:', userCorreo);

    const prestamos = await Prestamo.find({ 
      usuario: userCorreo, 
      estado: 'aprobado', // Filtrar solo los aprobados
      valor_total: { $gt: 0 }, // Solo mostrar préstamos con un valor total mayor que 0
      numero_cuotas: { $gt: 0 }, // Mostrar préstamos con cuotas pendientes
      pendientes: { $gt: 0 } // Mostrar aquellos con pagos pendientes
    });

    if (!prestamos || prestamos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron préstamos para este usuario' });
    }

    res.status(200).json(prestamos);
  } catch (error) {
    console.error('Error al obtener los detalles de los préstamos:', error);
    res.status(500).json({ message: 'Error al obtener los detalles de los préstamos' });
  }
};


// Controlador para validar el pago de una cuota
exports.validarPago = async (req, res) => {
  try {
    const { prestamoId, monto } = req.body;

    // Buscar el préstamo por su ID
    const prestamo = await Prestamo.findById(prestamoId);

    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // Verificar que el monto pagado es igual o mayor al valor de la cuota
    if (monto < prestamo.valor_cuota) {
      return res.status(400).json({ message: 'El monto es menor al valor de la cuota' });
    }

    // Reducir el valor total y el número de cuotas restantes
    prestamo.valor_total -= monto; // Restar el monto pagado al valor total
    prestamo.numero_cuotas -= 1; // Reducir el número de cuotas restantes

    // Si el número de cuotas es 0 o el valor total es <= 0, el préstamo está pagado
    if (prestamo.numero_cuotas <= 0 || prestamo.valor_total <= 0) {
      prestamo.estado = 'pagado'; // Cambiar el estado a "pagado"
      prestamo.valor_total = 0; // Asegurarse de que el valor total no sea negativo
    }

    // Guardar los cambios en la base de datos
    await prestamo.save();

    res.status(200).json({ message: 'Pago realizado con éxito', prestamo });
  } catch (error) {
    console.error('Error al validar el pago:', error);
    res.status(500).json({ message: 'Error al validar el pago' });
  }
};


// Actualizar estado del producto a "vendido"
exports.comprarProducto = async (req, res) => {
  try {
    const productoId = req.params.id;

    // Buscar el producto por su ID
    const producto = await Producto.findById(productoId);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Cambiar el estado del producto a 'vendido'
    producto.estado = 'vendido';
    await producto.save();

    res.status(200).json({ message: 'Producto comprado con éxito' });
  } catch (error) {
    console.error('Error al comprar el producto:', error);
    res.status(500).json({ message: 'Error al comprar el producto' });
  }
};

exports.aprobarSolicitud = async (req, res) => {
  try {
      const { id } = req.params;
      const { valorEvaluado, porcentajeAvaluo, numeroCuotas } = req.body;

      // Encontrar la solicitud por su ID
      const prestamo = await Prestamo.findById(id);
      if (!prestamo) {
          return res.status(404).json({ message: 'Préstamo no encontrado' });
      }

      // Conversión de valores
      const valor_evaluado = parseFloat(valorEvaluado);
      const porcentaje_avaluo = parseFloat(porcentajeAvaluo);
      const numero_cuotas = parseInt(numeroCuotas);

      // Cálculo de valor_total y valor_cuota
      const valor_total = (valor_evaluado * (porcentaje_avaluo / 100)) + valor_evaluado;
      const valor_cuota = valor_total / numero_cuotas;

      // Actualizar los campos en la base de datos
      prestamo.valor_evaluado = valor_evaluado;
      prestamo.porcentaje_avaluo = porcentaje_avaluo;
      prestamo.valor_total = valor_total;
      prestamo.numero_cuotas = numero_cuotas;
      prestamo.valor_cuota = valor_cuota;
      prestamo.estado = 'aprobado';

      // Guardar los cambios en la base de datos
      await prestamo.save();

      res.status(200).json({ message: 'Solicitud aprobada', valorCuota: valor_cuota, valorTotal: valor_total });
      console.log({ valor_total, valor_cuota });

  } catch (error) {
      console.error('Error al aprobar la solicitud:', error);
      res.status(500).json({ message: 'Error al aprobar la solicitud' });
  }
};

exports.recuperarObjeto = async (req, res) => {
  try {
    const prestamoId = req.params.id;

    // Buscar el préstamo y verificar si es recuperable
    const prestamo = await Prestamo.findById(prestamoId);
    if (!prestamo) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

    if (prestamo.valor_total > 0 || prestamo.estado !== "aprobado") {
      return res.status(400).json({ message: "Este préstamo no es elegible para recuperación." });
    }

    // Cambiar el estado a "recuperado"
    prestamo.estado = "recuperado";
    await prestamo.save();

    res.status(200).json({ message: "Objeto recuperado exitosamente." });
  } catch (error) {
    console.error("Error al recuperar el objeto:", error);
    res.status(500).json({ message: "Error al recuperar el objeto." });
  }
};

// Importar el modelo Producto
const Producto = require('../models/producto');

// Función para mover préstamos vencidos a la tabla de productos en venta
exports.verificarPrestamosVencidos = async (req, res) => {
  try {
    const prestamosVencidos = await Prestamo.find({
      tiempo: { $lte: 0 }, // Filtrar préstamos cuyo tiempo sea 0 o menos
      valor_total: { $gt: 0 }, // Filtrar aquellos con deuda pendiente
      estado: 'aprobado' // Solo los préstamos aprobados
    });

    if (prestamosVencidos.length === 0) {
      return res.status(200).json({ message: "No hay préstamos vencidos con deuda pendiente." });
    }

    // Mover cada préstamo vencido a la tabla de productos en venta
    for (const prestamo of prestamosVencidos) {
      const nuevoProducto = new Producto({
        descripcion: prestamo.descripcion,
        categoria: prestamo.categoria,
        foto: prestamo.fotos,
        precio: prestamo.valor_total,
        estado: 'en venta'
      });

      await nuevoProducto.save();
      prestamo.estado = 'vendido'; // Actualizar el estado del préstamo a "vendido"
      await prestamo.save();
    }

    res.status(200).json({ message: "Préstamos vencidos movidos a productos en venta correctamente." });
  } catch (error) {
    console.error('Error al mover préstamos vencidos:', error);
    res.status(500).json({ message: 'Error al mover préstamos vencidos.' });
  }
};

















