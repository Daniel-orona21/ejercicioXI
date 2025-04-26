import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cuestionarios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cuestionarios.component.html',
  styleUrls: ['./cuestionarios.component.scss']
})
export class CuestionariosComponent {
  // Componente simplificado que mantiene la navegación
}
