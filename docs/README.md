# SpendWise Backend - Documentación Técnica

## Stack tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **NestJS** | Framework backend modular, TypeScript nativo, arquitectura escalable |
| **Prisma** | ORM type-safe, migraciones declarativas, soporte PostgreSQL |
| **PostgreSQL (Neon)** | Base de datos serverless, pooling integrado |
| **Swagger/OpenAPI** | Documentación interactiva de la API |
| **Argon2** | Hash de contraseñas resistente a ataques |
| **JWT** | Tokens de acceso y refresh stateless |
| **Resend** | Envío de emails vía API (forgot-password, etc.) |
| **BullMQ + Redis** | Colas de jobs (preparado, sin jobs implementados aún) |
| **class-validator** | Validación de DTOs |
| **Helmet** | Cabeceras HTTP de seguridad |
| **Throttler** | Rate limiting en endpoints sensibles |

---

## Estructura de carpetas

```
src/
├── main.ts                 # Bootstrap de la aplicación
├── app.module.ts           # Módulo raíz
├── config/
│   └── configuration.ts    # Carga de variables de entorno
├── common/
│   ├── decorators/         # @CurrentUser, @Public
│   ├── filters/            # Manejo global de excepciones
│   └── guards/             # (JWT en modules/auth)
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts   # Cliente Prisma global
├── modules/
│   ├── auth/               # Autenticación completa
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── me.controller.ts    # GET /me
│   │   ├── dto/
│   │   ├── strategies/         # JWT access + refresh
│   │   └── guards/
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   ├── mail.service.ts
│   │   └── templates/
│   ├── health/             # GET /health
│   ├── accounts/           # CRUD cuentas (BANK, CASH, CARD, WALLET)
│   ├── categories/         # CRUD categorías (INCOME, EXPENSE, BOTH)
│   ├── transactions/       # CRUD transacciones con filtros y paginación
│   └── queue/              # BullMQ (infra preparada)
docs/
├── README.md               # Esta documentación
prisma/
├── schema.prisma
└── migrations/
```

### Responsabilidades por capa

- **Controllers**: Rutas, validación de entrada, respuestas HTTP
- **Services**: Lógica de negocio
- **DTOs**: Contratos de entrada con class-validator
- **Guards**: Protección de rutas (JWT)
- **Filters**: Formato consistente de errores

---

## Cómo correr localmente (desarrollo)

### Prerrequisitos

- Node.js 20+
- PostgreSQL (Neon o local)
- Redis (opcional, para QueueModule)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Ejecutar migraciones

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Iniciar en modo desarrollo

```bash
npm run start:dev
```

La API estará en `http://localhost:3000/api` y Swagger en `http://localhost:3000/api/docs`.

---

## Base de datos (Neon)

### DATABASE_URL vs DIRECT_URL

- **DATABASE_URL**: Usa el **pooler** de Neon. Es la URL que debe usar la aplicación en runtime (conexiones efímeras, serverless).
- **DIRECT_URL**: Conexión **directa** a la base. Prisma la usa para migraciones (`prisma migrate`).

En Neon:
1. En el dashboard, copia la URL del pooler → `DATABASE_URL`
2. Copia la URL de conexión directa → `DIRECT_URL`

Ejemplo:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Migraciones

```bash
# Desarrollo (crea migración y aplica)
npm run prisma:migrate

# Producción (solo aplica migraciones existentes)
npm run prisma:migrate:deploy
```

---

## Swagger

- **URL**: `http://localhost:3000/api/docs`
- **Bearer Auth**: En "Authorize" pega el `accessToken` obtenido de login/register
- **Probar endpoints**: Cada operación tiene "Try it out"

---

## Endpoints disponibles

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/refresh | Renovar tokens |
| POST | /api/auth/logout | Cerrar sesión |
| POST | /api/auth/forgot-password | Solicitar reset por email |
| POST | /api/auth/reset-password | Restablecer contraseña |
| GET | /api/me | Usuario actual (Bearer) |

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Health check |

### Accounts (Bearer)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/accounts | Listar cuentas del usuario |
| GET | /api/accounts/:id | Obtener cuenta por ID |
| POST | /api/accounts | Crear cuenta |
| PATCH | /api/accounts/:id | Actualizar cuenta |
| DELETE | /api/accounts/:id | Eliminar cuenta |

### Categories (Bearer)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/categories | Listar categorías del usuario |
| GET | /api/categories/:id | Obtener categoría por ID |
| POST | /api/categories | Crear categoría |
| PATCH | /api/categories/:id | Actualizar categoría |
| DELETE | /api/categories/:id | Eliminar categoría |

### Transactions (Bearer)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/transactions | Listar transacciones (filtros: date_from, date_to, type, account_id, category_id; paginación: page, limit) |
| GET | /api/transactions/:id | Obtener transacción por ID |
| POST | /api/transactions | Crear transacción |
| PATCH | /api/transactions/:id | Actualizar transacción |
| DELETE | /api/transactions/:id | Eliminar transacción |

---

## Ejemplos de requests/responses

### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "fullName": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Juan Pérez"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):** Igual que register.

### POST /api/auth/refresh

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /api/auth/logout

**Request (Header):** `Authorization: Bearer <accessToken>`  
**Request (Body):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (204):** No Content

### POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (202):** Accepted (siempre, para no filtrar emails existentes)

### POST /api/auth/reset-password

**Request:**
```json
{
  "token": "token-del-email",
  "newPassword": "NewSecureP@ss123"
}
```

**Response (200):** OK

### GET /api/me

**Request (Header):** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Juan Pérez",
  "currency": "USD",
  "timezone": "UTC"
}
```

### POST /api/accounts

**Request (Header):** `Authorization: Bearer <accessToken>`  
**Request (Body):**
```json
{
  "name": "Cuenta principal",
  "type": "BANK",
  "currency": "PEN",
  "initial_balance": 1000,
  "is_default": true
}
```

**Response (201):** Cuenta creada con `id`, `user_id`, `name`, `type`, `currency`, `initial_balance`, `is_default`, etc.

### POST /api/transactions

**Request (Header):** `Authorization: Bearer <accessToken>`  
**Request (Body):**
```json
{
  "account_id": "uuid-cuenta",
  "category_id": "uuid-categoria",
  "type": "EXPENSE",
  "amount": 150.5,
  "transaction_date": "2025-03-02",
  "description": "Supermercado"
}
```

**Response (201):** Transacción creada con relaciones incluidas (accounts, categories, payment_methods).

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar build compilado |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:migrate` | Migrar DB (dev) |
| `npm run prisma:migrate:deploy` | Migrar DB (prod) |
| `npm run prisma:studio` | UI de Prisma |
| `npm run lint` | Linter |
| `npm run format` | Formatear código |

---

## Deploy (Railway / Render)

- La app es **stateless**: no guarda sesiones en memoria
- Configurar `DATABASE_URL` y `DIRECT_URL` de Neon
- Configurar `JWT_SECRET` y `JWT_REFRESH_SECRET` fuertes
- Configurar `APP_URL` con la URL pública (para links de reset password)
- Opcional: Redis para BullMQ cuando se implementen jobs
