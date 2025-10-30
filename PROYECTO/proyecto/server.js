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

require('dotenv').config(); // Cargar variables de entorno desde .env


// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(categoriaRoutes);
app.use('/', categoriaRoutes); // Registrar rutas de categorías
app.use('/api', categoriaRoutes);

// **Configurar la sesión antes de las rutas**
app.use(session({
    secret: 'mi_secreto',  // Cambia esto por un secreto más fuerte
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Asegúrate de que 'secure' sea true si usas HTTPS
}));

// Configuración de Multer para manejar la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo con la fecha actual
  }
});

app.use(cors());
const upload = multer({ storage });

// Configurar rutas
app.use('/auth', authRoutes);
app.use(express.static('views'));
app.use(prestamoRoutes);

// Manejar rutas principales
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/loanform.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'loanform.html')));
app.get('/solicitudes.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'solicitudes.html')));

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

// Ruta para insertar productos en venta
app.post('/insertar-producto', upload.single('foto'), async (req, res) => {
  try {
    const { descripcion, categoria, precio } = req.body;
    const foto = `/uploads/${req.file.filename}`;

    const nuevoProducto = new Producto({
      descripcion,
      categoria,
      foto,
      precio,
      estado: 'en venta' // Estado del producto
    });

    await nuevoProducto.save();
    res.status(200).json({ message: 'Producto insertado correctamente' });
  } catch (error) {
    console.error('Error al insertar producto:', error);
    res.status(500).json({ message: 'Error al insertar el producto' });
  }
});

// Ejecutar la verificación de préstamos vencidos cada día a medianoche
cron.schedule('0 0 * * *', () => {
  console.log('Ejecutando verificación de préstamos vencidos...');
  verificarPrestamosVencidos(); // Puedes llamarlo sin req/res si lo haces directamente
});

// Servir la carpeta 'uploads' donde se guardarán las fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir el formulario en '/insertar-producto.html'
app.get('/insertar-producto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'insertar-producto.html'));
});