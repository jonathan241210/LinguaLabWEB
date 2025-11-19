/**
 * Modelo de datos para Vocabulario
 */
export interface Vocabulario {
  id_vocabulario: number;
  nivel: string;
  contenido: string; // JSON
  archivo_original: string;
  fecha_creacion: Date;
  fecha_actualizacion?: Date;
  activo: boolean;
}

export interface VocabularioParseado extends Omit<Vocabulario, 'contenido'> {
  contenido: PalabraVocabulario[] | UnidadVocabulario[];
}

export interface PalabraVocabulario {
  palabra: string;
  significado: string;
  nivel: string;
}

export interface UnidadVocabulario {
  unit_number: number;
  unit_name: string;
  words: PalabraVocabulario[];
}

export interface CreateVocabularioData {
  nivel: string;
  contenido: PalabraVocabulario[];
  archivo_original?: string;
  units_structure?: UnidadVocabulario[];
}

export interface VocabularioUnidad {
  id_unidad: number;
  id_vocabulario_fk: number;
  numero_unidad: number;
  nombre_unidad: string;
  palabras_ids: string; // JSON array
  activo: boolean;
}
