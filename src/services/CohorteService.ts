import { query } from '@/lib/db';
import type { 
  Cohorte,
  CreateCohorteData,
  ProgramaEducativo,
  NivelEducativo,
  Cuatrimestre
} from '@/src/models/Cohorte';

/**
 * Servicio para manejar operaciones de cohortes y catálogos en la base de datos
 */
export class CohorteService {
  
  /**
   * Obtener todas las cohortes
   */
  static async obtenerTodas(): Promise<Cohorte[]> {
    const cohortes = await query(
      `SELECT 
        id_cohorte,
        anio_ingreso,
        cuatrimestre_inicial,
        id_programa_cohorte_fk,
        id_nivel_inicial_fk,
        etiqueta,
        activo
      FROM cohortes
      WHERE activo = 1
      ORDER BY anio_ingreso DESC, cuatrimestre_inicial DESC`
    );
    return cohortes as Cohorte[];
  }

  /**
   * Crear una nueva cohorte
   */
  static async crear(data: CreateCohorteData): Promise<number> {
    const result: any = await query(
      `INSERT INTO cohortes (anio_ingreso, cuatrimestre_inicial, id_programa_cohorte_fk, id_nivel_inicial_fk, etiqueta, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [data.anio_ingreso, data.cuatrimestre_inicial, data.id_programa_cohorte_fk, data.id_nivel_inicial_fk, data.etiqueta]
    );
    return result.insertId;
  }

  /**
   * Verificar si existe una cohorte con la misma etiqueta
   */
  static async existeEtiqueta(etiqueta: string): Promise<boolean> {
    const result = await query(
      'SELECT id_cohorte FROM cohortes WHERE etiqueta = ?',
      [etiqueta]
    );
    return Array.isArray(result) && result.length > 0;
  }
}

/**
 * Servicio para catálogos educativos
 */
export class CatalogoService {
  
  /**
   * Obtener todos los programas educativos activos
   */
  static async obtenerProgramas(): Promise<ProgramaEducativo[]> {
    const programas = await query(
      `SELECT 
        id_programa,
        nombre,
        codigo,
        activo
      FROM programas_educativos
      WHERE activo = 1
      ORDER BY nombre ASC`
    );
    return programas as ProgramaEducativo[];
  }

  /**
   * Obtener todos los niveles educativos activos
   */
  static async obtenerNiveles(): Promise<NivelEducativo[]> {
    const niveles = await query(
      `SELECT 
        id_nivel,
        nombre,
        codigo,
        activo
      FROM niveles_educativos
      WHERE activo = 1
      ORDER BY nombre ASC`
    );
    return niveles as NivelEducativo[];
  }

  /**
   * Obtener todos los cuatrimestres activos
   */
  static async obtenerCuatrimestres(): Promise<Cuatrimestre[]> {
    const cuatrimestres = await query(
      `SELECT 
        id_cuatrimestre,
        nombre,
        activo
      FROM cuatrimestres
      WHERE activo = 1
      ORDER BY nombre ASC`
    );
    return cuatrimestres as Cuatrimestre[];
  }

  /**
   * Obtener docentes para catálogo (lista simplificada)
   */
  static async obtenerDocentes(): Promise<any[]> {
    const docentes = await query(
      `SELECT 
        d.id_docente,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        d.matricula
      FROM docentes d
      JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      WHERE u.activo = 1
      ORDER BY u.primer_apellido, u.nombre ASC`
    );
    return docentes;
  }
}
