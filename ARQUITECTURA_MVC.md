# 🏗️ Arquitectura MVC - LinguaLabWEB

## 📋 Resumen de la Reorganización

Este proyecto ha sido reorganizado siguiendo el patrón **Model-View-Controller (MVC)** para mejorar la mantenibilidad, escalabilidad y reutilización del código.

---

## 🗂️ Nueva Estructura del Proyecto

```
src/
├── models/              # 📦 Interfaces y tipos TypeScript
│   ├── Alumno.ts       # Tipos para alumnos
│   ├── Docente.ts      # Tipos para docentes
│   ├── Grupo.ts        # Tipos para grupos
│   ├── Laboratorio.ts  # Tipos para laboratorios/actividades
│   ├── Vocabulario.ts  # Tipos para vocabulario
│   └── Cohorte.ts      # Tipos para cohortes y catálogos
│
├── services/            # 🔧 Lógica de acceso a datos
│   ├── AlumnoService.ts
│   ├── DocenteService.ts
│   ├── GrupoService.ts
│   ├── LaboratorioService.ts
│   ├── VocabularioService.ts
│   └── CohorteService.ts
│
└── controllers/         # 🎮 Controladores de lógica de negocio
    ├── AlumnoController.ts
    ├── DocenteController.ts
    ├── GrupoController.ts
    ├── LaboratorioController.ts
    ├── VocabularioController.ts
    └── CohorteController.ts

pages/api/              # 🌐 Rutas API (Next.js)
├── alumnos/
├── docentes/
├── grupos/
├── laboratorios/
├── vocabulario/
└── auth/
```

---

## 🎯 Capas de la Arquitectura

### 1️⃣ **Models** (`src/models/`)
**Propósito:** Definir las interfaces y tipos de datos TypeScript.

**Contenido:**
- Interfaces de entidades de base de datos
- Tipos para DTOs (Data Transfer Objects)
- Tipos para requests y responses

**Ejemplo:**
```typescript
// src/models/Alumno.ts
export interface Alumno {
  id_alumno: number;
  matricula: string;
  id_usuario_alumno_fk: number;
  // ...
}

export interface CreateAlumnoData {
  nombre: string;
  matricula: string;
  correo: string;
  // ...
}
```

---

### 2️⃣ **Services** (`src/services/`)
**Propósito:** Encapsular todas las operaciones de base de datos.

**Responsabilidades:**
- Ejecutar consultas SQL
- Manejar transacciones
- Procesar y transformar datos de la BD
- **NO** contiene lógica de validación de negocio

**Ejemplo:**
```typescript
// src/services/AlumnoService.ts
export class AlumnoService {
  static async obtenerTodos(): Promise<AlumnoDisponible[]> {
    const alumnos = await query(`SELECT ...`);
    return alumnos as AlumnoDisponible[];
  }

  static async crear(data: CreateAlumnoData, hashedPassword: string) {
    const result = await query('INSERT INTO ...');
    return { id_usuario, id_alumno };
  }
}
```

---

### 3️⃣ **Controllers** (`src/controllers/`)
**Propósito:** Implementar la lógica de negocio y orquestar servicios.

**Responsabilidades:**
- Validar datos de entrada
- Coordinar múltiples servicios
- Transformar datos para respuestas
- Manejar errores y respuestas

**Ejemplo:**
```typescript
// src/controllers/AlumnoController.ts
export class AlumnoController {
  static async registrar(data: CreateAlumnoData) {
    // Validaciones
    if (!data.nombre || !data.correo) {
      return { success: false, error: 'Campos requeridos' };
    }

    // Verificar duplicados
    const existeCorreo = await AlumnoService.existeCorreo(data.correo);
    if (existeCorreo) {
      return { success: false, error: 'Correo ya registrado' };
    }

    // Hashear contraseña
    const hashedPassword = hashPassword(data.contrasena);

    // Crear alumno
    const result = await AlumnoService.crear(data, hashedPassword);

    return { success: true, data: result };
  }
}
```

---

### 4️⃣ **API Routes** (`pages/api/`)
**Propósito:** Manejar requests HTTP y delegar a controladores.

**Responsabilidades:**
- Validar método HTTP
- Extraer datos del request
- Llamar al controlador apropiado
- Devolver respuesta HTTP

**Ejemplo:**
```typescript
// pages/api/alumnos/available.ts
import { AlumnoController } from '@/src/controllers/AlumnoController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const result = await AlumnoController.obtenerDisponibles();
  
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
}
```

---

## ✅ Beneficios de la Nueva Arquitectura

### 🔄 **Reutilización de Código**
- Los servicios pueden ser usados por múltiples controladores
- Los controladores pueden ser usados por múltiples rutas API
- Elimina código duplicado

### 🧪 **Testabilidad**
- Servicios pueden ser probados independientemente
- Controladores pueden ser probados con servicios mockeados
- Separación clara de responsabilidades

### 📖 **Mantenibilidad**
- Cambios en queries SQL solo afectan a servicios
- Cambios en validaciones solo afectan a controladores
- Fácil de entender el flujo de datos

### 🔍 **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Estructura clara para nuevos desarrolladores
- Preparado para crecimiento del proyecto

---

## 🔄 Flujo de Datos

```
Cliente (Frontend)
    ↓
API Route (pages/api/)
    ↓
Controller (src/controllers/)
    ↓
Service (src/services/)
    ↓
Database (MySQL)
```

**Ejemplo completo:**
```
1. Usuario hace POST a /api/alumnos/register
2. API Route valida método HTTP
3. Llama a AlumnoController.registrar()
4. Controller valida datos y verifica duplicados
5. Controller llama a AlumnoService.crear()
6. Service ejecuta INSERT en base de datos
7. Service retorna ID del nuevo alumno
8. Controller retorna respuesta exitosa
9. API Route devuelve JSON con código 201
```

---

## 📝 Convenciones de Código

### Nombres de Archivos
- **Models:** `NombreEntidad.ts` (PascalCase)
- **Services:** `NombreEntidadService.ts`
- **Controllers:** `NombreEntidadController.ts`
- **API Routes:** `nombre-ruta.ts` (kebab-case)

### Nombres de Métodos
**Services:**
- `obtenerTodos()` - Listar todos
- `obtenerPorId(id)` - Obtener uno
- `crear(data)` - Insertar
- `actualizar(id, data)` - Actualizar
- `eliminar(id)` - Eliminar/Desactivar
- `existe*()` - Verificar existencia

**Controllers:**
- Mismos nombres que services
- Agregan validación y orquestación
- Retornan objetos con `{ success, data?, error? }`

---

## 🚀 Archivos Refactorizados

### ✅ Completamente Migrados

| Archivo Original | Nuevo Controller | Nuevo Service |
|-----------------|------------------|---------------|
| `pages/api/alumnos/available.ts` | `AlumnoController` | `AlumnoService` |
| `pages/api/alumnos/detailed.ts` | `AlumnoController` | `AlumnoService` |
| `pages/api/auth/register-student.ts` | `AlumnoController` | `AlumnoService` |
| `pages/api/auth/register-teacher.ts` | `DocenteController` | `DocenteService` |
| `pages/api/docentes/detailed.ts` | `DocenteController` | `DocenteService` |
| `pages/api/grupos/list.ts` | `GrupoController` | `GrupoService` |
| `pages/api/grupos/create.ts` | `GrupoController` | `GrupoService` |
| `pages/api/grupos/assign-students.ts` | `GrupoController` | `GrupoService` |
| `pages/api/laboratorios/list.ts` | `LaboratorioController` | `LaboratorioService` |
| `pages/api/laboratorios/create.ts` | `LaboratorioController` | `LaboratorioService` |
| `pages/api/vocabulario/list.ts` | `VocabularioController` | `VocabularioService` |
| `pages/api/vocabulario/upload.ts` | `VocabularioController` | `VocabularioService` |
| `pages/api/cohortes/create.ts` | `CohorteController` | `CohorteService` |

### ⏳ Pendientes de Migración
- `pages/api/alumnos/toggle-status.ts`
- `pages/api/docentes/toggle-status.ts`
- `pages/api/grupos/assign-teacher.ts`
- `pages/api/grupos/detail.ts`
- `pages/api/grupos/remove-student.ts`
- `pages/api/laboratorios/toggle-publish.ts`
- `pages/api/vocabulario/toggle-status.ts`
- `pages/api/vocabulario/get-unidades.ts`
- `pages/api/vocabulario/crear-unidad.ts`
- `pages/api/vocabulario/actualizar-unidad.ts`
- `pages/api/vocabulario/eliminar-unidad.ts`
- Rutas de catálogos (`cohortes`, `cuatrimestres`, `niveles`, `programas`, `docentes`)

---

## 🧪 Próximos Pasos

1. **Migrar rutas restantes** a la nueva arquitectura
2. **Implementar pruebas unitarias** para servicios
3. **Implementar pruebas de integración** para controladores
4. **Agregar validación con Zod o Yup** en controladores
5. **Implementar logging centralizado**
6. **Documentar API con Swagger/OpenAPI**

---

## 📚 Ejemplo de Uso

### Crear un nuevo endpoint

**1. Definir el modelo:**
```typescript
// src/models/MiEntidad.ts
export interface MiEntidad {
  id: number;
  nombre: string;
}
```

**2. Crear el servicio:**
```typescript
// src/services/MiEntidadService.ts
export class MiEntidadService {
  static async obtenerTodos(): Promise<MiEntidad[]> {
    return await query('SELECT * FROM mi_entidad');
  }
}
```

**3. Crear el controlador:**
```typescript
// src/controllers/MiEntidadController.ts
export class MiEntidadController {
  static async obtenerTodos() {
    try {
      const data = await MiEntidadService.obtenerTodos();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

**4. Crear la ruta API:**
```typescript
// pages/api/mi-entidad/list.ts
import { MiEntidadController } from '@/src/controllers/MiEntidadController';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await MiEntidadController.obtenerTodos();
  return res.status(result.success ? 200 : 500).json(result);
}
```

---

## 🤝 Contribuciones

Al agregar nuevas funcionalidades:
1. **Siempre** crear el modelo primero
2. **Luego** implementar el servicio con las queries
3. **Después** crear el controlador con validaciones
4. **Finalmente** crear la ruta API

Esto asegura consistencia y mantenibilidad del código.

---

## 📞 Contacto

Para preguntas sobre la arquitectura o implementación, consulta la documentación del proyecto o contacta al equipo de desarrollo.
