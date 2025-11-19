/**
 * Modelo de datos para Cohorte
 */
export interface Cohorte {
  id_cohorte: number;
  anio_ingreso: number;
  cuatrimestre_inicial: number;
  id_programa_cohorte_fk: number;
  id_nivel_inicial_fk: number;
  etiqueta: string;
  activo: boolean;
}

export interface CreateCohorteData {
  anio_ingreso: number;
  cuatrimestre_inicial: number;
  id_programa_cohorte_fk: number;
  id_nivel_inicial_fk: number;
  etiqueta: string;
}

export interface ProgramaEducativo {
  id_programa: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface NivelEducativo {
  id_nivel: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface Cuatrimestre {
  id_cuatrimestre: number;
  nombre: string;
  activo: boolean;
}
