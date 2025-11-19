-- ============================================
-- INTEGRACIÓN DEL SISTEMA DE LABORATORIOS
-- Con las tablas existentes de LinguaLab
-- ============================================

-- OPCIÓN 1: INTEGRAR CON TABLA `juegos` EXISTENTE
-- ============================================
-- En lugar de crear `plantillas_juegos` separada,
-- agregamos campos a la tabla `juegos` existente

-- Agregar campos a la tabla juegos existente
ALTER TABLE juegos 
  ADD COLUMN tipo_juego ENUM(
    'hangman', 'memory', 'matching', 'fill_blanks', 
    'multiple_choice', 'flashcards', 'word_search', 
    'crossword', 'spelling', 'sentence_builder'
  ) AFTER descripcion;

ALTER TABLE juegos ADD COLUMN icono VARCHAR(50) AFTER tipo_juego;
ALTER TABLE juegos ADD COLUMN tipo_icono ENUM('emoji', 'class', 'url') DEFAULT 'emoji' AFTER icono;
ALTER TABLE juegos ADD COLUMN es_plantilla BOOLEAN DEFAULT FALSE AFTER tipo_icono;
ALTER TABLE juegos ADD COLUMN palabras_minimas INT DEFAULT 5 AFTER experiencia_max;
ALTER TABLE juegos ADD COLUMN palabras_maximas INT DEFAULT 20 AFTER palabras_minimas;
ALTER TABLE juegos ADD COLUMN instrucciones_template TEXT AFTER palabras_maximas;
ALTER TABLE juegos ADD COLUMN nivel_sugerido VARCHAR(10) DEFAULT 'A1' AFTER instrucciones_template;

-- Agregar índices
ALTER TABLE juegos ADD INDEX idx_tipo_juego (tipo_juego);
ALTER TABLE juegos ADD INDEX idx_plantilla (es_plantilla);

-- OPCIÓN 2: INTEGRAR CON TABLA `actividades` EXISTENTE
-- ============================================
-- Agregamos campos de configuración avanzada a `actividades`

-- Configuración de palabras
ALTER TABLE actividades ADD COLUMN id_vocabulario_fk INT AFTER id_juego_actividad_fk;
ALTER TABLE actividades ADD COLUMN numero_palabras INT DEFAULT 10 AFTER descripcion;
ALTER TABLE actividades ADD COLUMN unidades_seleccionadas JSON AFTER numero_palabras;
ALTER TABLE actividades ADD COLUMN palabras_seleccionadas JSON AFTER unidades_seleccionadas;
ALTER TABLE actividades ADD COLUMN modo_seleccion ENUM('todas', 'por_unidad', 'manual', 'random') DEFAULT 'por_unidad' AFTER palabras_seleccionadas;
ALTER TABLE actividades ADD COLUMN nivel VARCHAR(10) DEFAULT 'A1' AFTER modo_seleccion;

-- Configuración avanzada (XP y scoring)
ALTER TABLE actividades ADD COLUMN experiencia_base INT DEFAULT 100 AFTER experiencia_maxima;
ALTER TABLE actividades ADD COLUMN experiencia_bonus_perfecto INT DEFAULT 50 AFTER experiencia_base;
ALTER TABLE actividades ADD COLUMN puntuacion_minima_aprobar INT DEFAULT 70 AFTER experiencia_bonus_perfecto;

-- Auto-refresh
ALTER TABLE actividades ADD COLUMN auto_refresh BOOLEAN DEFAULT FALSE AFTER puntuacion_minima_aprobar;
ALTER TABLE actividades ADD COLUMN refresh_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly' AFTER auto_refresh;
ALTER TABLE actividades ADD COLUMN refresh_type ENUM('palabras', 'dificultad', 'ambos') DEFAULT 'palabras' AFTER refresh_frequency;
ALTER TABLE actividades ADD COLUMN ultima_actualizacion TIMESTAMP NULL AFTER refresh_type;

-- Configuración de tiempo
ALTER TABLE actividades ADD COLUMN tiempo_limite INT NULL AFTER ultima_actualizacion;
ALTER TABLE actividades ADD COLUMN mostrar_temporizador BOOLEAN DEFAULT TRUE AFTER tiempo_limite;

-- Configuración de intentos
ALTER TABLE actividades ADD COLUMN intentos_permitidos INT NULL AFTER mostrar_temporizador;
ALTER TABLE actividades ADD COLUMN permitir_reintentos BOOLEAN DEFAULT TRUE AFTER intentos_permitidos;

-- Configuración de pistas
ALTER TABLE actividades ADD COLUMN mostrar_definiciones BOOLEAN DEFAULT TRUE AFTER permitir_reintentos;
ALTER TABLE actividades ADD COLUMN permitir_pistas BOOLEAN DEFAULT TRUE AFTER mostrar_definiciones;
ALTER TABLE actividades ADD COLUMN penalizacion_por_pista INT DEFAULT 5 AFTER permitir_pistas;

-- Estado
ALTER TABLE actividades ADD COLUMN publicado BOOLEAN DEFAULT FALSE AFTER activa;

-- Agregar foreign key para vocabulario
ALTER TABLE actividades 
  ADD CONSTRAINT fk_actividades_vocabulario 
  FOREIGN KEY (id_vocabulario_fk) REFERENCES vocabulario(id_vocabulario) 
  ON DELETE SET NULL;

-- Agregar índices
ALTER TABLE actividades ADD INDEX idx_auto_refresh (auto_refresh, ultima_actualizacion);
ALTER TABLE actividades ADD INDEX idx_nivel (nivel);
ALTER TABLE actividades ADD INDEX idx_publicado (publicado);

-- OPCIÓN 3: INTEGRAR CON TABLA `actividad_grupo` EXISTENTE
-- ============================================
-- Ya tienes esta tabla, solo agregamos campos que faltan

ALTER TABLE actividad_grupo ADD COLUMN fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER id_grupo_ag_fk;
ALTER TABLE actividad_grupo ADD COLUMN fecha_limite DATE NULL AFTER fecha_asignacion;
ALTER TABLE actividad_grupo ADD COLUMN intentos_permitidos INT NULL AFTER fecha_limite;
ALTER TABLE actividad_grupo ADD COLUMN visible_para_alumnos BOOLEAN DEFAULT TRUE AFTER intentos_permitidos;
ALTER TABLE actividad_grupo ADD COLUMN obligatorio BOOLEAN DEFAULT TRUE AFTER visible_para_alumnos;

-- Agregar índices
ALTER TABLE actividad_grupo ADD INDEX idx_fecha_limite (fecha_limite);
ALTER TABLE actividad_grupo ADD INDEX idx_visible (visible_para_alumnos);

-- OPCIÓN 4: INTEGRAR CON TABLA `resultados` EXISTENTE
-- ============================================
-- Agregamos campos para el sistema de laboratorios

ALTER TABLE resultados ADD COLUMN intento_numero INT DEFAULT 1 AFTER id_actividad_resultado_fk;
ALTER TABLE resultados ADD COLUMN fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER intento_numero;
ALTER TABLE resultados ADD COLUMN experiencia_ganada INT DEFAULT 0 AFTER puntaje;
ALTER TABLE resultados ADD COLUMN palabras_correctas INT DEFAULT 0 AFTER experiencia_ganada;
ALTER TABLE resultados ADD COLUMN palabras_incorrectas INT DEFAULT 0 AFTER palabras_correctas;
ALTER TABLE resultados ADD COLUMN palabras_totales INT DEFAULT 0 AFTER palabras_incorrectas;
ALTER TABLE resultados ADD COLUMN porcentaje_acierto DECIMAL(5,2) DEFAULT 0.00 AFTER palabras_totales;
ALTER TABLE resultados ADD COLUMN aprobado BOOLEAN DEFAULT FALSE AFTER completado;
ALTER TABLE resultados ADD COLUMN calificacion DECIMAL(5,2) NULL AFTER aprobado;
ALTER TABLE resultados ADD COLUMN pistas_usadas INT DEFAULT 0 AFTER calificacion;
ALTER TABLE resultados ADD COLUMN datos_juego JSON AFTER pistas_usadas;
ALTER TABLE resultados ADD COLUMN errores_detallados JSON AFTER datos_juego;

-- Agregar índices
ALTER TABLE resultados ADD INDEX idx_aprobado (aprobado);
ALTER TABLE resultados ADD INDEX idx_porcentaje (porcentaje_acierto);
ALTER TABLE resultados ADD INDEX idx_intento (intento_numero);

-- OPCIÓN 5: TABLA DE ESTADÍSTICAS DE PALABRAS (NUEVA)
-- ============================================
-- ⚠️ NOTA: Ya existe la tabla `estadisticas_alumno` para métricas GLOBALES
-- Esta tabla es DIFERENTE: tracking POR PALABRA individual

-- estadisticas_alumno (YA EXISTE) → Estadísticas generales del alumno
--   - total_puntaje, total_aciertos, experiencia_basico, racha_actual, etc.
--   - 1 fila por alumno

-- estadisticas_palabras (NUEVA) → Análisis detallado de vocabulario
--   - Cuántas veces vio cada palabra, tasa de éxito por palabra
--   - Muchas filas por alumno (1 por cada palabra única)

CREATE TABLE IF NOT EXISTS estadisticas_palabras (
  id_estadistica_palabra INT PRIMARY KEY AUTO_INCREMENT,
  id_alumno_fk INT NOT NULL,
  palabra VARCHAR(100) NOT NULL,
  significado VARCHAR(255) NULL, -- Para contexto en reportes
  veces_vista INT DEFAULT 0,
  veces_correcta INT DEFAULT 0,
  veces_incorrecta INT DEFAULT 0,
  tasa_exito DECIMAL(5,2) DEFAULT 0.00,
  ultima_vez_vista TIMESTAMP NULL,
  primera_vez_vista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nivel_dominio ENUM('bajo', 'medio', 'alto', 'dominado') DEFAULT 'bajo',
  tiempo_promedio_respuesta INT DEFAULT 0, -- Milisegundos
  FOREIGN KEY (id_alumno_fk) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  UNIQUE KEY unique_alumno_palabra (id_alumno_fk, palabra),
  INDEX idx_nivel_dominio (nivel_dominio),
  INDEX idx_tasa_exito (tasa_exito),
  INDEX idx_ultima_vista (ultima_vez_vista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger para actualizar estadisticas_alumno cuando se actualizan palabras
DELIMITER //

DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_alumno_from_palabras //

CREATE TRIGGER trg_actualizar_estadisticas_alumno_from_palabras
AFTER UPDATE ON estadisticas_palabras
FOR EACH ROW
BEGIN
  -- Calcular totales de todas las palabras del alumno
  DECLARE v_total_vistas INT;
  DECLARE v_total_correctas INT;
  DECLARE v_total_incorrectas INT;
  
  SELECT 
    SUM(veces_vista),
    SUM(veces_correcta),
    SUM(veces_incorrecta)
  INTO v_total_vistas, v_total_correctas, v_total_incorrectas
  FROM estadisticas_palabras
  WHERE id_alumno_fk = NEW.id_alumno_fk;
  
  -- Actualizar estadisticas_alumno
  UPDATE estadisticas_alumno
  SET 
    total_aciertos = v_total_correctas,
    total_errores = v_total_incorrectas,
    ultima_actividad = NOW()
  WHERE id_alumno_estadistica_fk = NEW.id_alumno_fk;
END //

DELIMITER ;

-- ============================================
-- INSERTAR LAS 10 PLANTILLAS EN LA TABLA `juegos`
-- ============================================

INSERT INTO juegos (
  id_admin_juego_fk, nombre, descripcion, dificultad, 
  tipo_juego, icono, tipo_icono, es_plantilla, 
  estructura, experiencia_min, experiencia_max, 
  palabras_minimas, palabras_maximas, 
  instrucciones_template, nivel_sugerido
) VALUES
-- 1. Hangman
(1, 'Hangman', 'Classic hangman game where students guess letters to form words', 'básico',
  'hangman', '🎯', 'emoji', TRUE,
  '{"max_attempts": 6, "show_hints": true, "hint_after_attempts": 3, "case_sensitive": false, "show_definition": true, "time_limit": null}',
  80, 120, 5, 15, 'Guess the word by selecting letters. You have {max_attempts} attempts!', 'A1'),

-- 2. Memory Match
(1, 'Memory Match', 'Match pairs of words with their translations', 'básico',
  'memory', '🎴', 'emoji', TRUE,
  '{"grid_size": "auto", "cards_visible_time": 3, "show_images": false, "shuffle_on_mistake": false, "max_attempts": null}',
  80, 150, 8, 16, 'Find matching pairs of words and their meanings!', 'A1'),

-- 3. Matching Game
(1, 'Matching Game', 'Connect words with their correct translations', 'básico',
  'matching', '🔗', 'emoji', TRUE,
  '{"columns": 2, "shuffle": true, "show_lines": true, "auto_check": false, "timed": false, "time_limit": 300}',
  80, 120, 6, 12, 'Draw lines to connect each word with its correct meaning!', 'A1'),

-- 4. Fill in the Blanks
(1, 'Fill in the Blanks', 'Complete sentences with the correct words', 'básico',
  'fill_blanks', '✏️', 'emoji', TRUE,
  '{"show_word_bank": true, "case_sensitive": false, "show_hints": true, "auto_generate_sentences": true, "sentence_complexity": "simple"}',
  100, 150, 8, 15, 'Complete the sentences using the words from the word bank!', 'A1'),

-- 5. Multiple Choice Quiz
(1, 'Multiple Choice Quiz', 'Choose the correct translation from multiple options', 'básico',
  'multiple_choice', '📋', 'emoji', TRUE,
  '{"options_count": 4, "randomize_options": true, "show_feedback": true, "time_per_question": 30, "allow_skip": false}',
  80, 120, 10, 20, 'Select the correct answer from the options provided!', 'A1'),

-- 6. Flashcards
(1, 'Flashcards', 'Study vocabulary with interactive flashcards', 'básico',
  'flashcards', '🃏', 'emoji', TRUE,
  '{"flip_on_click": true, "shuffle": true, "show_progress": true, "auto_advance": false, "swipe_enabled": true}',
  80, 100, 10, 30, 'Click to flip the cards and learn new vocabulary!', 'A1'),

-- 7. Word Search
(1, 'Word Search', 'Find hidden words in a grid of letters', 'básico',
  'word_search', '🔍', 'emoji', TRUE,
  '{"grid_size": "15x15", "directions": ["horizontal", "vertical", "diagonal"], "show_word_list": true, "time_limit": 600}',
  80, 120, 10, 20, 'Find all the words hidden in the puzzle!', 'A1'),

-- 8. Crossword Puzzle
(1, 'Crossword Puzzle', 'Solve a crossword using word definitions', 'básico',
  'crossword', '📰', 'emoji', TRUE,
  '{"grid_size": "auto", "show_definitions": true, "allow_hints": true, "difficulty": "medium", "numbered_cells": true}',
  120, 180, 8, 15, 'Fill in the crossword using the clues provided!', 'A1'),

-- 9. Spelling Challenge
(1, 'Spelling Challenge', 'Listen and spell words correctly', 'básico',
  'spelling', '🎧', 'emoji', TRUE,
  '{"audio_enabled": true, "attempts_per_word": 3, "show_hints": false, "case_sensitive": false, "pronunciation_speed": "normal"}',
  100, 150, 10, 20, 'Listen carefully and spell the words correctly!', 'A1'),

-- 10. Sentence Builder
(1, 'Sentence Builder', 'Build correct sentences using given words', 'básico',
  'sentence_builder', '🏗️', 'emoji', TRUE,
  '{"word_pool": "auto", "check_order": true, "show_translation": false, "difficulty": "medium", "allow_hints": true}',
  100, 150, 5, 10, 'Arrange the words to build correct sentences!', 'A1');

-- ============================================
-- STORED PROCEDURE PARA AUTO-ACTUALIZACIÓN
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_actualizar_actividades_automaticas //

CREATE PROCEDURE sp_actualizar_actividades_automaticas()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id_actividad INT;
  DECLARE v_refresh_frequency VARCHAR(20);
  DECLARE v_refresh_type VARCHAR(20);
  DECLARE v_ultima_actualizacion TIMESTAMP;
  DECLARE v_numero_palabras INT;
  DECLARE v_id_vocabulario INT;
  DECLARE v_unidades_seleccionadas JSON;
  
  -- Cursor para actividades con auto_refresh activo
  DECLARE cur CURSOR FOR 
    SELECT id_actividad, refresh_frequency, refresh_type, 
           ultima_actualizacion, numero_palabras, 
           id_vocabulario_fk, unidades_seleccionadas
    FROM actividades 
    WHERE auto_refresh = TRUE 
      AND activa = TRUE 
      AND id_vocabulario_fk IS NOT NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id_actividad, v_refresh_frequency, v_refresh_type, 
                   v_ultima_actualizacion, v_numero_palabras, 
                   v_id_vocabulario, v_unidades_seleccionadas;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Verificar si necesita actualización según frecuencia
    SET @necesita_actualizacion = FALSE;
    
    IF v_refresh_frequency = 'daily' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 1) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'weekly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 7) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'biweekly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 14) THEN
      SET @necesita_actualizacion = TRUE;
    ELSEIF v_refresh_frequency = 'monthly' AND 
       (v_ultima_actualizacion IS NULL OR DATEDIFF(NOW(), v_ultima_actualizacion) >= 30) THEN
      SET @necesita_actualizacion = TRUE;
    END IF;
    
    -- Actualizar si es necesario
    IF @necesita_actualizacion = TRUE THEN
      -- Si refresh_type incluye 'palabras' o 'ambos', regenerar palabras_seleccionadas
      IF v_refresh_type IN ('palabras', 'ambos') THEN
        -- Aquí iría la lógica para seleccionar palabras aleatorias
        -- Por ahora solo actualizamos el timestamp
        UPDATE actividades 
        SET ultima_actualizacion = NOW()
        WHERE id_actividad = v_id_actividad;
      END IF;
      
      -- Si refresh_type incluye 'dificultad' o 'ambos', incrementar dificultad
      IF v_refresh_type IN ('dificultad', 'ambos') THEN
        UPDATE actividades 
        SET numero_palabras = LEAST(numero_palabras + 2, 30),
            ultima_actualizacion = NOW()
        WHERE id_actividad = v_id_actividad;
      END IF;
    END IF;
    
  END LOOP;
  
  CLOSE cur;
END //

DELIMITER ;

-- ============================================
-- EVENT SCHEDULER PARA AUTO-ACTUALIZACIÓN
-- ============================================

-- Activar el event scheduler
SET GLOBAL event_scheduler = ON;

-- Crear evento que corre diariamente a medianoche
DROP EVENT IF EXISTS evt_actualizar_actividades_diario;

CREATE EVENT evt_actualizar_actividades_diario
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO 
  CALL sp_actualizar_actividades_automaticas();

-- ============================================
-- VISTAS ACTUALIZADAS
-- ============================================

-- Vista para dashboard de actividades/laboratorios
CREATE OR REPLACE VIEW vw_actividades_dashboard AS
SELECT 
  a.id_actividad,
  a.titulo,
  a.descripcion,
  a.nivel,
  a.numero_palabras,
  j.nombre AS tipo_juego,
  j.tipo_juego AS tipo_juego_code,
  j.icono,
  a.publicado,
  a.activa,
  a.experiencia_minima,
  a.experiencia_base,
  a.puntuacion_minima_aprobar,
  COUNT(DISTINCT ag.id_grupo_ag_fk) AS grupos_asignados,
  COUNT(DISTINCT r.id_alumno_resultado_fk) AS alumnos_participantes,
  AVG(r.puntuacion) AS promedio_puntuacion,
  SUM(CASE WHEN r.completado = TRUE THEN 1 ELSE 0 END) AS completados,
  a.fecha_creacion
FROM actividades a
INNER JOIN juegos j ON a.id_juego_actividad_fk = j.id_juego
LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_ag_fk
LEFT JOIN resultados r ON a.id_actividad = r.id_actividad_resultado_fk
GROUP BY a.id_actividad;

-- Vista para reportes de alumnos
CREATE OR REPLACE VIEW vw_reporte_alumno_actividades AS
SELECT 
  al.id_alumno,
  u.nombre,
  u.primer_apellido,
  al.experiencia_total,
  COUNT(DISTINCT r.id_actividad_resultado_fk) AS actividades_completadas,
  SUM(CASE WHEN r.aprobado = TRUE THEN 1 ELSE 0 END) AS actividades_aprobadas,
  AVG(r.puntuacion) AS promedio_puntuacion,
  SUM(r.experiencia_ganada) AS experiencia_total_actividades,
  MAX(r.fecha) AS ultima_actividad
FROM alumnos al
INNER JOIN usuarios u ON al.id_usuario_alumno_fk = u.id_usuario
LEFT JOIN resultados r ON al.id_alumno = r.id_alumno_resultado_fk
GROUP BY al.id_alumno;

-- ============================================
-- RESUMEN DE CAMBIOS
-- ============================================
/*
✅ INTEGRADO CON TABLAS EXISTENTES:
   - juegos: Agregamos tipo_juego, icono, es_plantilla, palabras_minimas/maximas
   - actividades: Agregamos 15+ campos de configuración avanzada
   - actividad_grupo: Agregamos fecha_limite, visible, obligatorio
   - resultados: Agregamos experiencia_ganada, aprobado, calificacion, pistas_usadas
   - estadisticas_alumno: ✅ YA EXISTE - NO SE MODIFICA (estadísticas globales)

🆕 NUEVA TABLA:
   - estadisticas_palabras: Para tracking individual de cada palabra
     (COMPLEMENTA a estadisticas_alumno, no la reemplaza)

📊 STORED PROCEDURE:
   - sp_actualizar_actividades_automaticas(): Auto-refresh system

⚙️ EVENT SCHEDULER:
   - evt_actualizar_actividades_diario: Corre diariamente

🎯 PLANTILLAS INSERTADAS:
   - 10 juegos como plantillas (es_plantilla = TRUE)

🔗 TRIGGER NUEVO:
   - trg_actualizar_estadisticas_alumno_from_palabras: Sincroniza datos

VENTAJAS DE ESTA INTEGRACIÓN:
1. ✅ No duplicas datos
2. ✅ Sistema unificado de actividades/laboratorios
3. ✅ Reutilizas estructura existente (incluyendo estadisticas_alumno)
4. ✅ Reportes consolidados
5. ✅ Menor complejidad en APIs
6. ✅ Análisis detallado por palabra + estadísticas globales

RELACIÓN DE TABLAS DE ESTADÍSTICAS:
- estadisticas_alumno (EXISTENTE): 1 fila por alumno
  → total_puntaje, experiencia_basico/intermedio/avanzado, racha_actual
  
- estadisticas_palabras (NUEVA): N filas por alumno
  → 1 fila por cada palabra única que ha visto
  → veces_vista, veces_correcta, nivel_dominio por palabra
  
- Ambas se complementan para dar vista 360° del progreso del alumno
*/
