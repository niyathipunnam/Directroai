from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
import urllib.parse
import urllib.request
from utils.file_utils import get_uploads_path, filename_with_uuid

router = APIRouter()

class AudioRequest(BaseModel):
    description: str
    project_id: int
    audio_type: Optional[str] = "music"

@router.post("/generate-audio")
async def generate_audio(req: AudioRequest, request: Request):
    """Free Fallback Audio generation using Google TTS."""
    try:
        # Fallback to TTS narration so the user can test the timeline
        text_to_speak = req.description[:200]
        if req.audio_type == "music":
            text_to_speak = f"Background music: {text_to_speak}"
            
        encoded_text = urllib.parse.quote(text_to_speak)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_text}&tl=en&client=tw-ob"
        
        req_obj = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req_obj)
        audio_bytes = res.read()
        
        fname = filename_with_uuid(".mp3")
        save_path = get_uploads_path("audio", fname)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_bytes(audio_bytes)
        
        return {
            "success": True,
            "status": "completed",
            "file_path": str(save_path),
            "audio_path": f"/uploads/audio/{fname}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "not_configured": True,
            "message": f"Free Audio failed: {str(e)}",
            "status": "failed"
        }
