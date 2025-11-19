import { DocenteService } from '@/src/services/DocenteService';
import { hashPassword } from '@/lib/hash';
import type { CreateDocenteData } from '@/src/models/Docente';

/**
 * Controlador para operaciones de docentes
 */
export class DocenteController {
  
  /**
   * Obtener docentes con información detallada
   */
  static async obtenerDetallados() {
    try {
      const docentes = await DocenteService.obtenerDetallados();
      return {
        success: true,
        data: docentes
      };
    } catch (error: any) {
      console.error('Error al obtener docentes detallados:', error);
      return {
        success: false,
        message: 'Error al obtener docentes',
        error: error.message
      };
    }
  }

  /**
   * Registrar un nuevo docente
   */
  static async registrar(data: CreateDocenteData) {
    try {
      // Validar campos requeridos
      if (!data.nombre || !data.primer_apellido || !data.matricula || !data.correo || !data.contrasena) {
        return {
          success: false,
          error: 'Faltan campos requeridos'
        };
      }

      // Verificar si el correo ya existe
      const existeCorreo = await DocenteService.existeCorreo(data.correo);
      if (existeCorreo) {
        return {
          success: false,
          error: 'El correo ya está registrado'
        };
      }

      // Verificar si la matrícula ya existe
      const existeMatricula = await DocenteService.existeMatricula(data.matricula);
      if (existeMatricula) {
        return {
          success: false,
          error: 'La matrícula ya está registrada'
        };
      }

      // Hash de la contraseña
      const hashedPassword = hashPassword(data.contrasena);

      // Crear docente
      const result = await DocenteService.crear(data, hashedPassword);

      return {
        success: true,
        message: 'Docente registrado exitosamente',
        data: {
          id_usuario: result.id_usuario,
          id_docente: result.id_docente,
          nombre: data.nombre,
          primer_apellido: data.primer_apellido,
          segundo_apellido: data.segundo_apellido,
          matricula: data.matricula,
          correo: data.correo,
          rol: 'docente'
        }
      };
    } catch (error: any) {
      console.error('Error registrando docente:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Cambiar estado activo de un docente
   */
  static async toggleStatus(id_docente: number) {
    try {
      if (!id_docente) {
        return {
          success: false,
          message: 'ID de docente requerido'
        };
      }

      await DocenteService.toggleStatus(id_docente);

      return {
        success: true,
        message: 'Estado del docente actualizado'
      };
    } catch (error: any) {
      console.error('Error al cambiar estado del docente:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del docente'
      };
    }
  }
}
