import { LaboratorioService } from '@/src/services/LaboratorioService';
import type { CreateLaboratorioData } from '@/src/models/Laboratorio';

/**
 * Controlador para operaciones de laboratorios
 */
export class LaboratorioController {
  
  /**
   * Obtener todos los laboratorios
   */
  static async obtenerTodos() {
    try {
      const laboratorios = await LaboratorioService.obtenerTodos();
      return {
        success: true,
        laboratorios: laboratorios || []
      };
    } catch (error: any) {
      console.error('Error fetching laboratorios:', error);
      return {
        success: false,
        error: 'Error fetching laboratorios'
      };
    }
  }

  /**
   * Obtener plantillas de juegos disponibles
   */
  static async obtenerPlantillas() {
    try {
      const plantillas = await LaboratorioService.obtenerPlantillas();
      return {
        success: true,
        plantillas: plantillas || []
      };
    } catch (error: any) {
      console.error('Error fetching plantillas:', error);
      return {
        success: false,
        error: 'Error fetching plantillas'
      };
    }
  }

  /**
   * Crear un nuevo laboratorio
   */
  static async crear(data: CreateLaboratorioData) {
    try {
      // Validaciones
      if (!data.id_plantilla || !data.id_vocabulario || !data.titulo) {
        return {
          success: false,
          error: 'Missing required fields: id_plantilla, id_vocabulario, titulo'
        };
      }

      // Crear laboratorio
      const id_actividad = await LaboratorioService.crear(data);

      return {
        success: true,
        message: 'Laboratory created successfully',
        id_actividad
      };
    } catch (error: any) {
      console.error('Error creating laboratory:', error);
      return {
        success: false,
        error: 'Error creating laboratory'
      };
    }
  }

  /**
   * Cambiar estado de publicación de un laboratorio
   */
  static async togglePublicacion(id_actividad: number) {
    try {
      if (!id_actividad) {
        return {
          success: false,
          message: 'ID de actividad requerido'
        };
      }

      await LaboratorioService.togglePublicacion(id_actividad);

      return {
        success: true,
        message: 'Estado de publicación actualizado'
      };
    } catch (error: any) {
      console.error('Error al cambiar estado de publicación:', error);
      return {
        success: false,
        message: 'Error al cambiar estado de publicación',
        error: error.message
      };
    }
  }

  /**
   * Asignar laboratorio a un grupo
   */
  static async asignarAGrupo(id_actividad: number, id_grupo: number) {
    try {
      if (!id_actividad || !id_grupo) {
        return {
          success: false,
          message: 'ID de actividad y grupo requeridos'
        };
      }

      await LaboratorioService.asignarAGrupo(id_actividad, id_grupo);

      return {
        success: true,
        message: 'Laboratorio asignado al grupo exitosamente'
      };
    } catch (error: any) {
      console.error('Error al asignar laboratorio:', error);
      return {
        success: false,
        message: 'Error al asignar laboratorio',
        error: error.message
      };
    }
  }
}
