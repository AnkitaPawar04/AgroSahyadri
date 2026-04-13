#!/bin/bash
# Setup script for AgroSahyadri

echo "🌾 AgroSahyadri Setup Script"
echo "============================"

# Backend Setup
echo -e "\n📦 Setting up Backend..."
cd backend
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

echo "✅ Backend setup complete!"

# Frontend Setup
echo -e "\n📦 Setting up Frontend..."
cd ../frontend
npm install

echo "✅ Frontend setup complete!"

echo -e "\n🚀 Setup Complete! Next steps:"
echo "1. Update database credentials in backend/.env"
echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
