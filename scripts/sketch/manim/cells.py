"""Watching Cells Decide — a Waddington (epigenetic) landscape.

The classic rendering: stacked contour ridgelines seen from the front, a single
valley at the back (monostable) that cascades into several valleys toward the
front (multistable) as developmental time proceeds. A cell rolls in at the back
and commits to one fate. Ink contours on the plate paper (FILL occludes for a
solid landscape); the cell path + fate in the sage accent. Two variants. 3:2.
"""
import os
import numpy as np
from manim import Scene, VMobject, Polygon, Dot, ManimColor, config

INK = ManimColor(os.environ.get("INK", "#211512"))
ACCENT = ManimColor(os.environ.get("ACCENT", "#5e7257"))
FILL = ManimColor(os.environ.get("FILL", "#f6f2ea"))

config.frame_height = 2.6
config.frame_width = config.frame_height * 1.5
config.pixel_height = 1000
config.pixel_width = 1500

B = np.array([-0.85, -0.32, 0.32, 0.85])   # eventual valley centres (multistable)
WIDTH, TOPY, DEPTH, SKEW, ZS = 1.45, 0.98, 1.32, 0.40, 1.4
BASELINE = -1.7


def spread(t):
    return t ** 1.25


def phi(u, t):
    depth = 0.13 + 0.24 * t
    sig = 0.32 - 0.17 * t
    centres = spread(t) * B
    return -depth * np.sum(np.exp(-((u - centres) ** 2) / (2 * sig ** 2)))


def project(u, t):
    return np.array([u * WIDTH + SKEW * t, (TOPY - DEPTH * t) + phi(u, t) * ZS, 0.0])


class Cells(Scene):
    def construct(self):
        us = np.linspace(-1.12, 1.12, 90)
        slices = np.linspace(0, 1, 42)

        # stacked contour ridgelines, back -> front, each filled to occlude
        for t in slices:
            pts = [project(u, t) for u in us]
            fillpoly = Polygon(*pts, [pts[-1][0], BASELINE, 0], [pts[0][0], BASELINE, 0],
                               stroke_width=0, fill_color=FILL, fill_opacity=1.0)
            self.add(fillpoly)
            line = VMobject().set_points_as_corners(pts)
            line.set_stroke(INK, width=1.15, opacity=0.72)
            self.add(line)

        # cells roll in at the back (one progenitor) and commit to different
        # basins — three lineages fanning into three fates.
        self.add(Dot(project(0, 0), radius=0.078, color=ACCENT))   # progenitor cell
        for k in (0, 2, 3):
            path = [project(spread(t) * B[k], t) for t in np.linspace(0, 1, 60)]
            traj = VMobject().set_points_smoothly(path)
            traj.set_stroke(ACCENT, width=3.4, opacity=1.0)
            self.add(traj)
            self.add(Dot(path[-1], radius=0.08, color=ACCENT))     # committed fate
