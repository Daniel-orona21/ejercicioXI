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

  // Guardar múltiples respuestas a la vez
  guardarRespuestas(respuestas: { preguntaId: number, opcionRespuestaId: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-respuestas`, {
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