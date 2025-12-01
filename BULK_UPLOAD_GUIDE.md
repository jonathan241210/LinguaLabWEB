# Guía de Carga Masiva de Grupos

## Descripción General

El sistema de carga masiva permite crear grupos, docentes, alumnos y todas sus relaciones desde un solo archivo Excel. El sistema es inteligente y automáticamente:

- ✅ Crea nuevos docentes si no existen
- ✅ Crea nuevos alumnos si no existen
- ✅ Usa docentes/alumnos existentes si ya están en el sistema
- ✅ Crea grupos con sus cohortes
- ✅ Establece relaciones entre docentes y grupos
- ✅ Asigna alumnos a grupos automáticamente

## Estructura del Archivo Excel

### Hoja 1: Grupos

El archivo debe tener las siguientes columnas (en este orden):

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| **Número de Grupo** | Número | ✅ Sí | Número del grupo (1, 2, 3, etc.) |
| **Cuatrimestre** | Número | ✅ Sí | Cuatrimestre actual (1-12) |
| **Código Programa** | Texto | ✅ Sí | Código del programa (TIC, NyM, CON, etc.) |
| **Código Nivel** | Texto | ✅ Sí | TSU o ING/LIC |
| **Año Ingreso** | Número | ✅ Sí | Año de ingreso (2025, 2024, etc.) |
| **Cuatrimestre Inicial** | Número | ✅ Sí | Cuatrimestre inicial (normalmente 1) |
| **Estado Prácticas** | Texto | ✅ Sí | SI o NO |
| **Matrícula Docente** | Texto | ✅ Sí | Matrícula del docente |
| **Nombre Docente** | Texto | ⚠️ Condicional | Requerido si el docente es nuevo |
| **Primer Apellido Docente** | Texto | ⚠️ Condicional | Requerido si el docente es nuevo |
| **Segundo Apellido Docente** | Texto | ❌ No | Opcional (puede estar vacío) |
| **Correo Docente** | Email | ⚠️ Condicional | Requerido si el docente es nuevo |
| **Datos Alumnos** | Texto | ❌ No | Lista de alumnos (ver formato especial abajo) |

### Hoja 2: Catálogos

Esta hoja contiene información de referencia con todos los códigos de programas educativos disponibles.

## Formato Especial: Datos Alumnos

La columna "Datos Alumnos" usa un formato especial para incluir múltiples alumnos en una sola celda:

### Formato

```
matricula,nombre,apellido1,apellido2,correo|matricula2,nombre2,apellido1,apellido2,correo2|...
```

### Reglas

- **Separador de alumnos:** `|` (pipe)
- **Separador de campos:** `,` (coma)
- **Orden de campos por alumno:**
  1. Matrícula
  2. Nombre
  3. Primer Apellido
  4. Segundo Apellido
  5. Correo Electrónico

### Ejemplo Completo

```
A001,María,López,Martínez,maria.lopez@example.com|A002,Pedro,Ramírez,Torres,pedro.ramirez@example.com|A003,Ana,González,Sánchez,ana.gonzalez@example.com
```

Este ejemplo crea/asigna 3 alumnos al grupo.

## Códigos de Programas Disponibles

| Código | Nombre del Programa |
|--------|---------------------|
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

## Códigos de Niveles Educativos

| Código | Descripción |
|--------|-------------|
| TSU | Técnico Superior Universitario |
| ING/LIC | Ingeniería/Licenciatura |

## Ejemplo Completo de Fila

### Grupo 1 - Docente Nuevo

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
Datos Alumnos: A001,María,López,Martínez,maria.lopez@example.com|A002,Pedro,Ramírez,Torres,pedro.ramirez@example.com
```

### Grupo 2 - Docente Existente

Si el docente D002 ya existe en el sistema, solo necesitas su matrícula:

```
Número de Grupo: 2
Cuatrimestre: 1
Código Programa: TIC
Código Nivel: TSU
Año Ingreso: 2025
Cuatrimestre Inicial: 1
Estado Prácticas: NO
Matrícula Docente: D002
Nombre Docente: 
Primer Apellido Docente: 
Segundo Apellido Docente: 
Correo Docente: 
Datos Alumnos: A010,Carlos,Fernández,Ruiz,carlos.fernandez@example.com
```

## Lógica de Creación

### Docentes

1. **El sistema busca al docente por matrícula:**
   - ✅ **Si existe:** Usa el docente existente
   - ❌ **Si NO existe:** 
     - Verifica que estén presentes: Nombre, Primer Apellido y Correo
     - Crea el usuario con contraseña = matrícula
     - Crea el registro de docente
     - Asigna el docente al grupo

### Alumnos

1. **El sistema procesa cada alumno en "Datos Alumnos":**
   - ✅ **Si existe (por matrícula):** Asigna al grupo
   - ❌ **Si NO existe:**
     - Crea el usuario con contraseña = matrícula
     - Crea el registro de alumno
     - Asigna al grupo

### Grupos

1. **Genera etiqueta de cohorte automáticamente:**
   - Formato: `YYYY-C#-CODIGO-NIVEL`
   - Ejemplo: `2025-C1-TIC-TSU`

2. **Verifica si la cohorte existe:**
   - ✅ Si existe, la usa
   - ❌ Si no existe, la crea

3. **Crea el grupo** con nombre numérico

## Contraseñas Iniciales

🔐 **IMPORTANTE:** Todos los usuarios nuevos (docentes y alumnos) se crean con contraseña igual a su matrícula.

### Ejemplos

- Docente con matrícula `D001` → Contraseña: `D001`
- Alumno con matrícula `A001` → Contraseña: `A001`

Se recomienda que los usuarios cambien su contraseña al iniciar sesión por primera vez.

## Resultados de la Carga

Después de procesar el archivo, el sistema muestra:

- ✅ **Grupos creados:** Cantidad de grupos nuevos
- ✅ **Cohortes creadas:** Cohortes generadas automáticamente
- ✅ **Docentes creados:** Docentes nuevos en el sistema
- ✅ **Docentes asignados:** Total de relaciones docente-grupo
- ✅ **Alumnos creados:** Alumnos nuevos en el sistema
- ✅ **Alumnos asignados:** Total de alumnos asignados a grupos
- ❌ **Errores:** Lista de problemas encontrados (si los hay)

## Validaciones

El sistema valida:

- ✅ Que los códigos de programa existan en el catálogo
- ✅ Que los códigos de nivel sean válidos (TSU o ING/LIC)
- ✅ Que el cuatrimestre esté entre 1 y 12
- ✅ Que el año de ingreso sea válido
- ✅ Formato correcto de "Datos Alumnos"
- ✅ Que no se dupliquen grupos (mismo número + misma cohorte)
- ✅ Emails válidos para docentes y alumnos nuevos
- ✅ Datos completos para usuarios nuevos

## Consejos y Mejores Prácticas

1. **Descarga la plantilla** desde el sistema antes de comenzar
2. **Revisa la hoja de Catálogos** para usar los códigos correctos
3. **Mantén el formato** de "Datos Alumnos" exactamente como se especifica
4. **Verifica los emails** antes de subir el archivo
5. **Revisa las matrículas** para evitar duplicados accidentales
6. **Prueba primero** con 1 o 2 grupos antes de hacer una carga masiva grande
7. **Guarda tu archivo** con un nombre descriptivo (ej: `grupos_2025_C1.xlsx`)

## Solución de Problemas Comunes

### Error: "Programa educativo no encontrado"
- ✅ Verifica que el código de programa exista en la hoja de Catálogos
- ✅ Revisa que no haya espacios extra en el código

### Error: "Datos incompletos para crear docente"
- ✅ Si el docente es nuevo, asegúrate de incluir: Nombre, Primer Apellido y Correo
- ✅ Si el docente ya existe, puedes dejar esos campos vacíos

### Error: "Formato de Datos Alumnos inválido"
- ✅ Verifica que uses `|` para separar alumnos
- ✅ Verifica que uses `,` para separar datos de cada alumno
- ✅ Asegúrate de tener exactamente 5 datos por alumno

### Error: "Email inválido"
- ✅ Verifica que todos los emails tengan formato válido
- ✅ Ejemplo correcto: `nombre@example.com`

## Soporte

Para problemas o dudas adicionales, contacta al administrador del sistema.
