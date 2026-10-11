import os
import uuid
import asyncio
import subprocess
from pathlib import Path
from utils.file_utils import get_uploads_path, filename_with_uuid

async def generate_video(image_path: str, prompt: str, save_path: str, duration: int = 5) -> dict:
    """
    FREE FALLBACK: Because RunwayML requires paid credits, this generates 
    a video by applying a cinematic zoom/pan to a static image using FFmpeg.
    """
    loop = asyncio.get_event_loop()
    
    def _generate():
        try:
            # Find FFmpeg locally (either via winget exact path or system path)
            ffmpeg_exe = r"C:\Users\Punnam\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"
            if not os.path.exists(ffmpeg_exe):
                ffmpeg_exe = "ffmpeg"
                
            # Input path needs to be absolute
            abs_image_path = Path(image_path).resolve()

            # FFmpeg zoompan filter for a cinematic slow zoom in
            cmd = [
                ffmpeg_exe, "-loop", "1", "-i", str(abs_image_path),
                "-vf", "scale=1280:-2,zoompan=z='min(zoom+0.0015,1.5)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-t", "3", "-s", "1280x720", "-pix_fmt", "yuv420p", "-y", save_path
            ]
            
            # Run FFmpeg synchronously in the thread
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(result.stderr)
                
            return {"success": True, "file_path": save_path}
        except Exception as e:
            return {"success": False, "error": f"Free Video Engine Failed: {str(e)}"}

    return await loop.run_in_executor(None, _generate)
