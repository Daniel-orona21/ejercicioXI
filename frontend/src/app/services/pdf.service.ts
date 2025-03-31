import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private resultadosComponent: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  // Registrar la instancia del componente de resultados cuando se inicializa
  registerResultadosComponent(component: any): void {
    this.resultadosComponent = component;
    console.log('ResultadosComponent registrado en PdfService');
  }

  // Desregistrar la instancia del componente cuando se destruye
  unregisterResultadosComponent(component: any): void {
    if (this.resultadosComponent === component) {
      this.resultadosComponent = null;
      console.log('ResultadosComponent desregistrado de PdfService');
    }
  }

  // Método para descargar el reporte personal
  descargarReportePersonal(): void {
    this.navegarYEjecutar('descargarReportePersonal');
  }

  // Método para descargar el reporte general
  descargarReporteGeneral(): void {
    this.navegarYEjecutar('descargarReporteGeneral');
  }

  // Método privado para navegar a resultados y ejecutar el método
  private navegarYEjecutar(metodo: string): void {
    // Si estamos en la página de resultados y el componente ya está registrado
    if (this.resultadosComponent && typeof this.resultadosComponent[metodo] === 'function') {
      console.log(`Ejecutando ${metodo} directamente`);
      this.resultadosComponent[metodo]();
    } else {
      // Navegar a la página de resultados y ejecutar el método después
      console.log(`Navegando a resultados y ejecutando ${metodo}`);
      this.router.navigate(['/dashboard/resultados']).then(() => {
        // Intentar ejecutar después de un tiempo para permitir que el componente se cargue
        setTimeout(() => {
          // Verificar si el componente se ha registrado después de la navegación
          if (this.resultadosComponent && typeof this.resultadosComponent[metodo] === 'function') {
            this.resultadosComponent[metodo]();
          } else {
            console.error(`No se encontró el método ${metodo} en el componente de resultados`);
            alert('No se pudo generar el PDF. Por favor, inténtelo de nuevo desde la página de resultados.');
          }
        }, 1000); // Tiempo suficiente para que el componente se cargue
      });
    }
  }
} 