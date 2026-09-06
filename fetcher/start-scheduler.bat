@echo off
cd /d "%~dp0"
echo Starting FPL Hub fetcher scheduler...
echo Matchday: sync every 1 minute
echo Non-matchday: sync once per day
echo Keep this window open.
node scheduler.js
pause
