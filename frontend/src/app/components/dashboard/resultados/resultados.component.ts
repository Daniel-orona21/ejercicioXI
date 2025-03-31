import { Component, OnInit, inject, ElementRef, ViewChild, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CuestionarioService } from '../../../services/cuestionario.service';
import { PdfService } from '../../../services/pdf.service';

// Definimos una interfaz para los datos de respuesta
interface RespuestaDetallada {
  cuestionarioId: number;
  cuestionarioNombre: string;
  cuestionarioCodigo: string;
  preguntaId: number;
  pregunta: string;
  respuesta: string;
  valor?: number;
  fecha: string;
}

// Interfaz para los resultados de la evaluación de riesgo
interface ResultadoRiesgo {
  cuestionarioId: number;
  cuestionarioNombre: string;
  cuestionarioCodigo: string;
  puntajeTotal: number;
  nivelRiesgo: string;
  colorRiesgo: string;
  recomendaciones: string[];
  respuestasAnalizadas: number;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  providers: [PdfService],
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit, OnDestroy {
  // Usar inject en lugar de constructor injection
  private cuestionarioService = inject(CuestionarioService);
  
  summaryData = {
    pendingTasks: 21,
    completedTasks: 13,
    overdueTasks: 17,
    yesterday: 9,
    openIssues: 24,
    closedToday: 19,
    proposals: 38,
    implemented: 16
  };

  respuestasCuestionarios: any[] = [];
  resultadosRiesgo: ResultadoRiesgo[] = [];
  
  // Datos globales para todos los usuarios
  datosGlobales: any = {
    totalUsuarios: 0,
    totalRespuestas: 0,
    distribucionRiesgo: [],
    respuestasPorCuestionario: [],
  };
  
  loading = false;
  error = '';

  // Colores para los niveles de riesgo
  coloresRiesgo: { [key: string]: string } = {
    'Bajo': '#28a745',       // Verde
    'Moderado': '#ffc107',   // Amarillo
    'Alto': '#dc3545'        // Rojo (antes era naranja)
  };

  @ViewChild('pdfContent') pdfContent!: ElementRef;

  // Inyectar PLATFORM_ID para detectar el entorno
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.cargarRespuestasDetalladasUsuario();
    this.cargarDatosGlobales();
    
    // Registrar este componente en el servicio PDF
    this.pdfService.registerResultadosComponent(this);
  }

  ngOnDestroy(): void {
    // Desregistrar este componente del servicio PDF al destruir el componente
    this.pdfService.unregisterResultadosComponent(this);
  }

  cargarRespuestasDetalladasUsuario(): void {
    this.loading = true;
    this.error = '';

    // Usar el nuevo método que obtiene respuestas detalladas con JOIN completo
    this.cuestionarioService.getAllRespuestasDetalladasUsuario().subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.data) {
          // Procesar los datos para verificar la integridad
          const cuestionariosVerificados = response.data.map((cuestionario: any) => {
            // Verificar que las respuestas pertenezcan al cuestionario correcto
            const respuestasVerificadas = cuestionario.respuestas.filter((r: any) => {
              // Si la pregunta tiene un cuestionarioId definido, verificar que coincida
              if (r.preguntaCuestionarioId && r.preguntaCuestionarioId !== cuestionario.id) {
                console.warn(`La pregunta ${r.preguntaId} no pertenece al cuestionario ${cuestionario.id}`, r);
                return false;
              }
              return true;
            });

            return {
              ...cuestionario,
              respuestas: respuestasVerificadas
            };
          });
          
          this.respuestasCuestionarios = cuestionariosVerificados;
          
          // Calcular niveles de riesgo
          this.calcularNivelesDeRiesgo();
          
          // Imprimir las respuestas en la consola
          this.imprimirRespuestasEnConsola();
        } else {
          this.error = 'No se pudieron cargar las respuestas detalladas';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error al cargar las respuestas detalladas: ' + (error.message || 'Desconocido');
        console.error('Error al cargar respuestas detalladas:', error);
      }
    });
  }

  // Método para convertir respuestas a valores numéricos según NOM-035
  convertirRespuestaAValor(respuesta: string, codigoCuestionario: string): number {
    // Prevenir errores si la respuesta es null o undefined
    if (!respuesta) {
      console.warn('Respuesta vacía o nula');
      return 0;
    }
    
    // Normalizar la respuesta a minúsculas para facilitar la comparación
    const respuestaLower = respuesta.toLowerCase().trim();
    
    // Si la respuesta es un número (escala 1-5), usarlo directamente
    const valorNumerico = parseInt(respuesta, 10);
    if (!isNaN(valorNumerico) && valorNumerico >= 1 && valorNumerico <= 5) {
      // Para Entorno Organizacional, invertir la escala numérica (5→1, 4→2, etc.)
      if (codigoCuestionario === 'entorno') {
        return 6 - valorNumerico; // 5→1, 4→2, 3→3, 2→4, 1→5
      }
      return valorNumerico;
    }
    
    // Valores para cuestionarios Traumáticos y Factores
    if (codigoCuestionario !== 'entorno') {
      if (respuestaLower === 'si' || respuestaLower === 'sí' || respuestaLower === 'siempre') return 5; // Alto riesgo
      if (respuestaLower === 'no' || respuestaLower === 'nunca' || respuestaLower === 'nada') return 1; // Bajo riesgo
      if (respuestaLower === 'en ocasiones' || respuestaLower === 'a veces' || respuestaLower === 'regular') return 3;
    } 
    // Valores INVERTIDOS para Entorno Organizacional (respuestas positivas = bajo riesgo)
    else {
      if (respuestaLower === 'si' || respuestaLower === 'sí' || respuestaLower === 'siempre') return 1; // Bajo riesgo
      if (respuestaLower === 'no' || respuestaLower === 'nunca' || respuestaLower === 'nada') return 5; // Alto riesgo
      if (respuestaLower === 'en ocasiones' || respuestaLower === 'a veces' || respuestaLower === 'regular') return 3;
    }
    
    // Mapeo para otras respuestas textuales
    let mapeoRespuestas: {[key: string]: number};
    
    // Usar mapeo distinto según el tipo de cuestionario
    if (codigoCuestionario === 'entorno') {
      // Valores INVERTIDOS para Entorno Organizacional
      mapeoRespuestas = {
        'casi nunca': 4,   // Invertido (4 puntos de riesgo)
        'poco': 4,         // Invertido 
        'pocas veces': 4,  // Invertido
        'casi siempre': 2, // Invertido (2 puntos de riesgo)
        'frecuentemente': 2, // Invertido
        'mucho': 2,        // Invertido
        'buena': 2,        // Invertido
        'bueno': 2,        // Invertido
        'excelente': 1,    // Invertido (1 punto de riesgo = muy bueno)
        'malo': 4,         // Invertido
        'mala': 4,         // Invertido
        'pesimo': 5,       // Invertido (5 puntos = muy malo)
        'pesima': 5,       // Invertido
        'regular': 3,      // Se mantiene en el medio
        'normal': 3,       // Se mantiene en el medio
        'algunas veces': 3, // Se mantiene en el medio
        'aveces': 3        // Se mantiene en el medio
      };
    } else {
      // Valores normales para los otros cuestionarios
      mapeoRespuestas = {
        'casi nunca': 2,
        'poco': 2,
        'pocas veces': 2,
        'casi siempre': 4,
        'frecuentemente': 4,
        'mucho': 4,
        'buena': 4,
        'bueno': 4,
        'excelente': 5,
        'malo': 2,
        'mala': 2,
        'pesimo': 1,
        'pesima': 1,
        'regular': 3,
        'normal': 3,
        'algunas veces': 3,
        'aveces': 3
      };
    }
    
    // Si la respuesta está en el mapeo, devolver el valor correspondiente
    if (mapeoRespuestas[respuestaLower] !== undefined) {
      return mapeoRespuestas[respuestaLower];
    }
    
    // Entorno organizacional: mapeo específico basado en texto parcial
    if (codigoCuestionario === 'entorno') {
      if (respuestaLower.includes('siemp') || respuestaLower.includes('excel')) return 1; // INVERTIDO
      if (respuestaLower.includes('casi siemp') || respuestaLower.includes('buen')) return 2; // INVERTIDO
      if (respuestaLower.includes('regular') || respuestaLower.includes('a vec') || respuestaLower.includes('ocasion')) return 3;
      if (respuestaLower.includes('casi nun') || respuestaLower.includes('mal')) return 4; // INVERTIDO
      if (respuestaLower.includes('nun') || respuestaLower.includes('nad')) return 5; // INVERTIDO
    } else {
      if (respuestaLower.includes('siemp') || respuestaLower.includes('excel')) return 5;
      if (respuestaLower.includes('casi siemp') || respuestaLower.includes('buen')) return 4;
      if (respuestaLower.includes('regular') || respuestaLower.includes('a vec') || respuestaLower.includes('ocasion')) return 3;
      if (respuestaLower.includes('casi nun') || respuestaLower.includes('mal')) return 2;
      if (respuestaLower.includes('nun') || respuestaLower.includes('nad')) return 1;
    }
    
    // Valor por defecto si no se puede determinar
    console.warn(`No se pudo determinar valor para respuesta: "${respuesta}" en cuestionario: ${codigoCuestionario}`);
    return 3; // Valor medio por defecto
  }

  // Método para calcular niveles de riesgo según NOM-035
  calcularNivelesDeRiesgo(): void {
    this.resultadosRiesgo = [];
    
    // Para cada cuestionario, calcular el nivel de riesgo
    this.respuestasCuestionarios.forEach(cuestionario => {
      // Filtrar las respuestas válidas (que no estén vacías)
      const respuestasValidas = cuestionario.respuestas.filter(
        (r: any) => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta'
      );
      
      if (respuestasValidas.length === 0) return; // No hay respuestas para analizar
      
      // Calcular el puntaje total sumando los valores de las respuestas
      let puntajeTotal = 0;
      let codigoCuestionario = '';
      
      // Determinar el código del cuestionario para el mapeo correcto
      if (cuestionario.codigo === 'Traumáticos') codigoCuestionario = 'traumaticos';
      else if (cuestionario.codigo === 'Factores') codigoCuestionario = 'factores';
      else if (cuestionario.codigo === 'Entorno') codigoCuestionario = 'entorno';
      else if (cuestionario.nombre.includes('Traumáticos')) codigoCuestionario = 'traumaticos';
      else if (cuestionario.nombre.includes('Factores')) codigoCuestionario = 'factores';
      else if (cuestionario.nombre.includes('Entorno')) codigoCuestionario = 'entorno';
      
      // Debug info
      console.log(`Cuestionario: ${cuestionario.nombre}, Código mapeado: ${codigoCuestionario}`);
      
      // Convertir respuestas a valores y sumar
      respuestasValidas.forEach((r: any) => {
        const valor = this.convertirRespuestaAValor(r.respuestaTexto, codigoCuestionario);
        console.log(`Pregunta: ${r.preguntaTexto.substring(0, 30)}..., Respuesta: ${r.respuestaTexto}, Valor: ${valor}`);
        puntajeTotal += valor;
      });
      
      // Calcular el nivel de riesgo basado en el puntaje total
      // Los rangos pueden ajustarse según la NOM-035 específica
      const nivelRiesgo = this.determinarNivelRiesgo(puntajeTotal, respuestasValidas.length);
      
      // Generar recomendaciones basadas en el nivel de riesgo
      const recomendaciones = this.generarRecomendaciones(nivelRiesgo, codigoCuestionario);
      
      // Agregar el resultado a la lista
      this.resultadosRiesgo.push({
        cuestionarioId: cuestionario.id,
        cuestionarioNombre: cuestionario.nombre,
        cuestionarioCodigo: cuestionario.codigo,
        puntajeTotal,
        nivelRiesgo,
        colorRiesgo: this.coloresRiesgo[nivelRiesgo] || '#6c757d',
        recomendaciones,
        respuestasAnalizadas: respuestasValidas.length
      });
    });
    
    console.log('Resultados de evaluación de riesgo:', this.resultadosRiesgo);
  }
  
  // Método para determinar el nivel de riesgo según el puntaje
  determinarNivelRiesgo(puntaje: number, numPreguntas: number): string {
    // Si no hay puntaje (0), mostrar Bajo
    if (puntaje === 0) return 'Bajo';
    
    // Usar los rangos específicos en lugar de porcentajes normalizados
    if (puntaje <= 10) return 'Bajo';
    if (puntaje <= 20) return 'Moderado';
    return 'Alto'; // Todo lo que sea mayor a 20 puntos será considerado Alto
  }
  
  // Método para generar recomendaciones según el nivel de riesgo
  generarRecomendaciones(nivelRiesgo: string, tipoCuestionario: string): string[] {
    const recomendaciones: string[] = [];
    
    // Recomendaciones basadas en nivel de riesgo según los criterios especificados
    switch (nivelRiesgo) {
      case 'Bajo':
        recomendaciones.push('No requiere intervención.');
        recomendaciones.push('Mantener condiciones actuales y fomentar bienestar laboral.');
        break;
      case 'Moderado':
        recomendaciones.push('Capacitación en manejo del estrés y carga laboral.');
        recomendaciones.push('Evaluaciones periódicas para evitar aumento del riesgo.');
        break;
      case 'Alto':
        recomendaciones.push('Reducción de carga laboral y horarios excesivos.');
        recomendaciones.push('Programas de bienestar y apoyo psicológico.');
        recomendaciones.push('Supervisión de casos de acoso y mejora del clima organizacional.');
        recomendaciones.push('Intervención inmediata en la empresa.');
        recomendaciones.push('Evaluaciones individuales con especialistas.');
        recomendaciones.push('Revisión de condiciones laborales y posible reestructuración.');
        break;
    }
    
    // Recomendaciones específicas adicionales según el tipo de cuestionario
    if (tipoCuestionario === 'traumaticos' && nivelRiesgo === 'Alto') {
      recomendaciones.push('Atención psicológica especializada para personal expuesto a eventos traumáticos.');
      recomendaciones.push('Implementación de protocolos de seguridad y manejo de crisis.');
    }
    
    if (tipoCuestionario === 'factores' && nivelRiesgo !== 'Bajo') {
      recomendaciones.push('Reestructuración de turnos y cargas de trabajo.');
      recomendaciones.push('Revisión de políticas de descanso y tiempo libre.');
    }
    
    if (tipoCuestionario === 'entorno' && nivelRiesgo !== 'Bajo') {
      recomendaciones.push('Desarrollo de programas de liderazgo y trabajo en equipo.');
      recomendaciones.push('Mejora de procesos comunicativos dentro de la organización.');
    }
    
    return recomendaciones;
  }

  imprimirRespuestasEnConsola(): void {
    console.clear(); // Limpiamos la consola para una visualización más clara
    
    console.log('%c===== RESPUESTAS DETALLADAS DE LOS CUESTIONARIOS DEL USUARIO =====', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
    
    if (this.respuestasCuestionarios.length === 0) {
      console.log('%cNo hay respuestas disponibles', 'color: #e73a4e; font-style: italic;');
      return;
    }
    
    // Crear variable global para todas las respuestas
    (window as any).todasLasRespuestas = {};
    
    // Imprimir cada cuestionario
    this.respuestasCuestionarios.forEach((cuestionario) => {
      console.group(`%c${cuestionario.nombre.toUpperCase()} (ID: ${cuestionario.id})`, 
        'color: #1e2a4a; font-weight: bold; font-size: 14px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;');
      
      console.log(`%cDescripción: ${cuestionario.descripcion}`, 'color: #6c757d;');
      console.log(`%cCódigo: ${cuestionario.codigo}`, 'color: #6c757d;');
      
      if (cuestionario.tieneRespuestas) {
        console.log('%cRespuestas:', 'color: #3a57e8; font-weight: bold;');
        
        // Filtrar para mostrar solo preguntas con respuestas
        const respuestasContestadas = cuestionario.respuestas.filter(
          (r: any) => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta'
        );
        
        if (respuestasContestadas.length > 0) {
          // Log de verificación para depuración
          console.log(`%cTotal de respuestas para este cuestionario: ${respuestasContestadas.length}`, 'color: #6c757d;');
          
          // Mostrar cada pregunta y respuesta de forma detallada para evitar truncamiento
          respuestasContestadas.forEach((r: any, index: number) => {
            console.group(`%cPregunta ${index + 1} (ID: ${r.preguntaId})`, 'color: #1e2a4a; font-weight: bold;');
            
            // Mostrar la pregunta completa
            console.log('%cTexto de la pregunta:', 'color: #6c757d; font-weight: bold;');
            console.log(r.preguntaTexto);
            
            // Mostrar la respuesta
            console.log(`%cRespuesta:`, 'color: #3a57e8; font-weight: bold;');
            console.log(r.respuestaTexto);
            
            if (r.respuestaValor) {
              console.log(`%cValor: ${r.respuestaValor}`, 'color: #28a745; font-weight: bold;');
            }
            
            console.log(`%cFecha: ${r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'}`, 'color: #6c757d; font-size: 12px;');
            console.groupEnd();
          });
          
          // Exportar datos como objeto para fácil acceso
          const datosCompletos = respuestasContestadas.map((r: any): RespuestaDetallada => ({
            cuestionarioId: cuestionario.id,
            cuestionarioNombre: cuestionario.nombre,
            cuestionarioCodigo: cuestionario.codigo,
            preguntaId: r.preguntaId,
            pregunta: r.preguntaTexto,
            respuesta: r.respuestaTexto,
            valor: r.respuestaValor,
            fecha: r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'
          }));
          
          // Guardar las respuestas en la variable global
          (window as any).todasLasRespuestas[cuestionario.codigo] = datosCompletos;
          
          // Tabla simple para visualización rápida
          console.table(datosCompletos.map((d: RespuestaDetallada) => ({
            'ID Pregunta': d.preguntaId,
            'Pregunta': d.pregunta.substring(0, 50) + (d.pregunta.length > 50 ? '...' : ''),
            'Respuesta': d.respuesta
          })));
          
          console.log(`%cLos datos completos están disponibles en: todasLasRespuestas.${cuestionario.codigo}`, 
            'color: #28a745; font-style: italic;');
        } else {
          console.log('%cNo hay preguntas contestadas en este cuestionario', 'color: #ffc107; font-style: italic;');
        }
      } else {
        console.log('%cNo hay respuestas para este cuestionario', 'color: #e73a4e; font-style: italic;');
      }
      
      console.groupEnd();
      console.log(''); // Espacio entre cuestionarios
    });
    
    // Crear una versión consolidada de todas las respuestas
    const consolidado: RespuestaDetallada[] = this.respuestasCuestionarios.flatMap(cuestionario => 
      cuestionario.respuestas
        .filter((r: any) => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta')
        .map((r: any): RespuestaDetallada => ({
          cuestionarioId: cuestionario.id,
          cuestionarioNombre: cuestionario.nombre,
          cuestionarioCodigo: cuestionario.codigo,
          preguntaId: r.preguntaId,
          pregunta: r.preguntaTexto,
          respuesta: r.respuestaTexto,
          valor: r.respuestaValor,
          fecha: r.fechaRespuesta ? new Date(r.fechaRespuesta).toLocaleString() : 'N/A'
        }))
    );
    
    (window as any).todasLasRespuestas.consolidado = consolidado;
    
    console.log('%cTodas las respuestas están disponibles en la variable global "todasLasRespuestas"', 
      'color: #28a745; font-weight: bold; font-style: italic;');
    console.log('%cPuedes acceder al consolidado de respuestas con: todasLasRespuestas.consolidado', 
      'color: #28a745; font-style: italic;');
    
    console.log('%c==========================================', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');

    // También imprimir los resultados de la evaluación de riesgo
    console.log('%c===== EVALUACIÓN DE RIESGOS PSICOSOCIALES (NOM-035) =====', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
    
    if (this.resultadosRiesgo.length === 0) {
      console.log('%cNo hay datos suficientes para la evaluación de riesgos', 'color: #e73a4e; font-style: italic;');
    } else {
      this.resultadosRiesgo.forEach(resultado => {
        console.group(`%c${resultado.cuestionarioNombre} - Nivel de Riesgo: ${resultado.nivelRiesgo}`, 
          `color: white; font-weight: bold; background-color: ${resultado.colorRiesgo}; padding: 2px 6px; border-radius: 4px;`);
        
        console.log(`%cPuntaje Total: ${resultado.puntajeTotal}`, 'color: #1e2a4a; font-weight: bold;');
        console.log(`%cRespuestas analizadas: ${resultado.respuestasAnalizadas}`, 'color: #6c757d;');
        
        console.log('%cRecomendaciones:', 'color: #28a745; font-weight: bold;');
        resultado.recomendaciones.forEach((rec, index) => {
          console.log(`%c${index + 1}. ${rec}`, 'color: #495057;');
        });
        
        console.groupEnd();
      });
      
      // Guardar los resultados en la variable global
      (window as any).resultadosEvaluacionRiesgo = this.resultadosRiesgo;
      console.log('%cLos resultados de la evaluación de riesgo están disponibles en la variable global "resultadosEvaluacionRiesgo"', 
        'color: #28a745; font-weight: bold; font-style: italic;');
    }
    
    // Imprimir datos globales de todos los usuarios
    this.imprimirDatosGlobalesEnConsola();
  }

  // Método para obtener el rango de puntaje para cada nivel de riesgo
  obtenerRangoRiesgo(nivelRiesgo: string): string {
    switch(nivelRiesgo) {
      case 'Bajo': return '(0-10 puntos)';
      case 'Moderado': return '(11-20 puntos)';
      case 'Alto': return '(21+ puntos)';
      default: return '';
    }
  }
  
  // Método para cargar datos globales reales desde la API
  cargarDatosGlobales(): void {
    this.loading = true;
    this.error = '';
    
    // Cargar todas las respuestas de todos los usuarios
    this.cuestionarioService.getAllRespuestasUsuarios().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.procesarDatosGlobales(response.data);
        } else {
          this.error = 'No se pudieron cargar los datos globales';
          console.error('Error al cargar datos globales:', response);
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Error al cargar los datos globales: ' + (error.message || 'Desconocido');
        console.error('Error al cargar datos globales:', error);
        this.loading = false;
      }
    });
  }
  
  // Procesar datos reales recibidos de la API
  procesarDatosGlobales(datos: any[]): void {
    // Contador de usuarios únicos
    const usuariosUnicos = new Set();
    
    // Contador total de respuestas
    let totalRespuestas = 0;
    
    // Contador por cuestionario
    const respuestasPorCuestionario: {[key: string]: {respuestas: number, completados: number}} = {};
    
    // Procesar cada respuesta para contar usuarios y respuestas
    datos.forEach(respuesta => {
      // Contar usuarios únicos
      if (respuesta.usuario_id) {
        usuariosUnicos.add(respuesta.usuario_id);
      }
      
      // Contar respuestas totales
      totalRespuestas++;
      
      // Agrupar por cuestionario
      if (respuesta.cuestionario_nombre) {
        if (!respuestasPorCuestionario[respuesta.cuestionario_nombre]) {
          respuestasPorCuestionario[respuesta.cuestionario_nombre] = {
            respuestas: 0,
            completados: 0
          };
        }
        respuestasPorCuestionario[respuesta.cuestionario_nombre].respuestas++;
      }
    });
    
    // Calcular niveles de riesgo globales basados en las respuestas
    // Primero agrupar por usuario y cuestionario
    const respuestasPorUsuario: {[key: string]: {[key: string]: any[]}} = {};
    
    datos.forEach(respuesta => {
      if (!respuesta.usuario_id || !respuesta.cuestionario_id) return;
      
      const clave = `${respuesta.usuario_id}`;
      
      if (!respuestasPorUsuario[clave]) {
        respuestasPorUsuario[clave] = {};
      }
      
      if (!respuestasPorUsuario[clave][respuesta.cuestionario_id]) {
        respuestasPorUsuario[clave][respuesta.cuestionario_id] = [];
      }
      
      respuestasPorUsuario[clave][respuesta.cuestionario_id].push(respuesta);
    });
    
    // Registrar los cuestionarios completados para debuggear
    console.log('Cuestionarios por usuario:', respuestasPorUsuario);
    
    // Para seguimiento de cuestionarios completados
    const cuestionariosCompletados: {[key: string]: {[key: string]: boolean}} = {};
    
    // Registrar los resultados de riesgo para cada usuario (el peor nivel por usuario)
    const nivelesRiesgoPorUsuario: {[key: string]: string} = {};
    
    // Ahora calcular el nivel de riesgo para cada usuario/cuestionario
    Object.keys(respuestasPorUsuario).forEach(usuarioId => {
      // Inicializar registro de completados para este usuario
      if (!cuestionariosCompletados[usuarioId]) {
        cuestionariosCompletados[usuarioId] = {};
      }
      
      // Para este usuario, seguiremos el peor nivel de riesgo encontrado
      let peorNivelRiesgoUsuario = 'Bajo';
      const nivelPrioridad: {[key: string]: number} = {
        'Bajo': 1,
        'Moderado': 2,
        'Alto': 3
      };
      
      Object.keys(respuestasPorUsuario[usuarioId]).forEach(cuestionarioId => {
        const respuestasUsuario = respuestasPorUsuario[usuarioId][cuestionarioId];
        
        if (!respuestasUsuario || respuestasUsuario.length === 0) return;
        
        // Obtener info para debugging
        const nombreCuestionario = respuestasUsuario[0].cuestionario_nombre;
        const estadoCuestionario = respuestasUsuario[0].cuestionario_estado;
        
        console.log(`Usuario ${usuarioId} - Cuestionario: ${nombreCuestionario} (ID: ${cuestionarioId}) - Estado: ${estadoCuestionario} - Respuestas: ${respuestasUsuario.length}`);
        
        // Marcar como completado si el estado es 'completado'
        if (estadoCuestionario === 'completado') {
          cuestionariosCompletados[usuarioId][cuestionarioId] = true;
          
          if (nombreCuestionario && respuestasPorCuestionario[nombreCuestionario]) {
            respuestasPorCuestionario[nombreCuestionario].completados++;
            console.log(`Incrementando completados para ${nombreCuestionario} a ${respuestasPorCuestionario[nombreCuestionario].completados}`);
          }
        }
        
        // Solo calcular nivel de riesgo si hay suficientes respuestas
        if (respuestasUsuario.length >= 5) {
          // Obtener el código del cuestionario para aplicar la lógica correcta
          const codigoCuestionario = respuestasUsuario[0].cuestionario_codigo?.toLowerCase() || '';
          
          // Calcular puntaje total
          let puntajeTotal = 0;
          
          respuestasUsuario.forEach(r => {
            if (r.respuesta_texto) {
              const valor = this.convertirRespuestaAValor(r.respuesta_texto, codigoCuestionario);
              puntajeTotal += valor;
            }
          });
          
          // Determinar nivel de riesgo
          const nivelRiesgo = this.determinarNivelRiesgo(puntajeTotal, respuestasUsuario.length);
          console.log(`Usuario ${usuarioId} - Cuestionario ${nombreCuestionario} - Nivel de riesgo: ${nivelRiesgo} (Puntaje: ${puntajeTotal})`);
          
          // Actualizar el peor nivel de riesgo para este usuario si corresponde
          if (nivelPrioridad[nivelRiesgo] > nivelPrioridad[peorNivelRiesgoUsuario]) {
            peorNivelRiesgoUsuario = nivelRiesgo;
          }
        }
      });
      
      // Asignar el nivel de riesgo final para este usuario (el peor de todos sus cuestionarios)
      nivelesRiesgoPorUsuario[usuarioId] = peorNivelRiesgoUsuario;
    });
    
    // Contar cuántos usuarios hay en cada nivel de riesgo
    const conteoNivelesRiesgo: {[key: string]: number} = {
      'Bajo': 0,
      'Moderado': 0, 
      'Alto': 0
    };
    
    Object.values(nivelesRiesgoPorUsuario).forEach(nivel => {
      conteoNivelesRiesgo[nivel]++;
    });
    
    console.log('Niveles de riesgo por usuario:', nivelesRiesgoPorUsuario);
    console.log('Conteo de niveles de riesgo:', conteoNivelesRiesgo);
    
    // Convertir a formato para la UI
    const distribucionRiesgo = Object.keys(conteoNivelesRiesgo).map(nivel => {
      const cantidad = conteoNivelesRiesgo[nivel];
      const totalUsuariosConNivel = Object.values(conteoNivelesRiesgo).reduce((sum, val) => sum + val, 0);
      const porcentaje = totalUsuariosConNivel > 0 ? (cantidad / totalUsuariosConNivel * 100).toFixed(2) : '0';
      
      return {
        nivel,
        cantidad,
        porcentaje: parseFloat(porcentaje)
      };
    });
    
    const respuestasCuestionarioArray = Object.keys(respuestasPorCuestionario).map(cuestionario => ({
      cuestionario,
      respuestas: respuestasPorCuestionario[cuestionario].respuestas,
      completados: respuestasPorCuestionario[cuestionario].completados
    }));
    
    // Log para depuración
    console.log('Cuestionarios completados:', cuestionariosCompletados);
    console.log('Resumen por cuestionario:', respuestasCuestionarioArray);
    
    // Actualizar el objeto de datos globales
    this.datosGlobales = {
      totalUsuarios: usuariosUnicos.size,
      totalRespuestas,
      distribucionRiesgo,
      respuestasPorCuestionario: respuestasCuestionarioArray
    };
    
    // Guardar en variable global para acceso desde consola
    (window as any).datosGlobalesNOM035 = this.datosGlobales;
    
    console.log('Datos globales cargados:', this.datosGlobales);
  }
  
  // Método para imprimir datos globales en consola
  imprimirDatosGlobalesEnConsola(): void {
    console.log('%c===== DATOS GLOBALES DE TODOS LOS USUARIOS (NOM-035) =====', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
    
    console.log(`%cTotal de usuarios evaluados: ${this.datosGlobales.totalUsuarios}`, 
      'color: #1e2a4a; font-weight: bold; font-size: 14px;');
    console.log(`%cTotal de respuestas registradas: ${this.datosGlobales.totalRespuestas}`, 
      'color: #1e2a4a; font-size: 14px;');
    
    // Distribución de niveles de riesgo
    console.group('%cDistribución por Nivel de Riesgo', 'color: #3a57e8; font-weight: bold;');
    console.table(this.datosGlobales.distribucionRiesgo.map((item: any) => ({
      'Nivel': item.nivel,
      'Cantidad Usuarios': item.cantidad,
      'Porcentaje': `${item.porcentaje}%`,
      'Color': this.coloresRiesgo[item.nivel]
    })));
    console.groupEnd();
    
    // Respuestas por cuestionario
    console.group('%cRespuestas por Cuestionario', 'color: #3a57e8; font-weight: bold;');
    console.table(this.datosGlobales.respuestasPorCuestionario.map((item: any) => ({
      'Cuestionario': item.cuestionario,
      'Total Respuestas': item.respuestas,
      'Cuestionarios Completados': item.completados,
      'Promedio Resp. por Usuario': this.datosGlobales.totalUsuarios > 0 ? (item.respuestas / this.datosGlobales.totalUsuarios).toFixed(1) : '0'
    })));
    console.groupEnd();
    
    console.log('%cLos datos globales están disponibles en la variable "datosGlobalesNOM035"', 
      'color: #28a745; font-weight: bold; font-style: italic;');
      
    console.log('%c==========================================', 
      'color: #3a57e8; font-weight: bold; font-size: 16px; background-color: #f8f9ff; padding: 5px 10px; border-radius: 4px;');
  }
  
  // Método para obtener el nivel de riesgo predominante
  obtenerNivelRiesgoPredominante(): string {
    if (!this.datosGlobales.distribucionRiesgo || this.datosGlobales.distribucionRiesgo.length === 0) {
      return 'Bajo';
    }
    
    const distribucion = this.datosGlobales.distribucionRiesgo;
    let maxCantidad = 0;
    let nivelPredominante = 'Bajo';
    
    distribucion.forEach((item: any) => {
      if (item.cantidad > maxCantidad) {
        maxCantidad = item.cantidad;
        nivelPredominante = item.nivel;
      }
    });
    
    return nivelPredominante;
  }
  
  // Método para generar recomendaciones globales
  generarRecomendacionesGlobales(nivelPredominante: string): string[] {
    const recomendaciones: string[] = [];
    
    // Recomendaciones basadas en el nivel predominante
    switch (nivelPredominante) {
      case 'Bajo':
        recomendaciones.push('Mantener las políticas actuales de bienestar laboral.');
        recomendaciones.push('Implementar evaluaciones periódicas para monitorear cambios en los factores de riesgo.');
        recomendaciones.push('Desarrollar programas preventivos para mantener el nivel bajo de riesgo psicosocial.');
        break;
      case 'Moderado':
        recomendaciones.push('Capacitación general en manejo del estrés y organización del tiempo.');
        recomendaciones.push('Revisión de cargas de trabajo.');
        recomendaciones.push('Implementar canales efectivos de comunicación para atender inquietudes del personal.');
        break;
      case 'Alto':
        recomendaciones.push('Intervención inmediata en áreas críticas.');
        recomendaciones.push('Evaluación detallada de factores de riesgo.');
        recomendaciones.push('Implementación de programas de apoyo psicológico y manejo del estrés.');
        recomendaciones.push('Revisión de políticas organizacionales relacionadas con horarios y cargas de trabajo.');
        recomendaciones.push('Intervención urgente a nivel organizacional.');
        recomendaciones.push('Reestructuración de procesos y cargas laborales.');
        recomendaciones.push('Programas intensivos de apoyo psicológico y manejo del estrés.');
        recomendaciones.push('Revisión completa de políticas organizacionales.');
        break;
    }
    
    return recomendaciones;
  }

  // Método para descargar el reporte personal (solo resultados del usuario)
  descargarReportePersonal(): void {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }
    
    // Verificar si hay resultados personales disponibles
    if (!this.resultadosRiesgo || this.resultadosRiesgo.length === 0) {
      alert('Para descargar tu reporte personal, primero debes completar al menos un cuestionario.');
      this.router.navigate(['/dashboard/cuestionarios']);
      return;
    }
    
    // Obtener la fecha actual para el nombre del archivo
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `mi_reporte_nom035_${fecha}.pdf`;
    
    // Seleccionar solo las secciones personales para incluir en el PDF
    const elementosPersonales = document.querySelectorAll('.risk-cards-row, .analysis-section, .recommendations-section');
    
    if (elementosPersonales.length === 0) {
      alert('No se encontraron elementos para generar el reporte. Por favor, intente de nuevo.');
      return;
    }
    
    console.log('Generando reporte personal con', elementosPersonales.length, 'elementos');
    this.generarPDF(elementosPersonales, nombreArchivo, 'Mi Reporte de Evaluación NOM-035');
  }
  
  // Método para descargar el reporte general (todos los datos)
  descargarReporteGeneral(): void {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }
    
    // Obtener la fecha actual para el nombre del archivo
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `reporte_general_nom035_${fecha}.pdf`;
    
    // Seleccionar el contenedor principal
    const dashboardContainer = document.querySelector('.results-dashboard');
    if (!dashboardContainer) {
      alert('No se encontró el contenedor de resultados. Por favor, intente de nuevo.');
      return;
    }
    
    // Determinar qué secciones incluir basado en si el usuario ha completado evaluaciones
    let elementos;
    
    if (this.resultadosRiesgo && this.resultadosRiesgo.length > 0) {
      // Usuario con evaluaciones - incluir resultados globales y medidas preventivas
      elementos = document.querySelectorAll('.global-stats-section, .preventive-measures-section, .normative-compliance-section');
    } else {
      // Usuario sin evaluaciones - incluir todo el dashboard excepto el banner de notificación
      const childElements = dashboardContainer.querySelectorAll(':scope > div:not(.notification-banner)');
      elementos = childElements;
    }
    
    if (elementos.length === 0) {
      alert('No se encontraron elementos para generar el reporte. Por favor, intente de nuevo.');
      return;
    }
    
    console.log('Generando reporte general con', elementos.length, 'elementos');
    this.generarPDF(elementos, nombreArchivo, 'Reporte General NOM-035');
  }
  
  // Método auxiliar para generar el PDF a partir de los elementos seleccionados
  private async generarPDF(elementos: NodeListOf<Element>, nombreArchivo: string, titulo: string): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La generación de PDF solo está disponible en el navegador');
      return;
    }
    
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
      alert('Ha ocurrido un error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  }
}
