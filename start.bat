@echo off
REM Start helper for Taskish project
pushd %~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-dev.ps1"
popd
