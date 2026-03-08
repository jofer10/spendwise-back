# SpendWise API – Cuentas, Categorías y Transacciones (Frontend)

Documento para implementar en el frontend los módulos **Accounts**, **Categories** y **Transactions**. La autenticación ya está implementada; estos endpoints usan el mismo Bearer token.

**Uso:** Copia este documento y úsalo como prompt/contexto para implementar el cliente HTTP, servicios y tipos de estos módulos.

---

## Configuración

| Concepto | Valor |
|----------|-------|
| **Base URL** | `http://localhost:3000/api` |
| **Header** | `Authorization: Bearer <accessToken>` (ya implementado) |
| **Content-Type** | `application/json` |

---

## Estructura de respuesta unificada

Todos los endpoints de Accounts, Categories y Transactions usan la misma estructura.

### Respuesta exitosa

```json
{
  "success": true,
  "message": null,
  "data": { ... } | [ ... ] | null
}
```

- **success**: `true` siempre en respuestas OK.
- **message**: `null` (reservado para mensajes opcionales).
- **data**: Objeto, array o `null` según el endpoint (lista → array, uno → objeto, DELETE → null).

### Respuesta de error

```json
{
  "success": false,
  "message": "Mensaje en español",
  "data": null,
  "statusCode": 400
}
```

- **success**: `false` siempre en errores.
- **message**: string o array de strings (validación 422).
- **data**: `null`.
- **statusCode**: 400, 401, 404, 409, 422, 429, 500.

**Nota:** Este formato de error es global (incluye Auth). Si el frontend de auth manejaba otro formato, actualizar a `response.success` y `response.message`.

---

## Enums

| Enum | Valores |
|------|---------|
| AccountType | `CASH`, `BANK`, `CARD`, `WALLET` |
| CategoryKind | `INCOME`, `EXPENSE`, `BOTH` |
| TxnType | `INCOME`, `EXPENSE` |

---

## Accounts

### GET /api/accounts

Listar cuentas del usuario.

**Response 200:**
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Cuenta principal",
      "type": "BANK",
      "currency": "PEN",
      "initial_balance": "1000.00",
      "is_default": true,
      "created_at": "2025-03-08T18:00:00.000Z",
      "updated_at": "2025-03-08T18:00:00.000Z"
    }
  ]
}
```

**Nota:** `initial_balance` es string (Decimal). Usar `response.data` para el array.

---

### GET /api/accounts/:id

Obtener cuenta por ID.

**Response 200:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Cuenta principal",
    "type": "BANK",
    "currency": "PEN",
    "initial_balance": "1000.00",
    "is_default": true,
    "created_at": "2025-03-08T18:00:00.000Z",
    "updated_at": "2025-03-08T18:00:00.000Z"
  }
}
```

**Errores:** 401, 404 `Cuenta no encontrada`

---

### POST /api/accounts

Crear cuenta.

**Request:**
```json
{
  "name": "Cuenta principal",
  "type": "BANK",
  "currency": "PEN",
  "initial_balance": 1000,
  "is_default": true
}
```

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| name | string | Sí | 1–100 chars |
| type | string | Sí | `CASH`, `BANK`, `CARD`, `WALLET` |
| currency | string | No | Default `PEN` |
| initial_balance | number | No | Default 0 |
| is_default | boolean | No | Default false |

**Response 201:**
```json
{
  "success": true,
  "message": null,
  "data": { "id": "uuid", "user_id": "uuid", "name": "Cuenta principal", ... }
}
```

**Errores:** 401, 409 `Ya existe una cuenta con ese nombre`, 422 (validación)

---

### PATCH /api/accounts/:id

Actualizar cuenta. Body parcial.

**Response 200:** `{ "success": true, "message": null, "data": { ... } }`

**Errores:** 401, 404, 409 `Ya existe una cuenta con ese nombre`, 422

---

### DELETE /api/accounts/:id

Eliminar cuenta.

**Response 200:**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

**Errores:** 401, 404, 409 `No se puede eliminar la cuenta porque tiene transacciones asociadas`

---

## Categories

### GET /api/categories

Listar categorías del usuario.

**Response 200:**
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Alimentación",
      "kind": "EXPENSE",
      "color": "#FF5733",
      "icon": "shopping-cart",
      "is_active": true,
      "created_at": "2025-03-08T18:00:00.000Z",
      "updated_at": "2025-03-08T18:00:00.000Z"
    }
  ]
}
```

---

### GET /api/categories/:id

Obtener categoría por ID.

**Response 200:** `{ "success": true, "message": null, "data": { ... } }`

**Errores:** 401, 404 `Categoría no encontrada`

---

### POST /api/categories

Crear categoría.

**Request:**
```json
{
  "name": "Alimentación",
  "kind": "EXPENSE",
  "color": "#FF5733",
  "icon": "shopping-cart",
  "is_active": true
}
```

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| name | string | Sí | 1–100 chars |
| kind | string | Sí | `INCOME`, `EXPENSE`, `BOTH` |
| color | string | No | Max 20 chars |
| icon | string | No | Max 50 chars |
| is_active | boolean | No | Default true |

**Response 201:** `{ "success": true, "message": null, "data": { ... } }`

**Errores:** 401, 409 `Ya existe una categoría con ese nombre`, 422

---

### PATCH /api/categories/:id

Actualizar categoría. Body parcial.

**Response 200:** `{ "success": true, "message": null, "data": { ... } }`

**Errores:** 401, 404, 409, 422

---

### DELETE /api/categories/:id

Eliminar categoría.

**Response 200:** `{ "success": true, "message": null, "data": null }`

**Errores:** 401, 404, 409 `No se puede eliminar la categoría porque tiene transacciones asociadas`

---

## Transactions

### GET /api/transactions

Listar transacciones con filtros y paginación.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| date_from | string | - | YYYY-MM-DD |
| date_to | string | - | YYYY-MM-DD |
| type | string | - | `INCOME` o `EXPENSE` |
| account_id | string | - | UUID cuenta |
| category_id | string | - | UUID categoría |
| page | number | 1 | Página |
| limit | number | 20 | Por página (max 100) |

**Response 200:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "account_id": "uuid",
      "category_id": "uuid",
      "payment_method_id": "uuid",
      "type": "EXPENSE",
      "amount": "150.50",
      "description": "Supermercado",
      "transaction_date": "2025-03-02T00:00:00.000Z",
      "created_at": "2025-03-08T18:00:00.000Z",
      "updated_at": "2025-03-08T18:00:00.000Z",
      "accounts": {
        "id": "uuid",
        "name": "Cuenta principal",
        "type": "BANK"
      },
      "categories": {
        "id": "uuid",
        "name": "Alimentación",
        "kind": "EXPENSE"
      },
      "payment_methods": {
        "id": "uuid",
        "name": "Tarjeta débito"
      }
    }
  ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

**Nota:** `payment_methods` puede ser `null`. `amount` es string (Decimal). El listado está en `response.data.data`, la paginación en `response.data.meta`.

---

### GET /api/transactions/:id

Obtener transacción por ID.

**Response 200:** `{ "success": true, "message": null, "data": { ... transacción con accounts, categories, payment_methods } }`

**Errores:** 401, 404 `Transacción no encontrada`

---

### POST /api/transactions

Crear transacción.

**Request:**
```json
{
  "account_id": "uuid",
  "category_id": "uuid",
  "payment_method_id": "uuid",
  "type": "EXPENSE",
  "amount": 150.5,
  "transaction_date": "2025-03-02",
  "description": "Supermercado"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| account_id | string | Sí | UUID v4 |
| category_id | string | Sí | UUID v4 |
| payment_method_id | string | No | UUID v4 |
| type | string | Sí | `INCOME`, `EXPENSE` |
| amount | number | Sí | >= 0.01 |
| transaction_date | string | Sí | YYYY-MM-DD |
| description | string | No | Max 500 chars |

**Response 201:** `{ "success": true, "message": null, "data": { ... transacción creada con relaciones } }`

**Errores:**
| statusCode | message |
|------------|---------|
| 400 | `Cuenta no encontrada o no pertenece al usuario` |
| 400 | `Categoría no encontrada o no pertenece al usuario` |
| 400 | `Método de pago no encontrado o no pertenece al usuario` |
| 401 | `Unauthorized` |
| 422 | Array validación (`ID de cuenta inválido`, `El monto debe ser mayor a 0`, `Fecha inválida`, etc.) |

---

### PATCH /api/transactions/:id

Actualizar transacción. Body parcial.

**Response 200:** `{ "success": true, "message": null, "data": { ... } }`

**Errores:** 400 (cuenta/categoría/pm no encontrados), 401, 404, 422

---

### DELETE /api/transactions/:id

Eliminar transacción.

**Response 200:** `{ "success": true, "message": null, "data": null }`

**Errores:** 401, 404

---

## Notas para el frontend

1. **Estructura:** Siempre verificar `response.success`; si es `false`, usar `response.message` para mostrar el error.
2. **Datos:** Los datos van en `response.data` (objeto, array o null).
3. **Transacciones paginadas:** Items en `response.data.data`, meta en `response.data.meta`.
4. **Decimales:** `initial_balance` y `amount` vienen como string → usar `parseFloat()` para cálculos.
5. **payment_method_id:** Opcional. El CRUD de métodos de pago no existe aún; omitir o enviar `null`.
6. **Orden de dependencias:** Crear cuentas y categorías antes de transacciones (necesitas sus IDs).
7. **Errores:** Si `message` es array, mostrar el primero o unirlos.
