require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const cors = require('cors');
const cron = require('node-cron');

// Importar rutas y controladores
const authRoutes = require('./src/routes/authRoutes');
const prestamoRoutes = require('./src/routes/prestamoRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const Producto = require('./src/models/producto');
const { verificarPrestamosVencidos } = require('./src/controllers/prestamoController');

const app = express();

// ====================================================
// 🌐 Conexión a MongoDB Atlas
// ====================================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// ====================================================
// ⚙️ Middlewares globales
// ====================================================
app.use(cors({
  origin: '*', // o especifica tu frontend si es separado
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'views')));

// ====================================================
// 🔐 Configuración de sesión persistente
// ====================================================
app.use(session({
  secret: process.env.SECRET_KEY || 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: false, // cámbialo a true si Render usa HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// ====================================================
// 📦 Configuración de subida de imágenes con Multer
// ====================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ====================================================
// 🚏 Rutas principales (API)
// ====================================================
app.use('/auth', authRoutes);
app.use('/api', categoriaRoutes);
app.use(prestamoRoutes);

// ====================================================
// 🌐 Rutas de vistas HTML (frontend)
// ====================================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get(['/login', '/login.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get(['/register', '/register.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get(['/loanform', '/loanform.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'loanform.html')));
app.get(['/solicitudes', '/solicitudes.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'solicitudes.html')));
app.get(['/insertar-producto', '/insertar-producto.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'insertar-producto.html')));

// 🔹 NUEVA RUTA para Categorías (corrige tu error)
app.get(['/categorias', '/categorias.html', '/Categorias', '/Categorias.html'], (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'categorias.html'))
);

// ====================================================
// 🛒 Ruta para insertar productos
// ====================================================
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

// ====================================================
// ⏰ Tareas automáticas (cron jobs)
// ====================================================
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Ejecutando verificación de préstamos vencidos...');
  verificarPrestamosVencidos();
});

// ====================================================
// 🚀 Inicializar servidor
// ====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
