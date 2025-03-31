import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CuestionarioService } from '../../../services/cuestionario.service';

// Definimos una interfaz para los datos de respuesta
interface RespuestaDetallada {
  cuestionarioId: number;
  cuestionarioNombre: string;
  cuestionarioCodigo: string;
  preguntaId: number;
  pregunta: string;
  respuesta: string;
  valor?: number;
  fecha: string;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit {
  // Usar inject en lugar de constructor injection
  private cuestionarioService = inject(CuestionarioService);
  
  summaryData = {
    pendingTasks: 21,
    completedTasks: 13,
    overdueTasks: 17,
    yesterday: 9,
    openIssues: 24,
    closedToday: 19,
    proposals: 38,
    implemented: 16
  };

  respuestasCuestionarios: any[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.cargarRespuestasDetalladasUsuario();
  }

  cargarRespuestasDetalladasUsuario(): void {
    this.loading = true;
    this.error = '';

    // Usar el nuevo método que obtiene respuestas detalladas con JOIN completo
    this.cuestionarioService.getAllRespuestasDetalladasUsuario().subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.data) {
          // Procesar los datos para verificar la integridad
          const cuestionariosVerificados = response.data.map((cuestionario: any) => {
            // Verificar que las respuestas pertenezcan al cuestionario correcto
            const respuestasVerificadas = cuestionario.respuestas.filter((r: any) => {
              // Si la pregunta tiene un cuestionarioId definido, verificar que coincida
              if (r.preguntaCuestionarioId && r.preguntaCuestionarioId !== cuestionario.id) {
                console.warn(`La pregunta ${r.preguntaId} no pertenece al cuestionario ${cuestionario.id}`, r);
                return false;
              }
              return true;
            });

            return {
              ...cuestionario,
              respuestas: respuestasVerificadas
            };
          });
          
          this.respuestasCuestionarios = cuestionariosVerificados;
          
          // Imprimir las respuestas en la consola
          this.imprimirRespuestasEnConsola();
        } else {
          this.error = 'No se pudieron cargar las respuestas detalladas';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error al cargar las respuestas detalladas: ' + (error.message || 'Desconocido');
        console.error('Error al cargar respuestas detalladas:', error);
      }
    });
  }

  imprimirRespuestasEnConsola(): void {
    console.clear(); // Limpiamos la consola para una visualización más clara
    
    console.log('%c===== RESPUESTAS DETALLADAS DE LOS CUESTIONARIOS DEL USUARIO =====', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
    
    if (this.respuestasCuestionarios.length === 0) {
      console.log('%cNo hay respuestas disponibles', 'color: #e73a4e; font-style: italic;');
      return;
    }
    
    // Crear variable global para todas las respuestas
    (window as any).todasLasRespuestas = {};
    
    // Imprimir cada cuestionario
    this.respuestasCuestionarios.forEach((cuestionario) => {
      console.group(`%c${cuestionario.nombre.toUpperCase()} (ID: ${cuestionario.id})`, 
        'color: #1e2a4a; font-weight: bold; font-size: 14px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;');
      
      console.log(`%cDescripción: ${cuestionario.descripcion}`, 'color: #6c757d;');
      console.log(`%cCódigo: ${cuestionario.codigo}`, 'color: #6c757d;');
      
      if (cuestionario.tieneRespuestas) {
        console.log('%cRespuestas:', 'color: #3a57e8; font-weight: bold;');
        
        // Filtrar para mostrar solo preguntas con respuestas
        const respuestasContestadas = cuestionario.respuestas.filter(
          (r: any) => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta'
        );
        
        if (respuestasContestadas.length > 0) {
          // Log de verificación para depuración
          console.log(`%cTotal de respuestas para este cuestionario: ${respuestasContestadas.length}`, 'color: #6c757d;');
          
          // Mostrar cada pregunta y respuesta de forma detallada para evitar truncamiento
          respuestasContestadas.forEach((r: any, index: number) => {
            console.group(`%cPregunta ${index + 1} (ID: ${r.preguntaId})`, 'color: #1e2a4a; font-weight: bold;');
            
            // Mostrar la pregunta completa
            console.log('%cTexto de la pregunta:', 'color: #6c757d; font-weight: bold;');
            console.log(r.preguntaTexto);
            
            // Mostrar la respuesta
            console.log(`%cRespuesta:`, 'color: #3a57e8; font-weight: bold;');
            console.log(r.respuestaTexto);
            
            if (r.respuestaValor) {
              console.log(`%cValor: ${r.respuestaValor}`, 'color: #28a745; font-weight: bold;');
            }
            
            console.log(`%cFecha: ${r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'}`, 'color: #6c757d; font-size: 12px;');
            console.groupEnd();
          });
          
          // Exportar datos como objeto para fácil acceso
          const datosCompletos = respuestasContestadas.map((r: any): RespuestaDetallada => ({
            cuestionarioId: cuestionario.id,
            cuestionarioNombre: cuestionario.nombre,
            cuestionarioCodigo: cuestionario.codigo,
            preguntaId: r.preguntaId,
            pregunta: r.preguntaTexto,
            respuesta: r.respuestaTexto,
            valor: r.respuestaValor,
            fecha: r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'
          }));
          
          // Guardar las respuestas en la variable global
          (window as any).todasLasRespuestas[cuestionario.codigo] = datosCompletos;
          
          // Tabla simple para visualización rápida
          console.table(datosCompletos.map((d: RespuestaDetallada) => ({
            'ID Pregunta': d.preguntaId,
            'Pregunta': d.pregunta.substring(0, 50) + (d.pregunta.length > 50 ? '...' : ''),
            'Respuesta': d.respuesta
          })));
          
          console.log(`%cLos datos completos están disponibles en: todasLasRespuestas.${cuestionario.codigo}`, 
            'color: #28a745; font-style: italic;');
        } else {
          console.log('%cNo hay preguntas contestadas en este cuestionario', 'color: #ffc107; font-style: italic;');
        }
      } else {
        console.log('%cNo hay respuestas para este cuestionario', 'color: #e73a4e; font-style: italic;');
      }
      
      console.groupEnd();
      console.log(''); // Espacio entre cuestionarios
    });
    
    // Crear una versión consolidada de todas las respuestas
    const consolidado: RespuestaDetallada[] = this.respuestasCuestionarios.flatMap(cuestionario => 
      cuestionario.respuestas
        .filter((r: any) => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta')
        .map((r: any): RespuestaDetallada => ({
          cuestionarioId: cuestionario.id,
          cuestionarioNombre: cuestionario.nombre,
          cuestionarioCodigo: cuestionario.codigo,
          preguntaId: r.preguntaId,
          pregunta: r.preguntaTexto,
          respuesta: r.respuestaTexto,
          valor: r.respuestaValor,
          fecha: r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'
        }))
    );
    
    (window as any).todasLasRespuestas.consolidado = consolidado;
    
    console.log('%cTodas las respuestas están disponibles en la variable global "todasLasRespuestas"', 
      'color: #28a745; font-weight: bold; font-style: italic;');
    console.log('%cPuedes acceder al consolidado de respuestas con: todasLasRespuestas.consolidado', 
      'color: #28a745; font-style: italic;');
    
    console.log('%c==========================================', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
  }
}
