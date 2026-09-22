"""Watching Cells Decide — Dynamic Waddington Epigenetic Landscape & Lineage Commitment.

A dynamic physical simulation of cellular differentiation down a branching potential:
- Topographic multi-scale Waddington landscape V(u, t):
  * High progenitor saddle at the top crest (t=0)
  * Tri-furcation into three distinct attractor valleys at terminal fate (t=1):
    Left (Oxide), Centre (Sage), Right (Blue)
- Stacked elevation contour terraces spanning the full card canvas
- Deep glowing potential pools at each terminal attractor sink
- RNA velocity vector field arrows showing developmental flow
- High-contrast, dynamic rolling cells: luminous cellular marbles with trailing
  comet tails rolling down the landscape, branching at the decision barrier
- Attractor arrival resonance ripples pulsing at the basin destinations
- Seamless 3.0s looping animation in both Light and Dark theme variants
- Borderless design: fully utilizes the 3:2 card canvas without inner axes boxes.
"""
import os
import numpy as np
from manim import (Scene, VMobject, Polygon, Dot, Circle, Rectangle, Arrow,
                   ManimColor, config, ValueTracker, linear)

config.frame_height = 2.6
config.frame_width  = config.frame_height * 1.5

INK_VAL  = os.environ.get("INK",  "#211512")
FILL_VAL = os.environ.get("FILL", "#f4f0e8")
IS_DARK  = (FILL_VAL.lower() in ["#191212", "#181212", "#110e0e"] or "dark" in os.environ.get("THEME", "").lower())

INK  = ManimColor(INK_VAL)
FILL = ManimColor(FILL_VAL)

# Distinct domain colors for the 3 cell fate attractors
if IS_DARK:
    A1 = ManimColor(os.environ.get("A1", "#c4856e"))  # oxide — left fate
    A2 = ManimColor(os.environ.get("A2", "#8faa84"))  # sage  — centre fate
    A3 = ManimColor(os.environ.get("A3", "#8fa0cb"))  # blue  — right fate
    CONTOUR_OPACITY = 0.58
    CONTOUR_STROKE  = 1.10
    CELL_CORE_COL   = ManimColor("#ffffff")
else:
    A1 = ManimColor(os.environ.get("A1", "#8f5c4a"))  # oxide — left fate
    A2 = ManimColor(os.environ.get("A2", "#5e7257"))  # sage  — centre fate
    A3 = ManimColor(os.environ.get("A3", "#6b7fb0"))  # blue  — right fate
    CONTOUR_OPACITY = 0.68
    CONTOUR_STROKE  = 1.15
    CELL_CORE_COL   = ManimColor("#211512")

# Attractor basin centers in developmental space
B = np.array([-0.74, 0.0, 0.74])
ZS = 1.45
TOPY = 1.10
BASELINE = -1.60

# 14° perspective rotation
_c, _s = np.cos(np.radians(14)), np.sin(np.radians(14))
_UX = 1.45 * _c
_UY = 1.45 * _s
_TX = 0.42 * _c + 1.30 * _s
_TY = 0.42 * _s - 1.30 * _c

# Optimal scaling to fill the full 3.9 x 2.6 canvas edge-to-edge
SCALE_S  = 0.86
CENTER_X = 0.361
CENTER_Y = 0.304


def spread(t):
    return t ** 1.22


def phi(u, t):
    """Waddington epigenetic potential function: valley depth and sharpness deepen with time."""
    depth = 0.12 + 0.30 * t
    sig = 0.32 - 0.16 * t
    centres = spread(t) * B
    return -depth * np.sum(np.exp(-((u - centres) ** 2) / (2.0 * sig ** 2)))


def project(u, t):
    """Project developmental coordinates (u, t) onto the isometric 2.5D visual plane."""
    raw_x = _UX * u + _TX * t
    raw_y = TOPY + _UY * u + _TY * t + phi(u, t) * ZS
    x = (raw_x - CENTER_X) * SCALE_S
    y = (raw_y - CENTER_Y) * SCALE_S
    return np.array([x, y, 0.0])


class Cells(Scene):
    def construct(self):
        # 1. Full-bleed background plate (fills the complete card frame)
        self.add(Rectangle(width=config.frame_width, height=config.frame_height,
                           fill_color=FILL, fill_opacity=1.0, stroke_width=0))

        # 2. Soft diffused potential washes at the 3 terminal attractor basins
        basin_accents = [A1, A2, A3]
        for target, col in zip(B, basin_accents):
            pt_end = project(target, 1.0)
            for r_val, op in [(0.52, 0.04), (0.36, 0.09), (0.22, 0.18), (0.12, 0.32)]:
                wash = Dot(pt_end, radius=r_val, color=col).set_opacity(op)
                self.add(wash)

        # 3. Stacked topographic elevation contour terraces
        # Wide domain to comfortably span the entire canvas width
        us = np.concatenate([[-1.50], np.linspace(-1.28, 1.28, 105), [1.50]])
        slices = np.linspace(0, 1, 36)

        for t in slices:
            pts = [project(u, t) for u in us]
            # Opaque polygon skirt occludes ridges behind it
            fillpoly = Polygon(*pts, [pts[-1][0], BASELINE, 0], [pts[0][0], BASELINE, 0],
                               stroke_width=0, fill_color=FILL, fill_opacity=1.0)
            self.add(fillpoly)

            # Contour terrace edge line
            line = VMobject().set_points_as_corners(pts)
            # Subtle depth gradient: foreground ridges are darker & crisper
            t_fade = 0.52 + 0.45 * t
            line.set_stroke(INK, width=CONTOUR_STROKE, opacity=CONTOUR_OPACITY * t_fade)
            self.add(line)

        # 4. RNA Velocity vectors (developmental gradient arrows down the valley flanks)
        for t_v in [0.38, 0.60, 0.80]:
            for target_idx, (target, col) in enumerate(zip(B, basin_accents)):
                u_center = spread(t_v) * target
                for side, u_shift in [(-1, -0.12), (1, 0.12)]:
                    u_v = u_center + u_shift
                    p_start = project(u_v, t_v)
                    grad_u = (phi(u_v + 0.02, t_v) - phi(u_v - 0.02, t_v)) / 0.04
                    p_next = project(u_v - 0.20 * grad_u, t_v + 0.05)
                    v_vec = p_next - p_start
                    v_norm = np.linalg.norm(v_vec)
                    if v_norm > 0.01:
                        v_dir = v_vec / v_norm
                        len_arr = 0.095
                        p_end = p_start + v_dir * len_arr
                        arr = Arrow(p_start, p_end, buff=0, stroke_width=2.4,
                                    max_tip_length_to_length_ratio=0.45,
                                    tip_length=0.048, color=col)
                        arr.set_opacity(0.70)
                        self.add(arr)

        # 5. Cellular Lineage Trajectory Curves (Guide Filaments)
        # 6 trajectories (2 per fate) calculated with dense numerical resolution
        lineage_trajectories = []
        accents_per_traj = []

        offsets_per_fate = [
            [-0.035, -0.015],  # Left fate (Oxide)
            [-0.004,  0.004],  # Centre fate (Sage)
            [ 0.015,  0.035],  # Right fate (Blue)
        ]

        for fate_idx, (target, col) in enumerate(zip(B, basin_accents)):
            kicks = offsets_per_fate[fate_idx]
            for sub_idx, kick in enumerate(kicks):
                path = []
                n_t_steps = 90
                for t in np.linspace(0, 1, n_t_steps):
                    tau = t ** 2.2
                    noise = 0.012 * np.sin(2.5 * np.pi * t + sub_idx * 1.5) * (t * (1.0 - t))
                    u = kick * (1.0 - tau) + target * tau + noise
                    path.append(project(u, t))
                
                lineage_trajectories.append(path)
                accents_per_traj.append((col, fate_idx, sub_idx))

        # Static guide curves
        for path, (col, fate_idx, sub_idx) in zip(lineage_trajectories, accents_per_traj):
            curve = VMobject().set_points_smoothly(path)
            curve.set_stroke(col, width=1.6, opacity=0.38)
            self.add(curve)

        # Terminal attractor destination dots
        for target, col in zip(B, basin_accents):
            pt_end = project(target, 1.0)
            self.add(Dot(pt_end, radius=0.075, color=col).set_opacity(0.90))
            self.add(Circle(radius=0.13, stroke_width=1.5, stroke_color=col).move_to(pt_end).set_stroke(opacity=0.45))

        # Pluripotent progenitor crest origin dot
        pt_origin = project(0.0, 0.0)
        self.add(Dot(pt_origin, radius=0.068, color=INK).set_opacity(0.80))
        self.add(Circle(radius=0.12, stroke_width=1.2, stroke_color=INK).move_to(pt_origin).set_stroke(opacity=0.40))

        # 6. DYNAMIC ANIMATION: Rolling Cell Marbles & Cometary Tails
        T_LOOP = 3.0
        time_tracker = ValueTracker(0.0)

        # We deploy 6 rolling cells (1 per trajectory) staggered across the 3-second cycle
        cell_mobjects = []

        for traj_idx, (path, (col, fate_idx, sub_idx)) in enumerate(zip(lineage_trajectories, accents_per_traj)):
            n_pts = len(path)
            # Evenly distribute launch phases so cells continually roll down in a rhythmic sequence
            phase_offset = (traj_idx / 6.0) % 1.0

            # Tail comet
            tail_mob = VMobject()
            # Main glowing cell sphere
            outer_glow = Dot(radius=0.095, color=col).set_opacity(0.35)
            core_dot   = Dot(radius=0.062, color=col).set_opacity(0.95)

            self.add(tail_mob, outer_glow, core_dot)
            cell_mobjects.append((tail_mob, outer_glow, core_dot, path, n_pts, col, phase_offset))

        def make_cell_updater(tail_m, glow_m, dot_m, pts, n_pts, col, offset):
            def updater(dt):
                t = time_tracker.get_value()
                # Phase runs from 0.0 to 1.0 (developmental progression t)
                phase = ((t / T_LOOP) + offset) % 1.0

                idx = int(phase * (n_pts - 1))
                pos = pts[idx]

                # Position cell
                glow_m.move_to(pos)
                dot_m.move_to(pos)

                # Fade in at start, stay solid during roll, fade gracefully into basin
                if phase < 0.08:
                    alpha = phase / 0.08
                elif phase > 0.90:
                    alpha = (1.0 - phase) / 0.10
                else:
                    alpha = 1.0

                dot_m.set_opacity(alpha * 0.95)
                glow_m.set_opacity(alpha * 0.38)

                # Tail: trace past 14 points behind the cell
                tail_len = int(12 + 10 * phase)
                start_tail = max(0, idx - tail_len)
                if idx - start_tail > 2:
                    sub_pts = pts[start_tail:idx + 1]
                    tail_m.set_points_smoothly(sub_pts)
                    tail_m.set_stroke(col, width=2.8 * alpha, opacity=0.75 * alpha)
                else:
                    tail_m.set_stroke(opacity=0)

            return updater

        for tail_m, glow_m, dot_m, pts, n_pts, col, offset in cell_mobjects:
            up = make_cell_updater(tail_m, glow_m, dot_m, pts, n_pts, col, offset)
            dot_m.add_updater(lambda m, dt, u=up: u(dt))

        # 7. Attractor Destination Pulsing Resonance Rings
        # When cells roll into their valleys, ripple waves radiate outward
        ripple_mobs = []
        for fate_idx, (target, col) in enumerate(zip(B, basin_accents)):
            pt_end = project(target, 1.0)
            ripple = Circle(radius=0.10, stroke_width=1.8, stroke_color=col).move_to(pt_end)
            self.add(ripple)
            # Offset corresponds to when cells arrive
            ripple_mobs.append((ripple, pt_end, col, (fate_idx * 0.33) % 1.0))

        def make_ripple_updater(rip, pt, col, off):
            def updater(m):
                t = time_tracker.get_value()
                # 2 pulses per loop
                cycle = (2.0 * (t / T_LOOP) + off) % 1.0
                rad = 0.08 + 0.28 * cycle
                op  = 0.70 * (1.0 - cycle) ** 1.5
                w   = 2.2 * (1.0 - 0.5 * cycle)
                m.become(Circle(radius=rad, stroke_width=w, stroke_color=col).move_to(pt))
                m.set_stroke(opacity=op)
            return updater

        for rip, pt, col, off in ripple_mobs:
            rip.add_updater(make_ripple_updater(rip, pt, col, off))

        # Render the 3.0-second seamless loop
        self.play(time_tracker.animate.set_value(T_LOOP), run_time=T_LOOP, rate_func=linear)
