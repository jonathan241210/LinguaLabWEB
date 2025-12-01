# 📊 Instrucciones para Carga Masiva de Grupos

## 🎯 Descripción
La funcionalidad de carga masiva permite crear múltiples grupos y sus relaciones (docentes y alumnos) mediante un archivo Excel, agilizando el proceso de creación que normalmente se haría manualmente.

## 📋 Estructura del Archivo Excel

### Columnas Requeridas (obligatorias):

1. **Número de Grupo**
   - Ejemplos: "1", "2", "3", "4"
   - Descripción: Número identificador del grupo (DEBE SER NUMÉRICO)
   - **IMPORTANTE**: Solo números, sin letras

2. **Cuatrimestre**
   - Ejemplos: "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
   - Descripción: Número del cuatrimestre (del 1 al 12)
   - **IMPORTANTE**: Debe existir en el catálogo de cuatrimestres

3. **Código Programa**
   - Ejemplos: "TIC", "NyM", "CON", "EyDS", "IND", "MEC"
   - Descripción: Código del programa educativo
   - **IMPORTANTE**: Usar el código exacto (ver hoja "Catálogos" en la plantilla)
   - **Códigos disponibles:**
     - TIC - Tecnologías de la Información e Innovación Digital
     - NyM - Negocios y Mercadotecnia
     - CON - Contaduría
     - TF - Terapia Física
     - TFR - Terapia Física Área Rehabilitación
     - CyCF - Criminalística y Ciencias Forenses
     - CRI - Criminalística
     - DDyPA - Diseño Digital y Producción Audiovisual
     - EyDS - Energía y Desarrollo Sostenible
     - ENF - Enfermería
     - IND - Industrial
     - MEC - Mecatrónica
     - MCyP - Médico Cirujano y Partero
     - NAN - Nanotecnología
     - SRyP - Salud Reproductiva y Partería
     - AyS - Ambiental y Sustentabilidad

4. **Código Nivel**
   - Valores: "TSU" o "ING/LIC"
   - Descripción: Nivel educativo del programa
   - **Opciones:**
     - TSU - Técnico Superior Universitario
     - ING/LIC - Ingeniería/Licenciatura

5. **Año Ingreso**
   - Ejemplos: 2025, 2024, 2026
   - Descripción: Año en que ingresó la cohorte
   - Nota: Si está vacío, se usa el año actual

6. **Cuatrimestre Inicial**
   - Ejemplos: 1, 2, 3
   - Descripción: Número de cuatrimestre en que ingresó la cohorte
   - Nota: Si está vacío, se usa 1

7. **Estado Prácticas**
   - Valores: "SI" o "NO"
   - Descripción: Indica si el grupo está en periodo de prácticas
   - Nota: Si está vacío, se considera "NO"

### Columnas Opcionales:

8. **Matrícula Docente**
   - Ejemplos: "D001", "D123", "DOC456"
   - Descripción: Matrícula del docente que se asignará al grupo
   - Nota: Si se proporciona, el docente debe existir en el sistema

9. **Matrículas Alumnos**
   - Ejemplos: "A001,A002,A003,A004,A005,A006,A007,A008,A009,A010"
   - Descripción: Matrículas de los alumnos a asignar, separadas por comas (,) o punto y coma (;)
   - **IMPORTANTE**: 
     - Las matrículas deben existir en el sistema
     - Los alumnos no deben estar ya asignados a otro grupo activo
     - Se recomienda al menos 10 alumnos por grupo

## 📝 Ejemplo de Archivo Excel

| Número de Grupo | Cuatrimestre | Código Programa | Código Nivel | Año Ingreso | Cuatrimestre Inicial | Estado Prácticas | Matrícula Docente | Matrículas Alumnos |
|-----------------|--------------|-----------------|--------------|-------------|---------------------|------------------|-------------------|-------------------|
| 1 | 1 | TIC | TSU | 2025 | 1 | NO | D001 | A001,A002,A003,A004,A005,A006,A007,A008,A009,A010 |
| 2 | 1 | TIC | TSU | 2025 | 1 | NO | D002 | A011,A012,A013,A014,A015,A016,A017,A018,A019,A020 |
| 1 | 5 | NyM | ING/LIC | 2024 | 1 | SI | D003 | A021,A022,A023,A024,A025,A026,A027,A028,A029,A030 |

## 🚀 Proceso de Carga

1. **Descargar la Plantilla**
   - Haz clic en el botón "Descargar Plantilla de Excel" en el modal de carga masiva
   - Se descargará un archivo `plantilla_grupos.xlsx` con:
     - Hoja "Grupos": Con la estructura y un ejemplo
     - Hoja "Catálogos": Con todos los códigos disponibles (programas, niveles, etc.)

2. **Llenar el Archivo**
   - Abre el archivo descargado
   - **Revisa la hoja "Catálogos"** para conocer los códigos correctos
   - Llena la hoja "Grupos" con tus datos
   - Asegúrate de usar los códigos exactos de los catálogos
   - Verifica que las matrículas de docentes y alumnos existan

3. **Subir el Archivo**
   - Guarda el archivo Excel
   - En el modal de carga masiva, haz clic en "Seleccionar Archivo"
   - Selecciona tu archivo
   - El sistema procesará automáticamente cada grupo

4. **Revisar Resultados**
   - Al finalizar, verás un resumen con:
     - Total de grupos procesados
     - Grupos creados exitosamente
     - Errores encontrados (si los hay)
   - Revisa los detalles de cada grupo creado y los errores para corregir

## ⚠️ Consideraciones Importantes

### Validaciones del Sistema:
- El **Número de Grupo** debe ser numérico (1, 2, 3... NO usar letras como A, B, C)
- El **Cuatrimestre** debe ser un número del 1 al 12
- El **Código Programa** debe existir exactamente en los catálogos (usa la hoja "Catálogos")
- El **Código Nivel** debe ser "TSU" o "ING/LIC"
- La **Matrícula Docente** debe existir en el sistema (si se proporciona)
- Las **Matrículas Alumnos** deben:
  - Existir en el sistema
  - No estar asignadas a otro grupo activo
  - Estar separadas por comas o punto y coma
  
### Cohortes:
- El sistema genera automáticamente una etiqueta: `{Año}-C{Cuatrimestre}-{CódigoPrograma}-{CódigoNivel}`
  - Ejemplo: `2025-C1-TIC-TSU`
- Si la cohorte no existe, se creará automáticamente
- Si ya existe, se usará la cohorte existente

### Relación Docente-Grupo:
- Se usa la tabla `docente_grupo` para asignar docentes
- Se marca automáticamente como activo
- Un docente puede estar asignado a múltiples grupos

### Errores Comunes:
1. **"El número de grupo debe ser numérico"**: Usar solo números (1, 2, 3...), NO letras
2. **"Cuatrimestre no encontrado"**: Verificar que sea un número del 1 al 12
3. **"Programa con código X no encontrado"**: Usar los códigos exactos de la hoja "Catálogos"
4. **"Nivel educativo con código X no encontrado"**: Usar "TSU" o "ING/LIC"
5. **"Alumno ya asignado"**: El alumno tiene una asignación activa a otro grupo
6. **"Faltan campos requeridos"**: Alguna columna obligatoria está vacía

## 💡 Consejos

- **Usa la hoja "Catálogos"**: Es tu referencia principal para códigos
- **Número de grupo**: Solo números (1, 2, 3...), es el identificador dentro del cuatrimestre
- **Códigos cortos**: Usa los códigos de programa (TIC, NyM, etc.), NO los nombres completos
- **Verifica matrículas**: Asegúrate de que docentes y alumnos existan en el sistema
- **Separa correctamente**: Usa comas (,) para separar las matrículas de alumnos
- **Revisa resultados**: Después de cargar, revisa los errores para corregir grupos que fallaron
- **Mínimo 10 alumnos**: Se recomienda al menos 10 alumnos por grupo

## 🔄 Proceso Automático

Al subir el archivo, el sistema automáticamente:
1. ✅ Valida cada grupo (número de grupo numérico, códigos correctos, etc.)
2. ✅ Busca o crea la cohorte con la etiqueta autogenerada
3. ✅ Crea el grupo con el número especificado
4. ✅ Asigna el docente usando la tabla `docente_grupo` (si se proporcionó)
5. ✅ Asigna los alumnos verificando que no estén ya asignados
6. ✅ Genera un reporte detallado de resultados

## 📊 Ejemplo de Cohorte Generada

Si creas un grupo con:
- Año Ingreso: 2025
- Cuatrimestre Inicial: 1
- Código Programa: TIC
- Código Nivel: TSU

El sistema creará/usará la cohorte: **2025-C1-TIC-TSU**

## 📞 Soporte

Si tienes dudas o encuentras problemas:
- Revisa que todos los catálogos estén actualizados
- Verifica que las matrículas existan en el sistema
- Consulta los mensajes de error para identificar el problema
- Asegúrate de usar el formato correcto del Excel
