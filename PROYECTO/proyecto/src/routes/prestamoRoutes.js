const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Prestamo = require("../models/prestamo");
const prestamoController = require('../controllers/prestamoController');

// Configurar multer para el manejo de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Especificar el directorio donde guardar los archivos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generar un nombre único para cada archivo
  },
});

const upload = multer({ storage: storage });

// Definir los campos esperados por multer
const uploadFields = upload.fields([
  { name: "fotos", maxCount: 1 }, // Solo una foto
  { name: "documento_tecnico", maxCount: 1 }, // Solo un archivo para documento técnico
]);

// Ruta para manejar la solicitud de préstamo
router.post("/solicitud-prestamo", uploadFields, async (req, res) => {
  try {
    console.log("Datos recibidos en el body:", req.body);
    console.log("Archivos recibidos:", req.files);

    // Verificar si la sesión está disponible y contiene el correo del usuario
    if (!req.session || !req.session.userCorreo) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { categoria, descripcion, valor_propuesto, tiempo } = req.body;
    const fotos =
      req.files && req.files["fotos"] ? req.files["fotos"][0].path : null;
    const documento_tecnico =
      req.files && req.files["documento_tecnico"]
        ? req.files["documento_tecnico"][0].path
        : null;

    // Crear un nuevo préstamo con el correo del usuario
    const prestamo = new Prestamo({
      categoria,
      descripcion,
      valor_propuesto: parseInt(valor_propuesto),
      tiempo,
      fotos,
      documento_tecnico,
      usuario: req.session.userCorreo, // Asegurarse de pasar el correo del usuario desde la sesión
    });

    console.log("Prestamo a guardar:", prestamo);

    // Guardar en MongoDB
    await prestamo.save();
    console.log("Prestamo guardado correctamente en MongoDB");

    res.status(201).json({ message: "Solicitud creada exitosamente" }); // Respuesta en JSON
  } catch (err) {
    console.log("Error al procesar la solicitud:", err);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

router.get("/solicitudes", async (req, res) => {
  try {
    const usuarioCorreo = req.session.userCorreo;

    if (!usuarioCorreo) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const prestamos = await Prestamo.find({ usuario: usuarioCorreo });

    res.status(200).json(prestamos);
  } catch (err) {
    console.log("Error al obtener las solicitudes:", err);
    res.status(500).json({ message: "Error al obtener las solicitudes" });
  }
});

// Ruta para obtener solicitudes pendientes de evaluación
router.get("/solicitudes-pendientes", async (req, res) => {
  try {
    const solicitudesPendientes = await Prestamo.find({ estado: "pendiente" });
    res.status(200).json(solicitudesPendientes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener las solicitudes pendientes" });
  }
});

// Ruta para obtener detalles de una solicitud
router.get("/solicitud-detalle/:id", async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);
    if (!prestamo) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }
    res.status(200).json(prestamo);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener el detalle de la solicitud" });
  }
});

// Ruta para aprobar la solicitud
router.post('/aprobar-solicitud/:id', prestamoController.aprobarSolicitud);

// Ruta para aprobar una solicitud
router.post('/aprobar-solicitud/:id', async (req, res) => {
  try {
    const { valorEvaluado, porcentajeAvaluo, numeroCuotas } = req.body;
    const prestamo = await Prestamo.findById(req.params.id);

    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // Calcular los valores requeridos
    const valorEvaluadoNumerico = parseFloat(valorEvaluado);
    const porcentajeAvaluoNumerico = parseFloat(porcentajeAvaluo);
    const numeroCuotasNumerico = parseInt(numeroCuotas);
    const valorTotal = valorEvaluadoNumerico + (valorEvaluadoNumerico * (porcentajeAvaluoNumerico / 100));
    const valorCuota = valorTotal / numeroCuotasNumerico;

    // Actualizar los campos relevantes
    prestamo.valor_evaluado = valorEvaluadoNumerico;
    prestamo.porcentaje_avaluo = porcentajeAvaluoNumerico;
    prestamo.valor_total = valorTotal;
    prestamo.numero_cuotas = numeroCuotasNumerico;
    prestamo.valor_cuota = valorCuota;
    prestamo.estado = 'aprobado';
    prestamo.fecha_aprobacion = new Date();

    // Preservar el campo `usuario` y demás campos
    await prestamo.save();

    res.status(200).json({ message: 'Solicitud aprobada exitosamente', valorCuota, valorTotal });
  } catch (err) {
    console.error("Error al aprobar la solicitud:", err);
    res.status(500).json({ message: 'Error al aprobar la solicitud' });
  }
});

// Ruta para obtener los productos en venta
router.get('/productos-en-venta', prestamoController.obtenerProductosEnVenta);

// Ruta para obtener los detalles de una solicitud por su ID
router.get('/solicitud-detalle/:id', prestamoController.obtenerDetallesSolicitud);

// Ruta para obtener todas las solicitudes
router.get('/solicitudes', prestamoController.obtenerSolicitudes);

// Ruta para obtener los préstamos del usuario por correo
router.get('/loan-details', async (req, res) => {
  try {
    const userCorreo = req.session.userCorreo;  // Asegúrate de que `userCorreo` esté bien definido
    const prestamos = await Prestamo.find({ usuario: userCorreo, estado: 'aprobado' }); // Filtrar solo los aprobados

    if (!prestamos || prestamos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron préstamos aprobados para este usuario' });
    }

    res.status(200).json(prestamos);  // Enviar solo los préstamos aprobados
  } catch (error) {
    console.error('Error al obtener los préstamos:', error);
    res.status(500).json({ message: 'Error al obtener los préstamos' });
  }
});




// Ruta para rechazar una solicitud
router.post('/rechazar-solicitud/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);

    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // Solo actualizar el campo `estado`
    prestamo.estado = 'rechazado';

    // Preservar el campo `usuario` y demás campos
    await prestamo.save();

    res.status(200).json({ message: 'Solicitud rechazada exitosamente' });
  } catch (err) {
    console.error("Error al rechazar la solicitud:", err);
    res.status(500).json({ message: 'Error al rechazar la solicitud' });
  }
});

router.post('/validar-pago', prestamoController.validarPago);


// Ruta para obtener productos en venta
router.get('/productos-en-venta', prestamoController.obtenerProductosEnVenta);

// Ruta para obtener las categorías
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.find(); // Obtiene todas las categorías
    res.status(200).json(categorias); // Envía las categorías como JSON
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ message: 'Error al obtener las categorías' });
  }
});

// Ruta para comprar un producto (actualizar su estado a "vendido")
router.post('/comprar-producto/:id', prestamoController.comprarProducto);

// Ruta para obtener préstamos con valor_total = 0 y estado "aprobado"
router.get("/prestamos-recuperables", async (req, res) => {
  try {
    const prestamosRecuperables = await Prestamo.find({ valor_total: 0, estado: "aprobado" });
    res.status(200).json(prestamosRecuperables);
  } catch (error) {
    console.error("Error al obtener préstamos recuperables:", error);
    res.status(500).json({ message: "Error al obtener préstamos recuperables" });
  }
});

// Ruta para marcar un préstamo como "recuperado"
router.post("/recuperar-objeto/:id", prestamoController.recuperarObjeto);

// Ruta para verificar y mover los préstamos vencidos a la tabla de productos
router.post('/verificar-prestamos-vencidos', prestamoController.verificarPrestamosVencidos);


module.exports = router;
