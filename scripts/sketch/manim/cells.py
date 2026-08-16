"""Watching Cells Decide — Waddington (epigenetic) landscape.

Three cells start from the same saddle/maxima on the back ridge and
roll into three distinct valleys (fates). Each cell path has its own
domain accent. Ink contours on paper plate. 3:2.
"""
import os
import numpy as np
from manim import Scene, VMobject, Polygon, Dot, Rectangle, ManimColor, config

INK  = ManimColor(os.environ.get("INK",  "#211512"))
FILL = ManimColor(os.environ.get("FILL", "#f4f0e8"))
A1   = ManimColor(os.environ.get("A1",   "#8f5c4a"))  # oxide  — left fate
A2   = ManimColor(os.environ.get("A2",   "#5e7257"))  # sage   — centre fate
A3   = ManimColor(os.environ.get("A3",   "#6b7fb0"))  # blue   — right fate

config.frame_height = 2.6
config.frame_width  = config.frame_height * 1.5
config.pixel_height = 1000
config.pixel_width  = 1500

B = np.array([-0.72, 0.0, 0.72])
ZS       = 1.55
TOPY     = 1.10   # lower to compensate for u→y shift after rotation
BASELINE = -1.7

# Rotate the u and t basis vectors 15° to produce a slight side-view.
# CCW scene rotation (= camera moved 15° clockwise from above):
#   u-vec (1.45, 0)    → (_UX,  _UY)  right side of cross-sections tilts UP
#   t-vec (0.42,-1.32) → (_TX,  _TY)  time axis becomes more horizontal
_c, _s = np.cos(np.radians(15)), np.sin(np.radians(15))
_UX =  1.45 * _c          #  1.401
_UY =  1.45 * _s          # +0.375  (positive → right side goes UP)
_TX =  0.42 * _c + 1.32 * _s   #  0.748
_TY =  0.42 * _s - 1.32 * _c   # -1.166


def spread(t):
    return t ** 1.2


def phi(u, t):
    depth   = 0.12 + 0.27 * t
    sig     = 0.30 - 0.15 * t
    centres = spread(t) * B
    return -depth * np.sum(np.exp(-((u - centres) ** 2) / (2 * sig ** 2)))


def project(u, t):
    x = _UX * u + _TX * t
    y = TOPY + _UY * u + _TY * t + phi(u, t) * ZS
    return np.array([x, y, 0.0])


class Cells(Scene):
    def construct(self):
        # Solid background so rotated ridgelines never leave transparent gaps
        self.add(Rectangle(width=config.frame_width, height=config.frame_height,
                            fill_color=FILL, fill_opacity=1.0, stroke_width=0))

        us     = np.concatenate([[-2.7], np.linspace(-1.12, 1.12, 90), [2.7]])
        slices = np.linspace(0, 1, 42)

        for t in slices:
            pts      = [project(u, t) for u in us]
            fillpoly = Polygon(*pts, [pts[-1][0], BASELINE, 0], [pts[0][0], BASELINE, 0],
                               stroke_width=0, fill_color=FILL, fill_opacity=1.0)
            self.add(fillpoly)
            line = VMobject().set_points_as_corners(pts)
            line.set_stroke(INK, width=1.15, opacity=0.72)
            self.add(line)

        # All three cells start from the same saddle (u≈0 at t=0).
        # Tiny symmetry-breaking kicks route each into its own valley.
        # Quadratic commitment: cells linger at the saddle, then commit fast.
        kicks   = [-0.025, 0.0, 0.025]
        accents = [A1, A2, A3]
        for kick, target, accent in zip(kicks, B, accents):
            path = []
            for t in np.linspace(0, 1, 60):
                u = kick * (1 - t ** 2) + target * t ** 2
                path.append(project(u, t))
            traj = VMobject().set_points_smoothly(path)
            traj.set_stroke(accent, width=2.8, opacity=1.0)
            self.add(traj)
            self.add(Dot(path[0], radius=0.060, color=accent))
            self.add(Dot(path[-1], radius=0.085, color=accent))
