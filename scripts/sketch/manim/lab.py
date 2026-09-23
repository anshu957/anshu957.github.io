"""Lab Standard -- loose files from working sessions get filed into a project tree.

Left: a loose pile of files (what sessions leave behind when nothing says where
things go). Right: the project tree, drawn the way `tree` prints it. In turn, a
file leaves the pile and lands in its empty slot in the tree, then the next one.

Files are coloured by kind, from the site's domain palette: scripts (blue), figures
(oxide), data and metrics (gold), and the three memory files at the top of the tree
(AGENTS.md, CONCLUSIONS.md, WORKLOG.md) in sage. Folders and rails are ink.

Every motion is periodic in LOOP, so the GIF loops seamlessly.
"""
import os
import numpy as np
from manim import (Scene, Line, Polygon, Rectangle, VGroup, ValueTracker, ManimColor,
                   DashedVMobject, config, linear, always_redraw)
from manim.constants import LineJointType, CapStyleType

config.frame_height = 2.6
config.frame_width = config.frame_height * 1.5

INK = ManimColor(os.environ.get("INK", "#211512"))
FILL = ManimColor(os.environ.get("FILL", "#f4f0e8"))
KIND = {  # kind -> colour
    "m": ManimColor(os.environ.get("SAGE", "#5e7257")),
    "s": ManimColor(os.environ.get("BLUE", "#6b7fb0")),
    "o": ManimColor(os.environ.get("OXIDE", "#b85a43")),
    "g": ManimColor(os.environ.get("GOLD", "#c89a52")),
}

LOOP = 6.0
PW, PH, EAR = 0.076, 0.097, 0.025    # page icon (file)
DW, DH, TAB = 0.115, 0.078, 0.021    # folder icon
STEP = 0.19                         # indent per tree level
SW = 1.7                            # icon stroke width

# (depth, kind, name length); kind: d = folder, else a file kind from KIND
ROWS = [(0, "d", 0.40),
        (1, "m", 0.30), (1, "m", 0.42), (1, "m", 0.33),
        (1, "d", 0.14), (2, "s", 0.26), (2, "s", 0.20),
        (1, "d", 0.38), (2, "d", 0.46), (3, "s", 0.18), (3, "g", 0.30), (3, "o", 0.24),
        (2, "d", 0.42), (3, "o", 0.28)]
TX, TY0, TY1 = 0.12, 1.14, -1.14
LANDING = [6, 10, 11, 13]            # tree slots the pile files into, in turn


def page(kind, center, angle=0.0, opacity=1.0):
    col = KIND[kind]
    w, h, e = PW / 2, PH / 2, EAR
    body = Polygon([-w, -h, 0], [w, -h, 0], [w, h - e, 0], [w - e, h, 0], [-w, h, 0],
                   stroke_color=col, stroke_width=SW, stroke_opacity=opacity,
                   fill_color=col, fill_opacity=0.28 * opacity)
    body.joint_type = LineJointType.ROUND
    ear = Polygon([w - e, h, 0], [w - e, h - e, 0], [w, h - e, 0],
                  stroke_color=col, stroke_width=SW * 0.8, stroke_opacity=opacity,
                  fill_color=col, fill_opacity=0.7 * opacity)
    ear.joint_type = LineJointType.ROUND
    return VGroup(body, ear).rotate(angle, about_point=np.zeros(3)).shift(center)


def ghost(center):
    w, h, e = PW / 2, PH / 2, EAR
    body = Polygon([-w, -h, 0], [w, -h, 0], [w, h - e, 0], [w - e, h, 0], [-w, h, 0],
                   stroke_color=INK, stroke_width=1.1, stroke_opacity=0.35)
    return DashedVMobject(body, num_dashes=14, dashed_ratio=0.55).shift(center)


def folder(center):
    w, h, t = DW / 2, DH / 2, TAB
    f = Polygon([-w, -h, 0], [w, -h, 0], [w, h, 0], [0.0, h, 0], [-0.018, h + t, 0],
                [-w, h + t, 0], stroke_color=INK, stroke_width=SW,
                fill_color=INK, fill_opacity=0.12)
    f.joint_type = LineJointType.ROUND
    return f.shift(center)


def stroke(a, b, color, width, opacity):
    ln = Line(np.array(a, float), np.array(b, float), stroke_color=color,
              stroke_width=width, stroke_opacity=opacity)
    ln.cap_style = CapStyleType.ROUND
    return ln


def ease(u):
    return u * u * u * (u * (6 * u - 15) + 10)   # smootherstep


def poisson(rng, n, xlim, ylim, rmin):
    pts = []
    while len(pts) < n:
        p = np.array([rng.uniform(*xlim), rng.uniform(*ylim)])
        if all(np.hypot(*(p - q)) > rmin for q in pts):
            pts.append(p)
    return np.array(pts)


class Lab(Scene):
    def construct(self):
        self.add(Rectangle(width=config.frame_width, height=config.frame_height,
                           fill_color=FILL, fill_opacity=1.0, stroke_width=0))
        rng = np.random.default_rng(11)
        ys = np.linspace(TY0, TY1, len(ROWS))
        slot = [np.array([TX + d * STEP, y, 0.0]) for (d, _, _), y in zip(ROWS, ys)]

        # tree rails, as `tree` prints them
        for i, (d, _, _) in enumerate(ROWS):
            if d == 0:
                continue
            p = max(j for j in range(i) if ROWS[j][0] == d - 1)
            x = TX + (d - 1) * STEP
            self.add(stroke([x, ys[p] - 0.07, 0], [x, ys[i], 0], INK, 1.2, 0.4))
            self.add(stroke([x, ys[i], 0], [slot[i][0] - 0.075, ys[i], 0], INK, 1.2, 0.4))

        # icons, plus a stroke standing in for each name
        for i, ((d, k, L), c) in enumerate(zip(ROWS, slot)):
            if k == "d":
                self.add(folder(c))
            elif i in LANDING:
                self.add(ghost(c))
            else:
                self.add(page(k, c))
            col = KIND["m"] if k == "m" else INK
            op = 0.85 if k == "m" else (0.7 if k == "d" else 0.35)
            x0 = c[0] + 0.1
            self.add(stroke([x0, c[1], 0], [x0 + L, c[1], 0], col, 2.6, op))

        # the pile: well-spaced, gently tilted, slowly drifting
        kinds = ["s", "o", "g", "s", "o", "g", "s", "o"] * 3
        n = 22
        base = poisson(rng, n, (-1.72, -0.42), (-1.08, 1.08), 0.23)
        ang = rng.uniform(-0.55, 0.55, n)
        amp = rng.normal(0, 0.018, (n, 2, 2))
        frq = rng.integers(1, 3, (n, 2, 2))
        phs = rng.uniform(0, 2 * np.pi, (n, 2, 2))
        w = 2 * np.pi / LOOP

        def pile_pos(i, tt):
            d = (amp[i] * np.sin(w * frq[i] * tt + phs[i])).sum(axis=1)
            return np.array([*(base[i] + d), 0.0])

        # couriers: the pile files nearest the tree, one per LANDING slot
        order = np.argsort(-base[:, 0])
        couriers = {}
        for k, s in enumerate(LANDING):
            want = ROWS[s][1]
            couriers[k] = next(j for j in order
                               if j not in couriers.values() and kinds[j] == want)

        t = ValueTracker(0.0)

        def courier(k, tt):
            i = couriers[k]
            u = ((tt / LOOP) - k / len(LANDING)) % 1.0
            a, b, kind = pile_pos(i, tt), slot[LANDING[k]], ROWS[LANDING[k]][1]
            if u < 0.40:                                   # flight
                s = ease(u / 0.40)
                ctrl = np.array([(a[0] + b[0]) / 2, max(a[1], b[1]) + 0.3, 0])
                p = (1 - s) ** 2 * a + 2 * s * (1 - s) * ctrl + s * s * b
                return page(kind, p, ang[i] * (1 - s))
            if u < 0.80:                                   # filed
                return page(kind, b)
            f = (u - 0.80) / 0.20                          # fade out of slot, back into pile
            return VGroup(page(kind, b, 0.0, 1 - f), page(kind, a, ang[i], f))

        busy = set(couriers.values())
        scene = always_redraw(lambda: VGroup(
            *[page(kinds[i], pile_pos(i, t.get_value()), ang[i]) for i in range(n) if i not in busy],
            *[courier(k, t.get_value()) for k in range(len(LANDING))]))
        self.add(scene)
        self.play(t.animate.set_value(LOOP), run_time=LOOP, rate_func=linear)
