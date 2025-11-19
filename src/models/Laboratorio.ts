/**
 * Modelo de datos para Laboratorio (Actividad)
 */
export interface Laboratorio {
  id_actividad: number;
  id_juego_fk: number;
  id_vocabulario_fk: number;
  titulo: string;
  descripcion?: string;
  nivel: string;
  numero_palabras: number;
  unidades_seleccionadas?: string; // JSON
  palabras_seleccionadas?: string; // JSON
  modo_seleccion: 'random' | 'por_unidad' | 'manual';
  creado_por: number;
  tipo_creador: 'admin' | 'docente';
  publicado: boolean;
  experiencia_base: number;
  experiencia_bonus_perfecto: number;
  puntuacion_minima_aprobar: number;
  tiempo_limite?: number;
  intentos_permitidos?: number;
  permitir_pistas: boolean;
  penalizacion_por_pista: number;
  auto_refresh: boolean;
  refresh_frequency?: string;
  refresh_type?: string;
  fecha_creacion: Date;
  ultima_actualizacion?: Date;
}

export interface LaboratorioDetallado extends Laboratorio {
  tipo_juego: string;
  tipo_juego_code: string;
  icono?: string;
  grupos_asignados: number;
  alumnos_participantes: number;
  promedio_puntuacion?: number;
  completados: number;
}

export interface CreateLaboratorioData {
  id_plantilla: number;
  id_vocabulario: number;
  titulo: string;
  descripcion?: string;
  numero_palabras: number;
  unidades_seleccionadas?: number[];
  modo_seleccion: 'random' | 'por_unidad' | 'manual';
  nivel: string;
  creado_por?: number;
  tipo_creador?: string;
  experiencia_base?: number;
  experiencia_bonus_perfecto?: number;
  puntuacion_minima_aprobar?: number;
  tiempo_limite?: number;
  intentos_permitidos?: number;
  permitir_pistas?: boolean;
  penalizacion_por_pista?: number;
  auto_refresh?: boolean;
  refresh_frequency?: string;
  refresh_type?: string;
}

export interface Plantilla {
  id_juego: number;
  nombre: string;
  tipo_juego: string;
  icono?: string;
  es_plantilla: boolean;
}
