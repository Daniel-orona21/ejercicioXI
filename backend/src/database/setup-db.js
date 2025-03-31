const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'factores_riesgo_psicosocial',
  multipleStatements: true // Importante para ejecutar múltiples sentencias SQL
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conectado a la base de datos MySQL.');
  
  // Leer el archivo SQL
  const sqlFilePath = path.join(__dirname, 'cuestionarios.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Ejecutar el script SQL
  connection.query(sqlScript, (err, results) => {
    if (err) {
      console.error('Error al ejecutar el script SQL:', err);
      process.exit(1);
    }
    
    console.log('Tablas y datos creados exitosamente.');
    
    // Cerrar la conexión
    connection.end((err) => {
      if (err) {
        console.error('Error al cerrar la conexión:', err);
        process.exit(1);
      }
      console.log('Conexión cerrada.');
      process.exit(0);
    });
  });
}); 