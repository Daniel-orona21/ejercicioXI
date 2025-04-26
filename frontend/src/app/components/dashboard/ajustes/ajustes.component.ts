import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss']
})
export class AjustesComponent implements OnInit {
  user: any = null;
  activeTab = 'perfil';
  
  // Configuraciones
  notificaciones = {
    email: true,
    sistema: true,
    reportes: false,
    nuevosUsuarios: true
  };
  
  temaOscuro = false;
  language = 'es';
  
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  guardarAjustes(): void {
    // Aquí iría la lógica para guardar las configuraciones
    Swal.fire({
      title: 'Éxito',
      text: 'Configuración guardada con éxito',
      icon: 'success',
      confirmButtonColor: '#3f51b5',
      confirmButtonText: 'Aceptar'
    });
  }
}
