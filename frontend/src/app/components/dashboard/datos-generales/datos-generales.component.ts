import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ResumenGeneral {
  totalUsuarios: number;
  usuariosCompletados: number;
  nivelRiesgoPromedio: string;
  colorRiesgoPromedio: string;
  distribucionRiesgo: {
    nivel: string;
    cantidad: number;
    color: string;
  }[];
  promediosPorCategoria: {
    categoria: string;
    categoria_id: number;
    promedio: number;
    nivel_riesgo: string;
    color_riesgo: string;
    total_usuarios: number;
  }[];
}

@Component({
  selector: 'app-datos-generales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datos-generales.component.html',
  styleUrl: './datos-generales.component.scss'
})
export class DatosGeneralesComponent implements OnInit {
  cargando: boolean = false;
  error: string | null = null;
  resumenGeneral: ResumenGeneral | null = null;
  tablaCalificacionRiesgo: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTablaCalificacionRiesgo();
  }

  cargarTablaCalificacionRiesgo(): void {
    this.cargando = true;
    
    this.http.get<any>(`${environment.apiUrl}/cuestionario/tabla-calificacion-riesgo`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tablaCalificacionRiesgo = response.data;
            this.cargarDatosGenerales();
          } else {
            this.error = 'Error al cargar la tabla de calificación de riesgo';
            this.cargando = false;
          }
        },
        error: (err) => {
          this.error = 'Error al comunicarse con el servidor';
          this.cargando = false;
        }
      });
  }

  cargarDatosGenerales(): void {
    this.http.get<any>(`${environment.apiUrl}/cuestionario/todas-respuestas-riesgo`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.procesarDatosGenerales(response.data);
          } else {
            this.error = 'Error al cargar los datos generales';
          }
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al comunicarse con el servidor';
          this.cargando = false;
        }
      });
  }

  procesarDatosGenerales(data: any[]): void {
    if (!data || !data.length) {
      this.error = 'No hay datos disponibles';
      return;
    }

    // Calcular estadísticas generales
    const totalUsuarios = data.length;
    const usuariosCompletados = data.filter(u => 
      u.progreso.respondidasObligatorias === u.progreso.totalObligatorias
    ).length;

    // Agrupar por nivel de riesgo
    const distribucionRiesgo: {[key: string]: {cantidad: number, color: string}} = {};
    
    // Recolectar datos para promedios por categoría
    const categorias: {[key: number]: {
      nombre: string,
      total: number,
      usuarios: number,
      nivel_riesgo: string,
      color_riesgo: string
    }} = {};

    // Procesar cada usuario
    data.forEach(item => {
      // Distribución de riesgo
      if (item.usuario.nivel_riesgo_total) {
        if (!distribucionRiesgo[item.usuario.nivel_riesgo_total]) {
          distribucionRiesgo[item.usuario.nivel_riesgo_total] = {
            cantidad: 0,
            color: item.usuario.color_riesgo_total || '#cccccc'
          };
        }
        distribucionRiesgo[item.usuario.nivel_riesgo_total].cantidad++;
      }

      // Promedios por categoría
      if (item.usuario.sumasPorCategoria) {
        item.usuario.sumasPorCategoria.forEach((cat: any) => {
          if (!categorias[cat.categoria_id]) {
            categorias[cat.categoria_id] = {
              nombre: cat.categoria,
              total: 0,
              usuarios: 0,
              nivel_riesgo: '',
              color_riesgo: ''
            };
          }
          categorias[cat.categoria_id].total += cat.suma;
          categorias[cat.categoria_id].usuarios++;
          // Usamos el último nivel y color por simplicidad
          categorias[cat.categoria_id].nivel_riesgo = cat.nivel_riesgo;
          categorias[cat.categoria_id].color_riesgo = cat.color_riesgo;
        });
      }
    });

    // Calcular nivel de riesgo promedio (simplificado - tomamos el más frecuente)
    let nivelRiesgoMasFrecuente = '';
    let cantidadMayor = 0;
    let colorRiesgoPromedio = '';

    Object.entries(distribucionRiesgo).forEach(([nivel, info]) => {
      if (info.cantidad > cantidadMayor) {
        nivelRiesgoMasFrecuente = nivel;
        cantidadMayor = info.cantidad;
        colorRiesgoPromedio = info.color;
      }
    });

    // Convertir distribución de riesgo a array
    const distribucionArray = Object.entries(distribucionRiesgo).map(([nivel, info]) => ({
      nivel,
      cantidad: info.cantidad,
      color: info.color
    }));

    // Convertir categorías a array con promedios
    const promediosCategoria = Object.entries(categorias).map(([id, info]) => {
      const promedio = info.usuarios > 0 ? info.total / info.usuarios : 0;
      return {
        categoria: info.nombre,
        categoria_id: parseInt(id),
        promedio: parseFloat(promedio.toFixed(2)),
        nivel_riesgo: info.nivel_riesgo,
        color_riesgo: info.color_riesgo,
        total_usuarios: info.usuarios
      };
    }).sort((a, b) => a.categoria_id - b.categoria_id);

    // Guardar resumen general
    this.resumenGeneral = {
      totalUsuarios,
      usuariosCompletados,
      nivelRiesgoPromedio: nivelRiesgoMasFrecuente,
      colorRiesgoPromedio,
      distribucionRiesgo: distribucionArray,
      promediosPorCategoria: promediosCategoria
    };
  }

  // Obtener criterios para la toma de acciones según nivel de riesgo
  getCriteriosAccion(nivelRiesgo: string): string {
    switch(nivelRiesgo) {
      case 'Nulo o despreciable':
        return 'El riesgo resulta despreciable por lo que no se requiere medidas adicionales.';
        
      case 'Bajo':
        return 'Es necesario una mayor difusión de la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral.';
        
      case 'Medio':
        return 'Se requiere revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión, mediante un Programa de intervención.';
        
      case 'Alto':
        return 'Se requiere realizar un análisis de cada categoría y dominio, de manera que se puedan determinar las acciones de intervención apropiadas a través de un Programa de intervención, que podrá incluir una evaluación específica y deberá incluir una campaña de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.';
        
      case 'Muy alto':
        return 'Se requiere realizar el análisis de cada categoría y dominio para establecer las acciones de intervención apropiadas, mediante un Programa de intervención que deberá incluir evaluaciones específicas, y contemplar campañas de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.';
        
      default:
        return 'No hay criterios definidos para este nivel de riesgo.';
    }
  }

  // Obtener color de texto que contraste con el fondo
  getColorTexto(color_fondo: string): string {
    // Convertir hex a RGB para calcular la luminosidad
    const hex = color_fondo.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular la luminosidad (percepción humana de brillo)
    const luminosidad = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Usar texto oscuro para fondos claros y texto claro para fondos oscuros
    return luminosidad > 0.5 ? '#000000' : '#ffffff';
  }

  getPorcentajeCompletado(): number {
    if (!this.resumenGeneral) return 0;
    const { totalUsuarios, usuariosCompletados } = this.resumenGeneral;
    return totalUsuarios > 0 ? Math.round((usuariosCompletados / totalUsuarios) * 100) : 0;
  }

  // Obtener color basado en el nivel de riesgo
  getColorPorNivel(nivel: string): string {
    switch(nivel) {
      case 'Nulo o despreciable':
        return '#2b9bb1';
      case 'Bajo':
        return '#8BC34A';
      case 'Medio':
        return '#FFC107';
      case 'Alto':
        return '#FF9800';
      case 'Muy alto':
        return '#F44336';
      default:
        return '#cccccc';
    }
  }
}
