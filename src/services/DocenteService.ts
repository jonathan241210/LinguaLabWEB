import { query } from '@/lib/db';
import type { 
  Docente, 
  DocenteDetallado, 
  CreateDocenteData 
} from '@/src/models/Docente';

/**
 * Servicio para manejar operaciones de docentes en la base de datos
 */
export class DocenteService {
  
  /**
   * Obtener todos los docentes con información detallada
   */
  static async obtenerDetallados(): Promise<DocenteDetallado[]> {
    const baseSelect = `SELECT 
        d.id_docente,
        d.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        u.correo,
        u.activo AS usuario_activo,
        CASE 
          WHEN u.activo = 0 THEN 'inactivo'
          WHEN (SELECT COUNT(*) FROM docente_grupo dg2 WHERE dg2.id_docente_dg_fk = d.id_docente AND dg2.activo = 1) > 0 THEN 'asignado'
          ELSE 'disponible'
        END AS estado,
        COUNT(DISTINCT dg.id_grupo_dg_fk) AS grupos_asignados,
        GROUP_CONCAT(DISTINCT CONCAT(c.anio_ingreso, '-C', c.cuatrimestre_inicial, '-', pe.codigo, '-', ne.codigo, '-', g.nombre) SEPARATOR ', ') AS grupos_nombres
      FROM docentes d
      JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      LEFT JOIN docente_grupo dg ON d.id_docente = dg.id_docente_dg_fk AND dg.activo = 1
      LEFT JOIN grupos g ON dg.id_grupo_dg_fk = g.id_grupo
      LEFT JOIN cohortes c ON g.id_cohorte_grupo_fk = c.id_cohorte
      LEFT JOIN programas_educativos pe ON c.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN niveles_educativos ne ON c.id_nivel_inicial_fk = ne.id_nivel
      GROUP BY d.id_docente, d.matricula, u.nombre, u.primer_apellido, u.segundo_apellido, u.correo, u.activo
      ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;

    try {
      const docentes = await query(baseSelect);
      return docentes as DocenteDetallado[];
    } catch (error: any) {
      console.error('Error al obtener docentes detallados:', error);
      
      // Fallback con consulta simplificada
      const fallbackSelect = `SELECT 
          d.id_docente,
          d.matricula,
          CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
          u.correo,
          u.activo AS usuario_activo,
          CASE 
            WHEN u.activo = 0 THEN 'inactivo'
            ELSE 'disponible'
          END AS estado,
          0 AS grupos_asignados,
          '' AS grupos_nombres
        FROM docentes d
        JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
        ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;
      
      const docentes = await query(fallbackSelect);
      return docentes as DocenteDetallado[];
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
    const result = await query('SELECT id_docente FROM docentes WHERE matricula = ?', [matricula]);
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Crear un nuevo docente
   */
  static async crear(data: CreateDocenteData, hashedPassword: string): Promise<{ id_usuario: number; id_docente: number }> {
    // Insertar usuario
    const userResult = await query(
      'INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.nombre, data.primer_apellido, data.segundo_apellido || null, data.correo, hashedPassword, data.rol || 'docente', 1]
    );
    const userId = (userResult as any).insertId;

    // Insertar docente
    const docenteResult = await query(
      'INSERT INTO docentes (id_usuario_docente_fk, matricula) VALUES (?, ?)',
      [userId, data.matricula]
    );

    return {
      id_usuario: userId,
      id_docente: (docenteResult as any).insertId
    };
  }

  /**
   * Cambiar estado activo de un docente
   */
  static async toggleStatus(id_docente: number): Promise<boolean> {
    const docenteResult = await query(
      'SELECT id_usuario_docente_fk FROM docentes WHERE id_docente = ?',
      [id_docente]
    );

    if (!Array.isArray(docenteResult) || docenteResult.length === 0) {
      throw new Error('Docente no encontrado');
    }

    const id_usuario = docenteResult[0].id_usuario_docente_fk;

    await query(
      'UPDATE usuarios SET activo = NOT activo WHERE id_usuario = ?',
      [id_usuario]
    );

    return true;
  }
}
