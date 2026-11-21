# API de autoagendamiento — contrato

La web de autoagendamiento (este repo) no habla con la agenda directamente. Habla con un módulo
público del Backend de appagenda, `app/selfbooking/`, montado en `/public/agendamiento`.

Este documento es el contrato entre los dos. Se escribe acá porque el frontend se construye contra
él; la implementación vive en `appagenda/Backend/app/selfbooking/`.

---

## Por qué un módulo en appagenda y no un BFF

De los 174 endpoints de la agenda solo `GET /scheduling/services/` es público. Todo lo que el flujo
necesita —disponibilidad, buscar cliente, crear cliente, pre-reservar, crear cita— va con `Bearer`.
Un token de servicio en el navegador le da a cualquiera, con abrir devtools, la agenda entera:
clientes, finanzas, comisiones, inventario. Así que hace falta una pieza de servidor sí o sí.

Esa pieza va donde están los datos, por tres razones concretas:

1. **Los cupos libres no se pueden pedir, hay que calcularlos.** `GET /scheduling/quotes/disponibilidad`
   devuelve las horas **ocupadas**, y solo los inicios. Los cupos reales son
   `turno del profesional − bloqueos − citas no canceladas`, recortados por la duración total del
   servicio. Magic Horse ya lo construyó por fuera (`app/booking/freeslots.py`) y le costó un
   incidente real de doble agendamiento. Construirlo una tercera vez en TypeScript sería la tercera
   implementación de la misma lógica crítica.

2. **`POST /scheduling/quotes/` no valida horarios.** Las validaciones de turno, bloqueo y solape
   están dentro de literales `"""..."""` en `routes_quotes.py:628-687`, con un `dia_info` fijo de
   09:00–18:00 puesto en medio para que el correo no se rompa. Quien escribe la cita es lo único que
   evita un doble agendamiento. Desde adentro eso se puede cerrar de verdad, en la misma transacción
   que escribe.

3. **Una sola verdad de disponibilidad.** El agente de WhatsApp y la web ofrecen los mismos cupos, o
   tarde o temprano se pisan.

---

## Reglas generales

- Prefijo: `/public/agendamiento`. Sin autenticación.
- **La sede va en la ruta, como apodo.** Desde el 2026-11-19 cada sede tiene su URL pública
  —`citas.rizosfelices.co/sabaneta`— y ese primer segmento viaja en todas las llamadas:
  `/public/agendamiento/sabaneta/catalogo`. La única que no cuelga de una sede es `GET /sedes`,
  que es la que las lista.

  Lo que viaja es el **apodo**, nunca el `sede_id`. `AUTOAGENDAMIENTO_SEDES` dice qué apodo
  corresponde a qué sede (`SD-88809:suramericana,SD-89958:sabaneta,…`) y un apodo que no esté en
  esa lista responde 404 sin tocar Mongo. La diferencia con aceptar un `sede_id` no es cosmética:
  el `sede_id` es la llave con la que se leen citas, horarios y clientas en toda la agenda, y el
  apodo solo significa algo a través de la lista. Si alguien pasa el parámetro de la ruta a una
  consulta sin traducir, no encuentra nada en vez de encontrar la sede equivocada. El `sede_id` no
  sale en ninguna respuesta.

  El 404 es el mismo para "esa sede no existe" y para "esa sede no agenda por web", a propósito:
  dos mensajes distintos le contarían a cualquiera que teclee nombres de ciudad qué sedes tiene la
  cadena y cuáles tienen autoagendamiento.
- Nada de este módulo devuelve datos de otra persona. En particular, al reconocer a una clienta
  existente responde `clienteReconocido: true` y **nunca** su nombre, correo, teléfono ni historial:
  si no, el endpoint sería un oráculo para comprobar si un número está en la base.
- Rate limit por IP: 60 lecturas/min, 10 retenciones/10 min, 5 citas/hora.
- Fechas `YYYY-MM-DD`, horas `HH:MM` 24h, zona `America/Bogota`. Dinero en enteros COP.
- Errores: `{ "error": { "codigo": "...", "mensaje": "..." } }` con el `mensaje` ya redactado para
  mostrárselo a la clienta tal cual.

### Códigos de error

| Código | HTTP | Cuándo |
|---|---|---|
| `cerrado` | 200 | No es error: va en `motivo` de disponibilidad |
| `cupo_tomado` | 409 | El slot se ocupó entre que se vio y se pidió |
| `retencion_vencida` | 410 | La retención expiró antes de confirmar |
| `datos_invalidos` | 400 | Validación de formulario |
| `servicio_no_disponible` | 400 | `servicioId` inexistente, inactivo o de otra sede |
| `demasiadas_solicitudes` | 429 | Rate limit |
| `sede_no_disponible` | 404 | El apodo de la ruta no está en `AUTOAGENDAMIENTO_SEDES` |
| `agenda_no_disponible` | 503 | Falló la lectura de la agenda. **Nunca** se degrada a "no hay cupos" |

> Un fallo de lectura jamás se traduce a lista vacía. Decir "no hay cupos" cuando en realidad no se
> pudo leer el horario es lo que hace que una clienta se vaya creyendo que el salón está lleno.

---

## `GET /sedes`

Qué sedes agendan por internet. Es la única llamada del módulo que no cuelga de una sede, y la
primera que hace la web: con ella traduce el apodo de la URL antes de montar el router.

**La web nunca pinta esta lista.** Hubo una pantalla que la mostraba para elegir y se quitó el
mismo día: ofrecer una lista de sedes es ofrecer agendar en la equivocada, que es justo lo que una
URL por sede vino a evitar. La web tiene una sola pantalla y es la de la sede; quien llega sin
apodo —o con uno que no es de nadie— entra a la **primera** de la lista. El endpoint existe para
traducir el apodo, no para mostrarse.

```json
{
  "sedes": [
    { "slug": "suramericana", "nombre": "Suramericana", "ciudad": "Medellín" },
    { "slug": "sabaneta", "nombre": "Sabaneta", "ciudad": null }
  ]
}
```

El orden es el de `AUTOAGENDAMIENTO_SEDES` y **la primera tiene un papel**: es la sede que atiende
a quien entra sin apodo. Hoy es Suramericana. Que eso sea una variable de entorno y no una
constante del frontend es lo que deja cambiarlo sin desplegar la web.

`nombre` ya viene listo para pintar. En la colección las sedes se llaman `RF CALI NORTE`, que está
escrito para la agenda interna; acá sale `Cali Norte`. Lo que operación escriba en
`autoagendamiento.nombre_publico` le gana a esa limpieza, que es lo que hace falta para `Niquía` o
para cualquier nombre con tilde.

`ciudad` es nullable y se pinta solo si está: la portada dice "Sede Cali Norte · Cali" o "Sede
Sabaneta", sin separador colgando.

Una sede habilitada que no exista en la colección se cae de la lista, con un log. Responder 503
dejaría el sitio entero sin portada por una sede mal escrita en una variable de entorno.

---

## `GET /{sede}/config`

Todo lo que hoy está quemado en `src/config/business.ts` y debería salir de la agenda.

```json
{
  "sede": {
    "slug": "suramericana",
    "nombre": "Suramericana",
    "ciudad": "Medellín",
    "direccion": "…",
    "telefono": "…"
  },
  "moneda": "COP",
  "abono": { "porDefecto": 50000, "porCategoria": { "Colorimetria": 90000 } },
  "whatsapp": "573001112233",
  "pagos": {
    "cuenta": "36000000929",
    "banco": "Bancolombia",
    "titular": null,
    "llave": "@rfsuramericana",
    "link": null
  },
  "politicas": { "reprogramacion": "…" },
  "agenda": {
    "diasMaximos": 16,
    "anticipacionMinimaMinutos": 60,
    "pasoMinutos": 60,
    "retencionMinutos": 10
  }
}
```

### Lo que es de cada sede

`whatsapp`, `pagos`, `politicas` y el `nombre`/`ciudad` salen del documento de la sede, bajo
`autoagendamiento`. Son datos de cada una: la cuenta de Cali no es la de Suramericana y el abono
cae en cajas distintas.

**`pagos` son las filas de la pantalla del abono**, y `null` no es "vacío" sino "esta forma de
pago no se ofrece": su fila no se pinta.

`banco` y `titular` acompañan a `cuenta` y los dos son nullables. El banco **no** se escribe en la
copia de la web: de las seis cuentas que hay, El Restrepo recauda en Caja Social y Rionegro en NU.
Un número de un banco tecleado en otro no falla por inválido —son 11 dígitos en varios— y puede
caer en una cuenta ajena que exista con ese número, con la clienta llegando al salón con el
comprobante de una plata que nadie recibió. Sin `banco`, la fila dice "Transferencia" y no promete
ninguno. `titular` se pinta porque son cuentas a nombre de una persona: la app del banco le muestra
ese nombre antes de confirmar, y verlo antes en la pantalla es lo que separa comprobar un dato de
desconfiar de la transferencia. Una sede a la que nadie le ha cargado la cuenta devuelve
los tres en `null` y llega al abono sin dónde pagar. Es a propósito. El respaldo fácil era la
cuenta de Suramericana, que es la que existe, y eso mandaría el abono de Cali a la caja de Medellín
sin que nada se vea raro hasta que alguien cuadre caja. **Regla: una sede no entra a
`AUTOAGENDAMIENTO_SEDES` hasta que su documento tenga su cuenta.**

`whatsapp` es nullable por lo mismo, en menor escala: el de otra sede manda a la clienta de Cali a
escribirle a Medellín. En `null`, la web cae a su número de marca.

El **abono** no se parte por sede, al contrario que lo anterior: cuánto se aparta para reservar es
una regla de la cadena, y las ocho sedes abiertas facturan en pesos con el mismo catálogo. Un valor
por sede serían ocho copias del mismo número esperando a desincronizarse. Eso cambia el día que
entre una sede en otra moneda.

`ciudad`, `direccion` y `telefono` son nullables. La `ciudad` sale de `autoagendamiento.ciudad` y
no de la dirección: derivarla sería adivinar, y ya pasó una vez — el agente le dijo Bucaramanga a
una clienta de una sede de Medellín.

`anticipacionMinimaMinutos` y `pasoMinutos` se toman de los valores que Magic Horse ya ajustó contra
clientas reales: 60 y 60. A 15 minutos la web ofrecería catorce horas seguidas, que se lee como una
máquina listando un arreglo y no como un salón ofreciendo horas.

---

## `GET /{sede}/catalogo`

Los servicios agendables de la sede, con los ejes del nombre ya interpretados.

```json
{
  "servicios": [
    {
      "servicioId": "SV-74469",
      "nombre": "COMPLETO MEDIA P.A",
      "categoria": "Plasticidad Alta",
      "duracionMinutos": 90,
      "precio": 145000,
      "ejes": { "familia": "COMPLETO", "densidad": "Media", "plasticidad": "alta", "afro": false, "nino": false }
    }
  ]
}
```

- Se lee de `admin/servicios/`, **no** de `scheduling/services/`: el segundo devuelve los 173 de
  todas las franquicias, incluidas las de México y Ecuador. Los de Rizos Colombia son los 96 de
  `franquicia_id: "FQ-11199"`.
- Se excluye `activo === false`.
- **Se excluye lo que no presta NADIE en esa sede.** El Restrepo no hace colorimetría: sus
  estilistas tienen esos servicios en `servicios_no_presta`, y un servicio que está en la lista de
  todas se cae del catálogo. Una categoría entera desaparece sola cuando se queda sin un solo
  servicio, porque el menú se arma con lo que llega.

  Sale del dato que la sede ya mantiene en el panel de estilistas, así que contratar o soltar a
  alguien cambia la web sin que nadie toque la web. Lo que se consulta es el mismo plantel y el
  mismo resolvedor por sede que usa `leer_profesionales` —`_plantel_de_la_sede`,
  `servicios_no_presta_en`— a propósito: si el catálogo y la disponibilidad usaran reglas distintas,
  la web ofrecería un servicio que después no tiene con quién agendarse.

  El filtro se abstiene en tres casos, y los tres son el mismo criterio: un catálogo de más termina
  en "no hay cupos" en la pantalla de la fecha, que se entiende; uno vacío no se distingue de un
  sitio roto. No filtra si no pudo leer el plantel, si la sede no tiene ni una estilista activa
  —casi siempre es un `activo: false` mal puesto, como le pasó a Niquía— o si el resultado se
  quedaría sin un solo servicio.

  Una lista de exclusiones vacía significa "sin restricción registrada", que es indistinguible de
  "sin configurar": esa estilista presta todo. Así que **basta una recién creada, o una de prueba,
  para que no se oculte nada.** Es la dirección segura del error, pero hay que saberla: en El
  Restrepo una `prueba1` activa sostenía los 91 servicios ella sola.
- `ejes` sale de parsear el nombre, igual que `magic-horse/app/booking/service_families.py`:
  densidad `EXTRA BAJA|BAJA|MEDIA|ALTA|EXTRA ALTA`, plasticidad `P.A|P.B`, `AFRO`, `NIÑO|NIÑA`, y el
  prefijo `X ` de reasignación interna. `familia` es el nombre sin esos modificadores.
- `precio` es `precios[moneda de la sede]`. Un servicio sin precio en esa moneda no se devuelve: la
  agenda rechazaría la cita al crearla, así que ofrecerlo sería ofrecer un callejón sin salida.
- **El eje no es decorativo.** `COMPLETO MEDIA P.A` (90 min, $145.000) y `COMPLETO MEDIA P.B`
  (150 min, $175.000) son servicios distintos con precio y duración distintos. El diagnóstico de
  densidad y plasticidad de la web es justamente lo que elige entre ellos.

### Equivalencia con el catálogo curado

`src/data/catalog.ts` es presentación: nombres y descripciones pensados para la clienta. El mapeo a
`servicioId` vive en `src/data/serviceMap.ts` y la **duración y el precio siempre salen del catálogo
de la agenda**, nunca de los rangos del catálogo local.

| Curado | Familia real | Eje |
|---|---|---|
| `full` | `COMPLETO` | densidad × plasticidad (+ afro) |
| `definicion` → `def-det` | `SOLO DEFINICION` | solo densidad |
| `definicion` → `def-exp` | `DEFINICION EXPRESS` | sin ejes |
| `corte` | `CORTE FORMA` | sin ejes |
| `transicion` | `TRANSICION` | densidad (+ afro) |
| `color` | `COLOR DIRECTO` / `COLOR` / `COLOR CON DISEÑO` | sin ejes |
| `tratamiento` | `OZONOTERAPIA` | sin ejes |
| `maquillaje` | `MAQUILLAJE` | sin ejes |

`P.A` = el rizo se forma solo (`easy: true`), `P.B` = necesita ayuda (`easy: false`).

> **Pendiente con operación.** Los precios del catálogo curado no cuadran con los de la agenda.
> Ejemplos: Peinados figura en $120.000 y en la agenda `PEINADOS` (SV-91564) está en $30.000;
> Ozonoterapia figura en $150.000 / 1h30 y `OZONOTERAPIA` (SV-23393) está en $130.000 / 60 min; el
> Full "se forma solo" se anuncia como $145.000–$190.000 y la escalera `COMPLETO … P.A` va de
> $121.000 a $197.000. La web muestra el precio de la agenda, que es el que se cobra y se factura, y
> los rangos del catálogo curado quedan solo como "desde" de la tarjeta hasta que operación los
> actualice. No hay forma de resolver esto desde el código: son dos listas de precios distintas.

---

## `GET /{sede}/profesionales?servicioIds=SV-1,SV-2`

```json
[{ "profesionalId": "P-123", "nombre": "Laura" }]
```

Las profesionales activas de la sede que **sí** prestan todos los `servicioIds` pedidos. La agenda
guarda lo contrario —`servicios_no_presta`, la lista de los que *no* hace— así que se excluye a quien
tenga alguno de los pedidos en esa lista. Una lista vacía significa "sin restricción registrada", que
es indistinguible de "sin configurar": se trata como ausencia de evidencia, nunca como "hace todo".

Solo id y nombre. Ni correo, ni teléfono, ni comisiones, ni estadísticas.

---

## `GET /{sede}/disponibilidad?fecha=&servicioIds=&profesionalId=`

```json
{
  "fecha": "2026-10-15",
  "duracionMinutos": 150,
  "motivo": "ok",
  "cupos": [{ "hora": "09:00" }, { "hora": "10:00" }]
}
```

`motivo` es `ok` | `sin_profesional` | `sin_horario` | `cerrado` | `lleno`, en ese orden de
precedencia. Una lista vacía de `cupos` significa cuatro cosas distintas y el frontend muestra un
mensaje distinto para cada una; nunca se interpreta sola.

| | Qué pasó | Qué ve la clienta |
|---|---|---|
| `sin_profesional` | Nadie presta ESE bloque de servicios | "Ningún profesional presta todos los servicios que elegiste" |
| `sin_horario` | Hay quién, pero nadie tiene turnos cargados | "Esta sede todavía no tiene horarios publicados" + WhatsApp |
| `cerrado` | Tienen turnos, pero ninguna trabaja ese día | "La sede no abre ese día" |
| `lleno` | Trabajan y no queda hueco | "No quedan horas libres ese día. Prueba con otro" |

Separar los dos primeros no es cosmético: `sin_horario` falla **todos** los días, así que mandarla
a "prueba con otro día" es mandarla a perder el rato. Es el estado real de una sede recién abierta
—El Restrepo, a 2026-11-21— y por eso ese mensaje la manda al WhatsApp y no al calendario.

`duracionMinutos` es la suma de las duraciones de los `servicioIds` — el bloque completo tiene que
caber, no solo el primer servicio.

Cálculo, por cada profesional candidata:

```
libre(profesional, fecha) =
      turno de ese día de la semana       GET /scheduling/schedule/stylist/{id}
    − bloqueos que ocluyen esa fecha      GET /scheduling/block/{id}
    − citas reales, usando su hora_fin    GET /scheduling/quotes/?sede_id=&fecha=
    − pre-reservas vigentes
    recortado por duracionMinutos, pasos de pasoMinutos
```

- Las citas **canceladas no ocupan**: la agenda las conserva con `estado: "cancelada"` en vez de
  borrarlas, y sin filtrarlas el cupo quedaría ocupado para siempre. Se excluyen por lista negra
  (solo `cancelada`), no por lista blanca: ante un estado que nadie ha mirado todavía, la dirección
  segura es bloquear, no liberar.
- Se usa `hora_fin` de la cita, nunca una duración recalculada: las estilistas ajustan los finales
  reales.
- Sin `profesionalId`, `cupos` es la **unión** de los cupos de todas las candidatas. Qué profesional
  queda asignada se resuelve al retener, no al mostrar.
- No se ofrece nada que empiece antes de `ahora + anticipacionMinimaMinutos`.

## `GET /{sede}/disponibilidad/dias?desde=&hasta=&servicioIds=`

```json
[{ "fecha": "2026-10-15", "hayCupo": true }]
```

Para que el selector de días pinte en gris los días sin cupo en vez de dejar que la clienta los
descubra uno por uno. `hasta − desde` tope `diasMaximos`.

---

## `POST /{sede}/retencion`

```json
{ "fecha": "2026-10-15", "hora": "10:00", "servicioIds": ["SV-74469"], "profesionalId": null }
```

→ `201`

```json
{ "retencionId": "…", "profesionalId": "P-123", "profesionalNombre": "Laura", "expiraEn": "2026-10-15T15:10:00Z" }
```

`profesionalNombre` es nullable: una ficha sin nombre registrado existe, y la web simplemente no
muestra la fila "Con".

Elige una profesional libre (la de menos carga ese día, para repartir) y retiene el **bloque
completo**, no solo la hora de inicio. Internamente reusa `POST /scheduling/quotes/pre-reservar`,
pero como ese endpoint solo compara `hora_inicio` exacta, el módulo retiene además cada paso que el
bloque cubre: sin eso, una retención de las 10:00 dejaría las 10:30 libres para otra clienta con un
servicio de 2h.

`409 cupo_tomado` si ya no hay nadie libre. El frontend recarga la disponibilidad del día.

## `DELETE /{sede}/retencion/{id}`

Para cuando la clienta se devuelve en el flujo. Idempotente: una retención ya vencida o inexistente
responde `204` igual.

---

## `POST /{sede}/cita`

```json
{
  "retencionId": "…",
  "servicioIds": ["SV-74469", "SV-86926"],
  "contacto": { "nombre": "María Pérez", "celular": "3001234567", "correo": "maria@…" },
  "notas": "Diagnóstico: densidad Media · el rizo se forma solo"
}
```

→ `201`

```json
{
  "citaId": "…",
  "estado": "pre_reservada",
  "fecha": "2026-10-15",
  "hora": "10:00",
  "duracionMinutos": 110,
  "profesionalNombre": "Laura",
  "total": 175000,
  "abono": 50000,
  "clienteReconocido": true
}
```

### Identificación de la clienta

Igual que el agente (`magic-horse/app/booking/client_resolution.py`), en este orden:

1. **Celular.** `GET /clientes/todos?filtro=` quita los no-dígitos y hace *substring* contra lo
   guardado, así que una consulta **más larga** nunca encuentra un valor **más corto**. Los teléfonos
   en la base están mezclados: nacionales (`3507804107`), E.164 sin `+` (`573152432246`) e
   internacionales. Se busca con la forma nacional de 10 dígitos —la más corta razonable— para que
   encuentre a la clienta esté guardada con indicativo o sin él. Un `57` + 10 dígitos se colapsa a
   los 10; cualquier otra longitud se deja igual, porque tomar "los últimos 10" destroza un número
   extranjero de verdad.
2. **Correo**, exacto y en minúsculas, si el celular no dio nada.
3. **Nombre + correo** juntos, nunca el nombre solo.

Si varias coinciden, gana la de `ultima_visita` más reciente, y con empate la de más `total_visitas`.

Si no aparece ninguna, se crea con `POST /clientes/` (`nombre`, `telefono`, `correo`, `sede_id`).

> **Un fallo de búsqueda nunca cae a crear.** Que la búsqueda falle no dice nada sobre si la clienta
> existe, y `POST /clientes/` **no deduplica del lado del servidor**: cada match fallido es un
> cliente duplicado en el CRM real. Ante un error de lectura se responde `503 agenda_no_disponible`.

### Qué se escribe

Antes de escribir se **revalida el cupo** contra la agenda: entre que se retuvo y se confirmó pudo
entrar una cita por la agenda de la sede, que no mira las retenciones.

```jsonc
{
  "cliente_id": "…",
  "profesional_id": "…",      // el de la retención
  "sede_id": "SD-88809",
  "servicios": [{ "servicio_id": "SV-74469" }],  // sin precio_personalizado: manda el de la agenda
  "fecha": "2026-10-15",
  "hora_inicio": "10:00",
  "hora_fin": "11:50",        // inicio + suma de duraciones
  "estado": "pre_reservada",
  "abono": 0,
  "origen": "web"
}
```

- `abono: 0` y `estado: "pre_reservada"`. La cita queda esperando el comprobante; la sede la pasa a
  confirmada cuando lo recibe y registra el pago por `POST /scheduling/quotes/citas/{id}/pago`, que
  además escribe la nota automática (`la_nota_del_pago_aplica("SD-88809")` ya es `True`).
- `origen: "web"` **requiere agregar `"web"` a `ORIGENES_CONOCIDOS`** en
  `appagenda/Backend/app/scheduling/utils.py`. Hoy la lista solo tiene `"agente"` y `origen_valido()`
  descarta en silencio lo que no reconoce: sin ese cambio las citas de la web quedan sin origen y no
  hay forma de contarlas.
- No se manda `precio_personalizado`. El precio lo pone la agenda, que es la que factura.
- La agenda manda sola el correo de confirmación a `cliente.correo`. Ese es el otro motivo del campo
  de correo en el formulario: sin él la clienta no recibe nada.
- La retención se libera después de escribir, no antes.

---

## La vía rápida de la clienta que vuelve

Una clienta de salón vuelve cada 6 a 10 semanas, y hoy repite el flujo largo entero —menú,
diagnóstico, opciones, detalle, complementos— para pedir exactamente lo mismo de la vez pasada.
`POST /clienta/historial` existe para que ese caso sea un toque.

### `POST /{sede}/clienta/historial`

Recibe el mismo `contacto` que `POST /cita`:

```jsonc
{ "nombre": "Juanita Restrepo", "celular": "3001234567", "correo": "juanita@ejemplo.com" }
```

Va por POST y no por GET con el contacto en la query: el celular y el correo no tienen nada que
hacer en una URL, que queda en el historial del navegador y en los logs de cualquier proxy.

La clienta se identifica con `buscar_cliente`, **la misma función que usa `POST /cita`** —celular,
después correo, después nombre + correo—, para que a quien se le muestra el historial sea
exactamente la misma a la que se le pegaría la cita.

```jsonc
{
  "reconocida": true,
  "nombre": "Juanita Restrepo",
  "ultimaVisita": "2026-08-14",
  "diagnostico": { "densidad": "Media", "plasticidad": "alta" },
  "frecuentes": [                       // máximo 3, por veces y luego por recencia
    {
      "servicioIds": ["SV-74469", "SV-71715"],   // el principal primero, igual que al crear la cita
      "servicios": [ /* el servicio completo de /catalogo, uno por id */ ],
      "etiqueta": "COMPLETO MEDIA P.A + OZONOTERAPIA COMBO",
      "veces": 3,
      "ultimaVez": "2026-08-14",
      "duracionMinutos": 130,
      "precio": 244000,
      "abono": 50000,
      "profesionalId": "P-10",
      "profesionalNombre": "Laura"
    }
  ]
}
```

### El nombre tiene que concordar

Con el celular solo, cualquiera probando números averiguaría quién es clienta de Rizos y qué se
hace en el pelo. Así que el servidor exige además que el nombre tecleado concuerde con el guardado.

La comparación es floja a propósito: sin tildes, en minúsculas, y basta con que compartan una
palabra que identifique a alguien —los conectores (`de`, `la`, `del`…) no cuentan—. La base real
tiene "Juanita", "Juanita Restrepo" y "Juanita Restrepo Gómez" para la misma persona, y exigir la
cadena completa dejaría sin atajo justo a las clientas de siempre. Si la ficha no tiene nombre
guardado se deja pasar: es un hueco del CRM, y negarle el atajo a la clienta sería castigarla por un
dato que no llenó ella.

Es un apretón, no una autenticación: quien tenga el número **y** el nombre pasa. El límite por IP va
aparte y es el más estrecho del módulo (`AUTOAGENDAMIENTO_LIMITE_HISTORIALES`, 10/hora), porque cada
intento es un contacto distinto probándose contra la base de clientas.

Para cerrarlo de verdad hace falta un **pase firmado** viajando en el enlace del correo de
confirmación y en el WhatsApp del agente: reconoce sin que la clienta teclee nada, en cualquier
dispositivo, y convierte el mensaje de retención de las 8 semanas en un toque hasta la fecha. Es lo
que sigue, y no está hecho.

### Lo que no se devuelve, teniéndolo a mano

- **Nada cuando no concuerda.** `reconocida: false` con todo vacío es la misma respuesta para "no
  está en la base" y para "está pero el nombre no concuerda". Distinguirlas por el cuerpo volvería a
  delatar quién está registrada.
- **Ni precio pagado, ni abono anterior, ni notas de la estilista.** Nada de eso hace falta para
  volver a agendar, y todo eso sí hace daño si el endpoint se equivoca de clienta.
- **Solo esta sede.** Ofrecer en Suramericana un servicio que se hizo en otra sede es ofrecer algo
  que acá quizá no se presta.

### Qué cuenta como historial

- **Fuera las canceladas y las "no asistió".** Ofrecer "repite lo de siempre" con una cita que no
  ocurrió es recordarle algo que no hizo. Es lista negra, igual que `ESTADOS_QUE_NO_OCUPAN`: ante un
  estado que nadie ha mirado todavía, se cuenta. Una cita de más es ruido; una de menos es la
  clienta que no ve su servicio de siempre.
- **Fuera las futuras.** Proponerle repetir lo que ya tiene para el jueves es el camino a dos citas
  iguales en la misma semana.
- **Fuera lo que esta sede no presta.** Se filtra contra el catálogo vivo —que además se recorta
  por plantel— así que un bloque de color no se le ofrece en una sede donde nadie hace color. Sería
  un atajo que falla en el último paso.
- **La unidad es la combinación, no el servicio.** "Full + Ozonoterapia" y "Full solo" son dos
  bloques distintos, porque son dos citas distintas de pedir y de cobrar.
- **Ventana de 18 meses** (`AUTOAGENDAMIENTO_HISTORIAL_MESES`): unas ocho o nueve citas de salón.
### La clienta es de la cadena; la estilista, de la sede

Las citas se leen de **todas las sedes**. Una clienta de años en Suramericana entraba a El Restrepo
y la web no sabía nada de ella: ni qué pide siempre, ni cómo es su cabello. Eso no era una regla,
era el recorte de cuando había una sola sede.

Lo que hace que funcione hoy y no antes es que **el catálogo web es el mismo en las ocho**: la
semilla sembró los 91 servicios en cada una, con un documento —y un id— por sede. Su
`COMPLETO MEDIA P.A` de allá es el mismo servicio que el de acá con otro id, y se emparejan por
nombre (`equivalencias_por_nombre`, sin tildes ni mayúsculas). Un nombre repetido en el catálogo no
se empareja con ninguno: elegir cuál sería elegir por el salón.

Qué cruza y qué no:

| | |
|---|---|
| El **diagnóstico** (densidad, plasticidad) | **Cruza.** Su cabello es el mismo en Medellín y en Cali. |
| **Lo que suele pedir** | **Cruza**, emparejado por nombre, y se cae si esta sede no lo presta. |
| **La última visita** | **Cruza**, para que no contradiga a los bloques. |
| **La profesional de siempre** | **No cruza.** Trabaja donde trabaja. |

El `profesional_id` de una cita de otra sede se borra antes de agrupar
(`profesionales_solo_de_esta_sede`), no al resolver el nombre al final: así no llega nunca a la
respuesta. La web ya lo ignoraba —exige también el nombre— pero el agente de WhatsApp lee el id.

Dos detalles más:

- Va sobre **todas las fichas del mismo teléfono**, no solo sobre la que ganó el desempate. Una
  clienta que estrena sede es justamente el caso donde su ficha de allá y la de acá son dos
  documentos distintos.
- El diagnóstico se lee de las **citas** y sus ejes de la colección, no del catálogo de la sede: un
  COLOR que acá no se presta igual dice de qué densidad es su cabello. Antes salía de los tres
  bloques ofrecibles, así que una clienta cuyo servicio de siempre no estuviera en este catálogo se
  quedaba sin diagnóstico aunque sus citas lo dijeran.

Si la lectura de los ejes falla, `diagnostico` sale en `null` y la web vuelve a preguntar — que es
lo que hacía antes de que esto existiera. Tumbar la identificación por el diagnóstico le costaría
la cita.

Medido contra producción, clientas reales de Suramericana identificándose en El Restrepo: **cuatro
de cinco llegan con su "repite lo de siempre"** y cuatro de seis con el diagnóstico resuelto, donde
antes no llegaba ninguna.

### Por qué la respuesta trae más de lo que la web usa

La web usa los `servicioIds` y repinta precio y duración contra `/catalogo`, que es su única fuente:
mostrar el valor de agosto en octubre es prometer algo que la cita no va a cobrar.

`servicios`, `etiqueta`, `precio` y `diagnostico` están para el **agente de WhatsApp**, que no tiene
catálogo cargado. Con una sola llamada puede decir "¿te hago el Servicio Full con ozonoterapia,
$244.000, como en agosto?" sin encadenar otra consulta, y con `diagnostico` ya resuelto no tiene que
pedirle a la clienta que se mire el pelo por chat para elegir el escalón correcto de una familia.

---

## Qué cambia en appagenda

| Archivo | Cambio |
|---|---|
| `app/selfbooking/` | Módulo nuevo: `routes.py`, `catalogo.py`, `freeslots.py`, `clientes.py`, `retencion.py`, `ratelimit.py`, `historial.py` |
| `app/selfbooking/historial.py` | De las citas pasadas a los bloques que se le ofrece repetir. Lógica pura, con pruebas |
| `app/core/config.py` | `include_router(selfbooking_router)` y el origen de la web en CORS |
| `app/scheduling/utils.py` | `"web"` en `ORIGENES_CONOCIDOS` |
| `.env` | `AUTOAGENDAMIENTO_SEDE_ID=SD-88809`, `AUTOAGENDAMIENTO_ORIGENES_CORS=…` |

Las validaciones comentadas de `crear_cita` se dejan como están: tocarlas afecta a las 17 sedes y a
todos los clientes de la API. El módulo valida por su cuenta antes de escribir, que es lo que ya hace
Magic Horse.
