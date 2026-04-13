@echo off
REM Setup script for AgroSahyadri (Windows)

echo.
echo 🌾 AgroSahyadri Setup Script (Windows)
echo ======================================

REM Backend Setup
echo.
echo 📦 Setting up Backend...
cd backend
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt

REM Copy environment file
copy .env.example .env

echo ✅ Backend setup complete!

REM Frontend Setup
echo.
echo 📦 Setting up Frontend...
cd ..\frontend
call npm install

echo ✅ Frontend setup complete!

echo.
echo 🚀 Setup Complete! Next steps:
echo 1. Update database credentials in backend\.env
echo 2. Start backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:3000 in your browser

pause
