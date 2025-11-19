import { AlumnoService } from '@/src/services/AlumnoService';
import { hashPassword } from '@/lib/hash';
import type { CreateAlumnoData } from '@/src/models/Alumno';

/**
 * Controlador para operaciones de alumnos
 */
export class AlumnoController {
  
  /**
   * Obtener todos los alumnos disponibles
   */
  static async obtenerDisponibles() {
    try {
      const alumnos = await AlumnoService.obtenerTodos();
      return {
        success: true,
        data: alumnos
      };
    } catch (error: any) {
      console.error('Error al obtener alumnos disponibles:', error);
      return {
        success: false,
        message: 'Error al obtener alumnos',
        error: error.message
      };
    }
  }

  /**
   * Obtener alumnos con información detallada
   */
  static async obtenerDetallados() {
    try {
      const alumnos = await AlumnoService.obtenerDetallados();
      return {
        success: true,
        data: alumnos,
        warning: alumnos.length === 0 ? 'No se encontraron alumnos' : undefined
      };
    } catch (error: any) {
      console.error('Error al obtener alumnos detallados:', error);
      return {
        success: false,
        message: 'Error al obtener alumnos',
        error: error.message
      };
    }
  }

  /**
   * Registrar un nuevo alumno
   */
  static async registrar(data: CreateAlumnoData) {
    try {
      // Validar campos requeridos
      if (!data.nombre || !data.primer_apellido || !data.matricula || !data.correo || !data.contrasena) {
        return {
          success: false,
          error: 'Faltan campos requeridos'
        };
      }

      // Verificar si el correo ya existe
      const existeCorreo = await AlumnoService.existeCorreo(data.correo);
      if (existeCorreo) {
        return {
          success: false,
          error: 'El correo ya está registrado'
        };
      }

      // Verificar si la matrícula ya existe
      const existeMatricula = await AlumnoService.existeMatricula(data.matricula);
      if (existeMatricula) {
        return {
          success: false,
          error: 'La matrícula ya está registrada'
        };
      }

      // Hash de la contraseña
      const hashedPassword = hashPassword(data.contrasena);

      // Crear alumno
      const result = await AlumnoService.crear(data, hashedPassword);

      return {
        success: true,
        message: 'Alumno registrado exitosamente',
        data: {
          id_usuario: result.id_usuario,
          id_alumno: result.id_alumno,
          nombre: data.nombre,
          primer_apellido: data.primer_apellido,
          segundo_apellido: data.segundo_apellido,
          matricula: data.matricula,
          correo: data.correo,
          rol: 'alumno'
        }
      };
    } catch (error: any) {
      console.error('Error registrando alumno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Cambiar estado activo de un alumno
   */
  static async toggleStatus(id_alumno: number) {
    try {
      if (!id_alumno) {
        return {
          success: false,
          message: 'ID de alumno requerido'
        };
      }

      await AlumnoService.toggleStatus(id_alumno);

      return {
        success: true,
        message: 'Estado del alumno actualizado'
      };
    } catch (error: any) {
      console.error('Error al cambiar estado del alumno:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del alumno'
      };
    }
  }
}
