# Guía de Carga Masiva de Grupos - Actualizado

## 🎯 Descripción General

El sistema de carga masiva permite crear grupos, docentes, alumnos y todas sus relaciones desde un solo archivo Excel usando el formato **UNA FILA = UN ALUMNO**.

## ✨ ¿Cómo funciona?

- ✅ **Una fila por alumno** (mucho más fácil que el formato anterior)
- ✅ Repites los datos del grupo y docente en cada fila
- ✅ Solo cambias los datos del alumno
- ✅ El sistema agrupa automáticamente por grupo
- ✅ Crea usuarios nuevos automáticamente

## 📋 Estructura del Archivo Excel

### Ejemplo Visual

Para un grupo con 3 alumnos, tendrías 3 filas así:

| Número de Grupo | Cuatrimestre | Código Programa | ... | Matrícula Docente | Nombre Docente | ... | Matrícula Alumno | Nombre Alumno | ... |
|-----------------|--------------|-----------------|-----|-------------------|----------------|-----|------------------|---------------|-----|
| 1 | 1 | TIC | ... | D001 | Juan | ... | **A001** | **María** | ... |
| 1 | 1 | TIC | ... | D001 | Juan | ... | **A002** | **Pedro** | ... |
| 1 | 1 | TIC | ... | D001 | Juan | ... | **A003** | **Ana** | ... |

> **Nota:** Los datos del grupo y docente se repiten, solo cambian los datos del alumno.

### Columnas Completas (17 columnas)

#### Columnas del Grupo (7 columnas)
1. **Número de Grupo** - Número (1, 2, 3...)
2. **Cuatrimestre** - Número del cuatrimestre (1-12)
3. **Código Programa** - Código del programa (TIC, NyM, etc.)
4. **Código Nivel** - TSU o ING/LIC
5. **Año Ingreso** - Año (2025, 2024, etc.)
6. **Cuatrimestre Inicial** - Número (normalmente 1)
7. **Estado Prácticas** - SI o NO

#### Columnas del Docente (5 columnas)
8. **Matrícula Docente** - Matrícula del docente
9. **Nombre Docente** - Nombre (requerido si es nuevo)
10. **Primer Apellido Docente** - Primer apellido (requerido si es nuevo)
11. **Segundo Apellido Docente** - Segundo apellido (opcional)
12. **Correo Docente** - Email (requerido si es nuevo)

#### Columnas del Alumno (5 columnas)
13. **Matrícula Alumno** - Matrícula del alumno
14. **Nombre Alumno** - Nombre del alumno
15. **Primer Apellido Alumno** - Primer apellido
16. **Segundo Apellido Alumno** - Segundo apellido (opcional)
17. **Correo Alumno** - Email del alumno

## 💡 Ejemplo Completo

### Grupo 1 con Docente D001 y 3 alumnos

**Fila 1:**
```
Número de Grupo: 1
Cuatrimestre: 1
Código Programa: TIC
Código Nivel: TSU
Año Ingreso: 2025
Cuatrimestre Inicial: 1
Estado Prácticas: NO
Matrícula Docente: D001
Nombre Docente: Juan
Primer Apellido Docente: Pérez
Segundo Apellido Docente: García
Correo Docente: juan.perez@example.com
Matrícula Alumno: A001
Nombre Alumno: María
Primer Apellido Alumno: López
Segundo Apellido Alumno: Martínez
Correo Alumno: maria.lopez@example.com
```

**Fila 2:** (Repite grupo y docente, cambia alumno)
```
Número de Grupo: 1
Cuatrimestre: 1
Código Programa: TIC
Código Nivel: TSU
Año Ingreso: 2025
Cuatrimestre Inicial: 1
Estado Prácticas: NO
Matrícula Docente: D001
Nombre Docente: Juan
Primer Apellido Docente: Pérez
Segundo Apellido Docente: García
Correo Docente: juan.perez@example.com
Matrícula Alumno: A002  ← Solo esto cambia
Nombre Alumno: Pedro
Primer Apellido Alumno: Ramírez
Segundo Apellido Alumno: Torres
Correo Alumno: pedro.ramirez@example.com
```

**Fila 3:** (Igual, solo cambia el alumno)
```
... (mismos datos de grupo y docente)
Matrícula Alumno: A003
Nombre Alumno: Ana
Primer Apellido Alumno: González
Segundo Apellido Alumno: Sánchez
Correo Alumno: ana.gonzalez@example.com
```

## 🔄 Lógica del Sistema

### 1. Agrupación Automática
El sistema agrupa las filas por:
- Número de Grupo
- Código de Programa
- Código de Nivel
- Año de Ingreso
- Cuatrimestre

**Resultado:** Todas las filas con los mismos valores se agrupan en UN solo grupo.

### 2. Creación de Docentes
- 🔍 Busca por matrícula
- ✅ Si existe: Lo asigna al grupo
- ❌ Si NO existe:
  - Valida que estén: Nombre, Primer Apellido, Correo
  - Crea usuario con contraseña = matrícula
  - Crea registro de docente
  - Asigna al grupo

### 3. Creación de Alumnos
- 🔍 Busca por matrícula
- ✅ Si existe: Lo asigna al grupo
- ❌ Si NO existe:
  - Valida que estén: Nombre, Primer Apellido, Correo
  - Crea usuario con contraseña = matrícula
  - Crea registro de alumno
  - Asigna al grupo

### 4. Creación de Cohortes
- Genera etiqueta: `{Año}-C{Cuatrimestre}-{Programa}-{Nivel}`
- Ejemplo: `2025-C1-TIC-TSU`
- Si ya existe, la reutiliza

## 📊 Resultados de la Carga

Después de procesar, verás:

```
✅ Grupos Creados: 2
✅ Cohortes Creadas: 1
✅ Docentes Creados: 1
✅ Docentes Asignados: 2
✅ Alumnos Creados: 5
✅ Alumnos Asignados: 6
```

**Explicación de contadores:**
- **Creados**: Usuarios nuevos insertados en la BD
- **Asignados**: Relaciones grupo-docente o grupo-alumno creadas

> Un alumno puede ya existir (Creados=0) pero asignarse a un nuevo grupo (Asignados=1)

## 🔐 Contraseñas Iniciales

- Docente D001 → Contraseña: `D001`
- Alumno A001 → Contraseña: `A001`

**Importante:** Los usuarios deben cambiar su contraseña al primer inicio de sesión.

## 📝 Códigos de Programas

| Código | Nombre |
|--------|--------|
| TIC | Tecnologías de la Información e Innovación Digital |
| NyM | Negocios y Mercadotecnia |
| CON | Contaduría |
| TF | Terapia Física |
| TFR | Terapia Física Área Rehabilitación |
| CyCF | Criminalística y Ciencias Forenses |
| CRI | Criminalística |
| DDyPA | Diseño Digital y Producción Audiovisual |
| EyDS | Energía y Desarrollo Sostenible |
| ENF | Enfermería |
| IND | Industrial |
| MEC | Mecatrónica |
| MCyP | Médico Cirujano y Partero |
| NAN | Nanotecnología |
| SRyP | Salud Reproductiva y Partería |
| AyS | Ambiental y Sustentabilidad |

## ✅ Validaciones

El sistema valida:

- ✅ Códigos de programa existen
- ✅ Códigos de nivel son válidos (TSU o ING/LIC)
- ✅ Cuatrimestre entre 1-12
- ✅ No duplicar grupos en misma cohorte
- ✅ Emails válidos
- ✅ Datos completos para usuarios nuevos

## ⚠️ Errores Comunes y Soluciones

### "Grupo X ya existe en esta cohorte"
- **Causa:** Ya existe un grupo con ese número en esa cohorte
- **Solución:** Usa otro número de grupo o elimina el existente

### "Programa 'XXX' no encontrado"
- **Causa:** El código de programa no está en el catálogo
- **Solución:** Verifica el código en la hoja "Catálogos"

### "Alumno X: Datos incompletos"
- **Causa:** Falta nombre, apellido o correo para un alumno nuevo
- **Solución:** Completa todos los campos del alumno

### "Docente ya existe"
- **Causa:** El docente ya está en el sistema
- **Solución:** Deja vacíos los campos de nombre/correo, solo usa la matrícula

## 💪 Mejores Prácticas

1. **Descarga la plantilla** desde el sistema
2. **Usa Excel** para copiar filas fácilmente
3. **Completa primero una fila** como plantilla
4. **Copia esa fila** y solo cambia los datos del alumno
5. **Revisa la hoja de Catálogos** para códigos válidos
6. **Prueba con pocos registros** primero
7. **Guarda tu archivo** antes de subirlo

## 🚀 Pasos para Usar

### 1. Descargar Plantilla
- Click en "Descargar Plantilla de Excel"
- Se descarga `plantilla_grupos.xlsx`

### 2. Llenar Datos
```excel
Fila 1: Grupo 1 - Alumno 1
Fila 2: Grupo 1 - Alumno 2 (copiar fila 1, cambiar solo alumno)
Fila 3: Grupo 1 - Alumno 3 (copiar fila 1, cambiar solo alumno)
Fila 4: Grupo 2 - Alumno 1 (cambiar grupo y alumno)
...
```

### 3. Subir Archivo
- Click en "Seleccionar Archivo"
- Elegir el `.xlsx`
- Esperar procesamiento

### 4. Ver Resultados
- El sistema muestra estadísticas detalladas
- Lista de errores (si los hay)
- La tabla se actualiza automáticamente

## 📊 Ventajas del Nuevo Formato

| Aspecto | Formato Anterior | Formato Actual |
|---------|------------------|----------------|
| **Estructura** | Todo en una celda | Una fila por alumno |
| **Facilidad** | Complejo de escribir | Simple: copiar y pegar |
| **Legibilidad** | Difícil de leer | Clara y visual |
| **Errores** | Propenso a formato | Menos errores |
| **Excel** | No usa características de Excel | Usa filtros, ordenar, etc. |

## 🎓 Ejemplo de Caso de Uso Real

### Escenario
Tienes que crear:
- 2 Grupos (Grupo 1 y Grupo 2)
- Ambos de TIC-TSU, año 2025, cuatrimestre 1
- Grupo 1: Docente D001 (nuevo) con 3 alumnos
- Grupo 2: Docente D002 (nuevo) con 2 alumnos

### Solución
**Total de filas en Excel: 5**

```
Fila 1: Grupo 1, Docente D001, Alumno A001
Fila 2: Grupo 1, Docente D001, Alumno A002
Fila 3: Grupo 1, Docente D001, Alumno A003
Fila 4: Grupo 2, Docente D002, Alumno A004
Fila 5: Grupo 2, Docente D002, Alumno A005
```

### Resultado
```
✅ Grupos Creados: 2
✅ Cohortes Creadas: 1 (2025-C1-TIC-TSU, compartida)
✅ Docentes Creados: 2 (D001 y D002)
✅ Docentes Asignados: 2
✅ Alumnos Creados: 5
✅ Alumnos Asignados: 5
```

## 🆘 Soporte

Para problemas o dudas, contacta al administrador del sistema.

---

**Versión:** 2.0 - Formato simplificado (Una fila por alumno)  
**Fecha:** Diciembre 2025
