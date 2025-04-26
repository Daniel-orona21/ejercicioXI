import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { InfoModalComponent } from './info-modal/info-modal.component';
import { FormsModule } from '@angular/forms';
import { CuestionarioService } from '../../../services/cuestionario.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cuestionarios',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatCardModule, 
    MatProgressBarModule,
    MatDialogModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './cuestionarios.component.html',
  styleUrls: ['./cuestionarios.component.scss']
})
export class CuestionariosComponent implements OnInit {
  // Estado del cuestionario
  cargando = false;
  guardando = false;
  error = false;
  errorMessage = '';
  mostrandoCuestionario = false;
  cuestionarioCompletado = false;
  
  // Preguntas del cuestionario
  preguntas: any[] = [];
  
  // Opciones de respuesta
  opcionesRespuesta: any[] = [];
  
  // Respuestas y progreso
  respuestasSeleccionadas: { [key: number]: number } = {};
  respuestasPendientesDeGuardar: { preguntaId: number, opcionRespuestaId: number }[] = [];
  preguntaActual = 0;
  progreso = {
    porcentajeTotal: 0,
    totalRespondidas: 0,
    totalAResponder: 0,
    esJefe: false
  };
  
  // Usuario actual
  usuarioId: number | null = null;
  userAuthenticated = false;
  
  constructor(
    private dialog: MatDialog,
    private cuestionarioService: CuestionarioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.userAuthenticated = this.authService.isAuthenticated();
    if (!this.userAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Obtener el ID del usuario actual
    this.authService.getUserData().subscribe(userData => {
      if (userData) {
        this.usuarioId = userData.id;
        console.log('ID del usuario actual:', this.usuarioId);
      } else {
        console.error('No se pudo obtener la información del usuario.');
        this.router.navigate(['/login']);
      }
    });
    
    // Obtener las opciones de respuesta
    this.obtenerOpcionesRespuesta();
    
    // Verificar si hay progreso guardado
    this.verificarEstadoCuestionario();
  }

  obtenerOpcionesRespuesta(): void {
    this.cuestionarioService.getOpcionesRespuesta().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.opcionesRespuesta = response.data;
        } else {
          console.error('Error al obtener opciones de respuesta:', response);
        }
      },
      error: (error) => {
        console.error('Error al obtener opciones de respuesta:', error);
      }
    });
  }

  iniciarCuestionario(): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
  
    // Mostrar el modal de información antes de comenzar
    const dialogRef = this.dialog.open(InfoModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado === 'aceptar') {
        this.mostrandoCuestionario = true;
        this.obtenerPreguntasDelBackend();
      }
    });
  }

  // Método para obtener preguntas del backend
  obtenerPreguntasDelBackend(): void {
    this.cargando = true;
    this.cuestionarioService.getMisPreguntas().subscribe({
      next: (response) => {
        if (response && response.success) {
          console.log('Preguntas obtenidas de la base de datos:', response.data);
          this.preguntas = response.data;
          this.progreso.totalAResponder = this.preguntas.length;
          
          // Verificar si alguna de las preguntas es "Soy jefe"
          const preguntaJefe = this.preguntas.find(p => p.orden === 68);
          if (preguntaJefe) {
            console.log('Pregunta "Soy jefe" identificada:', preguntaJefe);
          }
          
          this.actualizarProgreso();
        } else {
          console.error('Error en la respuesta del servidor:', response);
          this.error = true;
          this.errorMessage = 'Error en la respuesta del servidor.';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener preguntas:', error);
        this.error = true;
        this.errorMessage = 'Error al obtener las preguntas. Por favor, intente nuevamente.';
        this.cargando = false;
      }
    });
  }
  
  continuarCuestionario(): void {
    // Mostrar el cuestionario
    this.mostrandoCuestionario = true;
    
    // Cargar las preguntas y respuestas previas
    this.cargando = true;
    
    // Cargar las preguntas
    this.cuestionarioService.getMisPreguntasPromise()
      .then(result => {
        if (result.status && result.status !== 200) {
          throw result;
        }
        
        // Verificar la estructura de la respuesta y asignar las preguntas correctamente
        if (result.data) {
          // Formato response.data (como en obtenerPreguntasDelBackend)
          this.preguntas = result.data;
        } else if (result.preguntas) {
          // Formato result.preguntas 
          this.preguntas = result.preguntas;
        } else {
          console.error('Formato de respuesta inesperado:', result);
          throw new Error('No se pudieron cargar las preguntas. Formato de respuesta inesperado.');
        }
        
        // Verificar que preguntas no sea undefined o vacío
        if (!this.preguntas || this.preguntas.length === 0) {
          throw new Error('No se encontraron preguntas para mostrar.');
        }
        
        // Actualizar el total de preguntas a responder
        this.progreso.totalAResponder = this.preguntas.length;
        
        // Obtener opciones de respuesta
        return this.cuestionarioService.getOpcionesRespuestaPromise();
      })
      .then(result => {
        if (result.status && result.status !== 200) {
          throw result;
        }
        
        // Verificar la estructura de la respuesta para opciones
        if (result.data) {
          this.opcionesRespuesta = result.data;
        } else if (result.opciones) {
          this.opcionesRespuesta = result.opciones;
        } else {
          console.error('Formato de respuesta inesperado para opciones:', result);
          throw new Error('No se pudieron cargar las opciones de respuesta.');
        }
        
        // Cargar las respuestas previas del usuario
        return this.cuestionarioService.getMisRespuestasPromise();
      })
      .then(result => {
        if (result.status && result.status !== 200) {
          throw result;
        }
        
        // Verificar la estructura de la respuesta para respuestas
        let respuestasUsuario = [];
        if (result.data) {
          respuestasUsuario = result.data;
        } else if (result.respuestas) {
          respuestasUsuario = result.respuestas;
        } else {
          console.log('No se encontraron respuestas previas del usuario');
          respuestasUsuario = [];
        }
        
        // Guardar las respuestas del usuario en el mapa de respuestas seleccionadas
        if (respuestasUsuario && respuestasUsuario.length > 0) {
          respuestasUsuario.forEach((respuesta: any) => {
            this.respuestasSeleccionadas[respuesta.pregunta_id] = respuesta.opcion_respuesta_id;
          });
          
          // Encontrar la última pregunta respondida para posicionar al usuario
          const preguntasOrdenadas = [...this.preguntas].sort((a, b) => a.orden - b.orden);
          let ultimaPreguntaRespondida = 0;
          
          // Encontrar la última pregunta respondida según el orden
          for (let i = 0; i < preguntasOrdenadas.length; i++) {
            if (this.respuestasSeleccionadas[preguntasOrdenadas[i].id]) {
              ultimaPreguntaRespondida = i;
            }
          }
          
          // Posicionar en la siguiente pregunta a la última respondida
          this.preguntaActual = Math.min(ultimaPreguntaRespondida + 1, this.preguntas.length - 1);
        }
        
        // Actualizar el progreso
        return this.verificarProgreso();
      })
      .then(() => {
        this.cargando = false;
      })
      .catch(error => {
        console.error('Error al continuar cuestionario:', error);
        this.cargando = false;
        this.error = true;
        this.errorMessage = (error.error && error.error.message) 
          ? error.error.message 
          : 'No se pudo cargar el cuestionario. Por favor, intenta nuevamente.';
      });
  }
  
  guardarRespuesta(preguntaId: number, opcionId: number): void {
    this.respuestasSeleccionadas[preguntaId] = opcionId;
    
    // Identificar si es la pregunta "Soy jefe"
    const preguntaActual = this.preguntas[this.preguntaActual];
    const esPreguntaJefe = preguntaActual && preguntaActual.orden === 68;
    
    // Para la pregunta de jefe, convertir Sí/No a los valores de opciones_respuesta
    let opcionRespuestaId = opcionId;
    if (esPreguntaJefe) {
      // Si respondió "Sí" (opcionId=1), usar valor de "Siempre" (id=1, valor=4)
      // Si respondió "No" (opcionId=5), usar valor de "Nunca" (id=5, valor=0)
      console.log(`Respuesta a pregunta "Soy jefe": ${opcionId === 1 ? 'SÍ' : 'NO'}`);
    }
    
    // Agregar la respuesta a la lista de pendientes de guardar
    this.respuestasPendientesDeGuardar.push({
      preguntaId: preguntaId,
      opcionRespuestaId: opcionRespuestaId
    });
    
    // Guardar la respuesta en el backend
    this.guardarRespuestaEnBackend(preguntaId, opcionRespuestaId);
    
    this.actualizarProgreso();
    
    // Si es la pregunta "Soy jefe", esperamos la respuesta del servidor antes de avanzar
    if (esPreguntaJefe) {
      // No avanzamos automáticamente, esperamos la respuesta del backend
      console.log("Esperando respuesta del servidor para la pregunta 'Soy jefe'...");
      
      // Si respondió "No", finalizamos el cuestionario
      if (opcionId === 5) {
        this.cuestionarioCompletado = true;
        this.mostrandoCuestionario = false;
        console.log("Cuestionario completado porque respondió 'No' a ser jefe");
        return;
      }
      
      return;
    }
    
    // Verificar si es la última pregunta
    if (this.preguntaActual < this.preguntas.length - 1) {
      this.preguntaActual++;
    } else {
      // Marcar como completado si se respondieron todas las preguntas
      if (this.progreso.porcentajeTotal === 100) {
        this.cuestionarioCompletado = true;
        this.mostrandoCuestionario = false;
        // Guardar todas las respuestas pendientes si hay alguna
        if (this.respuestasPendientesDeGuardar.length > 0) {
          this.guardarTodasLasRespuestas();
        }
      }
    }
  }
  
  guardarRespuestaEnBackend(preguntaId: number, opcionId: number): void {
    this.guardando = true;
    
    // Identificar si es la pregunta "Soy jefe"
    const preguntaActual = this.preguntas.find(p => p.id === preguntaId);
    const esPreguntaJefe = preguntaActual && preguntaActual.orden === 68;
    
    // Usar el método estándar que utiliza el token de autenticación
    this.cuestionarioService.guardarRespuesta(preguntaId, opcionId).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          console.log('Respuesta guardada correctamente:', response);
          
          // Remover la respuesta de la lista de pendientes
          this.respuestasPendientesDeGuardar = this.respuestasPendientesDeGuardar.filter(
            r => r.preguntaId !== preguntaId
          );
          
          // Si la respuesta es para la pregunta "Soy jefe", actualizar el estado
          if (esPreguntaJefe && response.metadata && response.metadata.esJefe !== undefined) {
            this.progreso.esJefe = response.metadata.esJefe;
            console.log("Respuesta a pregunta 'Soy jefe':", response.metadata.esJefe ? "Sí es jefe" : "No es jefe");
            
            // Si el usuario respondió "Sí" y hay preguntas adicionales, mostrarlas
            if (response.metadata.esJefe && 
                response.metadata.mostrarPreguntasAdicionales && 
                response.metadata.preguntasAdicionales && 
                response.metadata.preguntasAdicionales.length > 0) {
              
              console.log("Mostrando preguntas adicionales:", response.metadata.preguntasAdicionales.length);
              
              // Añadir las preguntas adicionales solo si no existen ya
              const preguntasNuevas = response.metadata.preguntasAdicionales.filter(
                (nuevaPregunta: any) => !this.preguntas.some(p => p.id === nuevaPregunta.id)
              );
              
              if (preguntasNuevas.length > 0) {
                this.preguntas = [...this.preguntas, ...preguntasNuevas];
                this.progreso.totalAResponder = this.preguntas.length;
                this.actualizarProgreso();
                console.log("Preguntas añadidas. Total preguntas ahora:", this.preguntas.length);
              }
              
              // Avanzar a la siguiente pregunta si respondió "Sí"
              this.preguntaActual++;
              console.log("Avanzando a la siguiente pregunta:", this.preguntaActual);
            } 
            // Si el usuario respondió "No", no mostramos preguntas adicionales
            else if (!response.metadata.esJefe) {
              // Ya manejamos esto en guardarRespuesta
              console.log("No se mostrarán preguntas adicionales porque no es jefe");
            }
          } else if (esPreguntaJefe) {
            // Si es la pregunta de jefe pero no vino la metadata esperada
            console.error("Error: No se recibió la metadata esperada para la pregunta 'Soy jefe'");
            // Si respondió "Sí", avanzamos igualmente para no bloquear al usuario
            if (opcionId === 1) {
              this.preguntaActual++;
            }
          }
          
          // Actualizar el progreso con los datos del servidor si están disponibles
          if (response.metadata && response.metadata.progreso) {
            this.progreso = {
              ...this.progreso,
              ...response.metadata.progreso
            };
          }
        } else {
          console.error('Error al guardar respuesta:', response);
        }
        this.guardando = false;
      },
      error: (error: any) => {
        console.error('Error al guardar respuesta:', error);
        this.guardando = false;
      }
    });
  }
  
  guardarTodasLasRespuestas(): void {
    if (this.respuestasPendientesDeGuardar.length === 0) return;
    
    this.guardando = true;
    this.cuestionarioService.guardarRespuestas(this.respuestasPendientesDeGuardar).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          console.log('Todas las respuestas guardadas correctamente:', response);
          this.respuestasPendientesDeGuardar = [];
          
          // Actualizar el progreso con los datos del servidor
          if (response.data && response.data.progreso) {
            this.progreso = {
              ...this.progreso,
              ...response.data.progreso
            };
          }
        } else {
          console.error('Error al guardar todas las respuestas:', response);
        }
        this.guardando = false;
      },
      error: (error: any) => {
        console.error('Error al guardar todas las respuestas:', error);
        this.guardando = false;
      }
    });
  }
  
  actualizarProgreso(): void {
    this.progreso.totalRespondidas = Object.keys(this.respuestasSeleccionadas).length;
    this.progreso.porcentajeTotal = this.progreso.totalAResponder > 0 
      ? Math.round((this.progreso.totalRespondidas / this.progreso.totalAResponder) * 100)
      : 0;
  }
  
  preguntaAnterior(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
    }
  }
  
  volverAInicio(): void {
    this.mostrandoCuestionario = false;
    
    // Guardar todas las respuestas pendientes al volver al inicio
    if (this.respuestasPendientesDeGuardar.length > 0) {
      this.guardarTodasLasRespuestas();
    }
  }
  
  esPreguntaRespondida(preguntaId: number): boolean {
    return this.respuestasSeleccionadas.hasOwnProperty(preguntaId);
  }
  
  verificarEstadoCuestionario(): void {
    this.error = false;
    this.cargando = true;
    
    // Obtener el progreso actual del usuario
    this.cuestionarioService.getMiProgreso().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          console.log('Progreso actual:', response.data);
          this.progreso = {
            ...this.progreso,
            ...response.data
          };
          
          // Verificar si completó la evaluación (100%)
          if (this.progreso.porcentajeTotal === 100) {
            this.cuestionarioCompletado = true;
          }
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener progreso:', error);
        this.cargando = false;
      }
    });
  }
  
  // Método para reiniciar la evaluación
  reiniciarEvaluacion(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas borrar todas tus respuestas y empezar de nuevo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3f51b5',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        
        // Borrar todas las respuestas del usuario
        this.cuestionarioService.borrarMisRespuestas().subscribe({
          next: (response) => {
            if (response && response.success) {
              console.log('Respuestas borradas correctamente:', response);
              
              // Restablecer el estado del componente
              this.cuestionarioCompletado = false;
              this.respuestasSeleccionadas = {};
              this.respuestasPendientesDeGuardar = [];
              this.preguntaActual = 0;
              this.progreso = {
                porcentajeTotal: 0,
                totalRespondidas: 0,
                totalAResponder: 0,
                esJefe: false
              };
              
              // Iniciar la evaluación nuevamente
              this.iniciarCuestionario();
            } else {
              console.error('Error al borrar respuestas:', response);
              this.error = true;
              this.errorMessage = 'Error al reiniciar la evaluación.';
            }
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al borrar respuestas:', error);
            this.error = true;
            this.errorMessage = 'Error al reiniciar la evaluación.';
            this.cargando = false;
          }
        });
      }
    });
  }

  // Método para verificar y actualizar el progreso del usuario
  verificarProgreso(): Promise<void> {
    return this.cuestionarioService.getMiProgresoPromise()
      .then((result: any) => {
        if (result.status && result.status !== 200) {
          throw result;
        }
        
        if (result.progreso) {
          this.progreso = {
            ...this.progreso,
            ...result.progreso
          };
        }
        
        // Verificar si ya se completó el cuestionario
        if (this.progreso.totalRespondidas === this.progreso.totalAResponder) {
          this.cuestionarioCompletado = true;
        }
      });
  }

  // Método para obtener el color del gradiente de la barra de progreso según el porcentaje
  getColorGradient(percentage: number): string {
    // Definir colores para el espectro (rojo -> amarillo -> verde)
    if (percentage <= 0) return '#ff0000'; // Rojo para 0%
    if (percentage >= 100) return '#00ff00'; // Verde para 100%
    
    // Colores por segmentos 
    if (percentage < 20) {
      // Del rojo al naranja
      const factor = percentage / 20;
      const r = 255;
      const g = Math.round(165 * factor);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (percentage < 40) {
      // Del naranja al amarillo
      const factor = (percentage - 20) / 20;
      const r = 255;
      const g = 165 + Math.round(90 * factor);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (percentage < 60) {
      // Del amarillo al chartreuse
      const factor = (percentage - 40) / 20;
      const r = 255 - Math.round(128 * factor);
      const g = 255;
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (percentage < 80) {
      // Del chartreuse al verde claro
      const factor = (percentage - 60) / 20;
      const r = 127 - Math.round(127 * factor);
      const g = 255;
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Del verde claro al verde intenso
      const factor = (percentage - 80) / 20;
      const r = 0;
      const g = 255 - Math.round(55 * factor);
      const b = Math.round(55 * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
}
