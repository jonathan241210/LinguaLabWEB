# 🎮 Sistema de Laboratorios Interactivos - LinguaLab

## 📋 Descripción General

Sistema completo para crear actividades interactivas basadas en vocabulario. Permite al administrador crear juegos educativos de forma sencilla sin conocimientos de programación.

---

## 🎯 10 Plantillas de Juegos Disponibles

### 1. **🎯 Hangman (Ahorcado)**
- **Descripción**: Juego clásico donde el estudiante adivina letras para formar palabras
- **Config**: Máximo 6 intentos, pistas opcionales, mostrar definición
- **Nivel sugerido**: A1
- **Palabras**: 5-15

### 2. **🎴 Memory Match (Memorama)**
- **Descripción**: Encontrar parejas de palabras con sus traducciones
- **Config**: Grid automático, tiempo de visibilidad 3s, sin imágenes
- **Nivel sugerido**: A2
- **Palabras**: 8-16 (pares)

### 3. **🔗 Matching Game (Emparejar)**
- **Descripción**: Conectar palabras con sus significados correctos
- **Config**: 2 columnas, shuffle activado, mostrar líneas de conexión
- **Nivel sugerido**: A2
- **Palabras**: 6-12

### 4. **✏️ Fill in the Blanks (Llenar espacios)**
- **Descripción**: Completar oraciones con las palabras correctas
- **Config**: Banco de palabras visible, no case-sensitive, oraciones auto-generadas
- **Nivel sugerido**: B1
- **Palabras**: 8-15

### 5. **📋 Multiple Choice Quiz (Opción múltiple)**
- **Descripción**: Elegir la traducción correcta de múltiples opciones
- **Config**: 4 opciones, randomize, feedback inmediato, 30s por pregunta
- **Nivel sugerido**: A1
- **Palabras**: 10-20

### 6. **🃏 Flashcards (Tarjetas)**
- **Descripción**: Estudiar vocabulario con tarjetas interactivas
- **Config**: Click para voltear, shuffle activado, mostrar progreso, swipe habilitado
- **Nivel sugerido**: A1
- **Palabras**: 10-30

### 7. **🔍 Word Search (Sopa de letras)**
- **Descripción**: Encontrar palabras ocultas en una cuadrícula de letras
- **Config**: Grid 15x15, direcciones horizontal/vertical/diagonal, 10 min límite
- **Nivel sugerido**: A2
- **Palabras**: 10-20

### 8. **📰 Crossword Puzzle (Crucigrama)**
- **Descripción**: Resolver crucigrama usando definiciones
- **Config**: Grid automático, mostrar definiciones, pistas permitidas
- **Nivel sugerido**: B2
- **Palabras**: 8-15

### 9. **🎧 Spelling Challenge (Deletreo)**
- **Descripción**: Escuchar y escribir palabras correctamente
- **Config**: Audio activado, 3 intentos por palabra, no case-sensitive
- **Nivel sugerido**: A2
- **Palabras**: 10-20

### 10. **🏗️ Sentence Builder (Constructor de oraciones)**
- **Descripción**: Construir oraciones correctas usando palabras dadas
- **Config**: Pool automático, verificar orden, dificultad media
- **Nivel sugerido**: B1
- **Palabras**: 5-10

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### `plantillas_juegos`
Contiene las 10 plantillas predefinidas con su configuración

```sql
- id_plantilla (PK)
- nombre
- tipo_juego (ENUM)
- descripcion
- icono (emoji)
- configuracion_default (JSON)
- nivel_dificultad_sugerido
- palabras_minimas/maximas
- instrucciones_template
```

#### `laboratorios`
Instancias de juegos creados por admin/docentes

```sql
- id_laboratorio (PK)
- id_plantilla_fk
- id_vocabulario_fk
- titulo
- descripcion
- nivel
- numero_palabras
- configuracion_personalizada (JSON)
- unidades_seleccionadas (JSON)
- palabras_seleccionadas (JSON)
- modo_seleccion (ENUM: todas, por_unidad, manual, random)
- creado_por
- tipo_creador (admin/docente)
- publicado (BOOLEAN)
```

#### `laboratorio_grupo`
Asignación de laboratorios a grupos

```sql
- id_asignacion (PK)
- id_laboratorio_fk
- id_grupo_fk
- fecha_asignacion
- fecha_limite
- intentos_permitidos
- visible_para_alumnos
- obligatorio
```

#### `laboratorio_resultados`
Resultados de estudiantes

```sql
- id_resultado (PK)
- id_asignacion_fk
- id_alumno_fk
- intento_numero
- fecha_inicio/completado
- tiempo_transcurrido
- puntuacion (0-100)
- palabras_correctas/incorrectas
- porcentaje_acierto
- completado
- datos_juego (JSON)
- errores_detallados (JSON)
```

#### `estadisticas_palabras`
Análisis de dominio de palabras por estudiante

```sql
- id_estadistica (PK)
- id_alumno_fk
- palabra
- veces_vista/correcta/incorrecta
- tasa_exito
- nivel_dominio (bajo, medio, alto, dominado)
```

---

## 💻 Flujo de Creación (Admin)

### Interfaz Visual

```
┌─────────────────────────────────────────────┐
│  ⚙️ CREATE A LAB                            │
├─────────────────────────────────────────────┤
│                                             │
│  Step 1: Select Game Type                  │
│  [🎯]  [🎴]  [🔗]  [✏️]  [📋]             │
│  [🃏]  [🔍]  [📰]  [🎧]  [🏗️]             │
│                                             │
│  Step 2: Basic Information                 │
│  Title: [___________________]               │
│  Description: [____________]                │
│                                             │
│  Step 3: Choose Vocabulary                 │
│  ● Unit 8 - Daily Activities (A2) ✓       │
│    Level: A2 • 45 words                     │
│                                             │
│  Step 4: Select Units                      │
│  ☑ Unidad 1 (12 palabras)                  │
│  ☑ Unidad 2 (15 palabras)                  │
│  ☐ Unidad 3 (18 palabras)                  │
│                                             │
│  Step 5: Configuration                     │
│  Number of Words: [====●====] 12           │
│  Min: 5           Max: 15                   │
│                                             │
│  ⚙️ [Advanced Configuration] ▶             │
│                                             │
│  [✅ Create Activity]                       │
└─────────────────────────────────────────────┘
```

### Pasos:

1. **Seleccionar plantilla**: Click en el icono del juego deseado
2. **Información básica**: Título y descripción opcional
3. **Elegir vocabulario**: Seleccionar de los vocabularios subidos
4. **Seleccionar unidades**: Elegir una o más unidades (checkbox)
5. **Configurar**: Ajustar número de palabras con slider
6. **[OPCIONAL] Configuración Avanzada**: Click para expandir opciones avanzadas
7. **Crear**: Click en "Create Activity"

---

## ⚙️ Configuración Avanzada

Al hacer click en "Advanced Configuration" se despliegan opciones adicionales:

### 🏆 Experience & Scoring
Control del sistema de experiencia y puntuación

- **Base Experience** (0-500 XP): Experiencia base que recibe el estudiante al completar
  - Default: 100 XP
  - Sugerido A1: 100-150 XP
  - Sugerido B1+: 200-300 XP

- **Perfect Score Bonus** (0-200 XP): Bonus adicional por obtener 100% de acierto
  - Default: 50 XP
  - Incentiva la perfección

- **Minimum Passing Score** (0-100%): Puntuación mínima para aprobar la actividad
  - Default: 70%
  - Recomendado: 60-80% dependiendo del nivel

### ⏱️ Time Configuration
Control del tiempo límite

- **Enable Time Limit**: Checkbox para activar/desactivar límite de tiempo
  - Default: Desactivado (tiempo ilimitado)
  
- **Time Limit** (60-3600 segundos): Tiempo máximo para completar la actividad
  - Sugerido Hangman: 300s (5 min)
  - Sugerido Memory: 180s (3 min)
  - Sugerido Crossword: 600s (10 min)

- **Show Timer**: El temporizador será visible para el estudiante
  - Default: TRUE (siempre mostrar)

### 🔄 Attempts Configuration
Control de intentos permitidos

- **Limit Attempts**: Checkbox para limitar intentos
  - Default: Desactivado (intentos ilimitados)
  
- **Maximum Attempts** (1-10): Número máximo de veces que puede intentar
  - Sugerido para quizzes: 3 intentos
  - Sugerido para juegos complejos: ilimitado
  
- **Allow Retries**: Permitir reintentar después de completar
  - Default: TRUE

### 💡 Hints System
Sistema de pistas con penalización

- **Allow Hints**: Checkbox para habilitar pistas
  - Default: TRUE (pistas habilitadas)
  
- **Penalty per Hint** (0-50%): Penalización en el score por cada pista usada
  - Default: 5%
  - Sin pistas: 0%
  - Penalización moderada: 5-10%
  - Penalización alta: 15-25%

**Ejemplo**: Si el estudiante obtiene 90 puntos pero usó 2 pistas con penalización 5%:
- Score final: 90 - (90 × 0.05 × 2) = 90 - 9 = 81 puntos

### 🔄 Auto-Refresh System
Sistema de actualización automática de contenido

- **Enable Auto-Refresh**: Checkbox para activar actualización automática
  - Default: FALSE (contenido estático)
  
- **Update Frequency**: Cada cuánto tiempo actualizar
  - Daily: Todos los días a medianoche
  - Weekly: Cada lunes (default)
  - Biweekly: Cada 2 semanas
  - Monthly: El día 1 de cada mes

- **What to Update**: Qué aspecto actualizar automáticamente
  - **Only Words**: Regenera selección aleatoria de palabras del mismo vocabulario
  - **Only Difficulty**: Incrementa el nivel de dificultad (más palabras, menos tiempo, etc.)
  - **Both**: Actualiza palabras Y aumenta dificultad

**Uso recomendado**: 
- Para grupos que están aprendiendo continuamente: Weekly + Both
- Para repasos periódicos: Biweekly + Only Words
- Para challenges progresivos: Weekly + Only Difficulty

**Nota**: El stored procedure `sp_actualizar_laboratorios_automaticos()` se ejecuta diariamente y verifica qué laboratorios necesitan actualización según su `ultima_actualizacion` y `refresh_frequency`.

---

## 📊 Campos Adicionales en Base de Datos

### Tabla `laboratorios` - Campos de Configuración

```sql
-- Experience & Scoring
experiencia_base INT DEFAULT 100
experiencia_bonus_perfecto INT DEFAULT 50
puntuacion_minima_aprobar INT DEFAULT 70

-- Time Configuration
tiempo_limite INT NULL  -- segundos, NULL = sin límite
mostrar_temporizador BOOLEAN DEFAULT TRUE

-- Attempts
intentos_permitidos INT NULL  -- NULL = ilimitados
permitir_reintentos BOOLEAN DEFAULT TRUE

-- Hints
mostrar_definiciones BOOLEAN DEFAULT TRUE
permitir_pistas BOOLEAN DEFAULT TRUE
penalizacion_por_pista INT DEFAULT 5  -- porcentaje

-- Auto-Refresh
auto_refresh BOOLEAN DEFAULT FALSE
refresh_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly'
refresh_type ENUM('palabras', 'dificultad', 'ambos') DEFAULT 'palabras'
ultima_actualizacion TIMESTAMP NULL
```

### Tabla `laboratorio_resultados` - Campos de Tracking

```sql
experiencia_ganada INT DEFAULT 0
aprobado BOOLEAN DEFAULT FALSE
calificacion DECIMAL(5,2) NULL
pistas_usadas INT DEFAULT 0
```

---

## 🤖 Automatización con Stored Procedure

### `sp_actualizar_laboratorios_automaticos()`

Este stored procedure se ejecuta automáticamente cada día a medianoche gracias al event scheduler.

**Lógica**:
1. Busca todos los laboratorios con `auto_refresh = TRUE`
2. Para cada laboratorio, verifica si necesita actualización:
   - Si `refresh_frequency = 'daily'`: actualiza si pasó 1+ día
   - Si `refresh_frequency = 'weekly'`: actualiza si pasó 7+ días
   - Si `refresh_frequency = 'biweekly'`: actualiza si pasó 14+ días
   - Si `refresh_frequency = 'monthly'`: actualiza si pasó 30+ días
3. Si necesita actualización:
   - Si `refresh_type` incluye `'palabras'`: Regenera `palabras_seleccionadas` aleatoriamente
   - Si `refresh_type` incluye `'dificultad'`: Incrementa `numero_palabras` en 2 (hasta máximo)
4. Actualiza `ultima_actualizacion = NOW()`

**Activación del Event Scheduler**:
```sql
SET GLOBAL event_scheduler = ON;
```

**Verificar estado**:
```sql
SHOW EVENTS LIKE 'evt_actualizar_labs%';
SELECT * FROM laboratorios WHERE auto_refresh = TRUE;
```

**¡Listo!** El laboratorio se crea automáticamente.

---

## 📊 Panel de Control

### Vista Principal

```
┌─────────────────────────────────────────────┐
│  Total Laboratories:     15                 │
│  Published:              12                 │
│  Completed Activities:   234                │
│  Students Participating: 87                 │
└─────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│  🎯 Hangman - Unit 1                 │
│  A1 • Published • 10 words           │
│                                      │
│  Words: 10    Groups: 3              │
│  Completed: 45    Avg Score: 85%     │
│                                      │
│  [Unpublish] [Assign Groups]         │
└──────────────────────────────────────┘
```

---

## 📈 Sistema de Reportes

### Por Estudiante
- Actividades completadas
- Promedio de puntuación
- Tiempo total de estudio
- Palabras dominadas vs débiles
- Progreso por nivel

### Por Grupo
- Estudiantes activos
- Promedio del grupo
- Actividades pendientes
- Top estudiantes
- Palabras más difíciles

### Por Actividad
- Tasa de completados
- Promedio de tiempo
- Promedio de intentos
- Distribución de puntuaciones
- Palabras más falladas

---

## 🚀 Instalación

### 1. Ejecutar Schema de BD

```bash
mysql -u root -p lingualab2 < database/laboratorios_schema.sql
```

### 2. Verificar Tablas

```sql
SHOW TABLES LIKE 'laboratorio%';
SHOW TABLES LIKE 'plantillas_juegos';
SHOW TABLES LIKE 'estadisticas_palabras';
```

### 3. Verificar Plantillas Insertadas

```sql
SELECT id_plantilla, nombre, tipo_juego, icono 
FROM plantillas_juegos;
```

Deberías ver 10 registros (Hangman, Memory Match, etc.)

---

## 🔧 APIs Disponibles

### Listar Laboratorios
```
GET /api/laboratorios/list
```

### Listar Plantillas
```
GET /api/laboratorios/plantillas
```

### Crear Laboratorio
```
POST /api/laboratorios/create
Body: {
  // Basic
  id_plantilla, 
  id_vocabulario, 
  titulo, 
  descripcion,
  numero_palabras, 
  unidades_seleccionadas, 
  modo_seleccion, 
  nivel,
  
  // Advanced (optional)
  experiencia_base: 100,
  experiencia_bonus_perfecto: 50,
  puntuacion_minima_aprobar: 70,
  tiempo_limite: null,
  intentos_permitidos: null,
  permitir_pistas: true,
  penalizacion_por_pista: 5,
  auto_refresh: false,
  refresh_frequency: 'weekly',
  refresh_type: 'palabras'
}
```

### Publicar/Despublicar
```
POST /api/laboratorios/toggle-publish
Body: { id_laboratorio, publicado }
```

### Asignar a Grupos
```
POST /api/laboratorios/assign-groups
Body: { id_laboratorio, grupos: [id1, id2, ...], fecha_limite }
```

---

## 🎓 Vista del Estudiante (Futuro)

Los estudiantes verán:

```
┌─────────────────────────────────────┐
│  🎮 My Laboratory Activities        │
├─────────────────────────────────────┤
│                                     │
│  Available (3):                     │
│  ● Hangman - Unit 1 (Due: Nov 20)  │
│  ● Memory Match - Unit 2            │
│  ● Fill in the Blanks - Unit 3     │
│                                     │
│  Completed (5):                     │
│  ✓ Multiple Choice Quiz - 95%      │
│  ✓ Flashcards Study - 88%          │
│                                     │
│  My Progress:                       │
│  ▓▓▓▓▓▓▓▓░░ 80% Complete           │
│  Average Score: 87%                 │
│  Words Mastered: 45/60              │
└─────────────────────────────────────┘
```

---

## 🎨 Diseño y UX

### Colores del Sistema
- Verde primario: `#2ea853` (var(--color-primary-green))
- Azul oscuro: `var(--color-dark-blue)`
- Gradientes para stats cards
- Animaciones: llw-modal-overlay, llw-modal-card

### Animaciones Consistentes
```css
@keyframes llw-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes llw-pop-in { /* bounce effect */ }
.llw-modal-overlay { animation: llw-fade-in 220ms }
.llw-modal-card { animation: llw-pop-in 260ms }
```

---

## 📝 TODOs Futuro

- [ ] Implementar componentes de cada juego (Hangman, Memory, etc.)
- [ ] Sistema de puntuación y XP
- [ ] Badges y achievements
- [ ] Exportar reportes a PDF/Excel
- [ ] Notificaciones push para actividades nuevas
- [ ] Modo práctica libre (sin asignación)
- [ ] Competencias entre grupos
- [ ] Leaderboards globales
- [ ] Integración con API de pronunciación (Spelling Challenge)
- [ ] Editor visual de juegos avanzado

---

## 🤝 Contribución

Desarrollado por el equipo LinguaLab para la administración eficiente de actividades de laboratorio de inglés.

**Contacto**: [Tu correo o info del equipo]

---

## 📄 Licencia

Proyecto académico - Universidad Tecnológica de Tulancingo

---

**¡El sistema está listo para crear laboratorios de forma sencilla!** 🎉
