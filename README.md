# Banco Digital

Microservicio de banca para la gestión de clientes, cuentas y movimientos (depósitos, retiros y transferencias) con soporte multimoneda (DOP, USD, EUR) y conversión automática.

## Stack

- **NestJS 12 + TypeScript (ESM)**
- **GraphQL**
- **PostgreSQL 16 + TypeORM**
- **Redis**
- **Elasticsearch 8**
- **Vitest + Supertest**
- **Docker Compose**

## Requisitos

- Node.js 22 o superior
- Docker y Docker Compose

## Ejecutar con Docker (recomendado)

Levanta la base de datos, Redis, Elasticsearch y la aplicación. Las migraciones y los datos de prueba se aplican solos al iniciar.

```bash
cp .env.example .env
docker compose --profile app up -d --build
```

Elasticsearch puede tardar entre 30 y 60 segundos en estar listo; la app espera a que todos los servicios estén healthy.

- GraphiQL: http://localhost:3001/graphql
- Health: http://localhost:3001/health

El puerto se configura con `PORT` en el `.env`.

## Ejecutar en local (desarrollo)

Docker solo para la infraestructura y la app con hot reload:

```bash
cp .env.example .env
npm install
docker compose up -d          # Postgres, Redis y Elasticsearch
npm run migration:run         # esquema + datos de prueba
npm run start:dev
```

> Postgres se expone en el puerto **5433** de la máquina para no chocar con una instalación local. Dentro de la red de Docker usa el 5432.

## Variables de entorno

| Variable                            | Descripción                           | Valor por defecto                    |
| ----------------------------------- | ------------------------------------- | ------------------------------------ |
| `PORT`                              | Puerto HTTP de la app                 | `3001`                               |
| `NODE_ENV`                          | `development` / `production` / `test` | `development`                        |
| `DB_HOST`, `DB_PORT`                | Conexión a PostgreSQL                 | `localhost`, `5433`                  |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciales                          | `banco`, `banco123`, `banco_digital` |
| `REDIS_HOST`, `REDIS_PORT`          | Conexión a Redis                      | `localhost`, `6379`                  |
| `ELASTIC_NODE`                      | URL de Elasticsearch                  | `http://localhost:9200`              |

Las variables se validan al arrancar con Joi: si falta alguna, la app no inicia y muestra cuál.

## Datos de prueba

La migración `SeedDemoData` crea clientes y cuentas en las tres monedas. Cada saldo inicial tiene su depósito registrado.

| Cliente          | Cuenta       | Moneda | Saldo     | Estado |
| ---------------- | ------------ | ------ | --------- | ------ |
| Ana Martínez     | `1000000001` | DOP    | 50,000.00 | ACTIVE |
| Ana Martínez     | `1000000002` | USD    | 1,200.00  | ACTIVE |
| Carlos Rodríguez | `1000000003` | DOP    | 15,000.00 | ACTIVE |
| Carlos Rodríguez | `1000000004` | EUR    | 800.00    | ACTIVE |
| María Gómez      | `1000000005` | USD    | 300.00    | ACTIVE |
| María Gómez      | `1000000006` | DOP    | 2,500.00  | FROZEN |

`SeedExchangeRates` carga las tasas entre DOP, USD y EUR en ambas direcciones.

## API GraphQL

El esquema completo está en [`src/schema.gql`](src/schema.gql) y también se puede explorar desde GraphiQL.

| Queries                                    | Mutations                                                         |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `customers`, `customer`, `searchCustomers` | `createCustomer`, `updateCustomer`, `reindexCustomers`            |
| `account`, `accountTransactions`           | `openAccount`, `freezeAccount`, `unfreezeAccount`, `closeAccount` |
| `transaction`                              | `deposit`, `withdraw`, `transfer`                                 |
| `exchangeRates`                            | `setExchangeRate`                                                 |

### Ejemplos

Transferencia entre monedas (DOP → USD):

```graphql
mutation {
  transfer(
    input: {
      sourceAccountNumber: "1000000001"
      destinationAccountNumber: "1000000002"
      amount: "6350.00"
      description: "Pago"
    }
  ) {
    amount
    currency
    convertedAmount
    exchangeRate
  }
}
```

Cliente con sus cuentas:

```graphql
query {
  customer(id: "c1000000-0000-4000-8000-000000000001") {
    firstName
    accounts {
      accountNumber
      currency
      balance
      status
    }
  }
}
```

Búsqueda con tolerancia a errores de escritura:

```graphql
query {
  searchCustomers(term: "carlso rodrigez") {
    firstName
    lastName
    email
  }
}
```

Historial de una cuenta:

```graphql
query {
  accountTransactions(accountNumber: "1000000001", limit: 10) {
    type
    amount
    currency
    convertedAmount
    createdAt
  }
}
```

### Errores

Todos los errores siguen el mismo formato, con un código estable en `extensions.code`:

```json
{
  "message": "Insufficient funds",
  "path": ["withdraw"],
  "extensions": { "code": "INSUFFICIENT_FUNDS" }
}
```

| Código                  | Cuándo                                                |
| ----------------------- | ----------------------------------------------------- |
| `BAD_USER_INPUT`        | Validación fallida (incluye `details` con cada campo) |
| `NOT_FOUND`             | El recurso no existe                                  |
| `CONFLICT`              | Email o documento de cliente duplicado                |
| `INSUFFICIENT_FUNDS`    | Saldo insuficiente                                    |
| `ACCOUNT_NOT_ACTIVE`    | Operación sobre una cuenta congelada o cerrada        |
| `ACCOUNT_CLOSED`        | Intento de modificar una cuenta cerrada               |
| `ACCOUNT_HAS_BALANCE`   | Cerrar una cuenta con saldo                           |
| `SAME_ACCOUNT`          | Transferencia a la misma cuenta                       |
| `RATE_NOT_AVAILABLE`    | No hay tasa para el par de monedas                    |
| `INTERNAL_SERVER_ERROR` | Error inesperado; el detalle solo queda en los logs   |

## Pruebas

```bash
npm run test         # unitarias
npm run test:cov     # unitarias con cobertura
npm run test:e2e     # integración (requiere docker compose up)
```

- **Unitarias:** `TransactionsService` (saldos, conversión, orden de bloqueo, reglas de negocio), `AccountsService` (estados de cuenta) y `ExchangeRatesService` (caché e invalidación). Los servicios se instancian directamente con dependencias simuladas.
- **Integración:** levantan la app completa contra PostgreSQL, Redis y Elasticsearch reales y prueban por GraphQL: health, formato de errores y una transferencia entre monedas de principio a fin.

## Arquitectura y decisiones

### Estructura

```
src/
├── customers/        clientes y búsqueda en Elasticsearch
├── accounts/         cuentas y sus estados
├── transactions/     depósitos, retiros y transferencias
├── exchange-rates/   tasas de cambio
├── cache/            cliente Redis + CacheService
├── search/           cliente Elasticsearch
├── health/           /health con Terminus
├── common/           enums, errores, validadores y plugin de logs
├── config/           validación de variables de entorno
└── database/         DataSource y migraciones
```

Cada módulo es dueño de su entidad y expone un servicio. Los demás módulos usan ese servicio, nunca el repositorio ajeno. Los resolvers solo reciben la petición y delegan; la lógica está en los servicios.

### Un solo microservicio

Clientes, cuentas y movimientos forman un mismo contexto de negocio. Las transferencias necesitan actualizar dos saldos y registrar el movimiento de forma atómica; separarlos en servicios distintos obligaría a usar transacciones distribuidas (sagas). Internamente está modularizado, así que un módulo como `exchange-rates` podría extraerse sin reescribir el resto.

### Dinero

- Montos en `numeric(18,2)` y tasas en `numeric(18,6)`, nunca `float`.
- En la API los montos viajan como `String` (`"1500.00"`) para no perder precisión, y los cálculos se hacen con `decimal.js`.
- Las conversiones se redondean a 2 decimales con `ROUND_HALF_UP`.
- Las cuentas abren en cero: el dinero solo entra mediante un depósito, así que todo saldo está respaldado por movimientos.
- Cada transferencia guarda la tasa usada y el monto convertido, para auditoría.
- Las transacciones son inmutables (sin `updatedAt`).

### Concurrencia

Cada operación corre en una transacción de base de datos y bloquea las cuentas involucradas con `SELECT ... FOR UPDATE`. En las transferencias, las cuentas se bloquean siempre en el mismo orden para evitar deadlocks entre transferencias opuestas simultáneas (A→B y B→A).

### Identificadores

La API usa el **número de cuenta** (lo que conoce el cliente) y la base de datos usa UUID para las relaciones.

### Caché (Redis)

Se cachean las tasas de cambio: se leen en cada transferencia y cambian poco. Al actualizar una tasa se invalidan ambas direcciones, y el TTL de una hora es una red de seguridad. Los **saldos no se cachean**: un saldo desactualizado es un riesgo, y las transferencias necesitan el valor real bloqueado en la base. Si Redis falla, el servicio sigue funcionando contra PostgreSQL.

### Búsqueda (Elasticsearch)

PostgreSQL es la fuente de verdad. Los clientes se indexan después de crearse o actualizarse; la búsqueda obtiene los ids desde Elasticsearch (con tolerancia a errores de escritura y coincidencia exacta por documento) y los datos desde PostgreSQL. Si la indexación falla, la operación no se cae y `reindexCustomers` reconstruye el índice. Al iniciar, si el índice no existe, se crea y se carga.

### Health y logs

- `GET /health` verifica PostgreSQL, Redis y Elasticsearch y responde 503 si alguno falla.
- Cada operación GraphQL se registra con su duración y, si falla, su código de error.
- En desarrollo los logs son legibles en consola; en producción (`NODE_ENV=production`) se emiten en JSON.

## Limitaciones y mejoras futuras

- Las pruebas e2e usan la base de desarrollo; lo ideal sería una base dedicada que se limpie en cada ejecución.
- Cobertura de pruebas en clientes y búsqueda.
- La búsqueda cubre clientes; se podría extender a transacciones (por descripción, fecha o monto).
- TypeORM crea un tipo enum por columna; con `enumName` se podría compartir un único tipo `currency`.
- DataLoader para evitar consultas N+1 al pedir las cuentas de muchos clientes.
- GraphiQL está habilitado también en producción para facilitar la evaluación; en un entorno real se desactivaría.
- Autenticación y autorización quedaron fuera del alcance del reto.
