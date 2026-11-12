# Multi-sede: apartado, no descartado

**Estado: no se puede ejecutar.** El autoagendamiento hoy está disponible solo
para **Suramericana (SD-88809)**, y el backend que serviría varias sedes no
está en `main` de `appagenda`. El trabajo se apartó el 2026-11-12 para poder
sacar el color y la campaña de reactivación sin arrastrarlo.

## Dónde quedó

Rama local **`wip/multi-sede-y-color-20261112`** de este repositorio, commit
`5c85e23`. Lleva el multi-sede y, encima, una primera versión del color que ya
se rehizo sobre `main` — esa parte no hace falta recuperarla.

No está empujada a `origin`. Sigue siendo un respaldo de git, así que
sobrevive a cambiar de rama, pero si querés que viva fuera de esta máquina:

```bash
git push -u origin wip/multi-sede-y-color-20261112
```

Del lado del backend hay dos worktrees con la parte que les toca, en
`appagenda/.claude/worktrees/selfbooking-multisede-*`. El que tiene la ruta
`/sedes` es `…-f84058`. Ninguno tiene `.env` ni `venv`.

## La lógica, para no volver a deducirla

El cambio tiene una sola idea: **la sede deja de ser una constante del
servidor y pasa a ser parte de la ruta.**

Hoy la sede sale de `AUTOAGENDAMIENTO_SEDE_ID` y **no viaja en ninguna
petición**, a propósito. El docstring de `app/selfbooking/config.py` lo dice
sin rodeos: un `sede_id` libre desde el navegador convierte cada endpoint del
módulo en una ventana a las otras 16 sedes — su catálogo, sus profesionales y,
al retener, su agenda. Eso es lo que hay que resolver antes de abrir la ruta,
no después.

### Backend

- `GET /sedes` devuelve las sedes habilitadas para la web. **Habilitadas**, no
  todas: la lista es un dato de operación, no `branch` entero.
- Todo lo demás pasa a `/{sedeId}/…`, y `sedeId` se valida **contra esa
  lista** en cada llamada. Validarlo contra `branch` sería no haber cambiado
  nada.
- `GET /{sedeId}/config` ya existe en espíritu: el `/config` de hoy mezcla la
  sede (de la agenda) con los medios de pago, el WhatsApp y la política (del
  módulo). Con varias sedes, esos tres dejan de ser configuración del módulo y
  pasan a ser de la sede. Es el cambio de verdad y no la ruta.

### Frontend

- `SedePage` como primer paso, antes de `StartPage`.
- `RequireSede` en todo lo que viene después: sin sede no hay a qué ruta
  llamar y `bajoSede()` lanza.
- `src/data/sedes.ts` y `src/data/configSede.ts` guardan la sesión: una sede,
  una config, cargadas una vez. `configSede.ts` es el que **sustituye** a
  `src/data/configAgenda.ts`, que es lo que quedó en `main` haciendo lo mismo
  para una sola sede. Cuando el multi-sede vuelva, `configAgenda.ts` se
  reemplaza por `configSede.ts` y `abono()`, `campana()` y `cubreLaFecha()` se
  mudan tal cual: su firma no cambia, solo de dónde sale el dato.

### Lo que `main` ya dejó andando y conviene no volver a escribir

`configAgenda.ts` resolvió, para una sede, dos cosas que el multi-sede
necesita igual:

1. **El abono sale de `GET /config`**, ya no de `ABONO = 50_000` quemado en
   `catalog.ts`.
2. **El abono por categoría**: el backend cobra $90.000 para colorimetría y la
   web mostraba $50.000. `abono(categorias)` toma el mayor de los que apliquen,
   que es exactamente lo que hace `_abono_de` del backend.

## Por qué no se borró

Porque la lógica está bien y el problema es de calendario: falta el backend.
Borrarlo obligaría a deducir otra vez el modelo de alcance —y es justo donde
está el riesgo de seguridad.
