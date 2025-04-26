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

interface CuestionarioResponse {
  success: boolean;
  data?: any;
}

@Component({
  selector: 'app-cuestionarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuestionarios.component.html',
  styleUrls: ['./cuestionarios.component.scss']
})
export class CuestionariosComponent implements OnInit {
  loading = false;
  mensaje = { show: false, text: '', type: 'success' as 'success' | 'error' };
  todosCompletados = false;
  
  // Estado del cuestionario
  cuestionariosEstado = {
    factores: { completado: false, respondidas: 0, total: 0, id: 1 }
  };
  
  // Datos del usuario actual
  usuario: User | null = null;
  
  cuestionarios = {
    factores: [
      '¿Siente presión excesiva en el trabajo debido a la carga laboral?',
      '¿Considera que su horario laboral afecta su calidad de vida?',
      '¿Ha experimentado acoso o maltrato en su trabajo?',
      '¿Siente que la organización no valora su esfuerzo?',
      '¿Se siente constantemente fatigado o estresado por el trabajo?'
    ]
  };
  
  // Almacena las respuestas
  respuestas = {
    factores: {} as { [key: number]: string }
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
        // Cargar el estado del cuestionario
        this.cargarEstadoCuestionarios();
      },
      error: (error: any) => {
        console.error('Error al obtener información del usuario:', error);
        this.mostrarMensaje('Error al cargar información del usuario', 'error');
      }
    });
    
    // Inicializa el contador de preguntas
    this.cuestionariosEstado.factores.total = this.cuestionarios.factores.length;
  }
  
  // Cargar el estado del cuestionario del usuario
  cargarEstadoCuestionarios(): void {
    this.loading = true;
    this.cuestionarioService.getEstadoCuestionarios().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const cuestionario = response.data.find((c: any) => c.codigo === 'factores');
          if (cuestionario) {
            this.cuestionariosEstado.factores.completado = cuestionario.estado === 'completado';
            this.cuestionariosEstado.factores.id = cuestionario.id;
            
            // Si el cuestionario está iniciado pero no completado, cargar las respuestas
            if (cuestionario.estado === 'iniciado') {
              this.cargarRespuestasCuestionario('factores', cuestionario.id);
            }
          }
          
          // Verificar si el cuestionario está completado
          this.verificarTodosCompletados();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estado del cuestionario:', error);
        this.mostrarMensaje('Error al cargar estado del cuestionario', 'error');
        this.loading = false;
      }
    });
  }
  
  // Cargar las respuestas del cuestionario
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
        console.error(`Error al cargar respuestas del cuestionario:`, error);
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
      error: (error) => {
        console.error('Error al guardar respuesta:', error);
        this.mostrarMensaje('Error al guardar la respuesta', 'error');
      }
    });
  }
  
  actualizarContadorRespuestas(tipoEncuesta: string): void {
    const respuestas = this.respuestas[tipoEncuesta as keyof typeof this.respuestas];
    const contador = Object.keys(respuestas).length;
    this.cuestionariosEstado[tipoEncuesta as keyof typeof this.cuestionariosEstado].respondidas = contador;
  }
  
  tieneRespuesta(tipoEncuesta: string, indice: number): boolean {
    return this.respuestas[tipoEncuesta as keyof typeof this.respuestas].hasOwnProperty(indice);
  }
  
  finalizarCuestionario(): void {
    if (!this.todasRespondidas()) return;
    
    this.loading = true;
    const cuestionarioId = this.cuestionariosEstado.factores.id;
    
    this.cuestionarioService.completarCuestionario(cuestionarioId).subscribe({
      next: (response: CuestionarioResponse) => {
        if (response.success) {
          this.cuestionariosEstado.factores.completado = true;
          this.verificarTodosCompletados();
          this.mostrarMensaje('Cuestionario completado exitosamente', 'success');
        }
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error al finalizar cuestionario:', error);
        this.mostrarMensaje('Error al finalizar el cuestionario', 'error');
        this.loading = false;
      }
    });
  }
  
  todasRespondidas(): boolean {
    return this.cuestionariosEstado.factores.respondidas === this.cuestionariosEstado.factores.total;
  }
  
  calcularProgreso(tab: string): number {
    const estado = this.cuestionariosEstado[tab as keyof typeof this.cuestionariosEstado];
    return (estado.respondidas / estado.total) * 100;
  }
  
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
  
  verResultados(): void {
    // Implementar la navegación a la página de resultados
  }
  
  verificarTodosCompletados(): void {
    this.todosCompletados = this.cuestionariosEstado.factores.completado;
  }
  
  reiniciarCuestionarios(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se borrarán todas tus respuestas anteriores',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cuestionarioService.reiniciarCuestionarios().subscribe({
          next: (response) => {
            if (response.success) {
              this.todosCompletados = false;
              this.respuestas.factores = {};
              this.cuestionariosEstado.factores = {
                completado: false,
                respondidas: 0,
                total: this.cuestionarios.factores.length,
                id: 1
              };
              this.mostrarMensaje('Cuestionario reiniciado correctamente', 'success');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al reiniciar cuestionario:', error);
            this.mostrarMensaje('Error al reiniciar el cuestionario', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
