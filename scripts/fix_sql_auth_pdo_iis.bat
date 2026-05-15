@echo off
setlocal EnableExtensions EnableDelayedExpansion

title Fix SQL auth for PDO on IIS
echo =====================================================
echo  SQL auth fix (PDO) - IIS production helper
echo =====================================================
echo.

REM ---- Optional parameter: DB name (default: sortie_ecole)
set "DB_NAME=sortie_ecole"
if not "%~1"=="" set "DB_NAME=%~1"

REM ---- Find mysql.exe (MariaDB/MySQL)
set "MYSQL_EXE=mysql"
where mysql >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\MariaDB 10.11\bin\mysql.exe" set "MYSQL_EXE=C:\Program Files\MariaDB 10.11\bin\mysql.exe"
)

echo mysql executable: %MYSQL_EXE%
echo.

set /p ROOT_USER=Root user [root]: 
if "%ROOT_USER%"=="" set "ROOT_USER=root"

set /p ROOT_PASS=Root password (leave empty if none): 

set /p APP_USER=App SQL user [app_sortie]: 
if "%APP_USER%"=="" set "APP_USER=app_sortie"

set /p APP_PASS=App SQL password (required): 
if "%APP_PASS%"=="" (
    echo ERROR: app password is required.
    exit /b 1
)

echo.
echo [1/6] Test SQL connection...
"%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "SELECT VERSION();" >nul 2>nul
if errorlevel 1 (
    echo ERROR: cannot connect with provided root credentials.
    echo Verify MySQL/MariaDB service and credentials.
    exit /b 1
)

echo [2/6] Detect server flavor...
set "DB_VERSION="
for /f "usebackq delims=" %%v in (`"%MYSQL_EXE%" --protocol=TCP -N -B -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "SELECT VERSION();"`) do set "DB_VERSION=%%v"
echo Version: %DB_VERSION%
echo.

echo [3/6] Current auth plugin for root...
"%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "SELECT user,host,plugin FROM mysql.user WHERE user='%ROOT_USER%';"
echo.

echo [4/6] Create app user and set compatible auth plugin...
set "IS_MARIADB=0"
echo %DB_VERSION% | findstr /I "mariadb" >nul && set "IS_MARIADB=1"

if "%IS_MARIADB%"=="1" (
    echo Detected MariaDB syntax path...
    "%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "CREATE USER IF NOT EXISTS '%APP_USER%'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('%APP_PASS%');"
    if errorlevel 1 goto :sql_fail
    "%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "ALTER USER '%APP_USER%'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('%APP_PASS%');"
    if errorlevel 1 goto :sql_fail
) else (
    echo Detected MySQL syntax path...
    "%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "CREATE USER IF NOT EXISTS '%APP_USER%'@'localhost' IDENTIFIED WITH mysql_native_password BY '%APP_PASS%';"
    if errorlevel 1 goto :sql_fail
    "%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "ALTER USER '%APP_USER%'@'localhost' IDENTIFIED WITH mysql_native_password BY '%APP_PASS%';"
    if errorlevel 1 goto :sql_fail
)

echo [5/6] Grant minimum permissions on %DB_NAME%...
"%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "GRANT SELECT, INSERT, UPDATE, DELETE ON %DB_NAME%.* TO '%APP_USER%'@'localhost';"
if errorlevel 1 goto :sql_fail
"%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "FLUSH PRIVILEGES;"
if errorlevel 1 goto :sql_fail

echo [6/6] Verify new user plugin...
"%MYSQL_EXE%" --protocol=TCP -hlocalhost -u"%ROOT_USER%" --password="%ROOT_PASS%" -e "SELECT user,host,plugin FROM mysql.user WHERE user='%APP_USER%';"
if errorlevel 1 goto :sql_fail

echo.
echo SUCCESS.
echo Update your production .env with:
echo DB_HOST=localhost
echo DB_NAME=%DB_NAME%
echo DB_USER=%APP_USER%
echo DB_PASS=%APP_PASS%
echo.
echo Then recycle IIS app pool (or run: iisreset).
goto :eof

:sql_fail
echo.
echo ERROR: SQL command failed.
echo Check server type, SQL syntax compatibility, and privileges.
exit /b 1
