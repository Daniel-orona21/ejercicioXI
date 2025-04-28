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
  public isResultadosPage = false;
  public isDatosGeneralesPage = false;
  public isDetalleUsuarioPage = false;
  
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
      this.isDatosGeneralesPage = event.url.includes('/dashboard/datos-generales');
      this.isDetalleUsuarioPage = event.url.includes('/dashboard/detalle-usuario');
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
  
  // Método para descargar reporte según la página actual
  descargarReporte(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }

    if (this.isDatosGeneralesPage) {
      this.ejecutarDescargaGeneral();
    } else if (this.isDetalleUsuarioPage) {
      this.ejecutarDescargaPersonal();
    } else {
      Swal.fire({
        title: 'Información',
        text: 'Esta función solo está disponible en las secciones de Datos Generales y Detalle de Usuario.',
        icon: 'info',
        confirmButtonColor: '#3f51b5',
        confirmButtonText: 'Entendido'
      });
    }
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
    if (this.isDetalleUsuarioPage) {
      try {
        this.isGeneratingPdf = true;
        const tempContainer = document.createElement('div');
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.fontSize = '15px';
        tempContainer.style.padding = '32px 32px 24px 32px';
        tempContainer.style.margin = '0 auto';
        tempContainer.style.maxWidth = '900px';
        tempContainer.style.backgroundColor = '#fff';
        tempContainer.style.borderRadius = '10px';
        tempContainer.style.boxShadow = '0 0 12px rgba(0,0,0,0.08)';
        tempContainer.style.color = '#222';
        // TÍTULO Y SUBTÍTULO AGRUPADOS
        const titleSection = document.createElement('div');
        titleSection.style.marginBottom = '28px';
        titleSection.style.borderBottom = '2px solid #3f51b5';
        titleSection.style.paddingBottom = '14px';
        // Título
        const titulo = document.createElement('h1');
        titulo.textContent = 'Reporte de Evaluación NOM-035';
        titulo.style.color = '#3f51b5';
        titulo.style.margin = '0 0 7px 0';
        titulo.style.fontSize = '26px';
        titulo.style.letterSpacing = '0.5px';
        titulo.style.textAlign = 'left';
        titleSection.appendChild(titulo);
        // Subtítulo
        const subtitulo = document.createElement('div');
        subtitulo.textContent = 'IDENTIFICACIÓN Y ANÁLISIS DE LOS FACTORES DE RIESGO PSICOSOCIAL Y EVALUACIÓN DEL ENTORNO ORGANIZACIONAL EN LOS CENTROS DE TRABAJO';
        subtitulo.style.fontSize = '15px';
        subtitulo.style.color = '#222';
        subtitulo.style.margin = '0 0 12px 0';
        subtitulo.style.fontWeight = '500';
        subtitulo.style.letterSpacing = '0.1px';
        titleSection.appendChild(subtitulo);
        tempContainer.appendChild(titleSection);
        // Información del usuario SOLO UNA VEZ
        const infoUsuario = document.createElement('div');
        infoUsuario.style.backgroundColor = '#f8f9fa';
        infoUsuario.style.borderRadius = '7px';
        infoUsuario.style.padding = '18px 20px 12px 20px';
        infoUsuario.style.marginBottom = '28px';
        infoUsuario.style.display = 'grid';
        infoUsuario.style.gridTemplateColumns = 'repeat(2, 1fr)';
        infoUsuario.style.gap = '12px';
        const infoTitle = document.createElement('h2');
        infoTitle.textContent = 'Información del Usuario';
        infoTitle.style.fontSize = '18px';
        infoTitle.style.margin = '0 0 12px 0';
        infoTitle.style.color = '#3f51b5';
        infoTitle.style.gridColumn = '1 / span 2';
        infoUsuario.appendChild(infoTitle);
        const userInfo = {
          email: document.querySelector('.info-item:nth-child(1) .info-value')?.textContent?.trim() || 'No disponible',
          totalRespuestas: document.querySelector('.info-item:nth-child(2) .info-value')?.textContent?.trim() || 'No disponible',
          preguntasObligatorias: document.querySelector('.info-item:nth-child(3) .info-value')?.textContent?.trim() || 'No disponible',
          esJefe: document.querySelector('.info-item:nth-child(4) .info-value')?.textContent?.trim() || 'No',
          brindaServicio: document.querySelector('.info-item:nth-child(5) .info-value')?.textContent?.trim() || 'No'
        };
        const infoFields = [
          { label: 'Email:', value: userInfo.email },
          { label: 'Total respuestas:', value: userInfo.totalRespuestas },
          { label: 'Preguntas obligatorias:', value: userInfo.preguntasObligatorias },
          { label: 'Es jefe de otros trabajadores:', value: userInfo.esJefe },
          { label: 'Brinda servicio a clientes:', value: userInfo.brindaServicio }
        ];
        infoFields.forEach(field => {
          const fieldItem = document.createElement('div');
          fieldItem.style.display = 'flex';
          fieldItem.style.margin = '6px 0';
          const label = document.createElement('div');
          label.textContent = field.label;
          label.style.fontWeight = 'bold';
          label.style.fontSize = '15px';
          label.style.width = '180px';
          label.style.flexShrink = '0';
          fieldItem.appendChild(label);
          const value = document.createElement('div');
          value.textContent = field.value;
          value.style.fontSize = '15px';
          fieldItem.appendChild(value);
          infoUsuario.appendChild(fieldItem);
        });
        tempContainer.appendChild(infoUsuario);
        // Nivel de riesgo total
        const riesgoTotalSection = document.createElement('div');
        riesgoTotalSection.style.marginBottom = '18px';
        const riesgoTotalTitle = document.createElement('h2');
        riesgoTotalTitle.textContent = 'Nivel de riesgo total';
        riesgoTotalTitle.style.fontSize = '17px';
        riesgoTotalTitle.style.color = '#3f51b5';
        riesgoTotalTitle.style.margin = '0 0 8px 0';
        riesgoTotalSection.appendChild(riesgoTotalTitle);
        const riesgoBadge = document.querySelector('.riesgo-badge');
        const riesgoValor = document.querySelector('.riesgo-value');
        const riesgoDiv = document.createElement('div');
        riesgoDiv.style.display = 'flex';
        riesgoDiv.style.alignItems = 'center';
        riesgoDiv.style.gap = '18px';
        if (riesgoBadge) {
          const badge = document.createElement('span');
          badge.textContent = riesgoBadge.textContent?.trim() || '';
          const badgeBg = riesgoBadge.getAttribute('style')?.match(/background-color:([^;]+)/)?.[1] || '#d9d9d9';
          badge.style.background = badgeBg;
          // Contraste de texto
          function getContrastYIQ(hexcolor: string) {
            hexcolor = hexcolor.replace('#', '').trim();
            if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(x => x + x).join('');
            const r = parseInt(hexcolor.substr(0,2),16);
            const g = parseInt(hexcolor.substr(2,2),16);
            const b = parseInt(hexcolor.substr(4,2),16);
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128) ? '#222' : '#fff';
          }
          badge.style.color = getContrastYIQ(badgeBg.replace(' ',''));
          badge.style.fontWeight = 'bold';
          badge.style.fontSize = '16px';
          badge.style.padding = '6px 18px';
          badge.style.borderRadius = '16px';
          badge.style.marginRight = '10px';
          riesgoDiv.appendChild(badge);
        }
        if (riesgoValor) {
          const valor = document.createElement('span');
          valor.textContent = riesgoValor.textContent || '';
          valor.style.fontSize = '15px';
          valor.style.color = '#222';
          riesgoDiv.appendChild(valor);
        }
        riesgoTotalSection.appendChild(riesgoDiv);
        tempContainer.appendChild(riesgoTotalSection);
        // Criterios para la toma de acciones
        const criteriosSection = document.createElement('div');
        criteriosSection.style.marginBottom = '18px';
        const criteriosTitle = document.createElement('h2');
        criteriosTitle.textContent = 'Criterios para la toma de acciones';
        criteriosTitle.style.fontSize = '17px';
        criteriosTitle.style.color = '#3f51b5';
        criteriosTitle.style.margin = '0 0 8px 0';
        criteriosSection.appendChild(criteriosTitle);
        const criteriosTexto = document.querySelector('.criterios-accion p');
        const criteriosP = document.createElement('p');
        criteriosP.textContent = criteriosTexto?.textContent || '';
        criteriosP.style.fontSize = '15px';
        criteriosP.style.margin = '0';
        criteriosSection.appendChild(criteriosP);
        tempContainer.appendChild(criteriosSection);
        // Niveles de riesgo por categoría
        const sumasPorCategoria = Array.from(document.querySelectorAll('.categoria-stat-item'));
        if (sumasPorCategoria.length > 0) {
          const catSummarySection = document.createElement('div');
          catSummarySection.style.marginBottom = '24px';
          const catSummaryTitle = document.createElement('h2');
          catSummaryTitle.textContent = 'Niveles de riesgo por categoría';
          catSummaryTitle.style.fontSize = '17px';
          catSummaryTitle.style.color = '#3f51b5';
          catSummaryTitle.style.margin = '0 0 8px 0';
          catSummarySection.appendChild(catSummaryTitle);
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '15px';
          table.style.marginBottom = '0';
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          headerRow.style.backgroundColor = '#f2f2f2';
          ['Categoría', 'Calificación', 'Nivel de riesgo'].forEach((text, i) => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '10px 10px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '1px solid #ddd';
            if (i === 0) th.style.width = '50%';
            if (i === 1) th.style.width = '25%';
            if (i === 2) th.style.width = '25%';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          sumasPorCategoria.forEach(cat => {
            const row = document.createElement('tr');
            const catName = cat.querySelector('.categoria-name')?.textContent || '';
            const catSum = cat.querySelector('.sum-value')?.textContent?.replace('Suma: ', '') || '';
            const catNivel = cat.querySelector('.risk-level')?.textContent || '';
            const catColor = cat.querySelector('.risk-level')?.getAttribute('style')?.match(/background-color:([^;]+)/)?.[1] || '#d9d9d9';
            // Categoría
            const tdCat = document.createElement('td');
            tdCat.textContent = catName;
            tdCat.style.padding = '10px 10px';
            tdCat.style.verticalAlign = 'top';
            row.appendChild(tdCat);
            // Calificación (ahora suma)
            const tdCal = document.createElement('td');
            tdCal.textContent = catSum;
            tdCal.style.padding = '10px 10px';
            tdCal.style.verticalAlign = 'top';
            row.appendChild(tdCal);
            // Nivel de riesgo
            const tdNivel = document.createElement('td');
            tdNivel.textContent = catNivel;
            tdNivel.style.padding = '10px 10px';
            tdNivel.style.fontWeight = 'bold';
            tdNivel.style.background = catColor;
            tdNivel.style.color = '#222';
            tdNivel.style.textAlign = 'center';
            tdNivel.style.verticalAlign = 'middle';
            tdNivel.style.borderRadius = '0';
            row.appendChild(tdNivel);
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          catSummarySection.appendChild(table);
          tempContainer.appendChild(catSummarySection);
        }
        // Obtener todas las categorías de preguntas y construir secciones
        const acordeones = document.querySelectorAll('.accordion-item');
        let hasProcessedItems = false;
        
        acordeones.forEach(acordeon => {
          const categoriaTitle = acordeon.querySelector('.categoria-title')?.textContent || 'Categoría sin nombre';
          const preguntas = acordeon.querySelectorAll('.respuestas-table table tr');
          if (!preguntas || preguntas.length <= 1) return;
          hasProcessedItems = true;
          const categoriaSection = document.createElement('div');
          categoriaSection.style.marginBottom = '22px';
          const categoriaTitleEl = document.createElement('h2');
          categoriaTitleEl.textContent = categoriaTitle;
          categoriaTitleEl.style.color = '#3f51b5';
          categoriaTitleEl.style.fontSize = '17px';
          categoriaTitleEl.style.margin = '0 0 10px 0';
          categoriaTitleEl.style.paddingBottom = '5px';
          categoriaTitleEl.style.borderBottom = '1px solid #ddd';
          categoriaSection.appendChild(categoriaTitleEl);
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '15px';
          table.style.marginBottom = '0';
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          headerRow.style.backgroundColor = '#f2f2f2';
          const preguntaHeader = document.createElement('th');
          preguntaHeader.textContent = 'Pregunta';
          preguntaHeader.style.padding = '10px 10px';
          preguntaHeader.style.textAlign = 'left';
          preguntaHeader.style.borderBottom = '1px solid #ddd';
          preguntaHeader.style.width = '75%';
          headerRow.appendChild(preguntaHeader);
          const respuestaHeader = document.createElement('th');
          respuestaHeader.textContent = 'Respuesta';
          respuestaHeader.style.padding = '10px 10px';
          respuestaHeader.style.textAlign = 'left';
          respuestaHeader.style.borderBottom = '1px solid #ddd';
          respuestaHeader.style.width = '25%';
          headerRow.appendChild(respuestaHeader);
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          Array.from(preguntas).forEach((tr, index) => {
            if (index === 0) return;
            const newRow = document.createElement('tr');
            newRow.style.borderBottom = '1px solid #eee';
            const cells = tr.querySelectorAll('td');
            if (cells && cells.length >= 2) {
              const preguntaCell = document.createElement('td');
              preguntaCell.textContent = cells[0].textContent || '';
              preguntaCell.style.padding = '10px 10px';
              preguntaCell.style.verticalAlign = 'top';
              const respuestaCell = document.createElement('td');
              respuestaCell.textContent = cells[1].textContent || '';
              respuestaCell.style.padding = '10px 10px';
              respuestaCell.style.fontWeight = 'bold';
              respuestaCell.style.verticalAlign = 'top';
              newRow.appendChild(preguntaCell);
              newRow.appendChild(respuestaCell);
              tbody.appendChild(newRow);
            }
          });
          table.appendChild(tbody);
          categoriaSection.appendChild(table);
          tempContainer.appendChild(categoriaSection);
        });
        if (!hasProcessedItems) {
          const noDataMsg = document.createElement('div');
          noDataMsg.textContent = 'No se encontraron datos de preguntas y respuestas para mostrar.';
          noDataMsg.style.padding = '20px';
          noDataMsg.style.textAlign = 'center';
          noDataMsg.style.color = '#666';
          tempContainer.appendChild(noDataMsg);
        }
        const footer = document.createElement('div');
        footer.style.marginTop = '24px';
        footer.style.paddingTop = '10px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.color = '#666';
        footer.style.fontSize = '12px';
        footer.style.textAlign = 'center';
        footer.textContent = 'Este reporte contiene los resultados de la evaluación NOM-035-STPS-2018 y es confidencial.';
        tempContainer.appendChild(footer);
        document.body.appendChild(tempContainer);
        const fechaArchivo = new Date().toISOString().slice(0, 10);
        const nombreArchivo = `reporte_nom035_${fechaArchivo}.pdf`;
        await this.generarPDFOptimizado(tempContainer, nombreArchivo, 'Reporte NOM-035');
        document.body.removeChild(tempContainer);
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
        this.isGeneratingPdf = false;
      }
    } else {
      // Si no estamos en la página de detalle de usuario, usar el comportamiento original
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
  }
  
  private async ejecutarDescargaGeneral(): Promise<void> {
    let elementos;
    if (this.isDatosGeneralesPage) {
      try {
        this.isGeneratingPdf = true;
        const tempContainer = document.createElement('div');
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.fontSize = '15px';
        tempContainer.style.padding = '32px 32px 24px 32px';
        tempContainer.style.margin = '0 auto';
        tempContainer.style.maxWidth = '900px';
        tempContainer.style.backgroundColor = '#fff';
        tempContainer.style.borderRadius = '10px';
        tempContainer.style.boxShadow = '0 0 12px rgba(0,0,0,0.08)';
        tempContainer.style.color = '#222';
        // Header
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '28px';
        headerRow.style.borderBottom = '2px solid #3f51b5';
        headerRow.style.paddingBottom = '14px';
        const titleSection = document.createElement('div');
        const titulo = document.createElement('h1');
        titulo.textContent = 'Reporte General de Evaluaciones NOM-035';
        titulo.style.color = '#3f51b5';
        titulo.style.margin = '0 0 7px 0';
        titulo.style.fontSize = '26px';
        titulo.style.letterSpacing = '0.5px';
        titleSection.appendChild(titulo);
        // SUBTÍTULO
        const subtitulo = document.createElement('div');
        subtitulo.textContent = 'IDENTIFICACIÓN Y ANÁLISIS DE LOS FACTORES DE RIESGO PSICOSOCIAL Y EVALUACIÓN DEL ENTORNO ORGANIZACIONAL EN LOS CENTROS DE TRABAJO';
        subtitulo.style.fontSize = '15px';
        subtitulo.style.color = '#222';
        subtitulo.style.margin = '0 0 12px 0';
        subtitulo.style.fontWeight = '500';
        subtitulo.style.letterSpacing = '0.1px';
        titleSection.appendChild(subtitulo);
        const fecha = document.createElement('p');
        fecha.textContent = `Fecha: ${new Date().toLocaleDateString()}`;
        fecha.style.fontSize = '14px';
        fecha.style.margin = '0';
        fecha.style.color = '#666';
        titleSection.appendChild(fecha);
        headerRow.appendChild(titleSection);
        tempContainer.appendChild(headerRow);
        // Estadísticas principales
        const statsCards = Array.from(document.querySelectorAll('.stats-cards .stat-card'));
        if (statsCards.length > 0) {
          const statsSection = document.createElement('div');
          statsSection.style.display = 'flex';
          statsSection.style.gap = '24px';
          statsSection.style.marginBottom = '24px';
          statsCards.forEach(card => {
            const statDiv = document.createElement('div');
            statDiv.style.background = '#f8f9fa';
            statDiv.style.borderRadius = '7px';
            statDiv.style.padding = '18px 20px 12px 20px';
            statDiv.style.flex = '1';
            statDiv.style.display = 'flex';
            statDiv.style.flexDirection = 'column';
            statDiv.style.alignItems = 'center';
            statDiv.style.boxShadow = '0 0 4px rgba(0,0,0,0.04)';
            const title = card.querySelector('h3')?.textContent || '';
            const value = card.querySelector('.stat-number, .nivel-riesgo-badge')?.textContent || '';
            const color = card.querySelector('.nivel-riesgo-badge')?.getAttribute('style')?.match(/background-color:([^;]+)/)?.[1] || '#e0e0e0';
            const titleEl = document.createElement('div');
            titleEl.textContent = title;
            titleEl.style.fontWeight = 'bold';
            titleEl.style.fontSize = '16px';
            titleEl.style.marginBottom = '8px';
            statDiv.appendChild(titleEl);
            const valueEl = document.createElement('div');
            valueEl.textContent = value;
            valueEl.style.fontSize = '22px';
            valueEl.style.fontWeight = 'bold';
            valueEl.style.background = color;
            valueEl.style.color = '#222';
            valueEl.style.padding = '6px 18px';
            valueEl.style.borderRadius = '16px';
            statDiv.appendChild(valueEl);
            statsSection.appendChild(statDiv);
          });
          tempContainer.appendChild(statsSection);
        }
        // Criterios para la toma de acciones (si existen)
        const criteriosTexto = document.querySelector('.criterios-accion p');
        if (criteriosTexto) {
          const criteriosSection = document.createElement('div');
          criteriosSection.style.marginBottom = '18px';
          const criteriosTitle = document.createElement('h2');
          criteriosTitle.textContent = 'Criterios para la toma de acciones';
          criteriosTitle.style.fontSize = '17px';
          criteriosTitle.style.color = '#3f51b5';
          criteriosTitle.style.margin = '0 0 8px 0';
          criteriosSection.appendChild(criteriosTitle);
          const criteriosP = document.createElement('p');
          criteriosP.textContent = criteriosTexto?.textContent || '';
          criteriosP.style.fontSize = '15px';
          criteriosP.style.margin = '0';
          criteriosSection.appendChild(criteriosP);
          tempContainer.appendChild(criteriosSection);
        }
        // Distribución de riesgo
        const distribucionItems = Array.from(document.querySelectorAll('.distribution-item'));
        if (distribucionItems.length > 0) {
          const distSection = document.createElement('div');
          distSection.style.marginBottom = '24px';
          const distTitle = document.createElement('h2');
          distTitle.textContent = 'Distribución por Nivel de Riesgo';
          distTitle.style.fontSize = '17px';
          distTitle.style.color = '#3f51b5';
          distTitle.style.margin = '0 0 8px 0';
          distSection.appendChild(distTitle);
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '15px';
          table.style.marginBottom = '0';
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Nivel', 'Usuarios', 'Porcentaje'].forEach((text, i) => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '10px 10px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '1px solid #ddd';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          distribucionItems.forEach(item => {
            const row = document.createElement('tr');
            const nivel = item.querySelector('.item-label')?.textContent || '';
            const usuarios = item.querySelector('.item-value')?.textContent || '';
            const porcentaje = item.querySelector('.item-percentage')?.textContent || '';
            const color = item.getAttribute('style')?.match(/border-left-color:([^;]+)/)?.[1] || '#e0e0e0';
            // Nivel
            const tdNivel = document.createElement('td');
            tdNivel.textContent = nivel;
            tdNivel.style.padding = '10px 10px';
            tdNivel.style.verticalAlign = 'top';
            tdNivel.style.background = color;
            tdNivel.style.color = '#222';
            tdNivel.style.textAlign = 'center';
            tdNivel.style.borderRadius = '0';
            row.appendChild(tdNivel);
            // Usuarios
            const tdUsuarios = document.createElement('td');
            tdUsuarios.textContent = usuarios;
            tdUsuarios.style.padding = '10px 10px';
            tdUsuarios.style.verticalAlign = 'top';
            row.appendChild(tdUsuarios);
            // Porcentaje
            const tdPorc = document.createElement('td');
            tdPorc.textContent = porcentaje;
            tdPorc.style.padding = '10px 10px';
            tdPorc.style.verticalAlign = 'top';
            row.appendChild(tdPorc);
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          distSection.appendChild(table);
          tempContainer.appendChild(distSection);
        }
        // Tabla de promedios por categoría
        const catPromediosRows = Array.from(document.querySelectorAll('.data-section.risk-distribution + .data-section table tbody tr'));
        if (catPromediosRows.length > 0) {
          const catPromSection = document.createElement('div');
          catPromSection.style.marginBottom = '24px';
          const catPromTitle = document.createElement('h2');
          catPromTitle.textContent = 'Promedios por Categoría';
          catPromTitle.style.fontSize = '17px';
          catPromTitle.style.color = '#3f51b5';
          catPromTitle.style.margin = '0 0 8px 0';
          catPromSection.appendChild(catPromTitle);
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '15px';
          table.style.marginBottom = '0';
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Categoría', 'Promedio', 'Nivel de riesgo'].forEach((text, i) => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '10px 10px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '1px solid #ddd';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          catPromediosRows.forEach(rowEl => {
            const row = document.createElement('tr');
            const cells = rowEl.querySelectorAll('td');
            if (cells.length >= 3) {
              // Categoría
              const tdCat = document.createElement('td');
              tdCat.textContent = cells[0].textContent || '';
              tdCat.style.padding = '10px 10px';
              tdCat.style.verticalAlign = 'top';
              row.appendChild(tdCat);
              // Promedio
              const tdProm = document.createElement('td');
              tdProm.textContent = cells[1].textContent || '';
              tdProm.style.padding = '10px 10px';
              tdProm.style.verticalAlign = 'top';
              row.appendChild(tdProm);
              // Nivel de riesgo
              const tdNivel = document.createElement('td');
              tdNivel.textContent = cells[2].textContent || '';
              tdNivel.style.padding = '10px 10px';
              tdNivel.style.verticalAlign = 'top';
              tdNivel.style.background = cells[2].getAttribute('style')?.match(/background-color:([^;]+)/)?.[1] || '#e0e0e0';
              tdNivel.style.color = '#222';
              tdNivel.style.textAlign = 'center';
              tdNivel.style.borderRadius = '0';
              row.appendChild(tdNivel);
            }
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          catPromSection.appendChild(table);
          tempContainer.appendChild(catPromSection);
        }
        // Pie de página
        const footer = document.createElement('div');
        footer.style.marginTop = '24px';
        footer.style.paddingTop = '10px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.color = '#666';
        footer.style.fontSize = '12px';
        footer.style.textAlign = 'center';
        footer.textContent = 'Este reporte contiene los resultados de la evaluación NOM-035-STPS-2018 y es confidencial.';
        tempContainer.appendChild(footer);
        document.body.appendChild(tempContainer);
        const fechaArchivo = new Date().toISOString().slice(0, 10);
        const nombreArchivo = `reporte_general_nom035_${fechaArchivo}.pdf`;
        await this.generarPDFOptimizado(tempContainer, nombreArchivo, 'Reporte General NOM-035');
        document.body.removeChild(tempContainer);
        return;
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
        this.isGeneratingPdf = false;
      }
    } else {
      // Comportamiento original para la página de resultados
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
      elementos = document.querySelectorAll('.risk-cards-row');
      
      if (elementos && elementos.length > 0) {
        // Usuario con evaluaciones - incluir resultados globales y medidas preventivas
        elementos = document.querySelectorAll('.global-stats-section, .preventive-measures-section, .normative-compliance-section');
      } else {
        // Usuario sin evaluaciones - incluir todo el dashboard excepto el banner de notificación
        const childElements = dashboardContainer.querySelectorAll(':scope > div:not(.notification-banner)');
        elementos = childElements;
      }
    }
    
    if (!elementos || elementos.length === 0) {
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
  private async generarPDF(elementos: NodeListOf<Element> | Element[], nombreArchivo: string, titulo: string): Promise<void> {
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

  // Método optimizado para generar PDF
  private async generarPDFOptimizado(contenedor: HTMLElement, nombreArchivo: string, titulo: string): Promise<void> {
    try {
      const html2canvasModule = await import('html2canvas');
      const jsPDFModule = await import('jspdf');
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      // Seleccionar las secciones principales
      const sections: HTMLElement[] = [];
      // Header
      const header = contenedor.children[0] as HTMLElement;
      if (header) sections.push(header);
      // Estadísticas principales (tarjetas)
      const statsSection = contenedor.querySelector('div[style*="display: flex"][style*="gap: 24px"]');
      if (statsSection) sections.push(statsSection as HTMLElement);
      // Info usuario
      const infoUsuario = contenedor.querySelector('div[style*="background-color: #f8f9fa"]') as HTMLElement;
      if (infoUsuario) sections.push(infoUsuario);
      // Categorías
      const categorias = Array.from(contenedor.querySelectorAll('div > h2')).map(h2 => h2.parentElement as HTMLElement).filter(Boolean);
      sections.push(...categorias);
      // Footer
      const footer = contenedor.lastElementChild as HTMLElement;
      if (footer && footer !== header && footer !== infoUsuario) sections.push(footer);
      let yPos = 10;
      let firstSection = true;
      for (const section of sections) {
        // Renderizar sección como imagen
        const canvas = await html2canvas(section, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const imgWidth = width - 20; // 10mm de margen
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        // Si la sección no cabe en la página actual, saltar a la siguiente
        if (!firstSection && yPos + imgHeight > height - 10) {
          pdf.addPage();
          yPos = 10;
        }
        pdf.addImage(imgData, 'JPEG', 10, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 5;
        // Si la siguiente sección no cabe, saltar de página
        if (yPos > height - 30) {
          pdf.addPage();
          yPos = 10;
        }
        firstSection = false;
      }
      pdf.save(nombreArchivo);
    } catch (error) {
      console.error('Error en generarPDFOptimizado:', error);
      throw error;
    }
  }
}
