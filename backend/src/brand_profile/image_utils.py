from src.shared.image_utils import process_image, delete_image

MEDIA_DIR = "media/brand_logo"


def process_brand_logo(content: bytes) -> str:
    """
    Validates and saves image. Returns stored filename.
    """
    return process_image(content, MEDIA_DIR)


def delete_brand_logo(filename: str) -> None:
    delete_image(filename, MEDIA_DIR)
