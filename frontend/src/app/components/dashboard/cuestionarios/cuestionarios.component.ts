import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { InfoModalComponent } from './info-modal/info-modal.component';
import { FormsModule } from '@angular/forms';

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
  error = false;
  errorMessage = '';
  mostrandoCuestionario = false;
  cuestionarioCompletado = false;
  
  // Preguntas de ejemplo
  preguntas = [
    {id: 1, texto: 'Mi trabajo me exige hacer mucho esfuerzo físico.', es_opcional: false, orden: 1},
    {id: 2, texto: 'Me preocupa sufrir un accidente en mi trabajo.', es_opcional: false, orden: 2},
    {id: 3, texto: 'Considero que las actividades que realizo son peligrosas.', es_opcional: false, orden: 3},
    {id: 4, texto: 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno.', es_opcional: false, orden: 4},
    {id: 5, texto: 'Por la cantidad de trabajo que tengo debo laborar sin parar o con pocos descansos.', es_opcional: false, orden: 5}
  ];
  
  // Opciones de respuesta
  opcionesRespuesta = [
    {id: 1, texto: 'Siempre', valor: 4, orden: 1},
    {id: 2, texto: 'Casi siempre', valor: 3, orden: 2},
    {id: 3, texto: 'Algunas veces', valor: 2, orden: 3},
    {id: 4, texto: 'Casi nunca', valor: 1, orden: 4},
    {id: 5, texto: 'Nunca', valor: 0, orden: 5}
  ];
  
  // Respuestas y progreso
  respuestasSeleccionadas: { [key: number]: number } = {};
  preguntaActual = 0;
  progreso = {
    porcentajeTotal: 0,
    totalRespondidas: 0,
    totalAResponder: 5,
    esJefe: false
  };
  
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    // No hacemos nada para evitar la carga infinita
  }

  iniciarCuestionario(): void {
    // Mostrar el modal de información antes de comenzar
    const dialogRef = this.dialog.open(InfoModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado === 'aceptar') {
        this.mostrandoCuestionario = true;
      }
    });
  }
  
  continuarCuestionario(): void {
    this.mostrandoCuestionario = true;
  }
  
  guardarRespuesta(preguntaId: number, opcionId: number): void {
    this.respuestasSeleccionadas[preguntaId] = opcionId;
    
    // Actualizar el progreso
    this.progreso.totalRespondidas = Object.keys(this.respuestasSeleccionadas).length;
    this.progreso.porcentajeTotal = Math.round((this.progreso.totalRespondidas / this.progreso.totalAResponder) * 100);
    
    // Verificar si es la última pregunta
    if (this.preguntaActual < this.preguntas.length - 1) {
      this.preguntaActual++;
    } else {
      // Marcar como completado si se respondieron todas las preguntas
      if (this.progreso.porcentajeTotal === 100) {
        this.cuestionarioCompletado = true;
        this.mostrandoCuestionario = false;
  }
    }
  }
  
  preguntaAnterior(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
    }
  }
  
  volverAInicio(): void {
    this.mostrandoCuestionario = false;
  }
  
  esPreguntaRespondida(preguntaId: number): boolean {
    return this.respuestasSeleccionadas.hasOwnProperty(preguntaId);
  }
  
  verificarEstadoCuestionario(): void {
    this.error = false;
  }
}
