import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuestionarioService } from '../../../services/cuestionario.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

interface User {
  id: number;
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-cuestionarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuestionarios.component.html',
  styleUrls: ['./cuestionarios.component.scss']
})
export class CuestionariosComponent implements OnInit {
  activeTab = 'traumaticos';
  loading = false;
  mensaje = { show: false, text: '', type: 'success' as 'success' | 'error' };
  todosCompletados = false;
  
  // Estado de los cuestionarios
  cuestionariosEstado = {
    traumaticos: { completado: false, respondidas: 0, total: 0, id: 1 },
    factores: { completado: false, respondidas: 0, total: 0, id: 2 },
    entorno: { completado: false, respondidas: 0, total: 0, id: 3 }
  };
  
  // Datos del usuario actual
  usuario: User | null = null;
  
  // Orden secuencial de los cuestionarios
  secuenciaCuestionarios = ['traumaticos', 'factores', 'entorno'];
  
  cuestionarios = {
    traumaticos: [
      '¿Ha presenciado o sufrido alguna amenaza directa a su vida o salud en su lugar de trabajo?',
      '¿Ha experimentado violencia física, agresiones o amenazas graves en su entorno laboral?',
      '¿Ha estado involucrado en accidentes graves o situaciones de emergencia dentro de la empresa?',
      '¿Ha sido testigo de eventos que hayan puesto en riesgo la integridad de un compañero de trabajo?',
      '¿Ha recibido apoyo adecuado de la organización tras un acontecimiento traumático?',
      '¿Siente que su salud emocional ha sido afectada por algún evento ocurrido en su trabajo?'
    ],
    factores: [
      '¿Siente presión excesiva en el trabajo debido a la carga laboral?',
      '¿Considera que su horario laboral afecta su calidad de vida?',
      '¿Ha experimentado acoso o maltrato en su trabajo?',
      '¿Siente que la organización no valora su esfuerzo?',
      '¿Se siente constantemente fatigado o estresado por el trabajo?'
    ],
    entorno: [
      {
        texto: '¿Recibe apoyo de sus superiores en la realización de su trabajo?',
        opciones: ['Siempre', 'A veces', 'Nunca']
      },
      {
        texto: '¿Existe comunicación efectiva entre los empleados y la dirección?',
        opciones: ['Buena', 'Regular', 'Mala']
      },
      {
        texto: '¿Recibe capacitación adecuada para desempeñar sus funciones?',
        opciones: ['Sí', 'A Veces', 'No']
      },
      {
        texto: '¿Considera que el ambiente laboral es saludable y colaborativo?',
        opciones: ['Sí', 'A Veces', 'No']
      }
    ]
  };
  
  // Almacena las respuestas
  respuestas = {
    traumaticos: {} as { [key: number]: string },
    factores: {} as { [key: number]: string },
    entorno: {} as { [key: number]: string }
  };

  constructor(
    private cuestionarioService: CuestionarioService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Obtener información del usuario
    this.authService.getUserData().subscribe({
      next: (data: User | null) => {
        this.usuario = data;
        // Cargar el estado de los cuestionarios
        this.cargarEstadoCuestionarios();
      },
      error: (error: any) => {
        console.error('Error al obtener información del usuario:', error);
        this.mostrarMensaje('Error al cargar información del usuario', 'error');
      }
    });
    
    // Inicializa los contadores de preguntas
    this.cuestionariosEstado.traumaticos.total = this.cuestionarios.traumaticos.length;
    this.cuestionariosEstado.factores.total = this.cuestionarios.factores.length;
    this.cuestionariosEstado.entorno.total = this.cuestionarios.entorno.length;
  }
  
  // Cargar el estado de los cuestionarios del usuario
  cargarEstadoCuestionarios(): void {
    this.loading = true;
    this.cuestionarioService.getEstadoCuestionarios().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          response.data.forEach((cuestionario: any) => {
            const codigo = cuestionario.codigo;
            if (this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado]) {
              this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].completado = 
                cuestionario.estado === 'completado';
              this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].id = 
                cuestionario.id;
              
              // Si el cuestionario está iniciado pero no completado, cargar las respuestas
              if (cuestionario.estado === 'iniciado') {
                this.cargarRespuestasCuestionario(codigo, cuestionario.id);
              }
            }
          });
          
          // Verificar si todos los cuestionarios están completados
          this.verificarTodosCompletados();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estado de cuestionarios:', error);
        this.mostrarMensaje('Error al cargar estado de cuestionarios', 'error');
        this.loading = false;
      }
    });
  }
  
  // Cargar las respuestas de un cuestionario específico
  cargarRespuestasCuestionario(codigo: string, cuestionarioId: number): void {
    this.cuestionarioService.getRespuestasCuestionario(cuestionarioId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let contador = 0;
          
          response.data.forEach((item: any) => {
            if (item.respuesta_texto) {
              this.respuestas[codigo as keyof typeof this.respuestas][item.pregunta_id] = item.respuesta_texto;
              contador++;
            }
          });
          
          this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].respondidas = contador;
        }
      },
      error: (error) => {
        console.error(`Error al cargar respuestas del cuestionario ${codigo}:`, error);
      }
    });
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Iniciar cuestionario si no está completado
    if (!this.estaCompletado(tab)) {
      const cuestionarioId = this.cuestionariosEstado[tab as keyof typeof this.cuestionariosEstado].id;
      this.iniciarCuestionario(cuestionarioId);
    }
  }
  
  // Iniciar cuestionario en la base de datos
  iniciarCuestionario(cuestionarioId: number): void {
    this.cuestionarioService.iniciarCuestionario(cuestionarioId).subscribe({
      error: (error) => {
        console.error('Error al iniciar cuestionario:', error);
      }
    });
  }
  
  // Marcar una respuesta y guardarla en la base de datos
  responderPregunta(tipoEncuesta: string, indice: number, respuesta: string): void {
    this.respuestas[tipoEncuesta as keyof typeof this.respuestas][indice] = respuesta;
    this.actualizarContadorRespuestas(tipoEncuesta);
    
    // Guardar respuesta en la base de datos
    const cuestionarioId = this.cuestionariosEstado[tipoEncuesta as keyof typeof this.cuestionariosEstado].id;
    // +1 porque en la base de datos los índices empiezan en 1
    const preguntaId = indice + 1;
    
    this.cuestionarioService.guardarRespuesta(cuestionarioId, preguntaId, respuesta).subscribe({
      next: () => {
        // La respuesta se guardó correctamente
        // No mostramos mensaje para no interrumpir el flujo
      },
      error: (error) => {
        console.error('Error al guardar respuesta:', error);
        this.mostrarMensaje('Error al guardar respuesta', 'error');
      }
    });
  }
  
  // Actualizar contador de respuestas
  actualizarContadorRespuestas(tipoEncuesta: string): void {
    const respuestasObj = this.respuestas[tipoEncuesta as keyof typeof this.respuestas];
    const contador = Object.keys(respuestasObj).length;
    
    this.cuestionariosEstado[tipoEncuesta as keyof typeof this.cuestionariosEstado].respondidas = contador;
  }
  
  // Verificar si una pregunta tiene respuesta
  tieneRespuesta(tipoEncuesta: string, indice: number): boolean {
    return !!this.respuestas[tipoEncuesta as keyof typeof this.respuestas][indice];
  }
  
  // Finalizar el cuestionario actual
  finalizarCuestionario(): void {
    if (!this.todasRespondidas()) {
      this.mostrarMensaje('Debes responder todas las preguntas', 'error');
      return;
    }
    
    const cuestionarioActual = this.activeTab;
    const cuestionarioId = this.cuestionariosEstado[cuestionarioActual as keyof typeof this.cuestionariosEstado].id;
    
    this.loading = true;
    this.cuestionarioService.completarCuestionario(cuestionarioId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuestionariosEstado[cuestionarioActual as keyof typeof this.cuestionariosEstado].completado = true;
          
          // Verificar si todos los cuestionarios están completados después de finalizar uno
          this.verificarTodosCompletados();
          
          this.siguienteCuestionario();
          this.mostrarMensaje('Cuestionario completado correctamente', 'success');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al completar cuestionario:', error);
        this.mostrarMensaje('Error al completar cuestionario', 'error');
        this.loading = false;
      }
    });
  }
  
  // Navegar al siguiente cuestionario
  siguienteCuestionario(): void {
    const indiceActual = this.secuenciaCuestionarios.indexOf(this.activeTab);
    if (indiceActual < this.secuenciaCuestionarios.length - 1) {
      this.activeTab = this.secuenciaCuestionarios[indiceActual + 1];
      
      // Iniciar el siguiente cuestionario
      const siguienteCuestionarioId = this.cuestionariosEstado[this.activeTab as keyof typeof this.cuestionariosEstado].id;
      this.iniciarCuestionario(siguienteCuestionarioId);
    } else {
      // Todos los cuestionarios completados
      console.log('¡Todos los cuestionarios han sido completados!');
    }
  }
  
  // Verificar si todas las preguntas del cuestionario activo están respondidas
  todasRespondidas(): boolean {
    const estado = this.cuestionariosEstado[this.activeTab as keyof typeof this.cuestionariosEstado];
    return estado.respondidas === estado.total;
  }
  
  // Verificar si un cuestionario está completado
  estaCompletado(tab: string): boolean {
    return this.cuestionariosEstado[tab as keyof typeof this.cuestionariosEstado].completado;
  }
  
  // Calcular el progreso de un cuestionario (para indicadores visuales)
  calcularProgreso(tab: string): number {
    const estado = this.cuestionariosEstado[tab as keyof typeof this.cuestionariosEstado];
    if (estado.total === 0) return 0;
    return Math.round((estado.respondidas / estado.total) * 100);
  }
  
  // Mostrar mensaje temporal
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = {
      show: true,
      text: texto,
      type: tipo
    };
    
    setTimeout(() => {
      this.mensaje.show = false;
    }, 3000);
  }
  
  // Ir a la página de resultados
  verResultados(): void {
    // Emitir evento para cambiar el tab en el header a "resultados"
    const selectTabEvent = new CustomEvent('selectTab', { 
      detail: { tab: 'resultados' },
      bubbles: true
    });
    document.dispatchEvent(selectTabEvent);
  }
  
  // Verificar si todos los cuestionarios están completados
  verificarTodosCompletados(): void {
    this.todosCompletados = this.secuenciaCuestionarios.every(codigo => 
      this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].completado
    );
    
    if (this.todosCompletados) {
      console.log('Todos los cuestionarios han sido completados');
    }
  }
  
  // Verificar si estamos en el último cuestionario
  esUltimoCuestionario(): boolean {
    const indiceActual = this.secuenciaCuestionarios.indexOf(this.activeTab);
    return indiceActual === this.secuenciaCuestionarios.length - 1;
  }
  
  // Reiniciar todos los cuestionarios para el usuario
  reiniciarCuestionarios(): void {
    Swal.fire({
      title: '¿Estás seguro de querer reiniciar todos tus cuestionarios?',
      text: 'Todas tus respuestas serán eliminadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3a57e8',
      cancelButtonColor: '#e73a4e',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      background: '#fff',
      customClass: {
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        title: 'swal-title',
        popup: 'swal-popup',
        icon: 'swal-icon'
      },
      buttonsStyling: true,
      reverseButtons: true,
      focusConfirm: false,
      heightAuto: false,
      padding: '1.25rem'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cuestionarioService.reiniciarCuestionarios().subscribe({
          next: (response) => {
            if (response.success) {
              // Reiniciar los estados locales
              this.secuenciaCuestionarios.forEach(codigo => {
                this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].completado = false;
                this.cuestionariosEstado[codigo as keyof typeof this.cuestionariosEstado].respondidas = 0;
                this.respuestas[codigo as keyof typeof this.respuestas] = {};
              });
              
              this.todosCompletados = false;
              this.activeTab = this.secuenciaCuestionarios[0]; // Volver al primer cuestionario
              
              this.mostrarMensaje('Cuestionarios reiniciados correctamente. Puedes volver a responder.', 'success');
              
              // Iniciar el primer cuestionario
              this.iniciarCuestionario(this.cuestionariosEstado[this.activeTab as keyof typeof this.cuestionariosEstado].id);
            } else {
              this.mostrarMensaje('Error al reiniciar los cuestionarios', 'error');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al reiniciar cuestionarios:', error);
            this.mostrarMensaje('Error al reiniciar los cuestionarios', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
