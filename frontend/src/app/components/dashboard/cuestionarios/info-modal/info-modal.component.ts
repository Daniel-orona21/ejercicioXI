import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="info-modal">
      <h2 class="info-modal-title">Evaluación de Factores de Riesgo Psicosocial</h2>
      
      <div class="info-modal-content">
        <p>Esta evaluación tiene como <strong>objetivo identificar los factores de riesgo psicosocial</strong> 
        en su entorno laboral, permitiéndonos implementar medidas preventivas para mejorar las condiciones 
        de trabajo.</p>
        
        <p>La información proporcionada es <strong>estrictamente confidencial</strong> y será utilizada 
        únicamente con fines de diagnóstico e implementación de mejoras organizacionales.</p>
        
        <h3>Instrucciones:</h3>
        <ul>
          <li>El cuestionario consta de 68 preguntas básicas más 4 adicionales si usted es jefe de otros trabajadores.</li>
          <li>Lea cuidadosamente cada pregunta y seleccione la opción que mejor refleje su situación laboral.</li>
          <li>Responda con sinceridad pensando en su experiencia durante los últimos 3 meses.</li>
          <li>Todas las respuestas son válidas, no existen respuestas correctas o incorrectas.</li>
          <li>Las opciones de respuesta son: Siempre, Casi siempre, Algunas veces, Casi nunca y Nunca.</li>
        </ul>
        
        <p>Sus respuestas nos ayudarán a mejorar las condiciones de trabajo en la organización.</p>
      </div>
      
      <div class="info-modal-actions">
        <button mat-raised-button color="primary" (click)="aceptar()">
          Aceptar y comenzar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .info-modal {
      padding: 20px;
      max-width: 600px;
    }
    
    .info-modal-title {
      color: #3f51b5;
      margin-bottom: 20px;
      text-align: center;
      font-size: 24px;
    }
    
    .info-modal-content {
      margin-bottom: 30px;
    }
    
    .info-modal-content p {
      margin-bottom: 15px;
      line-height: 1.5;
    }
    
    .info-modal-content h3 {
      margin: 20px 0 10px;
      color: #3f51b5;
    }
    
    .info-modal-content ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    
    .info-modal-content li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    .info-modal-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class InfoModalComponent {
  constructor(private dialogRef: MatDialogRef<InfoModalComponent>) {}

  aceptar(): void {
    this.dialogRef.close('aceptar');
  }
} 