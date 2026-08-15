"""Generate a tileable aged-parchment texture overlay for the blog card plates.

Mottled warm/cool blotches + fine fibre grain on a transparent ground, meant to
be laid over the flat plate colour with `mix-blend-mode: multiply`. Writes
public/assets/blog/paper-texture.png. Run: python scripts/sketch/manim/paper_texture.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

N = 640
rng = np.random.default_rng(7)
OUT = Path(__file__).resolve().parents[3] / "public" / "assets" / "blog" / "paper-texture.png"


def octave(freq):
    small = rng.random((freq, freq))
    return np.asarray(Image.fromarray((small * 255).astype("uint8")).resize((N, N), Image.BICUBIC),
                      dtype=float) / 255.0


def fbm(freqs, gain=0.6):
    out = np.zeros((N, N)); amp = 1.0; tot = 0.0
    for f in freqs:
        out += amp * octave(f); tot += amp; amp *= gain
    out /= tot
    return (out - out.min()) / (np.ptp(out) + 1e-9)


mottle = fbm([3, 6, 12, 24])          # soft aging blotches
warmsel = fbm([2, 4, 8])              # where paper reads warm vs cool
grain = rng.random((N, N))            # fine fibre

# darker in the low patches, a touch of grain; kept subtle
alpha = 0.19 * (1 - mottle) ** 1.4 + 0.060 * (grain - 0.5) + 0.03
alpha = np.clip(alpha, 0.0, 0.24)

# warm-only mottle (golden tans), matching aged parchment — no cool patches
warm = np.array([150, 112, 56]); warm2 = np.array([196, 166, 108])
rgb = warmsel[..., None] * warm + (1 - warmsel[..., None]) * warm2

rgba = np.dstack([rgb, alpha * 255]).astype("uint8")
Image.fromarray(rgba, "RGBA").save(OUT)
print("wrote", OUT)
