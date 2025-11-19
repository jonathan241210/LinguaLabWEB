import { query, getPool } from '@/lib/db';
import type { 
  Vocabulario,
  VocabularioParseado,
  CreateVocabularioData,
  VocabularioUnidad
} from '@/src/models/Vocabulario';

/**
 * Servicio para manejar operaciones de vocabulario en la base de datos
 */
export class VocabularioService {
  
  /**
   * Obtener todos los vocabularios
   */
  static async obtenerTodos(): Promise<VocabularioParseado[]> {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const [vocabularios] = await connection.query(
        `SELECT 
          id_vocabulario,
          nivel,
          contenido,
          archivo_original,
          fecha_creacion,
          fecha_actualizacion,
          activo
        FROM vocabulario
        WHERE contenido IS NOT NULL
        ORDER BY fecha_creacion DESC`
      );

      // Parse contenido JSON para cada vocabulario
      const parsedVocabularios = (vocabularios as any[]).map(vocab => ({
        ...vocab,
        contenido: typeof vocab.contenido === 'string' ? JSON.parse(vocab.contenido) : vocab.contenido
      }));

      return parsedVocabularios as VocabularioParseado[];
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener vocabulario por ID
   */
  static async obtenerPorId(id_vocabulario: number): Promise<VocabularioParseado | null> {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const [vocabularios] = await connection.query(
        `SELECT 
          id_vocabulario,
          nivel,
          contenido,
          archivo_original,
          fecha_creacion,
          fecha_actualizacion,
          activo
        FROM vocabulario
        WHERE id_vocabulario = ?`,
        [id_vocabulario]
      );

      if (!vocabularios || (vocabularios as any[]).length === 0) {
        return null;
      }

      const vocab = (vocabularios as any[])[0];
      return {
        ...vocab,
        contenido: typeof vocab.contenido === 'string' ? JSON.parse(vocab.contenido) : vocab.contenido
      } as VocabularioParseado;
    } finally {
      connection.release();
    }
  }

  /**
   * Crear un nuevo vocabulario
   */
  static async crear(data: CreateVocabularioData): Promise<number> {
    const filename = data.archivo_original || 'vocabulary.pdf';
    const contenidoToSave = data.units_structure && data.units_structure.length > 0 
      ? data.units_structure  // Guardar estructura completa con unidades
      : data.contenido;       // Fallback a array plano

    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        `INSERT INTO vocabulario (nivel, contenido, archivo_original)
         VALUES (?, ?, ?)`,
        [data.nivel, JSON.stringify(contenidoToSave), filename]
      );

      return (result as any).insertId;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar vocabulario existente
   */
  static async actualizar(
    id_vocabulario: number, 
    data: Partial<CreateVocabularioData>
  ): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.nivel) {
        updates.push('nivel = ?');
        values.push(data.nivel);
      }

      if (data.contenido) {
        updates.push('contenido = ?');
        const contenidoToSave = data.units_structure && data.units_structure.length > 0 
          ? data.units_structure 
          : data.contenido;
        values.push(JSON.stringify(contenidoToSave));
      }

      if (data.archivo_original) {
        updates.push('archivo_original = ?');
        values.push(data.archivo_original);
      }

      updates.push('fecha_actualizacion = NOW()');
      values.push(id_vocabulario);

      await connection.query(
        `UPDATE vocabulario SET ${updates.join(', ')} WHERE id_vocabulario = ?`,
        values
      );

      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar estado activo de un vocabulario
   */
  static async toggleStatus(id_vocabulario: number): Promise<boolean> {
    await query(
      'UPDATE vocabulario SET activo = NOT activo WHERE id_vocabulario = ?',
      [id_vocabulario]
    );
    return true;
  }

  /**
   * Obtener unidades de un vocabulario
   */
  static async obtenerUnidades(id_vocabulario: number): Promise<VocabularioUnidad[]> {
    const unidades = await query(
      `SELECT 
        id_unidad,
        id_vocabulario_fk,
        numero_unidad,
        nombre_unidad,
        palabras_ids,
        activo
      FROM vocabulario_unidades
      WHERE id_vocabulario_fk = ?
      ORDER BY numero_unidad ASC`,
      [id_vocabulario]
    );
    return unidades as VocabularioUnidad[];
  }

  /**
   * Crear una nueva unidad de vocabulario
   */
  static async crearUnidad(
    id_vocabulario: number,
    numero_unidad: number,
    nombre_unidad: string,
    palabras_ids: number[]
  ): Promise<number> {
    const result = await query(
      `INSERT INTO vocabulario_unidades (id_vocabulario_fk, numero_unidad, nombre_unidad, palabras_ids)
       VALUES (?, ?, ?, ?)`,
      [id_vocabulario, numero_unidad, nombre_unidad, JSON.stringify(palabras_ids)]
    );
    return (result as any).insertId;
  }

  /**
   * Actualizar una unidad existente
   */
  static async actualizarUnidad(
    id_unidad: number,
    numero_unidad?: number,
    nombre_unidad?: string,
    palabras_ids?: number[]
  ): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (numero_unidad !== undefined) {
      updates.push('numero_unidad = ?');
      values.push(numero_unidad);
    }

    if (nombre_unidad !== undefined) {
      updates.push('nombre_unidad = ?');
      values.push(nombre_unidad);
    }

    if (palabras_ids !== undefined) {
      updates.push('palabras_ids = ?');
      values.push(JSON.stringify(palabras_ids));
    }

    if (updates.length === 0) return false;

    values.push(id_unidad);

    await query(
      `UPDATE vocabulario_unidades SET ${updates.join(', ')} WHERE id_unidad = ?`,
      values
    );

    return true;
  }

  /**
   * Eliminar una unidad
   */
  static async eliminarUnidad(id_unidad: number): Promise<boolean> {
    await query(
      'UPDATE vocabulario_unidades SET activo = 0 WHERE id_unidad = ?',
      [id_unidad]
    );
    return true;
  }
}
