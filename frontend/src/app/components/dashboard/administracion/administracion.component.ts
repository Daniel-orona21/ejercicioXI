import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuestionarioService } from '../../../services/cuestionario.service';
import { ToastrService } from 'ngx-toastr';

interface CorreccionResponse {
  success: boolean;
  message: string;
  correccionesRealizadas: number;
}

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AdministracionComponent implements OnInit {
  correccionMensaje: string = '';
  correccionExitosa: boolean = false;

  constructor(
    private cuestionarioService: CuestionarioService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Inicialización del componente
  }

  corregirRespuestasIncorrectas() {
    this.correccionMensaje = 'Procesando corrección...';
    this.correccionExitosa = true;

    this.cuestionarioService.corregirRespuestasIncorrectas().subscribe({
      next: (response: CorreccionResponse) => {
        console.log('Respuesta del servidor:', response);
        this.correccionMensaje = response.message;
        this.correccionExitosa = response.success;
        if (response.success) {
          this.toastr.success(`Corrección completada. ${response.correccionesRealizadas} respuestas corregidas.`);
        } else {
          this.toastr.error('Error al corregir respuestas.');
        }
      },
      error: (error: any) => {
        console.error('Error al corregir respuestas:', error);
        this.correccionMensaje = 'Error al corregir respuestas: ' + (error.error?.message || error.message || 'Error desconocido');
        this.correccionExitosa = false;
        this.toastr.error('Error al corregir respuestas.');
      }
    });
  }

  restaurarRespuestas() {
    this.correccionMensaje = 'Restaurando respuestas...';
    this.correccionExitosa = true;

    this.cuestionarioService.restaurarRespuestas().subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        this.correccionMensaje = response.message;
        this.correccionExitosa = response.success;
        if (response.success) {
          this.toastr.success(`Restauración completada. ${response.cuestionariosRestaurados?.length || 0} cuestionarios restaurados.`);
        } else {
          this.toastr.error('Error al restaurar respuestas.');
        }
      },
      error: (error: any) => {
        console.error('Error al restaurar respuestas:', error);
        this.correccionMensaje = 'Error al restaurar respuestas: ' + (error.error?.message || error.message || 'Error desconocido');
        this.correccionExitosa = false;
        this.toastr.error('Error al restaurar respuestas.');
      }
    });
  }
} 