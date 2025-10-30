const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Crear una categoría
router.post('/categorias', categoriaController.crearCategoria);

// Obtener todas las categorías
router.get('/categorias', categoriaController.obtenerCategorias);

// Actualizar una categoría
router.put('/categorias/:id', categoriaController.actualizarCategoria);

// Eliminar una categoría
router.delete('/categorias/:id', categoriaController.eliminarCategoria);

module.exports = router;
