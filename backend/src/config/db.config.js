const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'factores_riesgo_psicosocial',
  // Configuración para evitar truncamiento de datos
  typeCast: function (field, next) {
    // Para campos de texto, asegurar que no se trunquen
    if (field.type === 'TEXT' || field.type === 'VARCHAR') {
      return field.string();
    }
    return next();
  },
  // Aumentar el tiempo de espera para consultas grandes
  connectTimeout: 60000,
  // Establecer el tamaño del buffer para evitar truncamientos
  namedPlaceholders: true
});

connection.connect(error => {
  if (error) throw error;
  console.log('Conexión exitosa a la base de datos MySQL.');
});

module.exports = connection; 