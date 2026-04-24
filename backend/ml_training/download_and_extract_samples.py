"""Download Galaxy10.h5 and extract sample PNG images for local testing.

Saves images to the repo `media/samples/` folder so they can be dragged
into the frontend for manual testing.

Usage:
  python download_and_extract_samples.py --count 20
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

DEFAULT_URL = "https://astroweaver.utoronto.ca/Galaxy10.h5"


def download_file(url: str, dest: Path) -> None:
    import requests

    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url} -> {dest}")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)


def extract_images(h5_path: Path, out_dir: Path, count: int) -> None:
    import h5py
    import numpy as np
    from PIL import Image

    print(f"Opening {h5_path}")
    with h5py.File(h5_path, "r") as f:
        images = np.array(f["images"])
        labels = np.array(f["ans"]).astype(int)

    out_dir.mkdir(parents=True, exist_ok=True)

    # mapping from fine (0..9) -> macro class name used elsewhere in repo
    FINE_TO_MACRO = {
        0: "Irregular",
        1: "Irregular",
        2: "Elliptical",
        3: "Elliptical",
        4: "Lenticular",
        5: "Spiral",
        6: "Spiral",
        7: "Spiral",
        8: "Lenticular",
        9: "Lenticular",
    }

    n = min(count, len(images))
    print(f"Extracting {n} images to {out_dir}")
    for i in range(n):
        arr = images[i]
        cls = FINE_TO_MACRO.get(int(labels[i]), "unknown")
        img = Image.fromarray(arr.astype("uint8"))
        fname = out_dir / f"sample_{i:04d}_{cls}.png"
        img.save(fname)


def generate_placeholder_images(out_dir: Path, count: int = 20) -> None:
    import math
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter

    rng = np.random.default_rng(42)
    out_dir.mkdir(parents=True, exist_ok=True)
    classes = ["Spiral", "Elliptical", "Irregular", "Lenticular"]

    # Vivid nebula tint palettes per class
    palettes = {
        "Spiral": [(255, 180, 60), (100, 180, 255)],
        "Elliptical": [(255, 220, 130), (200, 160, 255)],
        "Irregular": [(80, 220, 160), (255, 100, 120)],
        "Lenticular": [(160, 200, 255), (255, 200, 100)],
    }

    def _add_stars(arr: np.ndarray, n: int = 120) -> None:
        h, w = arr.shape[:2]
        xs = rng.integers(0, w, n)
        ys = rng.integers(0, h, n)
        brightness = rng.integers(160, 255, n)
        for x, y, b in zip(xs, ys, brightness):
            arr[y, x] = [b, b, b]

    def _radial_glow(
        arr: np.ndarray,
        cx: float,
        cy: float,
        rx: float,
        ry: float,
        color: tuple,
        intensity: float = 1.0,
    ) -> None:
        h, w = arr.shape[:2]
        for row in range(h):
            for col in range(w):
                dx = (col - cx) / max(rx, 1)
                dy = (row - cy) / max(ry, 1)
                d = math.sqrt(dx * dx + dy * dy)
                alpha = math.exp(-0.5 * d * d) * intensity
                for c in range(3):
                    arr[row, col, c] = min(255, int(arr[row, col, c] + color[c] * alpha))

    def _draw_spiral_arms(
        arr: np.ndarray, cx: float, cy: float, radius: float, color: tuple
    ) -> None:
        for arm in range(2):
            for t_deg in range(0, 380, 3):
                t = math.radians(t_deg + arm * 180)
                r = radius * t_deg / 380
                fade = t_deg / 380
                angle = t + 2.5 * fade
                x = int(cx + r * math.cos(angle))
                y = int(cy + r * math.sin(angle))
                h, w = arr.shape[:2]
                if 0 <= x < w and 0 <= y < h:
                    alpha = (1 - fade) * 0.9
                    for c in range(3):
                        arr[y, x, c] = min(255, int(arr[y, x, c] + color[c] * alpha))

    size = 224
    for i in range(count):
        cls = classes[i % len(classes)]
        col1, col2 = palettes[cls]
        tint = col1 if (i // len(classes)) % 2 == 0 else col2

        # near-black space background
        arr = np.zeros((size, size, 3), dtype=np.float32)
        _add_stars(arr, 150)  # type: ignore[arg-type]

        cx, cy = size / 2.0, size / 2.0

        if cls == "Spiral":
            _radial_glow(arr, cx, cy, size * 0.12, size * 0.12, tint, 2.5)
            _draw_spiral_arms(arr, cx, cy, size * 0.44, tint)
            _radial_glow(arr, cx, cy, size * 0.22, size * 0.22, tint, 0.8)

        elif cls == "Elliptical":
            _radial_glow(arr, cx, cy, size * 0.35, size * 0.22, tint, 2.2)
            _radial_glow(arr, cx, cy, size * 0.18, size * 0.12, (255, 255, 220), 1.8)

        elif cls == "Lenticular":
            _radial_glow(arr, cx, cy, size * 0.42, size * 0.10, tint, 2.0)
            _radial_glow(arr, cx, cy, size * 0.14, size * 0.14, (255, 255, 200), 2.5)

        else:  # Irregular
            offsets = [(-0.18, -0.12), (0.10, 0.15), (-0.05, 0.20), (0.18, -0.08)]
            for ox, oy in offsets:
                _radial_glow(
                    arr, cx + ox * size, cy + oy * size, size * 0.10, size * 0.10, tint, 1.4
                )
            _radial_glow(arr, cx, cy, size * 0.06, size * 0.06, (255, 255, 255), 3.0)

        arr_uint8 = np.clip(arr, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr_uint8)
        img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
        fname = out_dir / f"placeholder_{i:04d}_{cls}.png"
        img.save(fname)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--url", default=DEFAULT_URL)
    p.add_argument(
        "--out-dir", default=str(Path(__file__).resolve().parents[2] / "media" / "samples")
    )
    p.add_argument("--count", type=int, default=20)
    args = p.parse_args(argv)

    h5_path = Path(__file__).resolve().parent / "Galaxy10.h5"
    out_dir = Path(args.out_dir)

    if not h5_path.exists():
        try:
            download_file(args.url, h5_path)
        except Exception as e:
            print("Failed to download dataset:", e)
            print("Falling back to generating placeholder sample images for local testing.")
            # generate placeholder images directly into out_dir
            try:
                generate_placeholder_images(out_dir, args.count)
                print("Generated placeholder images in", out_dir)
                return 0
            except Exception as ex:
                print("Failed to generate placeholder images:", ex)
                return 2

    try:
        extract_images(h5_path, out_dir, args.count)
    except Exception as e:
        print("Failed to extract images:", e)
        return 3

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
