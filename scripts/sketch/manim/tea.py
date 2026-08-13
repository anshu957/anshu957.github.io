"""Tea Between Simulations — a stirred cup, seen from above.

Top-down view of a teacup: the tea surface carries a swirling vortex field (a
stir spiralling inward and slowing). Warm colours — amber at the rim, hotter
toward the centre — with two cream/amber stir-lines. Two variants via env (INK
swaps for light/dark); the warm palette reads on both. Transparent 3:2.
"""
import os
import numpy as np
from manim import (Scene, Circle, Arrow, ArcBetweenPoints, VMobject, VGroup,
                   ManimColor, config, interpolate_color, UP)

INK = ManimColor(os.environ.get("INK", "#211512"))
GOLD = ManimColor("#c89a52")
OXIDE = ManimColor("#b85a43")

config.frame_height = 2.6
config.frame_width = config.frame_height * 1.5
config.pixel_height = 1000
config.pixel_width = 1500

R = 1.12


def swirl(p):
    x, y = p[0], p[1]
    r = np.hypot(x, y) + 1e-6
    tang = np.array([-y, x]) / r          # rotation
    inward = -np.array([x, y]) / r        # slow drain toward centre
    spd = 0.5 + 0.5 * (r / R)             # faster near the rim
    v = (tang * 0.9 + inward * 0.35) * spd
    return np.array([v[0], v[1], 0.0])


def stir_line(p0, dt=0.03, steps=150):
    p = np.array(p0, float)[:2]; pts = [p.copy()]
    for _ in range(steps):
        d = swirl([p[0], p[1], 0])[:2]
        p = p + dt * d; pts.append(p.copy())
        if np.hypot(*p) < 0.05:
            break
    return np.array(pts)


class Tea(Scene):
    def construct(self):
        # cup seen from above: saucer, a handle on the right, rim + inner wall
        self.add(Circle(radius=R + 0.26, color=INK).set_stroke(width=1.6, opacity=0.4))  # saucer
        handle = ArcBetweenPoints([R * 0.96, 0.34, 0], [R * 0.96, -0.34, 0],
                                  angle=-2.6, color=INK).set_stroke(width=3.0)
        self.add(handle)
        self.add(Circle(radius=R, color=INK).set_stroke(width=3.2))            # rim
        self.add(Circle(radius=R - 0.07, color=INK).set_stroke(width=1.4, opacity=0.5))

        # swirling surface field on a polar grid, warm-graded (hot centre -> amber rim)
        for ri, rr in enumerate(np.linspace(0.2, 0.96, 5) * R):
            m = int(round(2 * np.pi * rr / 0.34))
            for j in range(m):
                a = 2 * np.pi * j / m + ri * 0.35
                pos = np.array([rr * np.cos(a), rr * np.sin(a), 0])
                d = swirl(pos); d = d / (np.linalg.norm(d) + 1e-9)
                col = interpolate_color(OXIDE, GOLD, rr / R)
                arr = Arrow(pos - d * 0.11, pos + d * 0.11, buff=0,
                            stroke_width=3.0, max_tip_length_to_length_ratio=0.5,
                            tip_length=0.09, color=col)
                self.add(arr)

        # two stir-lines spiralling inward
        for seed, col, w in (([0.98 * R, 0.15, 0], GOLD, 3.0),
                             ([-0.9 * R, -0.4, 0], OXIDE, 2.6)):
            lp = stir_line(seed)
            curve = VMobject().set_points_smoothly([np.array([x, y, 0]) for x, y in lp])
            curve.set_stroke(col, width=w, opacity=0.95)
            self.add(curve)

        # foreshorten the whole surface into a 3/4 view (tilt the cup back)
        VGroup(*self.mobjects).stretch(0.6, dim=1).shift(UP * 0.3)

        # cup body below the tilted rim, so it reads as a cup, not a disc
        bowl = VMobject().set_points_smoothly([
            np.array(p) for p in
            [[-1.06, 0.22, 0], [-0.72, -0.58, 0], [-0.32, -0.95, 0], [0, -1.02, 0],
             [0.32, -0.95, 0], [0.72, -0.58, 0], [1.06, 0.22, 0]]])
        bowl.set_stroke(INK, width=3.0)
        self.add(bowl)
