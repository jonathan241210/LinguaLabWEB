# Arquitectura de Laboratorios - Sistema Integrado

## 📋 Resumen

El sistema de laboratorios está completamente integrado con la estructura de actividades existente, reutilizando las tablas: `juegos`, `actividades`, `actividad_grupo`, `resultados` y `estadisticas_palabras`.

---

## 🏗️ Arquitectura de Base de Datos

### Tabla Principal: `juegos`
Contiene las **plantillas de juegos** creadas por el administrador.

**Campos clave:**
- `id_juego_actividad` (PK)
- `nombre` - Nombre del juego (ej: "Hangman", "Memory Match")
- `tipo_juego` - ENUM: hangman, memory, matching, fill_blanks, etc.
- `icono` - Emoji representativo (🎯, 🎴, 🔗, etc.)
- `es_plantilla` - **TRUE** para plantillas del admin
- `nivel_sugerido` - Nivel recomendado (A1, A2, B1, B2)
- `palabras_minimas` / `palabras_maximas` - Rango de palabras
- `instrucciones_template` - Plantilla de instrucciones

**Plantillas predefinidas (10):**
1. 🎯 Hangman (Ahorcado)
2. 🎴 Memory Match (Memoria)
3. 🔗 Matching Game (Emparejar)
4. ✏️ Fill in the Blanks (Completar)
5. 📋 Multiple Choice Quiz (Opción múltiple)
6. 🃏 Flashcards (Tarjetas)
7. 🔍 Word Search (Sopa de letras)
8. 📰 Crossword Puzzle (Crucigrama)
9. 🎧 Spelling Challenge (Dictado)
10. 🏗️ Sentence Builder (Construir oraciones)

---

### Tabla: `actividades`
Contiene las **actividades/laboratorios específicos** creados por admin o docentes.

**Campos de configuración (18+):**
- `id_actividad` (PK)
- `id_juego_actividad_fk` - Referencia a plantilla en `juegos`
- `id_vocabulario_fk` - Referencia a vocabulario
- `titulo`, `descripcion`, `nivel`
- `numero_palabras` - Cantidad de palabras en esta actividad
- `unidades_seleccionadas` - JSON con IDs de unidades
- `palabras_seleccionadas` - JSON con palabras específicas
- `modo_seleccion` - ENUM: 'todas', 'por_unidad', 'random'
- `creado_por`, `tipo_creador` - 'admin' o 'docente'
- `publicado` - TRUE/FALSE

**Sistema de Experiencia:**
- `experiencia_base` - XP base por completar (default: 100)
- `experiencia_bonus_perfecto` - XP extra por perfecto (default: 50)
- `puntuacion_minima_aprobar` - % mínimo para aprobar (default: 70)

**Sistema de Tiempo:**
- `tiempo_limite` - Segundos límite (NULL = sin límite)
- `mostrar_temporizador` - TRUE/FALSE

**Sistema de Intentos:**
- `intentos_permitidos` - Número de intentos (NULL = ilimitados)
- `permitir_reintentos` - TRUE/FALSE

**Sistema de Ayudas:**
- `mostrar_definiciones` - Mostrar significados
- `permitir_pistas` - TRUE/FALSE
- `penalizacion_por_pista` - Puntos perdidos por pista (default: 5)

**Auto-Actualización:**
- `auto_refresh` - TRUE/FALSE
- `refresh_frequency` - ENUM: 'daily', 'weekly', 'biweekly', 'monthly'
- `refresh_type` - ENUM: 'palabras', 'dificultad', 'ambos'
- `ultima_actualizacion` - TIMESTAMP

---

### Tabla: `actividad_grupo`
Relaciona actividades con grupos (asignaciones de docentes).

**Campos clave:**
- `id_asignacion` (PK)
- `id_actividad_fk` - Referencia a actividad
- `id_grupo_fk` - Referencia a grupo
- `fecha_asignacion` - Cuándo se asignó
- `fecha_limite` - Deadline para completar
- `intentos_permitidos` - Sobrescribe intentos de actividad
- `visible_para_alumnos` - TRUE/FALSE
- `obligatorio` - TRUE/FALSE

---

### Tabla: `resultados`
Almacena resultados de estudiantes (web + móvil unificado).

**Campos de tracking (12+):**
- `id_resultado` (PK)
- `id_asignacion_fk` - Referencia a asignación
- `id_alumno_fk` - Referencia a estudiante
- `intento_numero` - Número de intento (1, 2, 3...)
- `fecha_inicio`, `fecha_fin` - Timestamps
- `experiencia_ganada` - XP obtenido
- `palabras_correctas` / `palabras_incorrecas` / `palabras_totales`
- `porcentaje_acierto` - % de aciertos
- `aprobado` - TRUE/FALSE
- `calificacion` - Puntaje final
- `pistas_usadas` - Cantidad de pistas utilizadas
- `datos_juego` - JSON con datos específicos del juego
- `errores_detallados` - JSON con errores por palabra

---

### Tabla: `estadisticas_palabras`
Tracking detallado por palabra y estudiante.

**Campos:**
- `id_alumno_fk`, `id_palabra_fk` (Composite Key)
- `veces_vista` - Veces que vio la palabra
- `veces_correcta` - Veces que acertó
- `veces_incorrecta` - Veces que falló
- `tasa_exito` - % de aciertos
- `nivel_dominio` - 'principiante', 'intermedio', 'avanzado', 'dominado'
- `ultima_practica` - TIMESTAMP

**Trigger:** `trg_actualizar_estadisticas_alumno_from_palabras`
- Se activa AFTER INSERT en `estadisticas_palabras`
- Actualiza `estadisticas_alumno` automáticamente

---

## 🔄 Flujo de Trabajo

### 1️⃣ **Administrador: Crear Plantillas de Juegos**
```
Admin → Dashboard → Laboratorios → Crear Nuevo
  ├─ Paso 1: Seleccionar plantilla de juego (de las 10 predefinidas)
  ├─ Paso 2: Información básica (título, descripción)
  ├─ Paso 3: Seleccionar vocabulario
  ├─ Paso 4: Seleccionar unidades
  ├─ Paso 5: Configurar palabras
  └─ Paso 6: Configuración avanzada (XP, tiempo, intentos, pistas, auto-refresh)

API: POST /api/laboratorios/create
  → INSERT INTO actividades (id_juego_actividad_fk, ...)
```

### 2️⃣ **Docente: Asignar a Grupos**
```
Docente → Dashboard → Laboratorios Disponibles → Asignar
  ├─ Seleccionar grupo(s)
  ├─ Establecer fecha límite
  ├─ Configurar intentos permitidos
  └─ Marcar como visible/obligatorio

API: POST /api/grupos/assign-activity
  → INSERT INTO actividad_grupo (id_actividad_fk, id_grupo_fk, ...)
```

### 3️⃣ **Docente: Crear Actividades Extra (Móvil)**
```
Docente → App Móvil → Crear Actividad
  ├─ Basada en plantilla de juego
  ├─ Seleccionar vocabulario/unidades
  ├─ Configuración simplificada
  └─ Publicar para sus alumnos

API: POST /api/laboratorios/create (tipo_creador='docente')
  → INSERT INTO actividades (...)
```

### 4️⃣ **Estudiante: Jugar y Completar**
```
Estudiante → Dashboard/App → Laboratorios Asignados → Jugar
  ├─ Carga palabras de actividad.palabras_seleccionadas
  ├─ Renderiza juego según tipo_juego
  ├─ Tracking en tiempo real
  └─ Guarda resultado al finalizar

API: POST /api/resultados/submit
  → INSERT INTO resultados (...)
  → INSERT INTO estadisticas_palabras (...)
  → TRIGGER actualiza estadisticas_alumno
```

---

## 📊 Sistema de Auto-Actualización

### Stored Procedure: `sp_actualizar_actividades_automaticas()`
Actualiza automáticamente el contenido de actividades según configuración.

**Lógica:**
```sql
FOR EACH actividad WHERE auto_refresh = TRUE:
  IF tiempo_desde_ultima_actualizacion >= refresh_frequency THEN
    CASE refresh_type:
      'palabras': 
        - Selecciona nuevas palabras aleatorias del vocabulario
        - Mantiene dificultad
      'dificultad':
        - Aumenta palabras_minimas/maximas gradualmente
        - Mantiene palabras existentes
      'ambos':
        - Nuevas palabras + mayor dificultad
    UPDATE actividad SET palabras_seleccionadas = nuevas_palabras
    UPDATE ultima_actualizacion = NOW()
```

### Event Scheduler: `evt_actualizar_actividades_diario`
Se ejecuta **diariamente a medianoche** (00:00:00).

```sql
CREATE EVENT evt_actualizar_actividades_diario
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00'
DO CALL sp_actualizar_actividades_automaticas();

SET GLOBAL event_scheduler = ON;
```

---

## 🔌 APIs Actualizadas

### `GET /api/laboratorios/plantillas`
Obtiene plantillas de juegos del admin.

**Query:**
```sql
SELECT id_juego_actividad AS id_plantilla, nombre, tipo_juego, icono, ...
FROM juegos
WHERE es_plantilla = TRUE
ORDER BY nombre ASC
```

### `POST /api/laboratorios/create`
Crea nueva actividad/laboratorio.

**Query:**
```sql
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
) VALUES (...)
```

### `GET /api/laboratorios/list`
Lista actividades creadas por admin.

**Query:**
```sql
SELECT 
  a.id_actividad AS id_laboratorio,
  a.titulo,
  a.nivel,
  a.numero_palabras,
  j.nombre AS tipo_juego,
  j.tipo_juego AS tipo_juego_code,
  j.icono,
  a.publicado,
  COUNT(DISTINCT ag.id_grupo_fk) AS grupos_asignados,
  COUNT(DISTINCT r.id_alumno_fk) AS alumnos_participantes,
  AVG(r.calificacion) AS promedio_puntuacion,
  SUM(CASE WHEN r.aprobado = TRUE THEN 1 ELSE 0 END) AS completados
FROM actividades a
INNER JOIN juegos j ON a.id_juego_actividad_fk = j.id_juego_actividad
LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_fk
LEFT JOIN resultados r ON ag.id_asignacion = r.id_asignacion_fk
WHERE j.es_plantilla = TRUE AND a.tipo_creador = 'admin'
GROUP BY a.id_actividad
ORDER BY a.fecha_creacion DESC
```

### `POST /api/laboratorios/toggle-publish`
Publica/despublica actividad.

**Query:**
```sql
UPDATE actividades 
SET publicado = ?
WHERE id_actividad = ?
```

---

## 🎨 Interfaz de Administrador

### Ubicación: `/app/dashboard/admin/laboratorios/page.tsx`

**Componente principal:** `LaboratoriosPage`

**Secciones:**
1. **Header con estadísticas**
   - Total de laboratorios
   - Publicados
   - Estudiantes activos
   - Tasa de completitud

2. **Grid de tarjetas de laboratorios**
   - Icono del juego
   - Título y nivel
   - Estado (Publicado/Borrador)
   - Estadísticas (palabras, grupos, completados, promedio)
   - Acciones (Publicar, Asignar grupos)

3. **Modal de creación (5 pasos + configuración avanzada)**
   - Paso 1: Selección de plantilla
   - Paso 2: Información básica
   - Paso 3: Selección de vocabulario
   - Paso 4: Selección de unidades
   - Paso 5: Configuración de palabras
   - Panel avanzado: XP, tiempo, intentos, pistas, auto-refresh

---

## 📈 Ventajas de la Arquitectura Integrada

✅ **Reutilización de código:** Una sola tabla `actividades` para web y móvil  
✅ **Resultados unificados:** Todo en `resultados` sin duplicación  
✅ **Tracking detallado:** `estadisticas_palabras` con trigger automático  
✅ **Flexibilidad:** Admin crea plantillas, docentes asignan y crean extras  
✅ **Auto-actualización:** Contenido dinámico sin intervención manual  
✅ **Escalabilidad:** Fácil agregar nuevos tipos de juegos  
✅ **Mantenimiento:** Menos tablas = menos complejidad  

---

## 🚀 Próximos Pasos

### Pendientes:
- [ ] Implementar componentes de juegos (Hangman, Memory, etc.)
- [ ] Crear interfaz de docente para asignar actividades
- [ ] Dashboard de resultados para docentes
- [ ] Vistas de estudiantes (web y móvil)
- [ ] Sistema de notificaciones por fecha límite
- [ ] Exportar reportes de estadísticas
- [ ] Panel de analytics para admin

### Para probar:
1. Ejecutar script `database/laboratorios_integracion.sql` (si no se hizo)
2. Crear actividad desde `/dashboard/admin/laboratorios`
3. Verificar en base de datos que se creó en `actividades`
4. Asignar a grupo (cuando esté implementado)
5. Jugar como estudiante (cuando estén los componentes)
6. Revisar resultados en `resultados` y `estadisticas_palabras`

---

## 📝 Notas Técnicas

- **MySQL 8.0.43+** requerido para event scheduler
- **Event scheduler DEBE estar activo:** `SET GLOBAL event_scheduler = ON;`
- Trigger se ejecuta automáticamente en INSERT de `estadisticas_palabras`
- Stored procedure se ejecuta diariamente a medianoche
- JSON fields para flexibilidad en `palabras_seleccionadas` y `datos_juego`
- Composite key en `estadisticas_palabras` (id_alumno_fk + id_palabra_fk)

---

**Última actualización:** 19 de noviembre de 2025  
**Estado:** ✅ Base de datos lista, APIs actualizadas, interfaz admin funcional
