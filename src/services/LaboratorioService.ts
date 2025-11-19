import { query, getPool } from '@/lib/db';
import type { 
  Laboratorio,
  LaboratorioDetallado,
  CreateLaboratorioData,
  Plantilla
} from '@/src/models/Laboratorio';

/**
 * Servicio para manejar operaciones de laboratorios (actividades) en la base de datos
 */
export class LaboratorioService {
  
  /**
   * Obtener todos los laboratorios con estadísticas
   */
  static async obtenerTodos(): Promise<LaboratorioDetallado[]> {
    const sqlQuery = `
      SELECT 
        a.id_actividad AS id_laboratorio,
        a.titulo,
        a.nivel,
        a.numero_palabras,
        j.nombre AS tipo_juego,
        j.tipo_juego AS tipo_juego_code,
        j.icono,
        a.publicado,
        a.experiencia_base,
        a.experiencia_bonus_perfecto,
        a.puntuacion_minima_aprobar,
        a.tiempo_limite,
        a.intentos_permitidos,
        a.permitir_pistas,
        COUNT(DISTINCT ag.id_grupo_fk) AS grupos_asignados,
        COUNT(DISTINCT r.id_alumno_fk) AS alumnos_participantes,
        AVG(r.calificacion) AS promedio_puntuacion,
        SUM(CASE WHEN r.aprobado = TRUE THEN 1 ELSE 0 END) AS completados,
        a.fecha_creacion
      FROM actividades a
      INNER JOIN juegos j ON a.id_juego_fk = j.id_juego
      LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_fk
      LEFT JOIN resultados r ON ag.id_asignacion = r.id_asignacion_fk
      WHERE j.es_plantilla = TRUE
      GROUP BY a.id_actividad
      ORDER BY a.fecha_creacion DESC
    `;

    const laboratorios = await query(sqlQuery);
    return (laboratorios || []) as LaboratorioDetallado[];
  }

  /**
   * Obtener plantillas de juegos disponibles
   */
  static async obtenerPlantillas(): Promise<Plantilla[]> {
    const plantillas = await query(
      `SELECT 
        id_juego,
        nombre,
        tipo_juego,
        icono,
        es_plantilla
      FROM juegos
      WHERE es_plantilla = TRUE AND activo = 1`
    );
    return plantillas as Plantilla[];
  }

  /**
   * Obtener palabras de un vocabulario
   */
  static async obtenerPalabrasVocabulario(id_vocabulario: number): Promise<any[]> {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const [vocabulario] = await connection.query(
        'SELECT contenido FROM vocabulario WHERE id_vocabulario = ?',
        [id_vocabulario]
      );

      if (!vocabulario || (vocabulario as any[]).length === 0) {
        return [];
      }

      const contenido = (vocabulario as any[])[0].contenido;
      const palabras = typeof contenido === 'string' ? JSON.parse(contenido) : contenido;
      
      // Si el contenido tiene estructura de unidades, aplanar las palabras
      if (Array.isArray(palabras) && palabras[0]?.words) {
        return palabras.flatMap((unidad: any) => unidad.words);
      }
      
      return palabras;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener palabras específicas de unidades seleccionadas
   */
  static async obtenerPalabrasPorUnidades(
    id_vocabulario: number, 
    unidades_seleccionadas: number[]
  ): Promise<any[]> {
    const unidadesQuery = `
      SELECT palabras_ids 
      FROM vocabulario_unidades 
      WHERE id_unidad IN (${unidades_seleccionadas.map(() => '?').join(',')})
    `;
    const unidadesResult = await query(unidadesQuery, unidades_seleccionadas);
    
    // Procesar los índices y obtener las palabras correspondientes
    // Esta es una simplificación - necesitarías implementar la lógica completa
    const todasLasPalabras = await this.obtenerPalabrasVocabulario(id_vocabulario);
    return todasLasPalabras;
  }

  /**
   * Seleccionar palabras aleatoriamente
   */
  static seleccionarPalabrasAleatorias(palabras: any[], cantidad: number): any[] {
    if (palabras.length <= cantidad) {
      return palabras;
    }
    return palabras.sort(() => 0.5 - Math.random()).slice(0, cantidad);
  }

  /**
   * Crear un nuevo laboratorio
   */
  static async crear(data: CreateLaboratorioData): Promise<number> {
    // Obtener palabras según el modo de selección
    let palabras: any[];
    
    if (data.modo_seleccion === 'por_unidad' && data.unidades_seleccionadas && data.unidades_seleccionadas.length > 0) {
      palabras = await this.obtenerPalabrasPorUnidades(data.id_vocabulario, data.unidades_seleccionadas);
    } else {
      palabras = await this.obtenerPalabrasVocabulario(data.id_vocabulario);
    }

    // Seleccionar palabras según el modo
    let palabrasSeleccionadas = palabras;
    if (data.modo_seleccion === 'random') {
      palabrasSeleccionadas = this.seleccionarPalabrasAleatorias(palabras, data.numero_palabras);
    } else if (palabras.length > data.numero_palabras) {
      palabrasSeleccionadas = palabras.slice(0, data.numero_palabras);
    }

    // Insertar actividad
    const insertQuery = `
      INSERT INTO actividades (
        id_juego_fk,
        id_vocabulario_fk,
        titulo,
        descripcion,
        nivel,
        numero_palabras,
        unidades_seleccionadas,
        palabras_seleccionadas,
        modo_seleccion,
        creado_por,
        tipo_creador,
        publicado,
        experiencia_base,
        experiencia_bonus_perfecto,
        puntuacion_minima_aprobar,
        tiempo_limite,
        mostrar_temporizador,
        intentos_permitidos,
        permitir_reintentos,
        mostrar_definiciones,
        permitir_pistas,
        penalizacion_por_pista,
        auto_refresh,
        refresh_frequency,
        refresh_type,
        ultima_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(insertQuery, [
      data.id_plantilla,
      data.id_vocabulario,
      data.titulo,
      data.descripcion || null,
      data.nivel,
      palabrasSeleccionadas.length,
      data.unidades_seleccionadas ? JSON.stringify(data.unidades_seleccionadas) : null,
      JSON.stringify(palabrasSeleccionadas),
      data.modo_seleccion,
      data.creado_por || 1,
      data.tipo_creador || 'admin',
      data.experiencia_base || 100,
      data.experiencia_bonus_perfecto || 50,
      data.puntuacion_minima_aprobar || 70,
      data.tiempo_limite || null,
      data.tiempo_limite ? true : false,
      data.intentos_permitidos || null,
      data.intentos_permitidos ? true : false,
      data.permitir_pistas !== undefined ? data.permitir_pistas : true,
      data.penalizacion_por_pista || 5,
      data.auto_refresh || false,
      data.refresh_frequency || 'weekly',
      data.refresh_type || 'palabras'
    ]);

    return (result as any).insertId;
  }

  /**
   * Cambiar estado de publicación de un laboratorio
   */
  static async togglePublicacion(id_actividad: number): Promise<boolean> {
    await query(
      'UPDATE actividades SET publicado = NOT publicado WHERE id_actividad = ?',
      [id_actividad]
    );
    return true;
  }

  /**
   * Asignar laboratorio a un grupo
   */
  static async asignarAGrupo(id_actividad: number, id_grupo: number): Promise<void> {
    await query(
      `INSERT INTO actividad_grupo (id_actividad_fk, id_grupo_fk, fecha_asignacion)
       VALUES (?, ?, NOW())`,
      [id_actividad, id_grupo]
    );
  }
}
