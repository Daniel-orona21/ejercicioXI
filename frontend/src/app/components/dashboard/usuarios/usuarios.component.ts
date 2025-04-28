import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent {
  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario'
  };

  constructor(private http: HttpClient) { }

  crearUsuario(): void {
    this.http.post(`${environment.apiUrl}/auth/register`, this.nuevoUsuario).subscribe({
      next: () => {
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario creado correctamente',
          icon: 'success',
          confirmButtonColor: '#3f51b5'
        });
        this.nuevoUsuario = {
          nombre: '',
          email: '',
          password: '',
          rol: 'usuario'
        };
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        Swal.fire({
          title: 'Error',
          text: error.error.message || 'Error al crear el usuario',
          icon: 'error',
          confirmButtonColor: '#3f51b5'
        });
      }
    });
  }
} 