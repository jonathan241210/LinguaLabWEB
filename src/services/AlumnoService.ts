import { query } from '@/lib/db';
import type { 
  Alumno, 
  AlumnoDetallado, 
  AlumnoDisponible, 
  CreateAlumnoData 
} from '@/src/models/Alumno';

/**
 * Servicio para manejar operaciones de alumnos en la base de datos
 */
export class AlumnoService {
  
  /**
   * Obtener todos los alumnos con su estado (disponible, asignado, inactivo)
   */
  static async obtenerTodos(): Promise<AlumnoDisponible[]> {
    const alumnos = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        IFNULL(p.nombre, 'Sin asignar') AS programa,
        p.nombre AS programa_completo,
        IFNULL(n.nombre, 'Sin asignar') AS nivel,
        u.activo AS usuario_activo,
        CASE 
          WHEN u.activo = 0 THEN 'inactivo'
          WHEN ag.id_alumno_grupo IS NOT NULL THEN 'asignado'
          ELSE 'disponible'
        END AS estado,
        g.nombre AS grupo_actual
      FROM alumnos a
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      LEFT JOIN programas_educativos p ON a.id_programa_alumno_fk = p.id_programa
      LEFT JOIN niveles_educativos n ON a.id_nivel_alumno_fk = n.id_nivel
      LEFT JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk AND ag.activo = 1
      LEFT JOIN grupos g ON ag.id_grupo_ag_fk = g.id_grupo
      ORDER BY u.activo DESC, u.primer_apellido, u.nombre`
    );
    return alumnos as AlumnoDisponible[];
  }

  /**
   * Obtener alumnos con información detallada incluyendo docentes y cohortes
   */
  static async obtenerDetallados(): Promise<AlumnoDetallado[]> {
    const baseSelect = `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        u.correo,
        IFNULL(p.nombre, 'No program') AS programa,
        IFNULL(n.nombre, 'No level') AS nivel,
        u.activo AS usuario_activo,
        CASE 
          WHEN u.activo = 0 THEN 'inactivo'
          WHEN ag.id_alumno_grupo IS NOT NULL THEN 'asignado'
          ELSE 'disponible'
        END AS estado,
        g.nombre AS grupo_actual,
        CONCAT(c.anio_ingreso, '-C', c.cuatrimestre_inicial, '-', pe.codigo, '-', ne.codigo) AS cohorte_etiqueta,
        IFNULL(pe.nombre, 'No program') AS programa_grupo,
        CONCAT(ud.nombre, ' ', ud.primer_apellido, ' ', IFNULL(ud.segundo_apellido, '')) AS docente_nombre,
        ud.correo AS docente_correo,
        {{EN_PRACTICAS_EXPR}} AS en_practicas
      FROM alumnos a
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      LEFT JOIN programas_educativos p ON a.id_programa_alumno_fk = p.id_programa
      LEFT JOIN niveles_educativos n ON a.id_nivel_alumno_fk = n.id_nivel
      LEFT JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk AND ag.activo = 1
      LEFT JOIN grupos g ON ag.id_grupo_ag_fk = g.id_grupo
      LEFT JOIN cohortes c ON g.id_cohorte_grupo_fk = c.id_cohorte
      LEFT JOIN programas_educativos pe ON c.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN niveles_educativos ne ON c.id_nivel_inicial_fk = ne.id_nivel
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios ud ON d.id_usuario_docente_fk = ud.id_usuario
      ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;

    try {
      // Intentar con columna en_practicas
      const sqlWithColumn = baseSelect.replace(
        '{{EN_PRACTICAS_EXPR}}',
        "CASE WHEN a.en_practicas = 1 THEN 'Yes' ELSE 'No' END"
      );
      const alumnos = await query(sqlWithColumn);
      return alumnos as AlumnoDetallado[];
    } catch (error: any) {
      if (error?.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback sin columna en_practicas
        const sqlFallback = baseSelect.replace('{{EN_PRACTICAS_EXPR}}', "'No'");
        const alumnos = await query(sqlFallback);
        return alumnos as AlumnoDetallado[];
      }
      throw error;
    }
  }

  /**
   * Verificar si un correo ya está registrado
   */
  static async existeCorreo(correo: string): Promise<boolean> {
    const result = await query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Verificar si una matrícula ya está registrada
   */
  static async existeMatricula(matricula: string): Promise<boolean> {
    const result = await query('SELECT id_alumno FROM alumnos WHERE matricula = ?', [matricula]);
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Crear un nuevo alumno
   */
  static async crear(data: CreateAlumnoData, hashedPassword: string): Promise<{ id_usuario: number; id_alumno: number }> {
    // Insertar usuario
    const userResult = await query(
      'INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.nombre, data.primer_apellido, data.segundo_apellido || null, data.correo, hashedPassword, data.rol || 'alumno', 1]
    );
    const userId = (userResult as any).insertId;

    // Insertar alumno
    let studentResult: any;
    try {
      studentResult = await query(
        'INSERT INTO alumnos (id_usuario_alumno_fk, matricula, id_programa_alumno_fk, id_nivel_alumno_fk, en_practicas) VALUES (?, ?, ?, ?, ?)',
        [userId, data.matricula, data.id_programa_alumno_fk || null, data.id_nivel_alumno_fk || null, data.en_practicas || 0]
      );
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback sin columna en_practicas
        studentResult = await query(
          'INSERT INTO alumnos (id_usuario_alumno_fk, matricula, id_programa_alumno_fk, id_nivel_alumno_fk) VALUES (?, ?, ?, ?)',
          [userId, data.matricula, data.id_programa_alumno_fk || null, data.id_nivel_alumno_fk || null]
        );
      } else {
        throw e;
      }
    }

    return {
      id_usuario: userId,
      id_alumno: (studentResult as any).insertId
    };
  }

  /**
   * Cambiar estado activo de un alumno
   */
  static async toggleStatus(id_alumno: number): Promise<boolean> {
    const alumnoResult = await query(
      'SELECT id_usuario_alumno_fk FROM alumnos WHERE id_alumno = ?',
      [id_alumno]
    );

    if (!Array.isArray(alumnoResult) || alumnoResult.length === 0) {
      throw new Error('Alumno no encontrado');
    }

    const id_usuario = alumnoResult[0].id_usuario_alumno_fk;

    await query(
      'UPDATE usuarios SET activo = NOT activo WHERE id_usuario = ?',
      [id_usuario]
    );

    return true;
  }

  /**
   * Actualizar programa y nivel de múltiples alumnos
   */
  static async actualizarProgramaNivel(
    id_alumnos: number[],
    id_programa: number,
    id_nivel: number
  ): Promise<void> {
    const updatePromises = id_alumnos.map((id_alumno) =>
      query(
        'UPDATE alumnos SET id_programa_alumno_fk = ?, id_nivel_alumno_fk = ? WHERE id_alumno = ?',
        [id_programa, id_nivel, id_alumno]
      )
    );
    await Promise.all(updatePromises);
  }
}
