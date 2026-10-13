@echo off
setlocal
echo ================================================================================
echo   Launching RLOE Demo 2 — Interview / Low Score Demo
echo ================================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RLOE_DEMO_2_INTERVIEW_LOW_SCORE.ps1" %*
endlocal
