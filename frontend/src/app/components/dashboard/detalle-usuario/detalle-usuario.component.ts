import { Component, Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

// Directiva ngVar (igual que en el componente de resultados)
@Directive({
  selector: '[ngVar]',
  standalone: true
})
export class VarDirective<T> {
  private context: { $implicit: T; ngVar: T } = { $implicit: null as any, ngVar: null as any };

  constructor(
    private vcRef: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {}

  @Input()
  set ngVar(value: T) {
    this.context.$implicit = this.context.ngVar = value;
    this.vcRef.clear();
    this.vcRef.createEmbeddedView(this.templateRef, this.context);
  }
}

// Interfaces (reutilizadas del componente resultados)
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  total_respuestas: number;
  suma_valores_ajustados: number;
  es_jefe: boolean;
  sumasPorCategoria?: SumaCategoriaRiesgo[];
  nivel_riesgo_total?: string;
  color_riesgo_total?: string;
}

interface SumaCategoriaRiesgo {
  categoria_id: number;
  categoria: string;
  suma: number;
  totalPreguntas: number;
  nivel_riesgo: string;
  color_riesgo: string;
}

interface RespuestaUsuario {
  id: number;
  usuario_id: number;
  pregunta_id: number;
  pregunta_texto: string;
  pregunta_orden: number;
  respuesta_texto: string;
  respuesta_valor: number;
  valor_ajustado: number;
  es_obligatoria: boolean;
  categoria_id: number;
  categoria: string;
}

interface Progreso {
  respondidasObligatorias: number;
  totalObligatorias: number;
  respondidasOpcionales: number;
  totalOpcionales: number;
  porcentajeTotal: number;
  esJefe: boolean;
}

interface RespuestasUsuario {
  usuario: Usuario;
  respuestas: RespuestaUsuario[];
  progreso: Progreso;
}

interface Categoria {
  id: number;
  nombre: string;
  preguntas: number[];
}

interface NivelRiesgo {
  nivel: string;
  rango: string;
  color: string;
}

interface CategoriaCalificacion {
  categoria: string;
  categoria_id: number;
  niveles: NivelRiesgo[];
}

@Component({
  selector: 'app-detalle-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, VarDirective],
  templateUrl: './detalle-usuario.component.html',
  styleUrl: './detalle-usuario.component.scss'
})
export class DetalleUsuarioComponent implements OnInit {
  usuarioId: number = 0;
  detalleUsuario: RespuestasUsuario | null = null;
  categorias: Categoria[] = [];
  tablaCalificacionRiesgo: CategoriaCalificacion[] = [];
  cargando: boolean = false;
  error: string | null = null;
  usuarioActual: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.usuarioActual = user;
    });
  }
  
  ngOnInit(): void {
    this.usuarioId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.usuarioId) {
      this.cargarTablaCalificacionRiesgo();
    } else {
      this.error = 'ID de usuario no válido';
    }
  }
  
  cargarTablaCalificacionRiesgo(): void {
    this.cargando = true;
    
    this.http.get<any>(`${environment.apiUrl}/cuestionario/tabla-calificacion-riesgo`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tablaCalificacionRiesgo = response.data;
            this.cargarCategorias();
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
  
  cargarCategorias(): void {
    this.http.get<any>(`${environment.apiUrl}/cuestionario/categorias-pregunta`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.categorias = response.data;
            this.cargarDetalleUsuario();
          } else {
            this.error = 'Error al cargar las categorías';
            this.cargando = false;
          }
        },
        error: (err) => {
          this.error = 'Error al comunicarse con el servidor';
          this.cargando = false;
        }
      });
  }
  
  cargarDetalleUsuario(): void {
    this.http.get<any>(`${environment.apiUrl}/cuestionario/todas-respuestas-riesgo`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const usuarios = response.data;
            this.detalleUsuario = usuarios.find((u: RespuestasUsuario) => u.usuario.id === this.usuarioId) || null;
            
            if (!this.detalleUsuario) {
              this.error = 'No se encontraron datos para el usuario seleccionado';
            }
          } else {
            this.error = 'Error al cargar los datos del usuario';
          }
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al comunicarse con el servidor';
          this.cargando = false;
        }
      });
  }
  
  // Helper para determinar si un ítem tiene valoración inversa
  esItemInverso(ordenPregunta: number): boolean {
    const itemsInversos = [1, 4, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 55, 56, 57];
    return itemsInversos.includes(ordenPregunta);
  }
  
  // Helper para obtener el nombre de una categoría
  obtenerNombreCategoria(categoriaId: number): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Responsabilidades';
  }
  
  // Obtener IDs únicos de categorías para un conjunto de respuestas
  getCategoriasIds(respuestas: any[]): number[] {
    const categoriasIds = [...new Set(respuestas.map(r => r.categoria_id))];
    return categoriasIds.sort((a, b) => a - b); // Ordenar por ID
  }
  
  // Filtrar respuestas por categoría
  getRespuestasByCategoria(respuestas: any[], categoriaId: number): any[] {
    return respuestas.filter(r => r.categoria_id === categoriaId);
  }
  
  // Obtener información de calificación de riesgo para una categoría
  getCalificacionRiesgo(categoriaId: number): CategoriaCalificacion | undefined {
    return this.tablaCalificacionRiesgo.find(c => c.categoria_id === categoriaId);
  }
  
  // Obtener color de texto para contrastar con el fondo
  getColorTexto(color_fondo: string): string {
    // Always return white for risk badges
    return '#ffffff';
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
  
  // Alternar el estado de expansión de un acordeón
  toggleAccordion(event: Event): void {
    const header = event.currentTarget as HTMLElement;
    const content = header.nextElementSibling as HTMLElement;
    const toggleIcon = header.querySelector('.toggle-icon') as HTMLElement;
    
    if (content.style.maxHeight) {
      content.style.maxHeight = '';
      toggleIcon.textContent = '▼';
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
      toggleIcon.textContent = '▲';
    }
  }
  
  // Obtener categoría por ID
  getCategoriaById(categoriasUsuario: SumaCategoriaRiesgo[] | undefined, categoriaId: number): SumaCategoriaRiesgo | undefined {
    if (!categoriasUsuario) return undefined;
    return categoriasUsuario.find(cat => cat.categoria_id === categoriaId);
  }
  
  /**
   * Verifica si el usuario es jefe basado en la respuesta a la pregunta 70
   * @param respuestas Array de respuestas del usuario
   * @returns true si el usuario es jefe (valor 4), false en caso contrario
   */
  esJefe(respuestas: any[]): boolean {
    if (!respuestas || !respuestas.length) return false;
    const respuestaJefe = respuestas.find(r => r.pregunta_orden === 70);
    return respuestaJefe && respuestaJefe.respuesta_valor === 4;
  }

  /**
   * Verifica si el usuario brinda servicio a clientes basado en la pregunta 65
   * @param respuestas Array de respuestas del usuario
   * @returns true si el usuario brinda servicio a clientes (valor 4), false en caso contrario
   */
  brindaServicioClientes(respuestas: any[]): boolean {
    if (!respuestas || !respuestas.length) return false;
    const respuestaServicio = respuestas.find(r => r.pregunta_orden === 65);
    return respuestaServicio && respuestaServicio.respuesta_valor === 4;
  }

  irACuestionario(): void {
    this.router.navigate(['/dashboard/cuestionarios']);
  }
} 