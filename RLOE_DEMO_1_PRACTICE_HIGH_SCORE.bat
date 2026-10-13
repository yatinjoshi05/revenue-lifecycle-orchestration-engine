@echo off
setlocal
echo ================================================================================
echo   Launching RLOE Demo 1 — Practice / High Score Demo
echo ================================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1" %*
endlocal
