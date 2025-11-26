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
        a.unidades_seleccionadas,
        v.archivo_original AS vocabulario_nombre,
        j.nombre AS tipo_juego,
        j.tipo_juego AS tipo_juego_code,
        j.icono,
        a.publicado,
        a.published_scope,
        a.notes,
        a.experiencia_base,
        a.experiencia_bonus_perfecto,
        a.puntuacion_minima_aprobar,
        a.tiempo_limite,
        a.intentos_permitidos,
        a.permitir_pistas,
        COUNT(DISTINCT ag.id_grupo_ag_fk) AS grupos_asignados,
        COUNT(DISTINCT r.id_alumno_resultado_fk) AS alumnos_participantes,
        AVG(r.calificacion) AS promedio_puntuacion,
        SUM(CASE WHEN r.aprobado = TRUE THEN 1 ELSE 0 END) AS completados,
        a.fecha_creacion
      FROM actividades a
      INNER JOIN juegos j ON a.id_juego_actividad_fk = j.id_juego
      LEFT JOIN vocabulario v ON a.id_vocabulario_fk = v.id_vocabulario
      LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_ag_fk
      LEFT JOIN resultados r ON a.id_actividad = r.id_actividad_resultado_fk
      WHERE j.es_plantilla = TRUE
      GROUP BY a.id_actividad
      ORDER BY a.fecha_creacion DESC
    `;

    const laboratorios = await query(sqlQuery);
    return (laboratorios || []) as LaboratorioDetallado[];
  }

  /**
   * Obtener nombres de unidades basados en sus IDs
   */
  static obtenerNombresUnidades(unidades_seleccionadas: string | null): string {
    if (!unidades_seleccionadas) return 'All units';
    
    try {
      const ids = JSON.parse(unidades_seleccionadas);
      if (Array.isArray(ids) && ids.length > 0) {
        return `Units: ${ids.join(', ')}`;
      }
      return 'All units';
    } catch {
      return 'All units';
    }
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
      const parsed = typeof contenido === 'string' ? JSON.parse(contenido) : contenido;
      
      console.log('📚 obtenerPalabrasVocabulario DEBUG');
      console.log('   Tipo de parsed:', Array.isArray(parsed) ? 'Array' : 'Object');
      console.log('   Tiene subunits?', parsed?.subunits ? 'SÍ' : 'NO');
      console.log('   Primer elemento:', Array.isArray(parsed) ? parsed[0] : 'N/A');
      
      // Si el contenido es un array de unidades con subunits [{ nombre, numero, subunits: [...] }]
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].subunits) {
        const palabras = parsed.flatMap((unit: any) => 
          (unit.subunits || []).flatMap((subunit: any) => subunit.palabras || [])
        );
        console.log('   ✅ Extraídas', palabras.length, 'palabras de array con subunits');
        return palabras;
      }
      // Si el contenido tiene estructura de unidades con subunits (objeto único)
      else if (parsed.subunits && Array.isArray(parsed.subunits)) {
        const palabras = parsed.subunits.flatMap((subunit: any) => subunit.palabras || []);
        console.log('   ✅ Extraídas', palabras.length, 'palabras de objeto con subunits');
        return palabras;
      }
      // Si tiene estructura de unidades directa (sin subunits)
      else if (Array.isArray(parsed) && parsed[0]?.words) {
        const palabras = parsed.flatMap((unidad: any) => unidad.words);
        console.log('   ✅ Extraídas', palabras.length, 'palabras con property words');
        return palabras;
      }
      // Si es directamente un array de palabras
      else if (Array.isArray(parsed) && parsed[0]?.palabra) {
        console.log('   ✅ Array directo de', parsed.length, 'palabras');
        return parsed;
      }
      
      console.log('   ❌ Estructura no reconocida');
      return [];
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
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      console.log('=== OBTENER PALABRAS POR UNIDADES ===');
      console.log('Vocabulario ID:', id_vocabulario);
      console.log('Unidades seleccionadas:', unidades_seleccionadas);
      
      // Obtener los índices de palabras de las unidades seleccionadas
      const unidadesQuery = `
        SELECT id_unidad, numero_unidad, nombre_unidad, palabras_ids 
        FROM vocabulario_unidades 
        WHERE id_unidad IN (${unidades_seleccionadas.map(() => '?').join(',')})
      `;
      const unidades = await connection.query(unidadesQuery, unidades_seleccionadas);
      
      console.log('Unidades encontradas:', (unidades as any[])[0]?.length);
      
      // Obtener todas las palabras del vocabulario
      const todasLasPalabras = await this.obtenerPalabrasVocabulario(id_vocabulario);
      console.log('Total palabras en vocabulario:', todasLasPalabras.length);
      
      if (!unidades || (unidades as any[])[0].length === 0) {
        console.log('No se encontraron unidades, devolviendo todas las palabras');
        return todasLasPalabras;
      }
      
      // Extraer todos los índices de todas las unidades seleccionadas
      const indices: number[] = [];
      (unidades as any[])[0].forEach((unidad: any) => {
        console.log(`\n📦 Unidad ${unidad.numero_unidad} (${unidad.nombre_unidad})`);
        console.log('   palabras_ids raw:', unidad.palabras_ids);
        if (unidad.palabras_ids) {
          const parsedIds = typeof unidad.palabras_ids === 'string' 
            ? JSON.parse(unidad.palabras_ids) 
            : unidad.palabras_ids;
          console.log('   palabras_ids parsed:', parsedIds);
          console.log('   Es array?', Array.isArray(parsedIds));
          if (Array.isArray(parsedIds)) {
            console.log(`   ✅ ${parsedIds.length} índices agregados:`, parsedIds.slice(0, 5), '...');
            indices.push(...parsedIds);
          } else {
            console.log('   ❌ No es array, tipo:', typeof parsedIds);
          }
        } else {
          console.log('   ❌ palabras_ids es null/undefined');
        }
      });
      
      console.log('\n=== RESUMEN DE ÍNDICES ===');
      console.log('Total índices combinados:', indices.length);
      console.log('Primeros 10 índices:', indices.slice(0, 10));
      console.log('Últimos 10 índices:', indices.slice(-10));
      
      // Filtrar solo las palabras que corresponden a esos índices
      const palabrasFiltradas = indices
        .map(index => todasLasPalabras[index])
        .filter(palabra => palabra !== undefined);
      
      console.log('\n=== RESULTADO FILTRADO ===');
      console.log('Palabras filtradas:', palabrasFiltradas.length);
      console.log('Palabras undefined encontradas:', indices.length - palabrasFiltradas.length);
      if (palabrasFiltradas.length > 0) {
        console.log('Primera palabra:', JSON.stringify(palabrasFiltradas[0]));
        console.log('Última palabra:', JSON.stringify(palabrasFiltradas[palabrasFiltradas.length - 1]));
      }
      console.log('=========================\n');
      
      return palabrasFiltradas;
    } finally {
      connection.release();
    }
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
    } else {
      // SIEMPRE aplicar el límite de numero_palabras
      palabrasSeleccionadas = palabras.slice(0, data.numero_palabras);
    }

    console.log('=== LABORATORIO SERVICE DEBUG ===');
    console.log('Modo selección:', data.modo_seleccion);
    console.log('Numero palabras solicitado:', data.numero_palabras);
    console.log('Total palabras obtenidas:', palabras.length);
    console.log('Palabras seleccionadas FINAL:', palabrasSeleccionadas.length);
    console.log('Primera palabra estructura:', JSON.stringify(palabrasSeleccionadas[0]));
    console.log('Última palabra estructura:', JSON.stringify(palabrasSeleccionadas[palabrasSeleccionadas.length - 1]));
    console.log('Es array de palabras?', palabrasSeleccionadas[0]?.palabra ? 'SI' : 'NO');

    // Insertar actividad
    const insertQuery = `
      INSERT INTO actividades (
        id_juego_actividad_fk,
        id_vocabulario_fk,
        titulo,
        descripcion,
        nivel,
        numero_palabras,
        unidades_seleccionadas,
        palabras_seleccionadas,
        modo_seleccion,
        id_docente_actividad_fk,
        publicado,
        published_scope,
        notes,
        visible_on_desktop,
        visible_on_mobile,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, NOW())
    `;

    console.log('=== ANTES DE INSERTAR EN DB ===');
    console.log('palabrasSeleccionadas.length que se guardará en numero_palabras:', palabrasSeleccionadas.length);
    console.log('Tamaño del JSON a guardar:', JSON.stringify(palabrasSeleccionadas).length, 'caracteres');
    console.log('==================');

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
      data.creado_por || null,
      data.published_scope !== 'admin_only' ? true : false, // Auto-publish para cualquier cosa que no sea admin_only
      data.published_scope || 'admin_only',
      data.notes || null,
      data.published_scope === 'students' ? true : null, // visible_on_desktop (solo students)
      data.published_scope === 'students' ? false : null, // visible_on_mobile (solo students = false)
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

    const id_actividad = (result as any).insertId;

    // Si se especificaron unidades, crear relación en juego_unidad
    if (data.unidades_seleccionadas && data.unidades_seleccionadas.length > 0) {
      const insertUnidadPromises = data.unidades_seleccionadas.map((id_unidad: number) => 
        query(
          'INSERT INTO juego_unidad (id_juego_ju_fk, id_unidad_ju_fk) VALUES (?, ?)',
          [id_actividad, id_unidad]
        )
      );
      await Promise.all(insertUnidadPromises);
    }

    return id_actividad;
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
