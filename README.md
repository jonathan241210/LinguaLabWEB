# LinguaLab - Sistema Web para Docentes y Administradores

## 📋 Descripción
Plataforma web con **Next.js + TypeScript** para gestionar docentes, administradores y alumnos. Incluye autenticación JWT con refresh tokens.

## 🏗️ Estructura MVC

```
lingualabweb/
├── models/
│   └── User.ts              # Consultas de usuarios
├── controllers/
│   └── authController.ts    # Lógica de autenticación
├── lib/
│   ├── db.ts               # Conexión MySQL
│   ├── hash.ts             # Encriptación scrypt
│   ├── jwt.ts              # Tokens JWT
│   ├── auth.ts             # Middleware
│   └── withAuth.tsx        # HOC de protección
└── app/
    ├── login/              # Página login
    └── dashboard/
        ├── docente/
        └── admin/
```

## 🗂️ Carpeta Test
```
test/
├── admin/                  # Interfaz prueba admin
│   ├── lib/               # Scripts BD y hash
│   └── pages/             # UI registro
└── docente/               # Interfaz prueba docente
    ├── lib/               # Scripts BD y hash
    └── pages/             # UI registro
```

## 🚀 Comandos

### Instalar
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```
Abre http://localhost:3000 (redirige a `/login`)

### Producción
```bash
npm run build
npm start
```

## 🔐 Autenticación

| Rol | Usuario | Contraseña |
|-----|---------|-----------|
| Docente | Matrícula | Contraseña |
| Admin | Correo | Contraseña |

### Tokens
- **Access Token**: 15 min (localStorage)
- **Refresh Token**: 1 día (httpOnly cookie)
- Se renueva automáticamente cada 13 min

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar token |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Datos usuario |

## ⚙️ Variables de Entorno (`.env.local`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=lingualab2
JWT_SECRET=secreto_super_seguro
JWT_REFRESH_SECRET=refresh_secreto_seguro
```

## 📝 Interfaces Principales

### UsuarioLogin
```typescript
{
  id_usuario: number
  nombre: string
  rol: 'administrador' | 'docente'
}
```

### UsuarioDocente
```typescript
{
  id_usuario: number
  nombre: string
  rol: 'docente'
  matricula: string
}
```

### UsuarioAdmin
```typescript
{
  id_usuario: number
  nombre: string
  rol: 'administrador'
  permisos?: any
}
```

### TokenPayload
```typescript
{
  id_usuario: number
  rol: 'administrador' | 'docente'
  nombre: string
  exp: number
  type?: 'access' | 'refresh'
}
```

### LoginResponse
```typescript
{
  success: boolean
  message: string
  accessToken?: string
  refreshToken?: string
  user?: {
    id_usuario: number
    nombre: string
    rol: string
    matricula?: string
  }
}
```

## 🔒 Características Seguridad

- ✅ Contraseñas encriptadas (crypto.scrypt)
- ✅ JWT con firma HMAC-SHA256
- ✅ Refresh tokens en httpOnly cookies
- ✅ Protección por rol
- ✅ Renovación automática transparente

## 📱 Dashboards

- **Docente**: Panel azul con información de matrícula
- **Admin**: Panel verde con información administrativo
- Botón cierre sesión en ambos

## 🛠️ Stack

- **Frontend**: React 19 + Next.js 16 + TypeScript
- **Backend**: Next.js API Routes
- **BD**: MySQL
- **Auth**: JWT + Refresh Tokens
- **Encriptación**: crypto.scrypt + HMAC-SHA256

## 📚 Próximas Funcionalidades

- [ ] Modelo Alumnos
- [ ] Gestión de Grupos
- [ ] Reportes
- [ ] Sistema de Actividades
- [ ] Tailwind CSS
- [ ] Animaciones
