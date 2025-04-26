import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="info-modal">
      <div class="modal-header">
        <h2 class="info-modal-title">Evaluación de Factores de Riesgo Psicosocial</h2>
      </div>
      
      <div class="info-modal-content">
        <div class="content-section">
          <p>Esta evaluación tiene como <strong>objetivo identificar los factores de riesgo psicosocial</strong> 
          en su entorno laboral, permitiéndonos implementar medidas preventivas para mejorar las condiciones 
          de trabajo.</p>
          
          <div class="confidentiality-notice">
            <mat-icon>security</mat-icon>
            <p>La información proporcionada es <strong>estrictamente confidencial</strong> y será utilizada 
            únicamente con fines de diagnóstico e implementación de mejoras organizacionales.</p>
          </div>
        </div>
        
        <div class="content-section">
          <h3>Instrucciones:</h3>
          <ul>
            <li>
              <div class="list-item-content">
                <span class="bullet">•</span>
                <span>El cuestionario consta de 68 preguntas básicas más 4 adicionales si usted es jefe de otros trabajadores.</span>
              </div>
            </li>
            <li>
              <div class="list-item-content">
                <span class="bullet">•</span>
                <span>Lea cuidadosamente cada pregunta y seleccione la opción que mejor refleje su situación laboral.</span>
              </div>
            </li>
            <li>
              <div class="list-item-content">
                <span class="bullet">•</span>
                <span>Responda con sinceridad pensando en su experiencia durante los últimos 3 meses.</span>
              </div>
            </li>
            <li>
              <div class="list-item-content">
                <span class="bullet">•</span>
                <span>Todas las respuestas son válidas, no existen respuestas correctas o incorrectas.</span>
              </div>
            </li>
            <li>
              <div class="list-item-content">
                <span class="bullet">•</span>
                <span>Las opciones de respuesta son: Siempre, Casi siempre, Algunas veces, Casi nunca y Nunca.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div class="note-section">
          <p>Sus respuestas nos ayudarán a mejorar las condiciones de trabajo en la organización.</p>
        </div>
      </div>
      
      <div class="info-modal-actions">
        <button mat-raised-button color="primary" (click)="aceptar()" class="btn-comenzar">
          Aceptar y comenzar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .info-modal {
      padding: 0;
      max-width: 800px;
      border-radius: 12px;
      overflow: hidden;
      width: 95%;
      max-height: 90vh;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    
    .modal-header {
      background-color: #f5f7ff;
      padding: 20px;
      border-bottom: 1px solid #e0e4f4;
    }
    
    .info-modal-title {
      color: #3f51b5;
      margin: 0;
      text-align: center;
      font-size: 24px;
      font-weight: 600;
    }
    
    .info-modal-content {
      padding: 24px;
      overflow-y: auto;
    }
    
    .content-section {
      margin-bottom: 20px;
    }
    
    .info-modal-content p {
      margin-bottom: 16px;
      line-height: 1.5;
      font-size: 15px;
      color: #333;
    }
    
    .confidentiality-notice {
      display: flex;
      align-items: flex-start;
      background-color: #f8f9fa;
      padding: 14px;
      border-radius: 8px;
      border-left: 4px solid #3f51b5;
      margin: 16px 0;
    }
    
    .confidentiality-notice mat-icon {
      color: #3f51b5;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    .confidentiality-notice p {
      margin: 0;
      flex: 1;
    }
    
    .info-modal-content h3 {
      margin: 0 0 16px;
      color: #3f51b5;
      font-size: 18px;
      font-weight: 600;
    }
    
    .info-modal-content ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      width: 100%;
    }
    
    .info-modal-content li {
      margin-bottom: 12px;
    }
    
    .list-item-content {
      display: flex;
      align-items: flex-start;
    }
    
    .bullet {
      color: #3f51b5;
      font-size: 18px;
      margin-right: 10px;
      line-height: 1.4;
      flex-shrink: 0;
    }
    
    .note-section {
      background-color: #f5f7ff;
      padding: 14px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .note-section p {
      margin: 0;
      font-weight: 500;
      color: #3f51b5;
      text-align: center;
    }
    
    .info-modal-actions {
      display: flex;
      justify-content: center;
      padding: 20px;
      border-top: 1px solid #e0e4f4;
      background-color: #f9fafc;
      margin-top: auto;
    }
    
    .btn-comenzar {
      padding: 10px 32px;
      font-size: 16px;
      border-radius: 8px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      width: 100%;
      max-width: 300px;
    }
    
    .btn-comenzar:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(63, 81, 181, 0.25);
    }
    
    @media (min-width: 768px) {
      .info-modal-content {
        padding: 28px;
      }
      
      .modal-header {
        padding: 24px;
      }
      
      .info-modal-title {
        font-size: 26px;
      }
      
      .info-modal-content ul {
        display: flex;
        flex-wrap: wrap;
      }
      
      .info-modal-content li {
        width: 100%;
      }
      
      /* En pantallas más grandes, ponemos las instrucciones en dos columnas */
      @media (min-width: 1024px) {
        .info-modal-content li {
          width: 50%;
          padding-right: 16px;
          box-sizing: border-box;
        }
      }
    }
  `]
})
export class InfoModalComponent {
  constructor(private dialogRef: MatDialogRef<InfoModalComponent>) {}

  aceptar(): void {
    this.dialogRef.close('aceptar');
  }
} 