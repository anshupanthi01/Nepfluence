import os
import uuid

from PIL import Image
from io import BytesIO


def ensure_media_dir(media_dir: str) -> None:
    os.makedirs(media_dir, exist_ok=True)


def process_image(content: bytes, media_dir: str) -> str:
    """
    Validates and saves image under media_dir. Returns stored filename.
    """
    ensure_media_dir(media_dir)

    img = Image.open(BytesIO(content))
    img = img.convert("RGB")  # normalize

    filename = f"{uuid.uuid4().hex}.jpg"
    path = os.path.join(media_dir, filename)
    img.save(path, format="JPEG", quality=85)

    return filename


def delete_image(filename: str, media_dir: str) -> None:
    path = os.path.join(media_dir, filename)
    if os.path.exists(path):
        os.remove(path)
