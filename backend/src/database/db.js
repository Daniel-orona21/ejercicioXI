const mysql = require('mysql2');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'factores_riesgo_psicosocial',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise(); 