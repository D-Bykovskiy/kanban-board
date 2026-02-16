@echo off
cd /d "C:\Users\talyu\Documents\GitHub\Opencode\kanban-board\backend"
echo Starting Backend Server...
echo URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
