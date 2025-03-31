import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuestionarioService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los cuestionarios
  getAllCuestionarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuestionarios`);
  }

  // Obtener un cuestionario específico con sus preguntas
  getCuestionarioWithQuestions(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuestionarios/${id}`);
  }

  // Obtener todos los cuestionarios con sus preguntas
  getAllCuestionariosWithQuestions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuestionarios-with-questions`);
  }

  // Obtener estado de cuestionarios para el usuario actual
  getEstadoCuestionarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-cuestionarios`);
  }

  // Obtener respuestas para un cuestionario específico del usuario actual
  getRespuestasCuestionario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-cuestionarios/${id}/respuestas`);
  }

  // Obtener todas las respuestas de todos los cuestionarios del usuario actual
  getAllRespuestasUsuario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-respuestas`);
  }

  // Obtener todas las respuestas detalladas (usando el JOIN completo)
  getAllRespuestasDetalladasUsuario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-respuestas-detalladas`);
  }

  // Iniciar un cuestionario
  iniciarCuestionario(cuestionarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/iniciar-cuestionario`, { cuestionarioId });
  }

  // Guardar una respuesta individual
  guardarRespuesta(cuestionarioId: number, preguntaId: number, respuestaTexto: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuesta`, {
      cuestionarioId,
      preguntaId,
      respuestaTexto
    });
  }

  // Guardar múltiples respuestas a la vez
  guardarRespuestas(cuestionarioId: number, respuestas: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuestas`, {
      cuestionarioId,
      respuestas
    });
  }

  // Completar un cuestionario
  completarCuestionario(cuestionarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/completar-cuestionario`, { cuestionarioId });
  }

  // Reiniciar todos los cuestionarios para el usuario actual
  reiniciarCuestionarios(): Observable<any> {
    return this.http.post(`${this.apiUrl}/reiniciar-cuestionarios`, {});
  }

  // Corregir respuestas incorrectamente asociadas
  corregirRespuestasIncorrectas(): Observable<any> {
    return this.http.post(`${this.apiUrl}/corregir-respuestas`, {});
  }

  // Reiniciar y restaurar correctamente todas las respuestas
  restaurarRespuestas(): Observable<any> {
    return this.http.post(`${this.apiUrl}/restaurar-respuestas`, {});
  }
} 