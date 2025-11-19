import { CohorteService, CatalogoService } from '@/src/services/CohorteService';
import type { CreateCohorteData } from '@/src/models/Cohorte';

/**
 * Controlador para operaciones de cohortes
 */
export class CohorteController {
  
  /**
   * Obtener todas las cohortes
   */
  static async obtenerTodas() {
    try {
      const cohortes = await CohorteService.obtenerTodas();
      return {
        success: true,
        data: cohortes
      };
    } catch (error: any) {
      console.error('Error al obtener cohortes:', error);
      return {
        success: false,
        message: 'Error al obtener cohortes',
        error: error.message
      };
    }
  }

  /**
   * Crear una nueva cohorte
   */
  static async crear(data: CreateCohorteData) {
    try {
      // Validar datos requeridos
      if (!data.anio_ingreso || !data.cuatrimestre_inicial || !data.id_programa_cohorte_fk || !data.id_nivel_inicial_fk || !data.etiqueta) {
        return {
          success: false,
          message: 'Todos los campos son obligatorios'
        };
      }

      // Verificar si ya existe una cohorte con la misma etiqueta
      const existeEtiqueta = await CohorteService.existeEtiqueta(data.etiqueta);
      if (existeEtiqueta) {
        return {
          success: false,
          message: 'Ya existe una cohorte con esa etiqueta'
        };
      }

      // Crear cohorte
      const id_cohorte = await CohorteService.crear(data);

      return {
        success: true,
        message: 'Cohorte creado exitosamente',
        data: { id_cohorte }
      };
    } catch (error: any) {
      console.error('Error al crear cohorte:', error);
      return {
        success: false,
        message: 'Error al crear cohorte',
        error: error.message
      };
    }
  }
}

/**
 * Controlador para catálogos educativos
 */
export class CatalogoController {
  
  /**
   * Obtener todos los programas educativos
   */
  static async obtenerProgramas() {
    try {
      const programas = await CatalogoService.obtenerProgramas();
      return {
        success: true,
        data: programas
      };
    } catch (error: any) {
      console.error('Error al obtener programas:', error);
      return {
        success: false,
        message: 'Error al obtener programas',
        error: error.message
      };
    }
  }

  /**
   * Obtener todos los niveles educativos
   */
  static async obtenerNiveles() {
    try {
      const niveles = await CatalogoService.obtenerNiveles();
      return {
        success: true,
        data: niveles
      };
    } catch (error: any) {
      console.error('Error al obtener niveles:', error);
      return {
        success: false,
        message: 'Error al obtener niveles',
        error: error.message
      };
    }
  }

  /**
   * Obtener todos los cuatrimestres
   */
  static async obtenerCuatrimestres() {
    try {
      const cuatrimestres = await CatalogoService.obtenerCuatrimestres();
      return {
        success: true,
        data: cuatrimestres
      };
    } catch (error: any) {
      console.error('Error al obtener cuatrimestres:', error);
      return {
        success: false,
        message: 'Error al obtener cuatrimestres',
        error: error.message
      };
    }
  }

  /**
   * Obtener docentes para catálogo
   */
  static async obtenerDocentes() {
    try {
      const docentes = await CatalogoService.obtenerDocentes();
      return {
        success: true,
        data: docentes
      };
    } catch (error: any) {
      console.error('Error al obtener docentes:', error);
      return {
        success: false,
        message: 'Error al obtener docentes',
        error: error.message
      };
    }
  }
}
