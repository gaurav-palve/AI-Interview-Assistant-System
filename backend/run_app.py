#!/usr/bin/env python3
"""
Simple script to run the AI Interview Assistant
"""
import subprocess
import sys
import time
import threading

def run_backend():
    """Run the FastAPI backend"""
    print("🚀 Starting Backend...")
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000", 
        "--reload"
    ])

def run_frontend():
    """Run the Streamlit frontend"""
    print("🎨 Starting Frontend...")
    time.sleep(3)  # Wait for backend to start
    subprocess.run([
        sys.executable, "-m", "streamlit", "run",
        "frontend/streamlit_app.py",
        "--server.port", "8501",
        "--server.address", "127.0.0.1",
        "--server.enableCORS", "true",
        "--server.enableXsrfProtection", "false",
        "--browser.gatherUsageStats", "false"
    ])

if __name__ == "__main__":
    print("🎯 AI Interview Assistant - Starting...")
    print("📍 Backend will be at: http://127.0.0.1:8000")
    print("📍 Frontend will be at: http://127.0.0.1:8501")
    print("📖 API docs at: http://127.0.0.1:8000/docs")
    print("\n" + "="*50)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Start frontend in main thread
    run_frontend()
