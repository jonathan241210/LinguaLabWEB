import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

interface ExcelRow {
  grupo_numero: string;
  cuatrimestre: string;
  programa_codigo: string;
  nivel_codigo: string;
  anio_ingreso: number;
  cuatrimestre_inicial: number;
  estado_practicas: string;
  
  matricula_docente?: string;
  nombre_docente?: string;
  primer_apellido_docente?: string;
  segundo_apellido_docente?: string;
  correo_docente?: string;
  
  matricula_alumno?: string;
  nombre_alumno?: string;
  primer_apellido_alumno?: string;
  segundo_apellido_alumno?: string;
  correo_alumno?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || (decoded as any).rol !== 'administrador') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { rows }: { rows: ExcelRow[] } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    // Agrupar filas por grupo
    const gruposMap = new Map<string, {
      grupo: ExcelRow;
      alumnos: ExcelRow[];
    }>();

    for (const row of rows) {
      const grupoKey = `${row.grupo_numero}-${row.programa_codigo}-${row.nivel_codigo}-${row.anio_ingreso}-${row.cuatrimestre}`;
      
      if (!gruposMap.has(grupoKey)) {
        gruposMap.set(grupoKey, {
          grupo: row,
          alumnos: []
        });
      }
      
      const matriculaAlumno = row.matricula_alumno ? String(row.matricula_alumno).trim() : '';
      if (matriculaAlumno) {
        gruposMap.get(grupoKey)!.alumnos.push(row);
      }
    }

    const preview = {
      totalGrupos: 0,
      totalCohortes: 0,
      totalDocentes: 0,
      totalAlumnos: 0,
      grupos: [] as any[],
      cohortes: [] as any[],
      docentes: [] as any[],
      alumnos: [] as any[],
      warnings: [] as string[]
    };

    const cohortesSet = new Set<string>();
    const docentesSet = new Set<string>();
    const alumnosSet = new Set<string>();

    // Analizar cada grupo
    for (const [grupoKey, grupoData] of gruposMap) {
      const grupo = grupoData.grupo;
      
      const grupoNumero = String(grupo.grupo_numero || '').trim();
      const programaCodigo = String(grupo.programa_codigo || '').trim();
      const nivelCodigo = String(grupo.nivel_codigo || '').trim();
      const estadoPracticas = String(grupo.estado_practicas || 'NO').trim().toUpperCase();

      if (!grupoNumero || !grupo.cuatrimestre || !programaCodigo || !nivelCodigo) {
        preview.warnings.push(`Grupo ${grupoNumero || 'sin número'}: Faltan campos requeridos`);
        continue;
      }

      // Verificar si el grupo ya existe
      const grupoExisteResult: any = await query(
        `SELECT g.id_grupo, g.nombre FROM grupos g
         INNER JOIN cohortes c ON g.id_cohorte_grupo_fk = c.id_cohorte
         INNER JOIN programas_educativos p ON c.id_programa_cohorte_fk = p.id_programa
         INNER JOIN niveles_educativos n ON c.id_nivel_inicial_fk = n.id_nivel
         WHERE g.nombre = ? AND p.codigo = ? AND n.codigo = ? AND c.anio_ingreso = ?`,
        [grupoNumero, programaCodigo, nivelCodigo, grupo.anio_ingreso]
      );

      if (grupoExisteResult && grupoExisteResult.length > 0) {
        preview.warnings.push(`⚠️ Grupo ${grupoNumero} ya existe - se omitirá`);
        continue;
      }

      // Cohorte
      const anio_ingreso = grupo.anio_ingreso || new Date().getFullYear();
      const cuatrimestre_inicial = grupo.cuatrimestre_inicial || 1;
      const cohorteEtiqueta = `${anio_ingreso}-C${cuatrimestre_inicial}-${programaCodigo}-${nivelCodigo}`;
      
      if (!cohortesSet.has(cohorteEtiqueta)) {
        const cohorteExiste: any = await query(
          'SELECT id_cohorte FROM cohortes WHERE etiqueta = ? LIMIT 1',
          [cohorteEtiqueta]
        );
        
        preview.cohortes.push({
          etiqueta: cohorteEtiqueta,
          existe: cohorteExiste && cohorteExiste.length > 0,
          anio: anio_ingreso,
          cuatrimestre: cuatrimestre_inicial,
          programa: programaCodigo,
          nivel: nivelCodigo
        });
        
        if (!cohorteExiste || cohorteExiste.length === 0) {
          preview.totalCohortes++;
        }
        cohortesSet.add(cohorteEtiqueta);
      }

      // Docente
      const matriculaDocente = grupo.matricula_docente ? String(grupo.matricula_docente).trim() : '';
      if (matriculaDocente && !docentesSet.has(matriculaDocente)) {
        const docenteExiste: any = await query(
          'SELECT d.id_docente, u.nombre, u.primer_apellido FROM docentes d INNER JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario WHERE d.matricula = ? LIMIT 1',
          [matriculaDocente]
        );

        preview.docentes.push({
          matricula: matriculaDocente,
          nombre: grupo.nombre_docente || '',
          primer_apellido: grupo.primer_apellido_docente || '',
          segundo_apellido: grupo.segundo_apellido_docente || '',
          correo: grupo.correo_docente || '',
          existe: docenteExiste && docenteExiste.length > 0
        });

        if (!docenteExiste || docenteExiste.length === 0) {
          preview.totalDocentes++;
        }
        docentesSet.add(matriculaDocente);
      }

      // Alumnos
      for (const alumnoRow of grupoData.alumnos) {
        const matriculaAlumnoStr = alumnoRow.matricula_alumno ? String(alumnoRow.matricula_alumno).trim() : '';
        if (!matriculaAlumnoStr || alumnosSet.has(matriculaAlumnoStr)) continue;

        const alumnoExiste: any = await query(
          'SELECT a.id_alumno, u.nombre, u.primer_apellido FROM alumnos a INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario WHERE a.matricula = ? LIMIT 1',
          [matriculaAlumnoStr]
        );

        preview.alumnos.push({
          matricula: matriculaAlumnoStr,
          nombre: alumnoRow.nombre_alumno || '',
          primer_apellido: alumnoRow.primer_apellido_alumno || '',
          segundo_apellido: alumnoRow.segundo_apellido_alumno || '',
          correo: alumnoRow.correo_alumno || '',
          existe: alumnoExiste && alumnoExiste.length > 0,
          grupo: grupoNumero
        });

        if (!alumnoExiste || alumnoExiste.length === 0) {
          preview.totalAlumnos++;
        }
        alumnosSet.add(matriculaAlumnoStr);
      }

      // Agregar grupo al preview
      preview.grupos.push({
        numero: grupoNumero,
        cohorte: cohorteEtiqueta,
        cuatrimestre: grupo.cuatrimestre,
        programa: programaCodigo,
        nivel: nivelCodigo,
        estado_practicas: estadoPracticas,
        docente: matriculaDocente || 'Sin asignar',
        totalAlumnos: grupoData.alumnos.length
      });

      preview.totalGrupos++;
    }

    return res.status(200).json({
      success: true,
      preview
    });

  } catch (error: any) {
    console.error('Error en preview bulk upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing preview: ' + error.message
    });
  }
}
