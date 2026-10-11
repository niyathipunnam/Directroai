import os
import asyncio
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env from ai_service dir and parent dir
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env", override=False)

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import character, environment, storyboard, video, audio

app = FastAPI(
    title="DIRECTRO AI Service",
    description="Internal AI generation service for DIRECTRO AI filmmaking platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared in-memory tasks store (imported by routers)
tasks: dict = {}

# Service key auth middleware
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY", "")

@app.middleware("http")
async def service_key_middleware(request: Request, call_next):
    protected_prefixes = ["/generate-", "/task/"]
    path = request.url.path
    
    if any(path.startswith(p) for p in protected_prefixes):
        key = request.headers.get("X-Service-Key", "")
        if not AI_SERVICE_KEY:
            # If no key configured, allow (dev mode)
            pass
        elif key != AI_SERVICE_KEY:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid service key"}
            )
    
    return await call_next(request)

# Ensure upload directories exist
@app.on_event("startup")
async def startup():
    uploads_base = Path(__file__).parent.parent / "uploads"
    for subdir in ["characters", "environments", "storyboards", "videos", "audio", "exports"]:
        (uploads_base / subdir).mkdir(parents=True, exist_ok=True)
    print("DIRECTRO AI Service started")
    print(f"   Gemini: {'configured' if os.getenv('GEMINI_API_KEY') else 'not configured'}")
    print(f"   Runway: {'configured' if os.getenv('RUNWAY_API_KEY') else 'not configured'}")

# Health check
@app.get("/")
async def root():
    return {
        "status": "DIRECTRO AI Service Running",
        "version": "1.0.0",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "runway_configured": bool(os.getenv("RUNWAY_API_KEY")),
    }

# Task status endpoint
@app.get("/task/{task_id}")
async def get_task(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task

# Include routers - pass tasks dict via app state
app.state.tasks = tasks

app.include_router(character.router)
app.include_router(environment.router)
app.include_router(storyboard.router)
app.include_router(video.router)
app.include_router(audio.router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
