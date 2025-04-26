import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, lastValueFrom, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuestionarioService {
  private apiUrl = `${environment.apiUrl}/cuestionario`;

  constructor(private http: HttpClient) { }

  // Obtener todas las preguntas (endpoint público)
  getPreguntas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/preguntas`);
  }

  // Obtener las preguntas según el perfil del usuario (si es jefe o no)
  getMisPreguntas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-preguntas`);
  }

  // Obtener opciones de respuesta (endpoint público)
  getOpcionesRespuesta(): Observable<any> {
    return this.http.get(`${this.apiUrl}/opciones-respuesta`);
  }

  // Guardar una respuesta individual
  guardarRespuesta(preguntaId: number, opcionRespuestaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuesta`, {
      preguntaId,
      opcionRespuestaId
    });
  }

  // Guardar una respuesta con ID de usuario manual (para pruebas)
  guardarRespuestaManual(data: { preguntaId: number, opcionRespuestaId: number, usuarioId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuesta-manual`, data);
  }

  // Guardar múltiples respuestas a la vez
  guardarRespuestas(respuestas: { preguntaId: number, opcionRespuestaId: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuestas`, {
      respuestas
    });
  }

  // Guardar múltiples respuestas a la vez con ID de usuario manual (para pruebas)
  guardarRespuestasManual(respuestas: { preguntaId: number, opcionRespuestaId: number, usuarioId: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuestas-manual`, {
      respuestas
    });
  }

  // Obtener todas las respuestas del usuario actual
  getMisRespuestas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-respuestas`);
  }

  // Obtener el progreso del usuario en el cuestionario
  getMiProgreso(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mi-progreso`);
  }

  // Borrar todas las respuestas del usuario actual
  borrarMisRespuestas(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mis-respuestas`);
  }

  // Métodos para convertir Observable a Promise con mejor manejo de errores
  async getMisPreguntasPromise(): Promise<any> {
    try {
      return await lastValueFrom(this.getMisPreguntas());
    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      throw this.handleErrorPromise(error);
    }
  }

  async getOpcionesRespuestaPromise(): Promise<any> {
    try {
      return await lastValueFrom(this.getOpcionesRespuesta());
    } catch (error) {
      console.error('Error al obtener opciones de respuesta:', error);
      throw this.handleErrorPromise(error);
    }
  }

  async getMisRespuestasPromise(): Promise<any> {
    try {
      return await lastValueFrom(this.getMisRespuestas());
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
      throw this.handleErrorPromise(error);
    }
  }

  async getMiProgresoPromise(): Promise<any> {
    try {
      return await lastValueFrom(this.getMiProgreso());
    } catch (error) {
      console.error('Error al obtener progreso:', error);
      throw this.handleErrorPromise(error);
    }
  }

  // Método para manejar errores en promesas
  private handleErrorPromise(error: any): any {
    if (error instanceof HttpErrorResponse) {
      // Preservar el status para poder verificarlo en el componente
      return {
        status: error.status,
        message: error.message,
        error: error.error
      };
    }
    return error;
  }

  // Estadísticas para administradores
  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }
} 