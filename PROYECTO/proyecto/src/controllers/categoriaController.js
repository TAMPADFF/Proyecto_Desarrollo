const Categoria = require('../models/categoria');

// Crear una nueva categoría
exports.crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion, porcentaje_avaluo } = req.body;
        const nuevaCategoria = new Categoria({ nombre, descripcion, porcentaje_avaluo });
        await nuevaCategoria.save();
        res.status(201).json({ message: 'Categoría creada exitosamente', categoria: nuevaCategoria });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la categoría' });
    }
};

// Obtener todas las categorías
exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las categorías' });
    }
};

// Actualizar una categoría
exports.actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, porcentaje_avaluo } = req.body;

        const categoriaActualizada = await Categoria.findByIdAndUpdate(
            id,
            { nombre, descripcion, porcentaje_avaluo },
            { new: true }
        );

        if (!categoriaActualizada) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        res.status(200).json({ message: 'Categoría actualizada correctamente', categoria: categoriaActualizada });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
};

// Eliminar una categoría
exports.eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoriaEliminada = await Categoria.findByIdAndDelete(id);

        if (!categoriaEliminada) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la categoría' });
    }
};
