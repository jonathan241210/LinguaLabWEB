import { GrupoService } from '@/src/services/GrupoService';
import { AlumnoService } from '@/src/services/AlumnoService';
import type { 
  CreateGrupoData,
  AsignarAlumnosData,
  AsignarDocenteData
} from '@/src/models/Grupo';

/**
 * Controlador para operaciones de grupos
 */
export class GrupoController {
  
  /**
   * Obtener todos los grupos
   */
  static async obtenerTodos() {
    try {
      const grupos = await GrupoService.obtenerTodos();
      return {
        success: true,
        data: grupos
      };
    } catch (error: any) {
      console.error('Error listing groups:', error);
      return {
        success: false,
        message: 'Error retrieving groups',
        error: error.message
      };
    }
  }

  /**
   * Obtener detalle de un grupo específico
   */
  static async obtenerDetalle(id_grupo: number) {
    try {
      if (!id_grupo) {
        return {
          success: false,
          message: 'Group ID is required'
        };
      }

      const grupo = await GrupoService.obtenerPorId(id_grupo);
      
      if (!grupo) {
        return {
          success: false,
          message: 'Group not found'
        };
      }

      const alumnos = await GrupoService.obtenerAlumnos(id_grupo);

      return {
        success: true,
        data: {
          grupo,
          alumnos
        }
      };
    } catch (error: any) {
      console.error('Error getting group details:', error);
      return {
        success: false,
        message: 'Error retrieving group details',
        error: error.message
      };
    }
  }

  /**
   * Crear un nuevo grupo
   */
  static async crear(data: CreateGrupoData) {
    try {
      // Validaciones
      if (!data.nombre || !data.id_cuatrimestre_grupo_fk || !data.id_cohorte_grupo_fk) {
        return {
          success: false,
          message: 'Missing required fields: nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk'
        };
      }

      // Verificar que cuatrimestre existe
      const existeCuatrimestre = await GrupoService.existeCuatrimestre(data.id_cuatrimestre_grupo_fk);
      if (!existeCuatrimestre) {
        return {
          success: false,
          message: 'Semester not valid or inactive'
        };
      }

      // Verificar que cohorte existe
      const existeCohorte = await GrupoService.existeCohorte(data.id_cohorte_grupo_fk);
      if (!existeCohorte) {
        return {
          success: false,
          message: 'Cohort not valid or inactive'
        };
      }

      // Crear grupo
      const id_grupo = await GrupoService.crear(data);

      return {
        success: true,
        message: 'Group created successfully',
        data: { id_grupo }
      };
    } catch (error: any) {
      console.error('Error creating group:', error);
      return {
        success: false,
        message: 'Error creating group',
        error: error.message
      };
    }
  }

  /**
   * Asignar alumnos a un grupo
   */
  static async asignarAlumnos(data: AsignarAlumnosData) {
    try {
      // Validaciones
      if (!data.id_grupo || !data.id_alumnos || !Array.isArray(data.id_alumnos) || data.id_alumnos.length === 0) {
        return {
          success: false,
          message: 'Missing fields: id_grupo and id_alumnos array required'
        };
      }

      // Verificar que grupo existe
      const grupo = await GrupoService.obtenerPorId(data.id_grupo);
      if (!grupo) {
        return {
          success: false,
          message: 'Group not found'
        };
      }

      // Si se proporciona programa y nivel, actualizar alumnos
      if (data.id_programa && data.id_nivel) {
        await AlumnoService.actualizarProgramaNivel(data.id_alumnos, data.id_programa, data.id_nivel);
      }

      // Asignar alumnos al grupo
      await GrupoService.asignarAlumnos(data);

      return {
        success: true,
        message: `${data.id_alumnos.length} student(s) assigned successfully${data.id_programa && data.id_nivel ? ' with program and level updated' : ''}`
      };
    } catch (error: any) {
      console.error('Error assigning students:', error);
      return {
        success: false,
        message: 'Error assigning students',
        error: error.message
      };
    }
  }

  /**
   * Asignar docente a un grupo
   */
  static async asignarDocente(data: AsignarDocenteData) {
    try {
      // Validaciones
      if (!data.id_grupo || !data.id_docente) {
        return {
          success: false,
          message: 'Missing fields: id_grupo and id_docente required'
        };
      }

      // Verificar que grupo existe
      const grupo = await GrupoService.obtenerPorId(data.id_grupo);
      if (!grupo) {
        return {
          success: false,
          message: 'Group not found'
        };
      }

      // Asignar docente al grupo
      await GrupoService.asignarDocente(data);

      return {
        success: true,
        message: 'Teacher assigned successfully'
      };
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      return {
        success: false,
        message: error.message || 'Error assigning teacher',
        error: error.message
      };
    }
  }

  /**
   * Asignar un alumno individual a un grupo existente
   */
  static async asignarAlumnoIndividual(id_grupo: number, id_alumno: number) {
    try {
      if (!id_grupo || !id_alumno) {
        return {
          success: false,
          message: 'Group and student ID required'
        };
      }

      // Verificar que grupo existe
      const grupo = await GrupoService.obtenerPorId(id_grupo);
      if (!grupo) {
        return {
          success: false,
          message: 'Group not found'
        };
      }

      // Asignar alumno
      await GrupoService.asignarAlumnoIndividual(id_grupo, id_alumno);

      return {
        success: true,
        message: 'Student assigned to group successfully'
      };
    } catch (error: any) {
      console.error('Error assigning student to group:', error);
      return {
        success: false,
        message: error.message || 'Error assigning student to group',
        error: error.message
      };
    }
  }

  /**
   * Remover alumno de un grupo
   */
  static async removerAlumno(id_grupo: number, id_alumno: number) {
    try {
      if (!id_grupo || !id_alumno) {
        return {
          success: false,
          message: 'Group and student ID required'
        };
      }

      const affectedRows = await GrupoService.removerAlumno(id_grupo, id_alumno);

      if (affectedRows === 0) {
        return {
          success: false,
          message: 'Student not found in this group or already removed'
        };
      }

      return {
        success: true,
        message: 'Student removed from group successfully'
      };
    } catch (error: any) {
      console.error('Error removing student from group:', error);
      return {
        success: false,
        message: 'Error removing student from group',
        error: error.message
      };
    }
  }
}
