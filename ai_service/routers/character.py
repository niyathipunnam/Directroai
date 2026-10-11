import os
import asyncio
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from utils.gemini_client import generate_image
from utils.file_utils import get_uploads_path, filename_with_uuid

router = APIRouter()


class CharacterRequest(BaseModel):
    description: str
    project_id: int
    task_id: Optional[str] = None


@router.post("/generate-character")
async def generate_character(req: CharacterRequest, request: Request):
    tasks = request.app.state.tasks

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not configured. Add it to your .env file."
        )

    task_id = req.task_id or str(uuid.uuid4())
    tasks[task_id] = {
        "task_id": task_id,
        "task_type": "character",
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "file_path": None,
        "url_path": None,
        "error": None,
    }

    # Enhanced prompt for cinematic character
    enhanced_prompt = (
        f"{req.description}, "
        "photorealistic portrait, cinematic lighting, professional film still, "
        "sharp focus, high resolution, 8K quality, dramatic atmosphere, "
        "professional cinematography"
    )

    # Save path
    fname = filename_with_uuid(".png")
    save_path = str(get_uploads_path("characters", fname))

    async def _run():
        tasks[task_id]["status"] = "generating"
        result = await generate_image(enhanced_prompt, save_path)
        if result["success"]:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["file_path"] = result["file_path"]
            tasks[task_id]["url_path"] = "/uploads/characters/" + fname
        else:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = result["error"]

    asyncio.create_task(_run())

    return {"task_id": task_id, "status": "queued"}
