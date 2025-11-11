# Mini proyecto de prueba (Next.js) — carpeta `test/`

Esto es un mini‑proyecto Next.js pensado para pruebas locales del endpoint de registro.

Archivos importantes:
- `pages/api/register.js` — endpoint POST `/api/register` que inserta en `usuarios` y `administradores`.
- `pages/register.js` — formulario de prueba en el navegador.
- `lib/db.js` — pool MySQL (lee variables de entorno en `.env.local`).
- `lib/hash.js` — hashing de contraseñas con scrypt.
- `.env.example` — plantilla de variables de entorno.

Pasos para usar:

1) Entra en la carpeta test:

```powershell
cd .\test
```

2) Instala dependencias (solo dentro de test):

```powershell
npm install
```

3) Crea `test/.env.local` copiando `.env.example` y edítalo con tus credenciales de DB:

```powershell
Copy-Item .\.env.example .\.env.local
# luego editar .\.env.local y rellenar DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
```

4) Ejecuta el servidor de desarrollo (usa puerto 3001 para no chocar con tu app principal):

```powershell
npm run dev
```

5) Abre en el navegador:

http://localhost:3001/register

Rellena el formulario y pulsa Registrar. El servidor encriptará la contraseña y guardará los registros.

Notas de seguridad y producción:
- No subas `.env.local` ni credenciales a un repositorio público.
- En producción debes integrar la API en tu app principal (mover `pages/api/register.js` a tu app o usar la carpeta `app/api`).
# Test: conexión y registro en la base de datos

Este directorio contiene un ejemplo mínimo (TypeScript) para conectarse a la base de datos MySQL y registrar un usuario en las tablas `usuarios` y `administradores`.

Archivos:
- `config.ts` - lee variables de entorno y exporta `dbConfig` y `sampleUser`/`sampleAdmin` de ejemplo.
- `.env.example` - plantilla de variables de entorno.
- `db.ts` - crea y exporta un pool MySQL usando `mysql2/promise`.
- `hash.ts` - util para encriptar/verificar contraseñas usando `crypto.scrypt` (no requiere dependencias externas).
- `register.ts` - script que inserta un usuario y su fila en `administradores` dentro de una transacción.

Pasos para usar:

1) Copia `.env.example` a `.env` y rellena tus credenciales:

   - En PowerShell:

```powershell
cp .\test\.env.example .\test\.env
# Edita .\test\.env con tu editor y reemplaza los valores
```

2) Instala la dependencia necesaria (`mysql2`):

```powershell
npm install mysql2
```

3) Ejecuta el script (opciones):

- Usando `ts-node` (si lo tienes):

```powershell
npx ts-node .\test\register.ts
```

- Compilar con `tsc` y ejecutar con `node`:

```powershell
npx tsc .\test\register.ts --outDir .\dist
node .\dist\test\register.js
```

Notas:
- El script utiliza `process.env` y las variables definidas en `config.ts`. Puedes reemplazar directamente los valores en `config.ts` o preferible: establecer las variables de entorno en `.env`.
- La contraseña se encripta con `scrypt` y se almacena en la columna `contrasena` en formato `salt:hash`.
- Asegúrate de que las tablas `usuarios` y `administradores` existan (según tu esquema SQL proporcionado).

