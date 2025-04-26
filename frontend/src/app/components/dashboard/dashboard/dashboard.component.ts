import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  isSidebarCollapsed = false;
  private selectTabListener: any;
  private isResultadosPage = false;
  
  // Agregar indicador de carga
  isGeneratingPdf = false;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar la ruta actual para saber si estamos en la página de resultados
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isResultadosPage = event.url.includes('/dashboard/resultados');
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    
    // Escuchar el evento personalizado para cambiar de tab
    this.selectTabListener = (event: CustomEvent) => {
      if (event.detail && event.detail.tab) {
        this.navigateTo(event.detail.tab);
      }
    };
    
    document.addEventListener('selectTab', this.selectTabListener);
  }
  
  ngOnDestroy(): void {
    // Limpiar el event listener cuando se destruya el componente
    if (this.selectTabListener) {
      document.removeEventListener('selectTab', this.selectTabListener);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate(['/dashboard', route]);
  }
  
  // Métodos para descargar reportes
  descargarReportePersonal(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }
    
    // Si no estamos en la página de resultados, navegar primero
    if (!this.isResultadosPage) {
      this.router.navigate(['/dashboard/resultados']).then(() => {
        // Dar tiempo a que cargue la página
        setTimeout(() => {
          this.ejecutarDescargaPersonal();
        }, 1000);
      });
    } else {
      this.ejecutarDescargaPersonal();
    }
  }
  
  descargarReporteGeneral(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }
    
    // Si no estamos en la página de resultados, navegar primero
    if (!this.isResultadosPage) {
      this.router.navigate(['/dashboard/resultados']).then(() => {
        // Dar tiempo a que cargue la página
        setTimeout(() => {
          this.ejecutarDescargaGeneral();
        }, 1000);
      });
    } else {
      this.ejecutarDescargaGeneral();
    }
  }
  
  // Métodos auxiliares para ejecutar la descarga
  private async ejecutarDescargaPersonal(): Promise<void> {
    // Verificar si hay resultados personales
    const elementosPersonales = document.querySelectorAll('.risk-cards-row, .analysis-section, .recommendations-section');
    
    if (elementosPersonales.length === 0) {
      Swal.fire({
        title: 'Información',
        text: 'Para descargar tu reporte personal, primero debes completar al menos un cuestionario.',
        icon: 'info',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Entendido'
      });
      this.router.navigate(['/dashboard/cuestionarios']);
      return;
    }
    
    // Obtener la fecha actual para el nombre del archivo
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `mi_reporte_nom035_${fecha}.pdf`;
    
    try {
      // Mostrar indicador de carga
      this.isGeneratingPdf = true;
      
      await this.generarPDF(
        elementosPersonales, 
        nombreArchivo, 
        'Mi Reporte de Evaluación NOM-035'
      );
    } catch (error) {
      console.error('Error al generar el PDF personal:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ha ocurrido un error al generar el PDF. Por favor, inténtelo de nuevo.',
        icon: 'error',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      // Ocultar indicador de carga independientemente del resultado
      this.isGeneratingPdf = false;
    }
  }
  
  private async ejecutarDescargaGeneral(): Promise<void> {
    // Seleccionar el contenedor principal
    const dashboardContainer = document.querySelector('.results-dashboard');
    if (!dashboardContainer) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró el contenedor de resultados. Por favor, intente de nuevo.',
        icon: 'error',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Determinar qué secciones incluir basado en si el usuario ha completado evaluaciones
    const resultadosPersonales = document.querySelectorAll('.risk-cards-row');
    let elementos;
    
    if (resultadosPersonales && resultadosPersonales.length > 0) {
      // Usuario con evaluaciones - incluir resultados globales y medidas preventivas
      elementos = document.querySelectorAll('.global-stats-section, .preventive-measures-section, .normative-compliance-section');
    } else {
      // Usuario sin evaluaciones - incluir todo el dashboard excepto el banner de notificación
      const childElements = dashboardContainer.querySelectorAll(':scope > div:not(.notification-banner)');
      elementos = childElements;
    }
    
    if (elementos.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontraron elementos para generar el reporte. Por favor, intente de nuevo.',
        icon: 'error',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Obtener la fecha actual para el nombre del archivo
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `reporte_general_nom035_${fecha}.pdf`;
    
    try {
      // Mostrar indicador de carga
      this.isGeneratingPdf = true;
      
      await this.generarPDF(
        elementos, 
        nombreArchivo, 
        'Reporte General NOM-035'
      );
    } catch (error) {
      console.error('Error al generar el PDF general:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ha ocurrido un error al generar el PDF. Por favor, inténtelo de nuevo.',
        icon: 'error',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      // Ocultar indicador de carga independientemente del resultado
      this.isGeneratingPdf = false;
    }
  }
  
  // Método para generar PDF
  private async generarPDF(elementos: NodeListOf<Element>, nombreArchivo: string, titulo: string): Promise<void> {
    console.log('Iniciando generación de PDF:', nombreArchivo);
    
    // Importar las bibliotecas de forma dinámica
    try {
      const html2canvasModule = await import('html2canvas');
      const jsPDFModule = await import('jspdf');
      
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;
      
      console.log('Bibliotecas cargadas correctamente');
      
      // Crear un nuevo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      // Añadir título
      pdf.setFontSize(18);
      pdf.setTextColor(30, 42, 74); // Color similar a $secondary
      pdf.text(titulo, width / 2, 20, { align: 'center' });
      
      // Añadir fecha
      pdf.setFontSize(10);
      pdf.setTextColor(108, 117, 125); // Color similar a $gray-600
      const fechaGeneracion = `Generado el: ${new Date().toLocaleDateString()}`;
      pdf.text(fechaGeneracion, width / 2, 28, { align: 'center' });
      
      // Contador para la posición vertical en el PDF
      let yPos = 35;
      
      console.log('Procesando', elementos.length, 'elementos');
      
      // Convertir cada elemento a imagen y añadirlo al PDF
      for (let i = 0; i < elementos.length; i++) {
        const elemento = elementos[i] as HTMLElement;
        
        // Saltar elementos que no deberían estar en el PDF o están vacíos
        if (elemento.classList.contains('notification-banner') || 
            elemento.offsetHeight === 0 || 
            elemento.offsetWidth === 0) {
          console.log('Saltando elemento:', elemento.className);
          continue;
        }
        
        console.log('Procesando elemento', i+1, 'de', elementos.length, ':', elemento.className);
        
        try {
          // Convertir elemento a canvas
          const canvas = await html2canvas(elemento, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          // Convertir canvas a imagen
          const imgData = canvas.toDataURL('image/png');
          
          // Calcular el tamaño proporcional para que encaje en el ancho de la página
          const imgWidth = width - 20; // 10mm de margen a cada lado
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          console.log('Dimensiones de imagen:', imgWidth, 'x', imgHeight);
          
          // Si la imagen no cabe en lo que queda de página, crear una nueva
          if (yPos + imgHeight > height - 10) {
            console.log('Añadiendo nueva página');
            pdf.addPage();
            yPos = 20; // Reiniciar la posición vertical
          }
          
          // Añadir la imagen al PDF
          pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
          
          // Actualizar la posición vertical para el siguiente elemento
          yPos += imgHeight + 10; // 10mm de espacio entre elementos
        } catch (elementError) {
          console.error('Error al procesar elemento:', elementError);
          // Continuar con el siguiente elemento si hay un error
          continue;
        }
      }
      
      console.log('PDF generado correctamente, guardando como', nombreArchivo);
      
      // Guardar el PDF
      pdf.save(nombreArchivo);
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      throw error;
    }
  }
}
