require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const prestamoRoutes = require('./src/routes/prestamoRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const Producto = require('./src/models/producto');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const cors = require('cors');
const cron = require('node-cron');
const { verificarPrestamosVencidos } = require('./src/controllers/prestamoController');

const app = express();

// ================================
// 🌐 Conexión a MongoDB Atlas
// ================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// ================================
// ⚙️ Middlewares base
// ================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
  origin: '*', // o reemplaza con tu dominio de Netlify si lo usas
}));

// Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================================
// 🧠 Configurar sesión persistente en MongoDB Atlas
// ================================
app.use(session({
  secret: process.env.SECRET_KEY || 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: false, // Cambia a true si usas HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// ================================
// 📦 Configuración de Multer para subir imágenes
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ================================
// 🚏 Rutas principales
// ================================
app.use('/auth', authRoutes);
app.use('/api', categoriaRoutes);
app.use(prestamoRoutes);

// Rutas para vistas HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/loanform.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'loanform.html')));
app.get('/solicitudes.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'solicitudes.html')));
app.get('/insertar-producto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'insertar-producto.html'));
});

// ================================
// 🛒 Ruta para insertar productos
// ================================
app.post('/insertar-producto', upload.single('foto'), async (req, res) => {
  try {
    const { descripcion, categoria, precio } = req.body;
    const foto = `/uploads/${req.file.filename}`;

    const nuevoProducto = new Producto({
      descripcion,
      categoria,
      foto,
      precio,
      estado: 'en venta'
    });

    await nuevoProducto.save();
    res.status(200).json({ message: '✅ Producto insertado correctamente' });
  } catch (error) {
    console.error('❌ Error al insertar producto:', error);
    res.status(500).json({ message: 'Error al insertar el producto' });
  }
});

// ================================
// ⏰ Tarea programada diaria
// ================================
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Ejecutando verificación de préstamos vencidos...');
  verificarPrestamosVencidos();
});

// ================================
// 🚀 Inicializar servidor
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
