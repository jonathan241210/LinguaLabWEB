import { query } from '@/lib/db';
import type { 
  Grupo, 
  GrupoDetallado, 
  CreateGrupoData,
  AsignarAlumnosData,
  AsignarDocenteData
} from '@/src/models/Grupo';

/**
 * Servicio para manejar operaciones de grupos en la base de datos
 */
export class GrupoService {
  
  /**
   * Obtener todos los grupos con información completa
   */
  static async obtenerTodos(): Promise<GrupoDetallado[]> {
    const grupos = await query(
      `SELECT 
        g.id_grupo,
        g.nombre,
        g.estado_practicas,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        p.nombre AS programa,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS docente,
        d.id_docente,
        COUNT(DISTINCT ag.id_alumno_ag_fk) AS total_alumnos
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN programas_educativos p ON coh.id_programa_cohorte_fk = p.id_programa
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo_ag_fk AND ag.activo = 1
      GROUP BY g.id_grupo, g.nombre, g.estado_practicas, c.nombre, coh.etiqueta, p.nombre, docente, d.id_docente
      ORDER BY c.nombre ASC, g.nombre ASC`
    );
    return grupos as GrupoDetallado[];
  }

  /**
   * Obtener grupo por ID con detalles completos
   */
  static async obtenerPorId(id_grupo: number): Promise<GrupoDetallado | null> {
    const grupos = await query(
      `SELECT 
        g.id_grupo,
        g.nombre,
        g.estado_practicas,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        p.nombre AS programa,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS docente,
        d.id_docente,
        COUNT(DISTINCT ag.id_alumno_ag_fk) AS total_alumnos
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN programas_educativos p ON coh.id_programa_cohorte_fk = p.id_programa
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo_ag_fk AND ag.activo = 1
      WHERE g.id_grupo = ?
      GROUP BY g.id_grupo, g.nombre, g.estado_practicas, c.nombre, coh.etiqueta, p.nombre, docente, d.id_docente`,
      [id_grupo]
    );
    
    if (!grupos || grupos.length === 0) return null;
    return grupos[0] as GrupoDetallado;
  }

  /**
   * Verificar si existe un cuatrimestre activo
   */
  static async existeCuatrimestre(id_cuatrimestre: number): Promise<boolean> {
    const result = await query(
      'SELECT id_cuatrimestre FROM cuatrimestres WHERE id_cuatrimestre = ? AND activo = 1',
      [id_cuatrimestre]
    );
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Verificar si existe una cohorte activa
   */
  static async existeCohorte(id_cohorte: number): Promise<boolean> {
    const result = await query(
      'SELECT id_cohorte FROM cohortes WHERE id_cohorte = ? AND activo = 1',
      [id_cohorte]
    );
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Crear un nuevo grupo
   */
  static async crear(data: CreateGrupoData): Promise<number> {
    const result: any = await query(
      `INSERT INTO grupos (nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, estado_practicas)
       VALUES (?, ?, ?, ?)`,
      [data.nombre, data.id_cuatrimestre_grupo_fk, data.id_cohorte_grupo_fk, data.en_practicas || 0]
    );
    return result.insertId;
  }

  /**
   * Verificar si un alumno ya está asignado a un grupo específico
   */
  static async alumnoYaAsignadoAGrupo(id_alumno: number, id_grupo: number): Promise<boolean> {
    const result = await query(
      'SELECT id_alumno_grupo FROM alumno_grupo WHERE id_alumno_ag_fk = ? AND id_grupo_ag_fk = ? AND activo = 1',
      [id_alumno, id_grupo]
    );
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Asignar múltiples alumnos a un grupo
   */
  static async asignarAlumnos(data: AsignarAlumnosData): Promise<void> {
    const values = data.id_alumnos.map((id_alumno) => [data.id_grupo, id_alumno, new Date()]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await query(
      `INSERT INTO alumno_grupo (id_grupo_ag_fk, id_alumno_ag_fk, fecha_ingreso)
       VALUES ${placeholders}`,
      flatValues
    );
  }

  /**
   * Asignar un solo alumno a un grupo existente
   */
  static async asignarAlumnoIndividual(id_grupo: number, id_alumno: number): Promise<void> {
    // Verificar si ya está asignado
    const yaAsignado = await this.alumnoYaAsignadoAGrupo(id_alumno, id_grupo);
    if (yaAsignado) {
      throw new Error('This student is already assigned to this group');
    }

    await query(
      `INSERT INTO alumno_grupo (id_grupo_ag_fk, id_alumno_ag_fk, fecha_ingreso)
       VALUES (?, ?, NOW())`,
      [id_grupo, id_alumno]
    );
  }

  /**
   * Verificar si un docente ya está asignado a un grupo específico
   */
  static async docenteYaAsignadoAGrupo(id_docente: number, id_grupo: number): Promise<boolean> {
    const result = await query(
      'SELECT id_docente_grupo FROM docente_grupo WHERE id_docente_dg_fk = ? AND id_grupo_dg_fk = ? AND activo = 1',
      [id_docente, id_grupo]
    );
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Asignar un docente a un grupo
   */
  static async asignarDocente(data: AsignarDocenteData): Promise<void> {
    // Verificar si ya existe esta asignación activa
    const yaAsignado = await this.docenteYaAsignadoAGrupo(data.id_docente, data.id_grupo);
    if (yaAsignado) {
      throw new Error('This teacher is already assigned to this group');
    }

    // Primero, desactivar asignaciones previas de OTROS docentes
    await query(
      'UPDATE docente_grupo SET activo = 0, fecha_fin = CURRENT_TIMESTAMP WHERE id_grupo_dg_fk = ? AND activo = 1',
      [data.id_grupo]
    );

    // Luego, crear nueva asignación
    await query(
      `INSERT INTO docente_grupo (id_grupo_dg_fk, id_docente_dg_fk, fecha_inicio, activo)
       VALUES (?, ?, CURRENT_TIMESTAMP, 1)`,
      [data.id_grupo, data.id_docente]
    );
  }

  /**
   * Remover un alumno de un grupo
   */
  static async removerAlumno(id_grupo: number, id_alumno: number): Promise<number> {
    const result: any = await query(
      'UPDATE alumno_grupo SET activo = 0, fecha_egreso = CURDATE() WHERE id_grupo_ag_fk = ? AND id_alumno_ag_fk = ? AND activo = 1',
      [id_grupo, id_alumno]
    );
    return result.affectedRows || 0;
  }

  /**
   * Obtener alumnos de un grupo específico
   */
  static async obtenerAlumnos(id_grupo: number): Promise<any[]> {
    const alumnos = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        ag.fecha_ingreso
      FROM alumno_grupo ag
      JOIN alumnos a ON ag.id_alumno_ag_fk = a.id_alumno
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1
      ORDER BY u.primer_apellido, u.nombre`,
      [id_grupo]
    );
    return alumnos;
  }
}
