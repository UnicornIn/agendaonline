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
| `VITE_META_PIXEL_ID` | Píxel de Meta. Vacío = no se carga (así está en desarrollo) |

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

## Medición (Meta Pixel)

El script base está en `index.html`, donde Meta lo quiere: arranca con el HTML y manda el PageView
de la primera carga. El id sale de `%VITE_META_PIXEL_ID%` y el snippet está envuelto en un `if`: sin
un id válido no carga nada. En desarrollo la variable va vacía a propósito, para que las pruebas del
equipo no entren a los informes de la cuenta de anuncios. Para probar en local, el id va en
`.env.development.local` —no en `.env.local`, que pierde contra el archivo del modo.

Todo lo demás vive en [`src/lib/metaPixel.ts`](src/lib/metaPixel.ts).

| Cuándo | Evento | Dónde se dispara |
|---|---|---|
| Cada paso del flujo | `PageView` | `useMetaPixel`, en `AppLayout` |
| Vio el servicio con su precio | `ViewContent` | `DetailPage` |
| Eligió día y hora y siguió | `InitiateCheckout` | `DatePage` |
| **La conversión**: la agenda confirmó la cita | `Schedule` | `DepositPage` |

Cuatro decisiones que conviene no deshacer sin pensarlas:

- **El PageView de la primera carga lo manda `index.html`, no el hook.** Si lo mandaran los dos,
  toda visita empezaría con dos y la portada parecería el doble de visitada.
- **`Schedule` se manda cuando la agenda responde OK, nunca al tocar el botón.** Un clic no es una
  cita, y una cita que falló contada como conversión le enseña a Meta a buscar gente que no agenda.
- **No se le manda a Meta el nombre, el celular ni el correo.** El *advanced matching* los acepta
  hasheados, pero esa decisión es del negocio y, si se toma, se implementa en el servidor.
- **`value` solo cuando el precio es exacto.** Con el diagnóstico a medias el precio es un rango, y
  mandar la punta baja como valor le enseña a Meta un ticket promedio que el salón no cobra.

### La Conversions API

El píxel se pierde seguido —bloqueadores, Safari en iPhone—, así que la conversión se manda también
desde el servidor. Lo que pone este repo es el puente:

- `asegurarFbc()` corre en `main.tsx` antes del render, y por eso antes de que el router toque la
  URL: `fbclid` viene en el enlace del anuncio y desaparece en el primer paso.
- `obtenerContextoMeta()` devuelve `{ fbp, fbc, event_source_url, client_user_agent }`, que es lo
  que hace que el evento del servidor no llegue anónimo.
- El `citaId` viaja como `eventID` en `Schedule`. El backend manda ese mismo id y Meta deduplica.

Va **apagado** (`MANDAR_CONTEXTO_META = false` en `src/lib/metaPixel.ts`) hasta que
`app/selfbooking/` acepte el campo `meta` en `POST /cita`: un campo que el servidor no espera puede
hacerle rechazar la petición, y la clienta perdería la cita por una métrica. El token de la
Conversions API **no va en este repo** —es público, y cualquier `VITE_*` queda a la vista en el
JavaScript que descarga el navegador—: va como variable de entorno del backend.

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

## Desplegar a producción

```bash
npm run deploy
```

Compila, sube a S3 y le limpia el caché a CloudFront. El detalle de cada paso está en
[`scripts/desplegar.ps1`](scripts/desplegar.ps1); esto es lo que hay que saber antes de correrlo.

**No es solo un bucket.** `citas.rizosfelices.co` es un bucket **privado** —CloudFront entra con un
Origin Access Control, nadie más— con la distribución `EKZ4P6ZAQ6T0A` delante. Por eso un
`aws s3 sync` solo no se ve: el archivo queda en S3 al instante y CloudFront sigue sirviendo el
viejo hasta un día. La invalidación **no hay que hacerla a mano en la consola**: el script la manda.

**El bucket y la distribución están quemados en el script, a propósito.** El perfil `default` es
administrador de la cuenta 975050131270 entera, y ahí al lado viven `agenda.rizosfelices.co` y
`staging-app.rizosfelices.co`, que son otros sitios en vivo. Un nombre de bucket mal escrito no da
error: crea o pisa otra cosa. Antes de subir nada, el script le pregunta a AWS de qué cuenta es el
perfil y se detiene si no es la de Rizos.

**El orden no es casual: primero los assets, de último el `index.html`.** El index nombra los assets
por su hash; si subiera primero habría unos segundos en los que una clienta recibe el index nuevo y
pide un `.js` que todavía no existe.

**Y se sube cada cosa con su `Cache-Control`**, que hasta ahora los objetos no traían. Los assets
llevan el hash en el nombre, así que son inmutables para siempre; el `index.html` se revalida cada
vez. De ahí en adelante la invalidación es por si acaso, no el único camino.

Las banderas van después de `--`, así: `npm run deploy -- -Prueba`.

| Bandera | Para qué |
|---|---|
| `-Prueba` | No sube ni invalida nada: lista lo que haría. Úsalo si dudas. |
| `-SaltarBuild` | Usa el `dist/` que ya está, sin volver a compilar. |
| `-Limpiar` | Borra del bucket los assets que ya no están en `dist/`. |
| `-NoEsperar` | No se queda esperando a que CloudFront termine de invalidar. |

`-Limpiar` no viene prendido porque borrar los assets viejos rompe a la clienta que tiene la página
abierta y todavía no ha pedido su `.js`. Dejarlos pesa poco; cuando el bucket junte basura, se corre
una vez con `-Limpiar`.

### Por qué no hay CI

Se dejó por fuera a propósito, no por falta de tiempo. Las llaves de este perfil son de
administrador de la cuenta entera: ponerlas en los secretos de GitHub Actions es darle a CI el poder
de borrar cualquier cosa de la cuenta. Si se quiere desplegar al mergear, el primer paso no es
escribir el workflow sino crear un usuario —o mejor, un rol por OIDC— que solo pueda escribir en ese
bucket e invalidar esa distribución. Con eso hecho, el workflow es corto y este script sigue
sirviendo para desplegar a mano.

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
