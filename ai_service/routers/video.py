import os
import asyncio
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from utils.runway_client import generate_video
from utils.file_utils import get_uploads_path, filename_with_uuid

router = APIRouter()


class VideoRequest(BaseModel):
    shot_id: int
    image_path: str
    prompt: Optional[str] = ""
    motion_prompt: Optional[str] = ""
    camera_movement: Optional[str] = ""
    project_id: int
    duration: Optional[int] = 5


@router.post("/generate-video")
async def generate_video_endpoint(req: VideoRequest, request: Request):
    tasks = request.app.state.tasks

    if not os.getenv("RUNWAY_API_KEY"):
        # Return a clear not_configured response instead of raising an error
        task_id = str(uuid.uuid4())
        tasks[task_id] = {
            "task_id": task_id,
            "task_type": "video",
            "status": "failed",
            "error": "RUNWAY_API_KEY is not configured. Add it to your .env file.",
            "not_configured": True,
        }
        return {"task_id": task_id, "status": "failed", "not_configured": True, 
                "error": "RUNWAY_API_KEY is not configured. Add it to your .env file."}

    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "task_id": task_id,
        "task_type": "video",
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "file_path": None,
        "url_path": None,
        "error": None,
        "not_configured": False,
    }

    # Build combined prompt
    parts = [p for p in [req.prompt, req.motion_prompt, f"Camera: {req.camera_movement}" if req.camera_movement else ""] if p]
    combined_prompt = ". ".join(parts)[:500]

    fname = filename_with_uuid(".mp4")
    save_path = str(get_uploads_path("videos", fname))

    async def _run():
        tasks[task_id]["status"] = "generating"
        result = await generate_video(
            image_path=req.image_path,
            prompt=combined_prompt,
            save_path=save_path,
            duration=req.duration or 5,
        )
        if result["success"]:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["file_path"] = result["file_path"]
            tasks[task_id]["url_path"] = "/uploads/videos/" + fname
        else:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = result.get("error", "Video generation failed")
            tasks[task_id]["not_configured"] = result.get("not_configured", False)

    asyncio.create_task(_run())

    return {"task_id": task_id, "status": "queued"}
