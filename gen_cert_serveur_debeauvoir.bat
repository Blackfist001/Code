@echo off
REM Ce batch lance le script PowerShell pour générer le certificat auto-signé
powershell -ExecutionPolicy Bypass -File "%~dp0gen_cert_serveur_debeauvoir.ps1"
pause