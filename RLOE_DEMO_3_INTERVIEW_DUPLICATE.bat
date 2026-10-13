@echo off
setlocal
echo ================================================================================
echo   Launching RLOE Demo 3 — Interview / Duplicate Cache Demo
echo ================================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RLOE_DEMO_3_INTERVIEW_DUPLICATE.ps1" %*
endlocal
