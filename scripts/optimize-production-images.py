"""Compress production-loaded images while preserving their dimensions."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 195 * 1024

TARGETS = (
    (
        ROOT / "assets/Background/adventure-workshops-hero-cliffin.png",
        ROOT / "assets/Background/adventure-workshops-hero-cliffin.webp",
        "WEBP",
    ),
    (ROOT / "assets/images/cliffinnadventures/school-programs/school-wix-01.webp", None, "WEBP"),
    (ROOT / "assets/og-image.jpg", None, "JPEG"),
    (ROOT / "assets/Background/hero-image-2-2560.webp", None, "WEBP"),
    (ROOT / "assets/images/cliffinnadventures/school-programs/school-wix-03.webp", None, "WEBP"),
    (ROOT / "assets/Background/hero-image-2-1920.webp", None, "WEBP"),
    (ROOT / "assets/images/cliffinnadventures/school-programs/school-wix-05.webp", None, "WEBP"),
    (ROOT / "assets/images/cliffinnadventures/adventure-workshops/workshop-action-1.webp", None, "WEBP"),
    (ROOT / "assets/og/og-school-programs.webp", None, "WEBP"),
    (ROOT / "assets/images/cliffinnadventures/adventure-workshops/workshop-briefing.webp", None, "WEBP"),
)


def save_candidate(image: Image.Image, path: Path, image_format: str, quality: int) -> None:
    options = {"format": image_format, "quality": quality, "optimize": True}
    if image_format == "WEBP":
        options["method"] = 6
    elif image_format == "JPEG":
        options["progressive"] = True
        options["subsampling"] = "4:2:0"
    image.save(path, **options)


def optimize(source: Path, destination: Path | None, image_format: str) -> None:
    output = destination or source
    original_size = source.stat().st_size
    if destination and destination.exists() and destination.stat().st_size <= MAX_BYTES:
        print(f"SKIP {destination.relative_to(ROOT)} ({destination.stat().st_size / 1024:.1f} KB)")
        return
    if destination is None and source.stat().st_size <= MAX_BYTES:
        print(f"SKIP {source.relative_to(ROOT)} ({source.stat().st_size / 1024:.1f} KB)")
        return

    temp = output.with_name(f"{output.stem}.optimizing{output.suffix}")
    with Image.open(source) as loaded:
        image = loaded.convert("RGB") if loaded.mode not in {"RGB", "RGBA"} else loaded.copy()

    for quality in range(80, 39, -3):
        save_candidate(image, temp, image_format, quality)
        if temp.stat().st_size <= MAX_BYTES:
            break

    if temp.stat().st_size >= source.stat().st_size and destination is None:
        image.close()
        temp.unlink()
        print(f"KEEP {source.relative_to(ROOT)} (optimized result was not smaller)")
        return

    image.close()
    temp.replace(output)
    print(
        f"OK   {output.relative_to(ROOT)} "
        f"({original_size / 1024:.1f} KB -> {output.stat().st_size / 1024:.1f} KB, q={quality})"
    )


if __name__ == "__main__":
    for source, destination, image_format in TARGETS:
        optimize(source, destination, image_format)
