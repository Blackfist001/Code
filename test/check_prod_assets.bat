@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Usage:
REM   check_prod_assets.bat
REM   check_prod_assets.bat https://10.201.140.200

set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=https://10.201.140.200

echo ==============================================
echo Production asset check
echo Base URL: %BASE_URL%
echo ==============================================
echo.

where curl >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] curl n est pas disponible sur cette machine.
  echo Installe curl ou utilise PowerShell Invoke-WebRequest.
  exit /b 1
)

set HAS_ERROR=0

call :check_contains "%BASE_URL%/html/layout.html" "main.js?v=20260515a" "layout versionne main.js"
call :check_contains "%BASE_URL%/js/view/managementView.js" "cache: 'no-store'" "managementView no-store"
call :check_contains "%BASE_URL%/html/management/schedules.html" "sched-professeur" "select professeur present"
call :check_contains "%BASE_URL%/html/management/teachers.html" "teachers-table-body" "partial teachers present"

echo.
echo ---------- Headers cache (indicatif) ----------
for %%U in (
  "%BASE_URL%/html/layout.html"
  "%BASE_URL%/js/main.js?v=20260515a"
  "%BASE_URL%/js/view/managementView.js"
) do (
  echo.
  echo URL: %%~U
  curl -k -s -I "%%~U" | findstr /I "HTTP/ Cache-Control Pragma Expires ETag Last-Modified"
)

echo.
if "%HAS_ERROR%"=="1" (
  echo ==============================================
  echo RESULTAT: ECHEC - au moins un controle a echoue.
  echo ==============================================
  exit /b 2
) else (
  echo ==============================================
  echo RESULTAT: OK - les fichiers testes semblent a jour.
  echo ==============================================
  exit /b 0
)

:check_contains
set URL=%~1
set NEEDLE=%~2
set LABEL=%~3

echo [CHECK] %LABEL%
for /f "tokens=1,2" %%A in ('curl -k -s -o NUL -w "%%{http_code} %%{size_download}" "%URL%"') do (
  set CODE=%%A
  set SIZE=%%B
)

if not "!CODE!"=="200" (
  echo   [KO] HTTP !CODE! sur %URL%
  set HAS_ERROR=1
  goto :eof
)

curl -k -s "%URL%" | findstr /C:"%NEEDLE%" >nul
if errorlevel 1 (
  echo   [KO] motif introuvable: %NEEDLE%
  echo   [OK] HTTP 200, taille !SIZE! octets
  set HAS_ERROR=1
) else (
  echo   [OK] HTTP 200, taille !SIZE! octets, motif trouve
)

goto :eof
