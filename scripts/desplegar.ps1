<#
  Despliega el frontend a producción: compila, sube a S3 y le limpia el caché a
  CloudFront.

      npm run deploy              despliega de verdad
      npm run deploy -- -Prueba   no sube nada, solo dice qué subiría

  Lo que hay detrás de citas.rizosfelices.co no es solo un bucket. Es un bucket
  PRIVADO (CloudFront entra con un Origin Access Control, nadie más) y una
  distribución de CloudFront delante. Por eso `aws s3 sync` solo no alcanza: el
  archivo queda en S3 al instante, pero CloudFront sigue sirviendo el viejo.

  Tres cosas de este script valen la explicación.

  LA CUENTA SE VERIFICA ANTES DE ESCRIBIR. El usuario de este perfil es
  administrador de la cuenta entera, y ahí al lado viven agenda.rizosfelices.co
  y staging-app.rizosfelices.co, que son otros sitios en vivo. Un nombre de
  bucket mal escrito no da error: crea o pisa otra cosa. Así que el bucket y la
  distribución están quemados acá —no se pasan por parámetro— y antes de subir
  nada se le pregunta a AWS de qué cuenta es el perfil. Si no es la de Rizos,
  el script se detiene.

  EL ORDEN IMPORTA: PRIMERO LOS ASSETS, DE ÚLTIMO EL index.html. El index.html
  nombra los assets por su hash. Si subiera primero, habría una ventana de unos
  segundos en la que una clienta pide la página, recibe el index nuevo, y pide
  un .js que todavía no existe: pantalla en blanco. Al revés no hay ventana,
  porque los assets nuevos no le estorban a nadie hasta que un index los nombre.

  Y SE SUBEN CON SU Cache-Control. La política de caché de la distribución es
  la gestionada CachingOptimized, que respeta lo que diga el origen y, cuando
  el origen no dice nada, cachea un día. Hoy los objetos de S3 no traen
  Cache-Control: por eso un cambio tarda hasta 24 horas en verse, invalidación
  de por medio o no. Al subirlos con cabecera correcta, los assets (que llevan
  el hash en el nombre) quedan inmutables para siempre y el index.html se
  revalida cada vez. De ahí en adelante la invalidación es por si acaso, no el
  único camino.
#>

[CmdletBinding()]
param(
  # No sube ni invalida nada: solo lista lo que haría.
  [switch]$Prueba,
  # Borra del bucket los assets que ya no están en dist/. Ver abajo por qué no
  # viene prendido.
  [switch]$Limpiar,
  # Usa el dist/ que ya está, sin volver a compilar.
  [switch]$SaltarBuild,
  # No se queda esperando a que CloudFront termine de invalidar.
  [switch]$NoEsperar
)

$ErrorActionPreference = "Stop"

# Quemados a propósito: ver el comentario de arriba.
$PERFIL       = "default"
$CUENTA       = "975050131270"
$BUCKET       = "citas.rizosfelices.co"
$DISTRIBUCION = "EKZ4P6ZAQ6T0A"
$SITIO        = "https://citas.rizosfelices.co"

$raiz = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $raiz "dist"

function Paso($t) { Write-Host ""; Write-Host "==> $t" -ForegroundColor Cyan }
function Listo($t) { Write-Host "    $t" -ForegroundColor Green }
function Morir($t) { Write-Host ""; Write-Host "ABORTADO: $t" -ForegroundColor Red; exit 1 }

if ($Prueba) {
  Write-Host ""
  Write-Host "  MODO PRUEBA: no se sube ni se invalida nada." -ForegroundColor Yellow
}

# --- 1. ¿Está el aws cli? ----------------------------------------------------
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  Morir "no encuentro el comando 'aws'. Instala el AWS CLI v2."
}

# --- 2. ¿Es la cuenta correcta? ----------------------------------------------
# Esto es el seguro. Si alguien le cambia las llaves al perfil 'default', o lo
# apunta a la otra cuenta, acá se cae y no allá adentro a medio subir.
Paso "Verificando el perfil '$PERFIL'"
$quien = aws sts get-caller-identity --profile $PERFIL --output json 2>&1
if ($LASTEXITCODE -ne 0) { Morir "el perfil '$PERFIL' no respondió:`n$quien" }
$yo = $quien | ConvertFrom-Json
if ($yo.Account -ne $CUENTA) {
  Morir @"
el perfil '$PERFIL' es de la cuenta $($yo.Account), y este sitio vive en la $CUENTA.
    Identidad que respondió: $($yo.Arn)
    No subo nada. Revisa 'aws configure list-profiles' y a cuál apunta 'default'.
"@
}
Listo "cuenta $($yo.Account) · $($yo.Arn)"

# El bucket tiene que existir YA. Que no exista no es un caso raro que haya que
# resolver creándolo: es la señal de que el nombre está mal escrito.
$cab = aws s3api head-bucket --bucket $BUCKET --profile $PERFIL 2>&1
if ($LASTEXITCODE -ne 0) { Morir "no puedo ver el bucket '$BUCKET':`n$cab" }
Listo "bucket s3://$BUCKET"

$alias = aws cloudfront get-distribution --id $DISTRIBUCION --profile $PERFIL `
           --query "Distribution.DistributionConfig.Aliases.Items[0]" --output text 2>&1
if ($LASTEXITCODE -ne 0) { Morir "no puedo ver la distribución '$DISTRIBUCION':`n$alias" }
Listo "CloudFront $DISTRIBUCION ($alias)"

# --- 3. Compilar -------------------------------------------------------------
if ($SaltarBuild) {
  Paso "Saltando el build (-SaltarBuild)"
} else {
  Paso "Compilando (typecheck + vite build, modo production)"
  Push-Location $raiz
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { Morir "el build falló. No se subió nada." }
  } finally { Pop-Location }
}

# Un dist/ sin index.html o sin assets/ es un build a medias. Subirlo deja el
# sitio roto, así que mejor pararse acá.
if (-not (Test-Path (Join-Path $dist "index.html"))) { Morir "no hay dist/index.html." }
if (-not (Test-Path (Join-Path $dist "assets")))     { Morir "no hay dist/assets/." }
$n = (Get-ChildItem (Join-Path $dist "assets") -File).Count
Listo "dist/ listo · index.html + $n archivos en assets/"

# --- 4. Los assets, primero y para siempre -----------------------------------
# Llevan el hash del contenido en el nombre, así que un archivo con ese nombre
# nunca cambia: 'immutable' le dice al navegador que no vuelva a preguntar.
Paso "Subiendo assets"
$argsAssets = @(
  "s3", "sync", "$dist", "s3://$BUCKET",
  "--profile", $PERFIL,
  "--exclude", "index.html",
  "--cache-control", "public,max-age=31536000,immutable"
)
if ($Prueba)  { $argsAssets += "--dryrun" }
# --delete no viene prendido. Borrar los assets viejos rompe a la clienta que
# tiene la página abierta en ese momento y todavía no ha pedido su .js. Pasa
# poco y pesa poco dejarlos; cuando el bucket ya tenga mucha basura, se corre
# una vez con -Limpiar y listo.
if ($Limpiar) { $argsAssets += "--delete" }
aws @argsAssets
if ($LASTEXITCODE -ne 0) { Morir "falló la subida de los assets." }

# --- 5. El index.html, de último y sin caché ---------------------------------
Paso "Subiendo index.html"
$argsIndex = @(
  "s3", "cp", (Join-Path $dist "index.html"), "s3://$BUCKET/index.html",
  "--profile", $PERFIL,
  "--cache-control", "public,max-age=0,must-revalidate",
  "--content-type", "text/html; charset=utf-8"
)
if ($Prueba) { $argsIndex += "--dryrun" }
aws @argsIndex
if ($LASTEXITCODE -ne 0) { Morir "falló la subida del index.html." }

# --- 6. Limpiarle el caché a CloudFront --------------------------------------
# Se invalida '/*' y no una lista de rutas. AWS cobra por ruta invalidada y
# cuenta '/*' como UNA, así que es tan barato como invalidar solo el index y no
# obliga a acordarse de las rutas del router (/fecha, /detalle…), que CloudFront
# cachea cada una por su lado porque cada una es un 403 de S3 reescrito.
if ($Prueba) {
  Paso "Invalidación (en prueba no se manda)"
  Listo "mandaría: cloudfront create-invalidation --distribution-id $DISTRIBUCION --paths /*"
} else {
  Paso "Invalidando el caché de CloudFront"
  $inv = aws cloudfront create-invalidation --distribution-id $DISTRIBUCION `
           --paths "/*" --profile $PERFIL --output json 2>&1
  if ($LASTEXITCODE -ne 0) { Morir "falló la invalidación:`n$inv" }
  $id = ($inv | ConvertFrom-Json).Invalidation.Id
  Listo "invalidación $id creada"

  if ($NoEsperar) {
    Listo "no espero a que termine (-NoEsperar). Suele tardar uno o dos minutos."
  } else {
    Write-Host "    esperando a que CloudFront termine (uno o dos minutos)…"
    aws cloudfront wait invalidation-completed --distribution-id $DISTRIBUCION `
      --id $id --profile $PERFIL
    if ($LASTEXITCODE -ne 0) {
      # Que se agote la espera no significa que el despliegue falló: ya está
      # todo subido y la invalidación sigue su curso sola.
      Write-Host "    la espera se cortó, pero la invalidación $id sigue en curso." -ForegroundColor Yellow
    } else {
      Listo "invalidación completa"
    }
  }
}

Write-Host ""
if ($Prueba) {
  Write-Host "  Prueba terminada. Nada se subió." -ForegroundColor Yellow
} else {
  Write-Host "  Listo. $SITIO" -ForegroundColor Green
}
Write-Host ""
