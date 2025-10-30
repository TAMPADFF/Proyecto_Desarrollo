const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
;

// Registrar un nuevo usuario
exports.register = async (req, res) => {
    try {
        const { nombre, correo, telefono, direccion, clave, confirmPassword, rol } = req.body;

        // Verificar si las contraseñas coinciden
        if (clave !== confirmPassword) {
            return res.status(400).send('Las contraseñas no coinciden.');
        }

        // Verificar que todos los campos están presentes
        if (!nombre || !correo || !telefono || !direccion || !clave) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        // Asignar rol automáticamente si no se especifica (como en register.html)
        const rolAsignado = rol || 'cliente';

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).send('El correo ya está registrado.');
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(clave, 10);

        // Crear el nuevo usuario con el rol asignado
        const nuevoUsuario = new Usuario({
            nombre,
            correo,
            telefono,
            direccion,
            clave: hashedPassword,
            rol: rolAsignado // Guardar el rol (cliente o administrador)
        });

        // Guardar el usuario en la base de datos
        await nuevoUsuario.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error en el registro: ' + error.message);
    }
};





// Controlador para manejar el login
exports.login = async (req, res) => {
    try {
        const { correo, clave } = req.body;

        if (!correo || !clave) {
            return res.status(400).send('Correo y contraseña son obligatorios.');
        }

        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).send('El usuario no existe.');
        }

        const esValido = await bcrypt.compare(clave, usuario.clave);
        if (!esValido) {
            return res.status(400).send('Contraseña incorrecta.');
        }

        // Verificar que req.session esté disponible
        if (!req.session) {
            return res.status(500).json({ message: 'Error con la sesión, no está disponible' });
        }

        // Guardar el correo del usuario en la sesión
        req.session.userCorreo = usuario.correo;

        // Verificar el rol del usuario y redirigir
        let redirectUrl = '/loanform.html'; // Redirigir a loanForm por defecto

        if (usuario.rol === 'administrador') {
            redirectUrl = '/panelAdmin.html'; // Redirigir al panel de administración si es administrador
        }

        res.status(200).json({ message: 'Login exitoso', redirectUrl });
    } catch (error) {
        res.status(500).send('Error en el login: ' + error.message);
    }
};





exports.forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;

        // Verificar si el usuario existe
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ message: 'El correo no está registrado.' });
        }

        // Generar un token de restablecimiento de contraseña
        const resetToken = uuidv4();
        const tokenExpiration = Date.now() + 3600000; // 1 hora de validez

        // Guardar el token y la fecha de expiración en el usuario
        usuario.resetPasswordToken = resetToken;
        usuario.resetPasswordExpires = tokenExpiration;
        await usuario.save();

        // Crear el enlace de restablecimiento
        const resetUrl = `http://localhost:3000/resetPassword.html?token=${resetToken}`;

        // Enviar el enlace en la respuesta en formato JSON para pruebas
        res.status(200).json({ message: 'Enlace de restablecimiento generado.', resetUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error en la solicitud de restablecimiento de contraseña.', error: error.message });
    }
};



// Controlador para manejar el restablecimiento de contraseña
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Buscar el usuario por el token y verificar si el token ha expirado
        const usuarioReset = await Usuario.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Verificar que la fecha de expiración sea futura
        });

        if (!usuarioReset) {
            return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
        }

        // Actualizar la contraseña del usuario
        usuarioReset.clave = await bcrypt.hash(newPassword, 10);
        usuarioReset.resetPasswordToken = undefined; // Eliminar el token para que no se reutilice
        usuarioReset.resetPasswordExpires = undefined; // Eliminar la fecha de expiración
        await usuarioReset.save();

        // Responder con un mensaje de éxito
        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el restablecimiento de contraseña.', error: error.message });
    }
};




