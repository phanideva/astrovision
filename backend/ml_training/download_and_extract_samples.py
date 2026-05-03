"""Download Galaxy10.h5 and extract sample PNG images for local testing.

Saves images to the repo `media/samples/` folder so they can be dragged
into the frontend for manual testing.

Usage:
  python download_and_extract_samples.py --count 20
"""

from __future__ import annotations

import argparse
from pathlib import Path

# top-level numpy import to satisfy type-checkers / linters that see
# `np` used in annotations and in helper functions.
import numpy as np

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


def _render_spiral(
    arr: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    col1: np.ndarray,
    col2: np.ndarray,
    rng: np.random.Generator,
) -> None:
    import math

    import numpy as np

    n_arms = int(rng.choice([2, 2, 2, 3, 4]))
    pitch = float(rng.uniform(0.7, 2.4))
    has_bar = rng.random() > 0.45
    bar_len = float(rng.uniform(0.09, 0.24)) if has_bar else 0.0
    inclination = float(rng.uniform(0.0, 0.65))
    core_scale = float(rng.uniform(0.04, 0.11))
    arm_width = float(rng.uniform(0.015, 0.045))
    pa = float(rng.uniform(0, math.pi * 2))  # global rotation

    Yi = Y * (1.0 - inclination * 0.75)

    # Thin exponential disk
    R = np.sqrt(X**2 + Yi**2)
    disk = np.exp(-R / 0.20) * 0.28
    arr += disk[..., np.newaxis] * col1

    # Central bar
    if has_bar:
        bar = (
            np.exp(-np.abs(Yi) / 0.022) * np.where(np.abs(X) < bar_len, 1.0, 0.0) * 1.4
        )
        arr += bar[..., np.newaxis] * col1

    # Spiral arms (logarithmic spiral via polar coordinates)
    R_sp = np.sqrt(X**2 + Yi**2) + 1e-9
    Theta = np.arctan2(Yi, X)
    arm_field = np.zeros_like(R_sp)
    for k in range(n_arms):
        arm_offset = k * (2 * math.pi / n_arms) + pa
        theta_diff = Theta - (np.log(np.maximum(R_sp, 0.01)) / pitch) - arm_offset
        theta_norm = (theta_diff + math.pi) % (2 * math.pi) - math.pi
        contrib = np.exp(-(theta_norm**2) / (2 * arm_width**2))
        radial_w = R_sp * np.exp(-R_sp / 0.38)
        arm_field += contrib * radial_w

    arm_color = col1 * 0.65 + col2 * 0.35
    arr += (arm_field * 6.0)[..., np.newaxis] * arm_color

    # Bulge
    bulge = np.exp(-R / core_scale * 3.0) * 2.8
    arr += bulge[..., np.newaxis] * (col1 * 0.55 + 0.45)

    # Nucleus
    R_c = np.sqrt(X**2 + Y**2)
    arr += np.exp(-R_c / 0.014)[..., np.newaxis] * 4.2


def _render_elliptical(
    arr: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    col1: np.ndarray,
    col2: np.ndarray,
    rng: np.random.Generator,
) -> None:
    import math

    import numpy as np

    ellipticity = float(rng.uniform(0.28, 0.97))  # b/a
    pa = float(rng.uniform(0, math.pi))
    sersic_n = float(rng.choice([2.0, 3.0, 4.0, 5.0, 6.0]))
    Re = float(rng.uniform(0.10, 0.24))
    extra_shell = rng.random() > 0.6  # faint outer shell (shell ellipticals)

    # Rotate
    Xr = X * math.cos(pa) + Y * math.sin(pa)
    Yr = -X * math.sin(pa) + Y * math.cos(pa)
    R_ell = np.sqrt(Xr**2 + (Yr / ellipticity) ** 2)

    # Sérsic profile
    bn = 2.0 * sersic_n - 1.0 / 3.0
    with np.errstate(over="ignore"):
        profile = np.exp(
            -bn * ((np.clip(R_ell, 1e-6, None) / Re) ** (1.0 / sersic_n) - 1.0)
        )
    profile = np.clip(profile, 0.0, 12.0) * 0.68

    # Colour gradient: warm core (col2) → cooler outer (col1)
    R_norm = np.clip(R_ell / (Re * 2.8), 0.0, 1.0)
    color_field = (
        col2[np.newaxis, np.newaxis, :] * (1.0 - R_norm[..., np.newaxis])
        + col1[np.newaxis, np.newaxis, :] * R_norm[..., np.newaxis]
    )
    arr += profile[..., np.newaxis] * color_field

    # Optional faint shell
    if extra_shell:
        shell_r = float(rng.uniform(0.30, 0.46))
        shell_w = float(rng.uniform(0.018, 0.035))
        shell = np.exp(-(((R_ell - shell_r) / shell_w) ** 2)) * float(
            rng.uniform(0.12, 0.30)
        )
        arr += shell[..., np.newaxis] * col2 * 0.6

    # Nucleus
    R_c = np.sqrt(X**2 + Y**2)
    arr += np.exp(-R_c / 0.013)[..., np.newaxis] * 3.6


def _render_lenticular(
    arr: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    col1: np.ndarray,
    col2: np.ndarray,
    rng: np.random.Generator,
) -> None:
    import math

    import numpy as np

    inclination = float(rng.uniform(0.08, 0.92))  # 0 = face-on, 1 = edge-on
    pa = float(rng.uniform(0, math.pi))
    has_ring = rng.random() > 0.5
    has_bar = rng.random() > 0.6

    # Rotate coordinates
    Xr = X * math.cos(pa) + Y * math.sin(pa)
    Yr = -X * math.sin(pa) + Y * math.cos(pa)

    # Project (inclination squishes Yr)
    Yp = Yr / max(1.0 - inclination * 0.88, 0.06)

    bulge_r = np.sqrt(Xr**2 + Yr**2)
    disk_r = np.sqrt(Xr**2 + Yp**2)

    # Exponential disk
    arr += (np.exp(-disk_r / 0.26) * 0.75)[..., np.newaxis] * col1

    # Spherical bulge
    arr += (np.exp(-bulge_r / 0.07) * 2.2)[..., np.newaxis] * (col1 * 0.4 + col2 * 0.6)

    # Edge-on dust lane
    if inclination > 0.62:
        dust = np.where(np.abs(Yr) < 0.009, 1.0, 0.0) * np.exp(-bulge_r / 0.28) * 0.45
        arr -= dust[..., np.newaxis] * 0.18

    # Optional ring
    if has_ring:
        ring_r = float(rng.uniform(0.22, 0.40))
        ring_w = float(rng.uniform(0.014, 0.028))
        ring = np.exp(-(((disk_r - ring_r) / ring_w) ** 2)) * float(
            rng.uniform(0.28, 0.72)
        )
        arr += ring[..., np.newaxis] * col2

    # Optional bar
    if has_bar:
        bar_len = float(rng.uniform(0.10, 0.20))
        bar = (
            np.exp(-np.abs(Yr) / 0.020) * np.where(np.abs(Xr) < bar_len, 1.0, 0.0) * 1.0
        )
        arr += bar[..., np.newaxis] * col1 * 0.8

    # Nucleus
    R_c = np.sqrt(X**2 + Y**2)
    arr += np.exp(-R_c / 0.013)[..., np.newaxis] * 3.2


def _render_irregular(
    arr: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    col1: np.ndarray,
    col2: np.ndarray,
    rng: np.random.Generator,
) -> None:
    import math

    import numpy as np

    n_clumps = int(rng.integers(3, 8))
    clump_x = rng.uniform(-0.34, 0.34, n_clumps)
    clump_y = rng.uniform(-0.34, 0.34, n_clumps)
    clump_r = rng.uniform(0.045, 0.16, n_clumps)
    clump_bright = rng.uniform(0.5, 2.0, n_clumps)
    clump_col_mix = rng.random(n_clumps)

    for j in range(n_clumps):
        R_c = np.sqrt((X - clump_x[j]) ** 2 + (Y - clump_y[j]) ** 2)
        glow = np.exp(-R_c / clump_r[j]) * clump_bright[j]
        c = col1 * (1.0 - clump_col_mix[j]) + col2 * clump_col_mix[j]
        arr += glow[..., np.newaxis] * c

    # Tidal tail
    if rng.random() > 0.35:
        ang = float(rng.uniform(0, 2 * math.pi))
        tx, ty = math.cos(ang), math.sin(ang)
        proj = X * tx + Y * ty
        perp = np.abs(-X * ty + Y * tx)
        tail = (
            np.exp(-perp / 0.028)
            * np.exp(-((proj - 0.28) ** 2) / 0.042)
            * float(rng.uniform(0.4, 0.9))
        )
        arr += np.clip(tail, 0, 1)[..., np.newaxis] * col2

    # HII region hotspots
    n_hii = int(rng.integers(4, 12))
    hx = rng.uniform(-0.30, 0.30, n_hii)
    hy = rng.uniform(-0.30, 0.30, n_hii)
    hb = rng.uniform(0.4, 1.6, n_hii)
    for j in range(n_hii):
        R_h = np.sqrt((X - hx[j]) ** 2 + (Y - hy[j]) ** 2)
        arr += (np.exp(-R_h / 0.017) * hb[j])[..., np.newaxis]


def generate_placeholder_images(out_dir: Path, count: int = 20) -> None:
    import numpy as np
    from PIL import Image, ImageFilter

    out_dir.mkdir(parents=True, exist_ok=True)
    classes = ["Spiral", "Elliptical", "Irregular", "Lenticular"]
    SIZE = 256

    # 18-colour palette — rich variety across classes
    COLORS = [
        (95, 172, 255),  # azure-blue (young O/B stars)
        (255, 210, 90),  # golden amber (K giant stars)
        (110, 240, 160),  # seafoam green (star-forming)
        (255, 148, 64),  # copper-orange (H-alpha regions)
        (200, 120, 255),  # violet (emission nebulae)
        (245, 243, 190),  # warm cream (S0 bulges)
        (64, 218, 236),  # cyan-turquoise (ionised gas)
        (255, 110, 140),  # rose-red (starburst)
        (148, 200, 255),  # periwinkle (late-type spirals)
        (238, 255, 115),  # chartreuse (young star clusters)
        (255, 184, 140),  # peach (lenticular disks)
        (90, 140, 210),  # steel-blue (compact ellipticals)
        (255, 225, 153),  # lemon-yellow (post-starburst)
        (140, 255, 218),  # mint-green (irregulars)
        (255, 128, 205),  # hot-pink (mergers)
        (180, 220, 140),  # sage-green (low-surf-brightness)
        (235, 165, 77),  # saffron (barred spirals)
        (128, 166, 255),  # cornflower-blue (dwarf spirals)
    ]

    # Normalised meshgrid (range ≈ −0.5 … +0.5)
    Y_grid, X_grid = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    Y_grid = (Y_grid - SIZE / 2.0) / SIZE
    X_grid = (X_grid - SIZE / 2.0) / SIZE

    for i in range(count):
        rng = np.random.default_rng(seed=i * 7919 + 42)
        cls = classes[i % len(classes)]

        # Choose two distinct colours per image
        ci1 = (i // len(classes) + i % len(classes)) % len(COLORS)
        ci2 = (ci1 + 4 + (i % 5)) % len(COLORS)
        col1 = np.array(COLORS[ci1], dtype=np.float32) / 255.0
        col2 = np.array(COLORS[ci2], dtype=np.float32) / 255.0

        # Black space background
        arr = np.zeros((SIZE, SIZE, 3), dtype=np.float32)

        # Background stars (count varied per image)
        n_stars = int(rng.integers(70, 200))
        sx = (rng.random(n_stars) * SIZE).astype(int)
        sy = (rng.random(n_stars) * SIZE).astype(int)
        sb = rng.random(n_stars) * 0.85 + 0.15
        arr[sy, sx] += sb[:, np.newaxis]  # white stars

        # Faint background galaxy hazes
        if rng.random() > 0.55:
            hcx = float(rng.uniform(-0.35, 0.35))
            hcy = float(rng.uniform(-0.35, 0.35))
            R_h = np.sqrt((X_grid - hcx) ** 2 + (Y_grid - hcy) ** 2)
            haze = np.exp(-R_h / float(rng.uniform(0.04, 0.10))) * float(
                rng.uniform(0.05, 0.15)
            )
            arr += haze[..., np.newaxis] * col2

        # Galaxy morphology
        if cls == "Spiral":
            _render_spiral(arr, X_grid, Y_grid, col1, col2, rng)
        elif cls == "Elliptical":
            _render_elliptical(arr, X_grid, Y_grid, col1, col2, rng)
        elif cls == "Lenticular":
            _render_lenticular(arr, X_grid, Y_grid, col1, col2, rng)
        else:
            _render_irregular(arr, X_grid, Y_grid, col1, col2, rng)

        # Subtle radial vignette
        vignette = 1.0 - np.clip((X_grid**2 + Y_grid**2) * 4.5, 0, 0.55)
        arr *= vignette[..., np.newaxis]

        # Photon-noise grain
        grain = rng.random((SIZE, SIZE, 3)).astype(np.float32) * 0.016
        arr = np.clip(arr + grain, 0.0, 1.0)

        img = Image.fromarray((arr * 255).astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
        img.save(out_dir / f"placeholder_{i:04d}_{cls}.png")
        print(
            f"  [{i + 1:02d}/{count}] {cls:12s}  colours: #{COLORS[ci1][0]:02x}{COLORS[ci1][1]:02x}{COLORS[ci1][2]:02x}  #{COLORS[ci2][0]:02x}{COLORS[ci2][1]:02x}{COLORS[ci2][2]:02x}"
        )


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--url", default=DEFAULT_URL)
    p.add_argument(
        "--out-dir",
        default=str(
            Path(__file__).resolve().parents[2] / "frontend" / "public" / "samples"
        ),
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
            print(
                "Falling back to generating placeholder sample images for local testing."
            )
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
