@echo off
title RE:START A:GAIN? // DEV SERVER (KEI OS)
echo ========================================================
echo   RE:START A:GAIN? // 2D PRECISION PLATFORMER
echo ========================================================
echo Launching local game engine at http://localhost:3000...
cd /d "%~dp0"
call npm run dev -- --open

