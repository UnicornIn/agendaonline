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
| `VITE_API_BASE_URL` | Dominio del backend de agenda. Si está vacío se resuelve por hostname en `src/config/domains.ts` |
| `VITE_API_PREFIX` | Prefijo del módulo público de autoagendamiento (`/public/agendamiento`) |
| `VITE_USE_MOCKS` | `true` = todo el flujo corre sin backend, con los servicios reales de la sede |
| `VITE_ROUTER_MODE` | `browser` (URLs limpias, requiere rewrite a `index.html`) o `hash` |
| `VITE_ROUTER_BASENAME` / `VITE_PUBLIC_BASE` | Si la app vive en un subdirectorio |
| `VITE_DEV_PROXY_TARGET` | En desarrollo, proxy del prefijo a este backend (evita CORS) |

La sede **no** se configura acá: la fija el servidor. Un `sede_id` que venga del navegador es un
`sede_id` que cualquiera puede cambiar.

## Dónde cambiar cada cosa

| Qué | Archivo |
|---|---|
| Dominio del backend por hostname | `src/config/domains.ts` |
| Rutas del backend (tipadas) | `src/config/endpoints.ts` |
| URLs de la app | `src/router/paths.ts` |
| **Qué servicio de la agenda es cada opción del menú** | `src/data/serviceMap.ts` |
| Catálogo curado: nombres, descripciones, qué incluye | `src/data/catalog.ts` |
| Videos del diagnóstico | `src/data/diagnosis.ts` |
| Tipos de dominio y contratos con el API | `src/types/index.ts` |
| Texto de marca (lo único que no sale de la agenda) | `src/config/business.ts` |

Sede, abono, medios de pago, políticas, WhatsApp y los parámetros de la agenda ya **no** se editan
en el código: salen de `GET /public/agendamiento/config` y se leen con `useAgendaConfig()`.

## Estructura

```
src/
  api/          cliente HTTP, servicios y mocks
  config/       ambiente, dominios, endpoints, marca
  context/      agenda (config + catálogo), reserva (en sessionStorage), toasts
  data/         catálogo curado, diagnóstico y el mapeo a servicios de la agenda
  features/booking/
    pages/      una pantalla por paso del flujo
    components/ selector de día, horarios, resumen
  lib/          precios, fechas, validación, calendario (.ics)
  router/       rutas, guards y paths
  types/        tipos compartidos
```

## El backend

La web no habla con la agenda directamente: habla con el módulo público `app/selfbooking/` del
Backend de appagenda, montado en `/public/agendamiento`.

El contrato completo —endpoints, formas, errores y el porqué de cada decisión— está en
[docs/autoagendamiento-api.md](docs/autoagendamiento-api.md). Léelo antes de tocar `src/api/`.

Resumen:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/config` | Sede, abono, medios de pago, políticas |
| GET | `/catalogo` | Servicios agendables, con los ejes del nombre interpretados |
| GET | `/profesionales` | Quienes prestan todos los servicios del bloque |
| GET | `/disponibilidad` | Cupos libres de un día, ya recortados por la duración |
| GET | `/disponibilidad/dias` | Qué días del rango tienen algún cupo |
| POST | `/retencion` | Aparta el bloque mientras la clienta llena el formulario |
| DELETE | `/retencion/:id` | Lo suelta si se devuelve |
| POST | `/cita` | Identifica o crea la clienta y escribe la cita |

## Pendientes con operación

- **Los precios del catálogo curado no cuadran con los de la agenda.** La web muestra el de la
  agenda, que es el que se cobra y se factura; los rangos de `src/data/catalog.ts` quedan solo como
  el "desde" de la tarjeta. Ejemplos: Peinados figura en $120.000 y `PEINADOS` (SV-91564) está en
  $30.000; Ozonoterapia figura en $150.000 / 1h30 y `OZONOTERAPIA` (SV-23393) está en $130.000 / 1h.
- **Hay opciones del menú sin servicio utilizable en la agenda** y la web las esconde, porque crear
  la cita exige un `servicio_id`: Peinado especial (novia o quince), Maquillaje de novia y **Uñas
  completo** — la única fila genérica, `SERVICIO DE UÑAS` (SV-14954), está a $1.000, que es un
  precio marcador; las demás son acrílicas de manos, de pies o el retiro. Para habilitarlas,
  operación crea el servicio con su precio y se agrega una línea en `src/data/serviceMap.ts`.
- **Definición detallada no distingue plasticidad en la agenda.** La escalera `SOLO DEFINICION` va
  solo por densidad, así que "se forma solo" y "necesita ayuda" dan el mismo precio y el mismo
  tiempo. En el catálogo curado sí eran distintos ($130.000–$190.000 / 2h contra $160.000–$195.000 /
  3h). Si la diferencia es real, hay que crear las filas `P.A` / `P.B` en la agenda.
- Falta el número de WhatsApp real de la sede, las cuentas de Nequi y Bancolombia, el link de pago y
  los videos del diagnóstico. Los primeros cuatro ya salen de `/config`: se llenan en la agenda, no
  en este repo.
