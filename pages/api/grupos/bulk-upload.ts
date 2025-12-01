import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

interface ExcelRow {
  grupo_numero: string;
  cuatrimestre: string;
  programa_codigo: string;
  nivel_codigo: string;
  anio_ingreso: number;
  cuatrimestre_inicial: number;
  estado_practicas: string;
  
  // Datos del docente
  matricula_docente?: string;
  nombre_docente?: string;
  primer_apellido_docente?: string;
  segundo_apellido_docente?: string;
  correo_docente?: string;
  
  // Datos de UN alumno (una fila = un alumno)
  matricula_alumno?: string;
  nombre_alumno?: string;
  primer_apellido_alumno?: string;
  segundo_apellido_alumno?: string;
  correo_alumno?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || (decoded as any).rol !== 'administrador') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { rows }: { rows: ExcelRow[] } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
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
      
      // Verificar que tenga matrícula de alumno (puede ser string o número)
      const matriculaAlumno = row.matricula_alumno ? String(row.matricula_alumno).trim() : '';
      if (matriculaAlumno) {
        gruposMap.get(grupoKey)!.alumnos.push(row);
      }
    }

    let gruposCreados = 0;
    let cohortesCreadas = 0;
    let docentesCreados = 0;
    let docentesAsignados = 0;
    let alumnosCreados = 0;
    let alumnosAsignados = 0;
    const errores: string[] = [];

    // Procesar cada grupo
    for (const [grupoKey, grupoData] of gruposMap) {
      const grupo = grupoData.grupo;

      try {
        // Convertir campos que pueden venir como números del Excel
        const grupoNumero = String(grupo.grupo_numero || '').trim();
        const programaCodigo = String(grupo.programa_codigo || '').trim();
        const nivelCodigo = String(grupo.nivel_codigo || '').trim();
        const estadoPracticas = String(grupo.estado_practicas || 'NO').trim().toUpperCase();
        
        if (!grupoNumero || !grupo.cuatrimestre || !programaCodigo || !nivelCodigo) {
          errores.push(`Grupo ${grupoNumero || 'sin número'}: Faltan campos requeridos`);
          continue;
        }

        if (!/^\d+$/.test(grupoNumero)) {
          errores.push(`Grupo ${grupoNumero}: Debe ser numérico`);
          continue;
        }

        // Obtener ID de cuatrimestre
        const cuatrimestreResult: any = await query(
          'SELECT id_cuatrimestre FROM cuatrimestres WHERE nombre = ? LIMIT 1',
          [grupo.cuatrimestre]
        );
        if (!cuatrimestreResult || cuatrimestreResult.length === 0) {
          errores.push(`Grupo ${grupoNumero}: Cuatrimestre "${grupo.cuatrimestre}" no encontrado`);
          continue;
        }
        const id_cuatrimestre = cuatrimestreResult[0].id_cuatrimestre;

        // Obtener ID de programa
        const programaResult: any = await query(
          'SELECT id_programa FROM programas_educativos WHERE codigo = ? LIMIT 1',
          [programaCodigo]
        );
        if (!programaResult || programaResult.length === 0) {
          errores.push(`Grupo ${grupoNumero}: Programa "${programaCodigo}" no encontrado`);
          continue;
        }
        const id_programa = programaResult[0].id_programa;

        // Obtener ID de nivel
        const nivelResult: any = await query(
          'SELECT id_nivel FROM niveles_educativos WHERE codigo = ? LIMIT 1',
          [nivelCodigo]
        );
        if (!nivelResult || nivelResult.length === 0) {
          errores.push(`Grupo ${grupoNumero}: Nivel "${nivelCodigo}" no encontrado`);
          continue;
        }
        const id_nivel = nivelResult[0].id_nivel;

        // Crear o buscar cohorte
        const anio_ingreso = grupo.anio_ingreso || new Date().getFullYear();
        const cuatrimestre_inicial = grupo.cuatrimestre_inicial || 1;
        
        let cohorteResult: any = await query(
          'SELECT id_cohorte FROM cohortes WHERE anio_ingreso = ? AND cuatrimestre_inicial = ? AND id_programa_cohorte_fk = ? AND id_nivel_inicial_fk = ? LIMIT 1',
          [anio_ingreso, cuatrimestre_inicial, id_programa, id_nivel]
        );

        let id_cohorte;
        if (!cohorteResult || cohorteResult.length === 0) {
          const etiqueta = `${anio_ingreso}-C${cuatrimestre_inicial}-${programaCodigo}-${nivelCodigo}`;
          
          const createCohorte: any = await query(
            'INSERT INTO cohortes (anio_ingreso, cuatrimestre_inicial, id_programa_cohorte_fk, id_nivel_inicial_fk, etiqueta) VALUES (?, ?, ?, ?, ?)',
            [anio_ingreso, cuatrimestre_inicial, id_programa, id_nivel, etiqueta]
          );
          id_cohorte = createCohorte.insertId;
          cohortesCreadas++;
        } else {
          id_cohorte = cohorteResult[0].id_cohorte;
        }

        // Verificar si el grupo ya existe
        const grupoExiste: any = await query(
          'SELECT id_grupo FROM grupos WHERE nombre = ? AND id_cohorte_grupo_fk = ? LIMIT 1',
          [grupoNumero, id_cohorte]
        );

        let id_grupo;
        if (grupoExiste && grupoExiste.length > 0) {
          errores.push(`Grupo ${grupoNumero} ya existe en esta cohorte`);
          continue;
        } else {
          const estado_practicas_bool = estadoPracticas === 'SI' || estadoPracticas === '1' ? 1 : 0;
          
          const createGrupo: any = await query(
            'INSERT INTO grupos (nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, estado_practicas) VALUES (?, ?, ?, ?)',
            [grupoNumero, id_cuatrimestre, id_cohorte, estado_practicas_bool]
          );

          id_grupo = createGrupo.insertId;
          gruposCreados++;
        }

        // Asignar docente
        let id_docente = null;
        const matriculaDocente = grupo.matricula_docente ? String(grupo.matricula_docente).trim() : '';
        if (matriculaDocente) {
          const docenteExiste: any = await query(
            `SELECT d.id_docente 
             FROM docentes d 
             WHERE d.matricula = ? LIMIT 1`,
            [matriculaDocente]
          );

          if (docenteExiste && docenteExiste.length > 0) {
            id_docente = docenteExiste[0].id_docente;
          } else if (grupo.nombre_docente && grupo.primer_apellido_docente && grupo.correo_docente) {
            const hashedPassword = await bcrypt.hash(matriculaDocente, 10);
            
            const nuevoUsuario: any = await query(
              `INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) 
               VALUES (?, ?, ?, ?, ?, 'docente', 1)`,
              [
                String(grupo.nombre_docente).trim(),
                String(grupo.primer_apellido_docente).trim(),
                grupo.segundo_apellido_docente ? String(grupo.segundo_apellido_docente).trim() : '',
                String(grupo.correo_docente).trim(),
                hashedPassword
              ]
            );

            const nuevoDocente: any = await query(
              'INSERT INTO docentes (id_usuario_docente_fk, matricula) VALUES (?, ?)',
              [nuevoUsuario.insertId, matriculaDocente]
            );

            id_docente = nuevoDocente.insertId;
            docentesCreados++;
          }

          if (id_docente) {
            await query(
              'INSERT INTO docente_grupo (id_docente_dg_fk, id_grupo_dg_fk, activo) VALUES (?, ?, 1)',
              [id_docente, id_grupo]
            );
            docentesAsignados++;
          }
        }

        // Asignar alumnos
        for (const alumnoRow of grupoData.alumnos) {
          const matriculaAlumnoStr = alumnoRow.matricula_alumno ? String(alumnoRow.matricula_alumno).trim() : '';
          if (!matriculaAlumnoStr) continue;

          const matricula = matriculaAlumnoStr;
          
          const alumnoExiste: any = await query(
            `SELECT a.id_alumno 
             FROM alumnos a 
             WHERE a.matricula = ? LIMIT 1`,
            [matricula]
          );

          let id_alumno;
          if (alumnoExiste && alumnoExiste.length > 0) {
            id_alumno = alumnoExiste[0].id_alumno;
          } else if (alumnoRow.nombre_alumno && alumnoRow.primer_apellido_alumno && alumnoRow.correo_alumno) {
            const hashedPassword = await bcrypt.hash(matricula, 10);

            const nuevoUsuario: any = await query(
              `INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) 
               VALUES (?, ?, ?, ?, ?, 'alumno', 1)`,
              [
                String(alumnoRow.nombre_alumno).trim(),
                String(alumnoRow.primer_apellido_alumno).trim(),
                alumnoRow.segundo_apellido_alumno ? String(alumnoRow.segundo_apellido_alumno).trim() : '',
                String(alumnoRow.correo_alumno).trim(),
                hashedPassword
              ]
            );

            const nuevoAlumno: any = await query(
              'INSERT INTO alumnos (id_usuario_alumno_fk, matricula) VALUES (?, ?)',
              [nuevoUsuario.insertId, matricula]
            );

            id_alumno = nuevoAlumno.insertId;
            alumnosCreados++;
          } else {
            errores.push(`Alumno ${matricula}: Datos incompletos`);
            continue;
          }

          await query(
            'INSERT INTO alumno_grupo (id_alumno_ag_fk, id_grupo_ag_fk) VALUES (?, ?)',
            [id_alumno, id_grupo]
          );
          alumnosAsignados++;
        }

      } catch (error: any) {
        errores.push(`Grupo ${grupo.grupo_numero}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        gruposCreados,
        cohortesCreadas,
        docentesCreados,
        docentesAsignados,
        alumnosCreados,
        alumnosAsignados,
        errores
      }
    });

  } catch (error: any) {
    console.error('Error en bulk upload:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error processing bulk upload', 
      details: error.message 
    });
  }
}
