import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contestar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="contestar-container">
      <div class="contestar-card">
        <div class="header">
          <h2>Evaluación de Factores de Riesgo Psicosocial</h2>
          <p>Aquí aparecerán las preguntas del cuestionario cuando lo implementemos.</p>
        </div>
        
        <div class="placeholder-content">
          <mat-icon class="placeholder-icon">assignment</mat-icon>
          <p>Este componente se implementará en el siguiente paso.</p>
        </div>
        
        <div class="actions">
          <button mat-raised-button color="warn" routerLink="/dashboard/cuestionarios">
            Volver
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contestar-container {
      display: flex;
      justify-content: center;
      padding: 40px 20px;
      min-height: calc(100vh - 120px);
      background-color: #f5f7fa;
    }
    
    .contestar-card {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 800px;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      
      h2 {
        color: #3f51b5;
        font-size: 28px;
        margin-bottom: 15px;
      }
      
      p {
        color: #5f6368;
        font-size: 16px;
      }
    }
    
    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      background-color: #f8f9ff;
      border-radius: 10px;
      margin: 30px 0;
      
      .placeholder-icon {
        font-size: 80px;
        height: 80px;
        width: 80px;
        color: #3f51b5;
        margin-bottom: 20px;
      }
      
      p {
        color: #5f6368;
        font-size: 18px;
      }
    }
    
    .actions {
      display: flex;
      justify-content: center;
      margin-top: 30px;
    }
  `]
})
export class ContestarComponent {
  // Este componente se implementará completamente en el siguiente paso
} 