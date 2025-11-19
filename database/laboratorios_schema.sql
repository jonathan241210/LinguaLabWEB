-- ============================================
-- SISTEMA DE LABORATORIOS INTERACTIVOS
-- LinguaLab - Actividades basadas en vocabulario
-- ============================================

-- Tabla de plantillas de juegos (10 tipos predefinidos)
CREATE TABLE IF NOT EXISTS plantillas_juegos (
  id_plantilla INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  tipo_juego ENUM(
    'hangman',           -- Ahorcado
    'memory',            -- Memoria/Memorama
    'matching',          -- Emparejar
    'fill_blanks',       -- Llenar espacios
    'multiple_choice',   -- Opción múltiple
    'flashcards',        -- Tarjetas
    'word_search',       -- Sopa de letras
    'crossword',         -- Crucigrama
    'spelling',          -- Deletreo
    'sentence_builder'   -- Constructor de oraciones
  ) NOT NULL UNIQUE,
  descripcion TEXT,
  icono VARCHAR(50), -- Emoji, nombre de clase de icono, o URL de imagen
  tipo_icono ENUM('emoji', 'class', 'url') DEFAULT 'emoji', -- Tipo de icono
  configuracion_default JSON, -- Config por defecto del juego
  nivel_dificultad_sugerido VARCHAR(10), -- A1, A2, B1, etc.
  palabras_minimas INT DEFAULT 5,
  palabras_maximas INT DEFAULT 20,
  instrucciones_template TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tipo_juego (tipo_juego),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar las 10 plantillas predefinidas
INSERT INTO plantillas_juegos (nombre, tipo_juego, descripcion, icono, tipo_icono, configuracion_default, nivel_dificultad_sugerido, palabras_minimas, palabras_maximas, instrucciones_template) VALUES
('Hangman', 'hangman', 'Classic hangman game where students guess letters to form words', '🎯', 'emoji',
  '{"max_attempts": 6, "show_hints": true, "hint_after_attempts": 3, "case_sensitive": false, "show_definition": true, "time_limit": null}', 
  'A1', 5, 15, 'Guess the word by selecting letters. You have {max_attempts} attempts!'),

('Memory Match', 'memory', 'Match pairs of words with their translations', '🎴', 'emoji',
  '{"grid_size": "auto", "cards_visible_time": 3, "show_images": false, "shuffle_on_mistake": false, "max_attempts": null}', 
  'A2', 8, 16, 'Find matching pairs of words and their meanings!'),

('Matching Game', 'matching', 'Connect words with their correct translations', '🔗', 'emoji',
  '{"columns": 2, "shuffle": true, "show_lines": true, "auto_check": false, "timed": false, "time_limit": 300}', 
  'A2', 6, 12, 'Draw lines to connect each word with its correct meaning!'),

('Fill in the Blanks', 'fill_blanks', 'Complete sentences with the correct words', '✏️', 'emoji',
  '{"show_word_bank": true, "case_sensitive": false, "show_hints": true, "auto_generate_sentences": true, "sentence_complexity": "simple"}', 
  'B1', 8, 15, 'Complete the sentences using the words from the word bank!'),

('Multiple Choice Quiz', 'multiple_choice', 'Choose the correct translation from multiple options', '📋', 'emoji',
  '{"options_count": 4, "randomize_options": true, "show_feedback_immediately": true, "allow_retry": false, "time_per_question": 30}', 
  'A1', 10, 20, 'Select the correct answer for each question!'),

('Flashcards', 'flashcards', 'Study vocabulary with interactive flashcards', '🃏', 'emoji',
  '{"auto_flip": false, "auto_advance": false, "shuffle": true, "show_progress": true, "swipe_enabled": true, "study_mode": "both"}', 
  'A1', 10, 30, 'Review vocabulary cards. Click to flip and see the translation!'),

('Word Search', 'word_search', 'Find hidden words in a letter grid', '🔍', 'emoji',
  '{"grid_size": "15x15", "directions": ["horizontal", "vertical", "diagonal"], "highlight_found": true, "timed": true, "time_limit": 600, "show_word_list": true}', 
  'A2', 10, 20, 'Find all the hidden words in the puzzle!'),

('Crossword Puzzle', 'crossword', 'Solve a crossword using word definitions', '📰', 'emoji',
  '{"grid_size": "auto", "show_definitions": true, "check_on_complete": true, "allow_hints": true, "hint_penalty": 10}', 
  'B2', 8, 15, 'Fill the crossword using the clues provided!'),

('Spelling Challenge', 'spelling', 'Listen and spell words correctly', '🎧', 'emoji',
  '{"play_audio": true, "show_definition": false, "attempts_per_word": 3, "case_sensitive": false, "show_first_letter": false}', 
  'A2', 10, 20, 'Listen to the word and type the correct spelling!'),

('Sentence Builder', 'sentence_builder', 'Build correct sentences using given words', '🏗️', 'emoji',
  '{"word_pool_size": "auto", "check_word_order": true, "show_translation": false, "difficulty": "medium", "allow_shuffle": true}', 
  'B1', 5, 10, 'Arrange the words to form a correct sentence!');

-- Tabla de laboratorios creados (instancias de juegos)
CREATE TABLE IF NOT EXISTS laboratorios (
  id_laboratorio INT PRIMARY KEY AUTO_INCREMENT,
  id_plantilla_fk INT NOT NULL,
  id_vocabulario_fk INT NULL, -- Referencia al vocabulario base
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  nivel VARCHAR(10), -- A1, A2, B1, B2, C1, C2
  numero_palabras INT NOT NULL DEFAULT 10,
  configuracion_personalizada JSON, -- Override: tiempo límite, intentos, hints, etc.
  unidades_seleccionadas JSON, -- Array de IDs de unidades: [1,2,3]
  palabras_seleccionadas JSON, -- Array de palabras específicas o NULL para auto
  modo_seleccion ENUM('todas', 'por_unidad', 'manual', 'random') DEFAULT 'por_unidad',
  
  -- Sistema de puntuación y experiencia customizable
  experiencia_base INT DEFAULT 100, -- XP base al completar
  experiencia_bonus_perfecto INT DEFAULT 50, -- XP extra si score = 100%
  puntuacion_minima_aprobar INT DEFAULT 70, -- % mínimo para pasar
  
  -- Configuración de actualización automática
  auto_refresh BOOLEAN DEFAULT FALSE, -- Si se actualiza automáticamente
  refresh_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
  refresh_type ENUM('palabras', 'dificultad', 'ambos') DEFAULT 'palabras',
  ultima_actualizacion TIMESTAMP NULL, -- Última vez que se actualizó auto
  
  -- Configuración de tiempo
  tiempo_limite INT NULL, -- Segundos (NULL = sin límite)
  mostrar_temporizador BOOLEAN DEFAULT TRUE,
  
  -- Configuración de intentos
  intentos_permitidos INT NULL, -- NULL = ilimitados
  permitir_reintentos BOOLEAN DEFAULT TRUE,
  
  -- Configuración de ayudas
  mostrar_definiciones BOOLEAN DEFAULT TRUE,
  permitir_pistas BOOLEAN DEFAULT TRUE,
  penalizacion_por_pista INT DEFAULT 5, -- % de puntos que resta usar una pista
  
  instrucciones_custom TEXT NULL,
  creado_por INT NOT NULL, -- ID del admin/docente que lo creó
  tipo_creador ENUM('admin', 'docente') DEFAULT 'admin',
  publicado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_plantilla_fk) REFERENCES plantillas_juegos(id_plantilla),
  FOREIGN KEY (id_vocabulario_fk) REFERENCES vocabulario(id_vocabulario) ON DELETE CASCADE,
  INDEX idx_publicado (publicado),
  INDEX idx_nivel (nivel),
  INDEX idx_creador (creado_por, tipo_creador),
  INDEX idx_auto_refresh (auto_refresh, refresh_frequency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de asignación de laboratorios a grupos
CREATE TABLE IF NOT EXISTS laboratorio_grupo (
  id_asignacion INT PRIMARY KEY AUTO_INCREMENT,
  id_laboratorio_fk INT NOT NULL,
  id_grupo_fk INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio DATE NULL, -- Cuando está disponible
  fecha_limite DATETIME NULL, -- Fecha límite de entrega
  intentos_permitidos INT DEFAULT NULL, -- NULL = ilimitados
  visible_para_alumnos BOOLEAN DEFAULT TRUE,
  obligatorio BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (id_laboratorio_fk) REFERENCES laboratorios(id_laboratorio) ON DELETE CASCADE,
  FOREIGN KEY (id_grupo_fk) REFERENCES grupos(id_grupo) ON DELETE CASCADE,
  UNIQUE KEY unique_lab_grupo (id_laboratorio_fk, id_grupo_fk),
  INDEX idx_fecha_limite (fecha_limite),
  INDEX idx_visible (visible_para_alumnos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de resultados de laboratorios por alumno
CREATE TABLE IF NOT EXISTS laboratorio_resultados (
  id_resultado INT PRIMARY KEY AUTO_INCREMENT,
  id_asignacion_fk INT NOT NULL,
  id_alumno_fk INT NOT NULL,
  intento_numero INT DEFAULT 1,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completado TIMESTAMP NULL,
  tiempo_transcurrido INT NULL, -- Segundos
  puntuacion INT DEFAULT 0, -- 0-100
  experiencia_ganada INT DEFAULT 0, -- XP obtenida en este intento
  palabras_correctas INT DEFAULT 0,
  palabras_incorrectas INT DEFAULT 0,
  palabras_totales INT DEFAULT 0,
  porcentaje_acierto DECIMAL(5,2) DEFAULT 0.00,
  aprobado BOOLEAN DEFAULT FALSE, -- Si cumplió puntuacion_minima_aprobar
  completado BOOLEAN DEFAULT FALSE,
  calificacion DECIMAL(5,2) NULL, -- 0-10 o 0-100 según sistema
  pistas_usadas INT DEFAULT 0, -- Número de pistas usadas
  datos_juego JSON, -- Detalles específicos del juego jugado
  errores_detallados JSON, -- Palabras falladas, intentos, etc.
  FOREIGN KEY (id_asignacion_fk) REFERENCES laboratorio_grupo(id_asignacion) ON DELETE CASCADE,
  FOREIGN KEY (id_alumno_fk) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  INDEX idx_alumno_completado (id_alumno_fk, completado),
  INDEX idx_puntuacion (puntuacion),
  INDEX idx_fecha (fecha_completado),
  INDEX idx_aprobado (aprobado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de estadísticas de palabras (para análisis)
CREATE TABLE IF NOT EXISTS estadisticas_palabras (
  id_estadistica INT PRIMARY KEY AUTO_INCREMENT,
  id_alumno_fk INT NOT NULL,
  palabra VARCHAR(100) NOT NULL,
  veces_vista INT DEFAULT 0,
  veces_correcta INT DEFAULT 0,
  veces_incorrecta INT DEFAULT 0,
  tasa_exito DECIMAL(5,2) DEFAULT 0.00,
  ultima_vez_vista TIMESTAMP NULL,
  nivel_dominio ENUM('bajo', 'medio', 'alto', 'dominado') DEFAULT 'bajo',
  FOREIGN KEY (id_alumno_fk) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  UNIQUE KEY unique_alumno_palabra (id_alumno_fk, palabra),
  INDEX idx_nivel_dominio (nivel_dominio),
  INDEX idx_tasa_exito (tasa_exito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista para dashboard de laboratorios
CREATE OR REPLACE VIEW vw_laboratorios_dashboard AS
SELECT 
  l.id_laboratorio,
  l.titulo,
  l.nivel,
  l.numero_palabras,
  p.nombre AS tipo_juego,
  p.icono,
  l.publicado,
  l.activo,
  l.creado_por,
  l.tipo_creador,
  COUNT(DISTINCT lg.id_grupo_fk) AS grupos_asignados,
  COUNT(DISTINCT lr.id_alumno_fk) AS alumnos_participantes,
  AVG(lr.puntuacion) AS promedio_puntuacion,
  SUM(CASE WHEN lr.completado = TRUE THEN 1 ELSE 0 END) AS completados,
  l.fecha_creacion
FROM laboratorios l
INNER JOIN plantillas_juegos p ON l.id_plantilla_fk = p.id_plantilla
LEFT JOIN laboratorio_grupo lg ON l.id_laboratorio = lg.id_laboratorio_fk
LEFT JOIN laboratorio_resultados lr ON lg.id_asignacion = lr.id_asignacion_fk
GROUP BY l.id_laboratorio;

-- Vista para reportes de alumnos
CREATE OR REPLACE VIEW vw_reporte_alumno_laboratorios AS
SELECT 
  a.id_alumno,
  a.matricula,
  CONCAT(u.nombre, ' ', u.primer_apellido, ' ', u.segundo_apellido) AS nombre_completo,
  COUNT(DISTINCT lr.id_resultado) AS total_actividades,
  SUM(CASE WHEN lr.completado = TRUE THEN 1 ELSE 0 END) AS actividades_completadas,
  SUM(CASE WHEN lr.aprobado = TRUE THEN 1 ELSE 0 END) AS actividades_aprobadas,
  AVG(lr.puntuacion) AS promedio_general,
  SUM(lr.experiencia_ganada) AS experiencia_total_labs,
  SUM(lr.tiempo_transcurrido) AS tiempo_total_minutos,
  MAX(lr.fecha_completado) AS ultima_actividad
FROM alumnos a
INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
LEFT JOIN laboratorio_resultados lr ON a.id_alumno = lr.id_alumno_fk
GROUP BY a.id_alumno;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedimiento para actualizar laboratorios automáticamente
DELIMITER //

CREATE PROCEDURE sp_actualizar_laboratorios_automaticos()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE lab_id INT;
  DECLARE vocab_id INT;
  DECLARE num_palabras INT;
  DECLARE modo_sel VARCHAR(20);
  DECLARE unidades_sel JSON;
  DECLARE tipo_refresh VARCHAR(20);
  DECLARE frecuencia VARCHAR(20);
  DECLARE ultima_act TIMESTAMP;
  
  DECLARE cur CURSOR FOR 
    SELECT 
      id_laboratorio, 
      id_vocabulario_fk, 
      numero_palabras,
      modo_seleccion,
      unidades_seleccionadas,
      refresh_type,
      refresh_frequency,
      ultima_actualizacion
    FROM laboratorios 
    WHERE auto_refresh = TRUE 
      AND activo = TRUE 
      AND publicado = TRUE;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO lab_id, vocab_id, num_palabras, modo_sel, unidades_sel, tipo_refresh, frecuencia, ultima_act;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Verificar si necesita actualización según frecuencia
    SET @debe_actualizar = FALSE;
    
    IF ultima_act IS NULL THEN
      SET @debe_actualizar = TRUE;
    ELSEIF frecuencia = 'daily' AND DATEDIFF(NOW(), ultima_act) >= 1 THEN
      SET @debe_actualizar = TRUE;
    ELSEIF frecuencia = 'weekly' AND DATEDIFF(NOW(), ultima_act) >= 7 THEN
      SET @debe_actualizar = TRUE;
    ELSEIF frecuencia = 'biweekly' AND DATEDIFF(NOW(), ultima_act) >= 14 THEN
      SET @debe_actualizar = TRUE;
    ELSEIF frecuencia = 'monthly' AND DATEDIFF(NOW(), ultima_act) >= 30 THEN
      SET @debe_actualizar = TRUE;
    END IF;
    
    IF @debe_actualizar THEN
      -- Actualizar palabras aleatorias del vocabulario
      IF tipo_refresh = 'palabras' OR tipo_refresh = 'ambos' THEN
        -- Aquí se regenerarían las palabras_seleccionadas aleatoriamente
        -- Por ahora solo actualizamos el timestamp
        UPDATE laboratorios 
        SET ultima_actualizacion = NOW()
        WHERE id_laboratorio = lab_id;
      END IF;
      
      -- Si se actualiza dificultad, incrementar nivel o cambiar config
      IF tipo_refresh = 'dificultad' OR tipo_refresh = 'ambos' THEN
        -- Lógica para incrementar dificultad (ej: reducir tiempo, quitar hints, etc)
        UPDATE laboratorios 
        SET ultima_actualizacion = NOW()
        WHERE id_laboratorio = lab_id;
      END IF;
    END IF;
    
  END LOOP;
  
  CLOSE cur;
END //

DELIMITER ;

-- Event scheduler para ejecutar actualizaciones automáticas diariamente
-- (Requiere que event_scheduler esté habilitado en MySQL)
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_actualizar_labs_diario
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  CALL sp_actualizar_laboratorios_automaticos();
