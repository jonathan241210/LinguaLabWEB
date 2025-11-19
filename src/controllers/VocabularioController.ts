import { VocabularioService } from '@/src/services/VocabularioService';
import type { CreateVocabularioData } from '@/src/models/Vocabulario';

/**
 * Controlador para operaciones de vocabulario
 */
export class VocabularioController {
  
  /**
   * Obtener todos los vocabularios
   */
  static async obtenerTodos() {
    try {
      const vocabularios = await VocabularioService.obtenerTodos();
      return {
        success: true,
        vocabularios
      };
    } catch (error: any) {
      console.error('Error fetching vocabularies:', error);
      return {
        success: false,
        error: 'Error fetching vocabularies'
      };
    }
  }

  /**
   * Obtener vocabulario por ID
   */
  static async obtenerPorId(id_vocabulario: number) {
    try {
      if (!id_vocabulario) {
        return {
          success: false,
          error: 'ID de vocabulario requerido'
        };
      }

      const vocabulario = await VocabularioService.obtenerPorId(id_vocabulario);
      
      if (!vocabulario) {
        return {
          success: false,
          error: 'Vocabulario no encontrado'
        };
      }

      return {
        success: true,
        vocabulario
      };
    } catch (error: any) {
      console.error('Error fetching vocabulary:', error);
      return {
        success: false,
        error: 'Error fetching vocabulary'
      };
    }
  }

  /**
   * Crear un nuevo vocabulario
   */
  static async crear(data: CreateVocabularioData) {
    try {
      // Validaciones
      if (!data.nivel) {
        return {
          success: false,
          error: 'Missing required field: nivel'
        };
      }

      if (!data.contenido || !Array.isArray(data.contenido) || data.contenido.length === 0) {
        return {
          success: false,
          error: 'Contenido must be a non-empty array'
        };
      }

      // Crear vocabulario
      const id_vocabulario = await VocabularioService.crear(data);

      // Preparar contenido para respuesta
      const contenidoToSave = data.units_structure && data.units_structure.length > 0 
        ? data.units_structure 
        : data.contenido;

      return {
        success: true,
        message: 'Vocabulary saved successfully',
        vocabulario: {
          id_vocabulario,
          nivel: data.nivel,
          contenido: contenidoToSave,
          archivo_original: data.archivo_original || 'vocabulary.pdf'
        },
        entries: data.contenido.length
      };
    } catch (error: any) {
      console.error('Error saving vocabulary:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Cambiar estado activo de un vocabulario
   */
  static async toggleStatus(id_vocabulario: number) {
    try {
      if (!id_vocabulario) {
        return {
          success: false,
          message: 'ID de vocabulario requerido'
        };
      }

      await VocabularioService.toggleStatus(id_vocabulario);

      return {
        success: true,
        message: 'Estado del vocabulario actualizado'
      };
    } catch (error: any) {
      console.error('Error al cambiar estado del vocabulario:', error);
      return {
        success: false,
        message: 'Error al cambiar estado del vocabulario',
        error: error.message
      };
    }
  }

  /**
   * Obtener unidades de un vocabulario
   */
  static async obtenerUnidades(id_vocabulario: number) {
    try {
      if (!id_vocabulario) {
        return {
          success: false,
          error: 'ID de vocabulario requerido'
        };
      }

      const unidades = await VocabularioService.obtenerUnidades(id_vocabulario);

      return {
        success: true,
        unidades
      };
    } catch (error: any) {
      console.error('Error al obtener unidades:', error);
      return {
        success: false,
        error: 'Error al obtener unidades'
      };
    }
  }

  /**
   * Crear una nueva unidad
   */
  static async crearUnidad(
    id_vocabulario: number,
    numero_unidad: number,
    nombre_unidad: string,
    palabras_ids: number[]
  ) {
    try {
      if (!id_vocabulario || !numero_unidad || !nombre_unidad) {
        return {
          success: false,
          error: 'Faltan campos requeridos'
        };
      }

      const id_unidad = await VocabularioService.crearUnidad(
        id_vocabulario,
        numero_unidad,
        nombre_unidad,
        palabras_ids
      );

      return {
        success: true,
        message: 'Unidad creada exitosamente',
        id_unidad
      };
    } catch (error: any) {
      console.error('Error al crear unidad:', error);
      return {
        success: false,
        error: 'Error al crear unidad'
      };
    }
  }

  /**
   * Actualizar una unidad existente
   */
  static async actualizarUnidad(
    id_unidad: number,
    numero_unidad?: number,
    nombre_unidad?: string,
    palabras_ids?: number[]
  ) {
    try {
      if (!id_unidad) {
        return {
          success: false,
          error: 'ID de unidad requerido'
        };
      }

      const success = await VocabularioService.actualizarUnidad(
        id_unidad,
        numero_unidad,
        nombre_unidad,
        palabras_ids
      );

      if (!success) {
        return {
          success: false,
          error: 'No se proporcionaron campos para actualizar'
        };
      }

      return {
        success: true,
        message: 'Unidad actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al actualizar unidad:', error);
      return {
        success: false,
        error: 'Error al actualizar unidad'
      };
    }
  }

  /**
   * Eliminar una unidad
   */
  static async eliminarUnidad(id_unidad: number) {
    try {
      if (!id_unidad) {
        return {
          success: false,
          error: 'ID de unidad requerido'
        };
      }

      await VocabularioService.eliminarUnidad(id_unidad);

      return {
        success: true,
        message: 'Unidad eliminada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al eliminar unidad:', error);
      return {
        success: false,
        error: 'Error al eliminar unidad'
      };
    }
  }
}
