/**
 * Modelo de datos para Grupo
 */
export interface Grupo {
  id_grupo: number;
  nombre: string;
  id_cuatrimestre_grupo_fk: number;
  id_cohorte_grupo_fk: number;
  estado_practicas: boolean;
}

export interface GrupoDetallado extends Grupo {
  cuatrimestre?: string;
  cohorte?: string;
  programa?: string;
  docente?: string;
  id_docente?: number;
  total_alumnos: number;
}

export interface CreateGrupoData {
  nombre: string;
  id_cuatrimestre_grupo_fk: number;
  id_cohorte_grupo_fk: number;
  en_practicas?: boolean;
}

export interface AsignarAlumnosData {
  id_grupo: number;
  id_alumnos: number[];
  id_programa?: number;
  id_nivel?: number;
}

export interface AsignarDocenteData {
  id_grupo: number;
  id_docente: number;
}
