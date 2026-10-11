import os
import asyncio
from pathlib import Path


def get_uploads_path(*parts) -> Path:
    base = os.getenv("UPLOADS_DIR", "../uploads")
    root = (Path(__file__).parent.parent.parent / "uploads").resolve()
    if parts:
        return root.joinpath(*parts)
    return root


def ensure_dir(path) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def filename_with_uuid(extension: str) -> str:
    import uuid
    ext = extension if extension.startswith('.') else f'.{extension}'
    return f"{uuid.uuid4()}{ext}"


def save_bytes_to_file(data: bytes, path) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
    return p


def get_url_path(file_path: str) -> str:
    """Convert absolute file path to /uploads/... URL path."""
    if not file_path:
        return None
    norm = file_path.replace("\\", "/")
    idx = norm.find("/uploads/")
    if idx >= 0:
        return norm[idx:]
    return "/uploads/" + Path(file_path).name
