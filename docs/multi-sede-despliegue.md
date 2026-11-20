# Multi-sede: qué falta para prenderlo

> Estado al 19 de noviembre de 2026. El código está escrito y probado; lo que
> queda es desplegar, y hay un orden que importa.

Ocho sedes agendan por web, cada una en su URL:

| Sede | URL | `sede_id` |
|---|---|---|
| Suramericana | `citas.rizosfelices.co/suramericana` | `SD-88809` |
| El Restrepo | `citas.rizosfelices.co/restrepo` | `SD-28904` |
| Cali Norte | `citas.rizosfelices.co/cali-norte` | `SD-22094` |
| Cali Sur | `citas.rizosfelices.co/cali-sur` | `SD-18821` |
| Sabaneta | `citas.rizosfelices.co/sabaneta` | `SD-89958` |
| Rionegro | `citas.rizosfelices.co/rionegro` | `SD-36145` |
| Niquía | `citas.rizosfelices.co/niquia` | `SD-26470` |
| Apartadó | `citas.rizosfelices.co/apartado` | `SD-49436` |

**La web tiene una sola pantalla y es la de la sede.** No hay lista para
elegir ni pantalla intermedia: una lista es una invitación a elegir mal, y la
clienta que no está segura toca la primera y la cita queda en otra ciudad.

Quien entre a `citas.rizosfelices.co` a secas, o con un enlace que no
corresponde a ninguna sede, entra a la **primera de `AUTOAGENDAMIENTO_SEDES`**
—hoy Suramericana— y la URL se corrige sola. Por eso el orden de esa variable
sí importa: la primera es la sede que atiende a quien llega sin enlace.

Los enlaces viejos siguen sirviendo: `citas.rizosfelices.co/entrar` termina en
`/suramericana/entrar`, en el mismo paso de siempre.

---

## Lo que ya está hecho

**En la base, aplicado el 2026-11-19.** No hay que volver a correrlo.

- El catálogo web sembrado en las siete sedes nuevas: 91 servicios cada una,
  con sus ejes, su precio y su duración. Sin esto la web las mostraría sin un
  solo servicio, porque el backend corre con
  `AUTOAGENDAMIENTO_SOLO_CATALOGO_WEB=true`.
- El `nombre_publico` y la `ciudad` de las ocho, en
  `branch.<sede>.autoagendamiento`. Es lo que la portada pinta: "Sede Cali
  Norte · Cali".
- La cuenta de Suramericana movida ahí también, desde donde estaba quemada en
  el frontend.

**En la base, aplicado el 2026-11-20.**

- El recaudo de cinco sedes más —El Restrepo, Sabaneta, Apartadó, Niquía y
  Rionegro— en `branch.<sede>.autoagendamiento.pagos`, con `banco` y
  `titular`. Falta Cali Norte y Cali Sur.

**En código, sin desplegar.**

| Repo | Rama | Qué |
|---|---|---|
| `appagenda` | `feat/autoagendamiento-multisede` | `GET /sedes`, todas las rutas bajo `/{apodo}`, la cuenta por sede. 525 pruebas en verde. |
| `agendaonline` | `feat/una-url-por-sede` | El router por sede, la pantalla de la raíz, la cuenta leída de `/config`. |

---

## El orden, que no es negociable

**Primero el backend, después la web.** La web nueva llama a
`/public/agendamiento/sabaneta/catalogo`; contra el backend de hoy eso es un
404 y la pantalla queda en el error de carga. Al revés no pasa nada: el
backend nuevo con la web vieja sigue atendiendo Suramericana igual, porque sin
`AUTOAGENDAMIENTO_SEDES` la lista blanca cae a `AUTOAGENDAMIENTO_SEDE_ID` y es
exactamente la configuración de siempre.

Eso da una ventana cómoda: se puede subir el backend un día, verificar que
Suramericana sigue andando, y subir la web después.

### 1 · Backend (appagenda)

1. Mergear `feat/autoagendamiento-multisede`.
2. En Railway, servicio **`previewapi`**, agregar la variable:

   ```
   AUTOAGENDAMIENTO_SEDES=SD-88809:suramericana,SD-28904:restrepo,SD-89958:sabaneta,SD-36145:rionegro,SD-26470:niquia,SD-49436:apartado
   ```

   El formato es `id:apodo`, separado por comas. **La primera es la que
   atiende a quien llega sin enlace**, así que Suramericana va de primera.
   Quitar una sede de la lista la apaga sin desplegar nada: su URL deja de
   existir y cae en la primera.

   **Cali Norte y Cali Sur no están en esa lista todavía**, por la regla de
   más abajo: no tienen cuenta. Cuando lleguen se agregan al final —
   `,SD-22094:cali-norte,SD-18821:cali-sur`— y basta reiniciar.

3. **Darle Redeploy a mano.** Railway tiene `watchPatterns: ["Dockerfile"]`,
   así que un merge que solo toca código aparece como **SKIPPED** y no sube
   nada. Sin ese botón, el merge no existe.

   Ojo: ese Redeploy también se lleva lo que esté en `main` sin desplegar. Ver
   `appagenda/DESPLIEGUE-PENDIENTE.md`.

4. Comprobar: `GET https://previewapi.rizosfelices.co/public/agendamiento/sedes`
   tiene que devolver las seis de la lista.

### 2 · Web (agendaonline)

1. Mergear `feat/una-url-por-sede`.
2. `npm run deploy` (compila, sube a S3 e invalida CloudFront).

No hay que tocar nada del hosting. CloudFront ya reescribe el 403 de S3 a
`index.html`, que es lo que hace que `/sabaneta/servicios` funcione igual que
`/fecha` funciona hoy.

---

## Antes de prender cada sede: la cuenta

**Una sede no entra a `AUTOAGENDAMIENTO_SEDES` hasta que su documento tenga su
cuenta.**

Al 20 de noviembre de 2026 tienen cuenta escrita seis: Suramericana, El
Restrepo, Sabaneta, Apartadó, Niquía y Rionegro. **Faltan Cali Norte y Cali
Sur**, y hasta que lleguen esas dos no van en la variable.

El backend no hereda la cuenta de otra sede a propósito. Lo fácil habría sido
dejar la de Suramericana de respaldo, y eso mandaría el abono de Cali a la
caja de Medellín sin que nada se vea raro en ninguna pantalla, hasta que
alguien cuadre caja. Sin cuenta, la pantalla del abono sale **sin una sola
forma de pago**: se ve en la primera prueba.

Lo que hay que escribirle a cada sede, en `branch.<sede>.autoagendamiento`:

```json
{
  "pagos": {
    "cuenta": "36000000929",
    "banco": "Bancolombia",
    "titular": null,
    "llave": "@rfsuramericana",
    "link": null
  },
  "whatsapp": "573147193009"
}
```

- `cuenta` — la cuenta de ahorros donde cae el abono.
- `banco` — el banco de esa cuenta. **No se asume Bancolombia:** El Restrepo
  recauda en Caja Social y Rionegro en NU. Un número de un banco tecleado en
  otro no falla por inválido y puede caer en una cuenta ajena. En `null` la
  fila dice "Transferencia" sin prometer banco.
- `titular` — a nombre de quién está la cuenta. Son cuentas personales; la app
  del banco le muestra ese nombre a la clienta antes de confirmar, y verlo
  antes en la pantalla evita que parezca una estafa.
- `llave` — la llave Bre-B. `null` si la sede no tiene y su fila no se pinta.
- `link` — link de pago. Hoy ninguna lo tiene; va en `null`.
- `whatsapp` — a dónde escribe la clienta con dudas, solo dígitos con
  indicativo. En `null` la web usa el número general de la marca
  (`+57 314 719 3009`), que al menos contesta.

Mientras falten, se puede prender Suramericana sola y agregar las demás a la
variable a medida que lleguen los datos. Eso es un cambio de variable y un
reinicio, no un despliegue.

---

## Lo que quedó señalado y sin hacer

- **Comisiones de 11 servicios.** La siembra creó en cada sede 91 servicios, y
  11 de ellos no tienen equivalente en el catálogo viejo —uñas, peinado de
  fiesta, secado, los combos— así que **nacieron sin comisión**. Comisionan 0
  hasta que alguien se las configure. No impide abrir la web; sí importa en la
  quincena. Es lo mismo que pasó en Suramericana cuando se sembró allá.
- **Niquía tenía sus 4 estilistas en `activo: false`** aunque estuvieran
  atendiendo: la agenda interna no filtra por ese campo y la web sí. Se
  reactivaron 3 el 2026-11-19. Vale la pena revisar si pasa en otras sedes
  antes de abrirlas.
- **El Restrepo no tiene dirección ni teléfono** (`"Confirmar"` y `000000`).
  Por eso su portada dice solo "Sede El Restrepo", sin ciudad.
- **Niquía figura como "NIQUIA - MEDELLIN"** y su dirección está en Bello. Se
  dejó sin ciudad para no decidir esa discusión desde un script.
