import os
import asyncio
from utils.face_swap import face_swap
import uuid
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from utils.gemini_client import generate_image, generate_text
from utils.file_utils import get_uploads_path, filename_with_uuid

router = APIRouter()


class StoryboardRequest(BaseModel):
    story_description: str
    project_id: int
    character_description: Optional[str] = ""
    environment_description: Optional[str] = ""
    character_image_path: Optional[str] = None
    environment_image_path: Optional[str] = None
    num_shots: Optional[int] = 4
    single_shot: Optional[bool] = False


def parse_shots_json(text) -> list:
    if isinstance(text, list): return text
    if isinstance(text, dict): return [text]
    if not isinstance(text, str): text = str(text)
    try:
        import json
        return json.loads(text)
    except Exception:
        pass
    import re
    match = re.search(r'\[[\\s\\S]*\]', text)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return []


@router.post("/generate-storyboard")
async def generate_storyboard(req: StoryboardRequest, request: Request):
    tasks = request.app.state.tasks

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not configured. Add it to your .env file."
        )

    num_shots = min(max(req.num_shots or 4, 1), 6)

    # Step 1: Generate shot descriptions via text
    shots_prompt = f"""You are a professional film director and storyboard artist.

Story: {req.story_description}
Character: {req.character_description or 'As described in the story'}
Environment: {req.environment_description or 'As described in the story'}

Generate exactly {num_shots} storyboard shot descriptions for this story.

Return ONLY a valid JSON array with no other text. Each object must have:
- shot_number (integer starting at 1)
- description (string: detailed visual description of what is happening in the shot)
- motion_prompt (string: how the scene moves, e.g. "slow zoom in", "tracking shot")
- camera_movement (string: camera angle and movement, e.g. "low angle, pan left")

Example format:
[
  {{
    "shot_number": 1,
    "description": "Close-up of character's determined face in rain",
    "motion_prompt": "slow zoom out revealing the rainy street",
    "camera_movement": "low angle, slight tilt up"
  }}
]"""

    try:
        text_response = await generate_text(shots_prompt)
        if not text_response.get('success'):
            raise Exception(text_response.get('error', 'Unknown error'))
        shot_descriptions = parse_shots_json(text_response.get('text', '[]'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate shot descriptions: {str(e)}")

    if not shot_descriptions:
        # Create fallback shot descriptions
        shot_descriptions = [
            {
                "shot_number": i + 1,
                "description": f"Shot {i + 1}: {req.story_description[:100]}",
                "motion_prompt": "slow pan",
                "camera_movement": "medium shot"
            }
            for i in range(num_shots)
        ]

    # Step 2: Generate images for each shot CONCURRENTLY to save time
    async def process_shot(shot_data, idx):
        shot_desc = shot_data.get("description", "")
        image_prompt = (
            f"{shot_desc}. "
            f"Environment: {req.environment_description or ''}. "
            f"Character: {req.character_description or ''}. "
            "Cinematic film still, professional storyboard shot, "
            "dramatic lighting, high quality, photorealistic"
        )

        fname = filename_with_uuid(".png")
        save_path = str(get_uploads_path("storyboards", fname))

        ref_images = []
        if req.character_image_path: ref_images.append(req.character_image_path)
        if req.environment_image_path: ref_images.append(req.environment_image_path)
        image_result = await generate_image(image_prompt, save_path, ref_images)
        if image_result.get('success') and req.character_image_path:
            face_swap(save_path, req.character_image_path, save_path)

        return {
            "shot_number": shot_data.get("shot_number", idx + 1),
            "description": shot_desc,
            "motion_prompt": shot_data.get("motion_prompt", ""),
            "camera_movement": shot_data.get("camera_movement", ""),
            "image_path": image_result.get("file_path") if image_result["success"] else None,
            "image_url": f"/uploads/storyboards/{fname}" if image_result["success"] else None,
            "image_error": image_result.get("error") if not image_result["success"] else None,
        }

    # Run image generations concurrently but staggered to avoid 429 rate limits
    async def process_shot_staggered(shot_data, idx):
        await asyncio.sleep(idx * 2.0)
        return await process_shot(shot_data, idx)

    tasks_list = [process_shot_staggered(shot_data, i) for i, shot_data in enumerate(shot_descriptions[:num_shots])]
    shots_with_images = await asyncio.gather(*tasks_list)

    return {"shots": shots_with_images, "total": len(shots_with_images)}




