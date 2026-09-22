# agendaonline — Rizos Felices

Autoagendamiento web de Rizos Felices (sede Suramericana, Medellín): la clienta elige el servicio, hace su diagnóstico
de densidad y plasticidad, suma complementos, escoge fecha y hora, y aparta el cupo con el abono.

React 19 + TypeScript (strict) + Vite + React Router 7.

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de producción en dist/
npm run typecheck  # solo tipos
```

Node 18 o superior.

## Configuración por ambiente

Copia `.env.example` a `.env.local` (o edita `.env.development` / `.env.production`).

| Variable | Para qué |
|---|---|
| `VITE_API_BASE_URL` | Dominio del backend. Si está vacío se resuelve por hostname en `src/config/domains.ts` |
| `VITE_API_PREFIX` | Prefijo común de los endpoints (`/api/v1`) |
| `VITE_USE_MOCKS` | `true` = catálogo, disponibilidad y reservas simulados |
| `VITE_ROUTER_MODE` | `browser` (URLs limpias, requiere rewrite a `index.html`) o `hash` |
| `VITE_ROUTER_BASENAME` / `VITE_PUBLIC_BASE` | Si la app vive en un subdirectorio |
| `VITE_DEV_PROXY_TARGET` | En desarrollo, proxy de `/api/v1` a este backend (evita CORS) |
| `VITE_BRANCH_ID` / `VITE_WHATSAPP_NUMBER` | Sede y WhatsApp |

## Dónde cambiar cada cosa

| Qué | Archivo |
|---|---|
| Dominio del backend por hostname | `src/config/domains.ts` |
| Rutas del backend (tipadas) | `src/config/endpoints.ts` |
| URLs de la app | `src/router/paths.ts` |
| Datos de la sede, horarios, abono, medios de pago | `src/config/business.ts` |
| Catálogo local y matriz densidad × plasticidad | `src/data/catalog.ts` |
| Videos del diagnóstico | `src/data/diagnosis.ts` |
| Tipos de dominio y contratos con el API | `src/types/index.ts` |
| Cuerpo de `POST /bookings` | `src/features/booking/bookingPayload.ts` |

## Estructura

```
src/
  api/          cliente HTTP, servicios y mocks
  config/       ambiente, dominios, endpoints, negocio
  context/      catálogo, reserva (persistida en sessionStorage), toasts
  data/         catálogo local y opciones de diagnóstico
  features/booking/
    pages/      una pantalla por paso del flujo
    components/ selector de día, horarios, resumen
  lib/          precios, fechas, validación, calendario (.ics)
  router/       rutas, guards y paths
  types/        tipos compartidos
```

## Endpoints esperados

| Método | Ruta | Uso |
|---|---|---|
| GET | `/branches/:branchId/catalog` | Catálogo (misma forma que `Catalog`) |
| GET | `/branches/:branchId/availability?date=&duration=` | `AvailabilitySlot[]` |
| POST | `/bookings` | Crea la reserva (`BookingPayload` → `CreatedBooking`) |
| POST | `/bookings/:bookingId/deposit` | La clienta avisa que envió el comprobante |

Pendientes de negocio: número de WhatsApp, cuentas de Nequi/Bancolombia, link de pago y videos del diagnóstico.
Los precios intermedios de la matriz son supuestos a validar con operación.
