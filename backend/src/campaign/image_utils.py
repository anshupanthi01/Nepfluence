from src.shared.image_utils import ensure_media_dir as _ensure_media_dir
from src.shared.image_utils import process_image, delete_image

MEDIA_DIR = "media/brand_post"


def ensure_media_dir() -> None:
    _ensure_media_dir(MEDIA_DIR)


def process_campaign_image(content: bytes) -> str:
    """
    Validates and saves image. Returns stored filename.
    """
    return process_image(content, MEDIA_DIR)


def delete_campaign_image(filename: str) -> None:
    delete_image(filename, MEDIA_DIR)
