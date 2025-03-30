const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'factores_riesgo_psicosocial'
});

connection.connect(error => {
  if (error) throw error;
  console.log('Conexión exitosa a la base de datos MySQL.');
});

module.exports = connection; 