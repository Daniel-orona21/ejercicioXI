const db = require('../config/db.config');

class User {
  static async create(userData) {
    const { nombre, email, password } = userData;
    const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [nombre, email, password], (error, results) => {
        if (error) reject(error);
        resolve(results.insertId);
      });
    });
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [email], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });
  }
}

module.exports = User; 