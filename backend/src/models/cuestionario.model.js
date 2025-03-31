const db = require('../config/db.config');

class Cuestionario {
  static async getAll() {
    const query = 'SELECT * FROM cuestionarios';
    return new Promise((resolve, reject) => {
      db.query(query, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  static async getById(id) {
    const query = 'SELECT * FROM cuestionarios WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [id], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });
  }

  static async getByCodigo(codigo) {
    const query = 'SELECT * FROM cuestionarios WHERE codigo = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [codigo], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });
  }

  static async getWithQuestions(id) {
    const queryCuestionario = 'SELECT * FROM cuestionarios WHERE id = ?';
    const queryPreguntas = 'SELECT * FROM preguntas WHERE cuestionario_id = ? ORDER BY orden ASC';
    
    return new Promise((resolve, reject) => {
      db.query(queryCuestionario, [id], (error, cuestionarioResults) => {
        if (error) reject(error);
        if (cuestionarioResults.length === 0) resolve(null);

        const cuestionario = cuestionarioResults[0];
        
        db.query(queryPreguntas, [id], (error, preguntasResults) => {
          if (error) reject(error);
          
          cuestionario.preguntas = preguntasResults.map(pregunta => {
            // Convertir opciones de JSON a objeto JS si existen
            if (pregunta.opciones) {
              try {
                pregunta.opciones = JSON.parse(pregunta.opciones);
              } catch (e) {
                console.error('Error al parsear opciones JSON:', e);
              }
            }
            return pregunta;
          });
          
          resolve(cuestionario);
        });
      });
    });
  }

  static async getAllWithQuestions() {
    const query = 'SELECT * FROM cuestionarios';
    
    return new Promise((resolve, reject) => {
      db.query(query, (error, cuestionariosResults) => {
        if (error) reject(error);
        if (cuestionariosResults.length === 0) resolve([]);

        const cuestionarios = [...cuestionariosResults];
        const promises = cuestionarios.map(cuestionario => 
          this.getWithQuestions(cuestionario.id)
        );
        
        Promise.all(promises)
          .then(resultadosConPreguntas => {
            resolve(resultadosConPreguntas);
          })
          .catch(error => reject(error));
      });
    });
  }
}

module.exports = Cuestionario; 