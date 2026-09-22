"""Tea Between Simulations — Hydrodynamic Vortex Dipole & Fluid Streamlines.

A true 2D fluid mechanics simulation of tea liquor eddies and swirling flow:
- Counter-rotating vortex dipole with viscous cores (Lamb-Oseen profile)
  * Left vortex: Clockwise rotation
  * Right vortex: Counter-clockwise rotation
- Incompressible stream function with container boundary recirculation
- Einstein tea-leaf secondary radial inflow drawing fluid into vortex centers
- RK4 numerical integration of fluid streamlines across the full card area
- Smoothly gliding fluid streamlets with tapered heads/tails for seamless 3.0s looping
- High-precision hydrodynamic vector field with adaptive streamlet vectors
- Translucent tea liquor washes in authentic steeped tea hues
- Rendered in light and dark variants. ABSOLUTELY ZERO isolated dots.
"""
import os
import numpy as np
from manim import (Scene, VMobject, Arrow, Dot, Rectangle,
                   ManimColor, config, interpolate_color, Line, ValueTracker, linear)

config.frame_height = 2.6
config.frame_width  = config.frame_height * 1.5

INK_VAL = os.environ.get("INK", "#211512")
FILL_VAL = os.environ.get("FILL", "#f4f0e8")
IS_DARK = (FILL_VAL.lower() in ["#191212", "#181212", "#110e0e"] or "dark" in os.environ.get("THEME", "").lower())

INK  = ManimColor(INK_VAL)
FILL = ManimColor(FILL_VAL)

if IS_DARK:
    TEA_HUES = [
        ManimColor("#8e301a"),  # deep pu-erh leaf
        ManimColor("#b24420"),  # copper tannin
        ManimColor("#d06130"),  # amber liquor
        ManimColor("#e27e3e"),  # roasted oolong
        ManimColor("#efa252"),  # golden malt
        ManimColor("#f6c46c"),  # honey tips
        ManimColor("#fbe29a"),  # delicate steam
    ]
    ACCENT = ManimColor("#d4b06a")
else:
    TEA_HUES = [
        ManimColor("#44130a"),  # deep pu-erh tannin
        ManimColor("#661f10"),  # dark steeped tannin
        ManimColor("#8a341a"),  # assam amber
        ManimColor("#ad5026"),  # ceylon copper
        ManimColor("#c57432"),  # roasted oolong
        ManimColor("#d99644"),  # golden tips
        ManimColor("#e9bf6a"),  # light infusion
    ]
    ACCENT = ManimColor("#c89a52")

# Domain geometry: expanded to fill the complete 3.9 x 2.6 card canvas
W, H = 1.92, 1.28
x0 = 0.90
rc = 0.35
gamma = 3.5
sink_alpha = 0.20

def stream_function(x, y):
    # Boundary envelope: vanishes at +/-W and +/-H to enforce wall tangency
    bx = np.clip(1.0 - (x / W)**4, 0.0, 1.0)
    by = np.clip(1.0 - (y / H)**4, 0.0, 1.0)
    B = bx * by

    # Vortex dipole: Left (x = -x0, CW: -gamma), Right (x = +x0, CCW: +gamma)
    r1_sq = (x + x0)**2 + y**2 + rc**2
    r2_sq = (x - x0)**2 + y**2 + rc**2
    psi_dipole = (gamma / (4.0 * np.pi)) * (np.log(r2_sq) - np.log(r1_sq))

    # Mild shear wave along central mixing zone
    psi_shear = 0.05 * np.sin(2.0 * np.pi * x / W) * np.cos(np.pi * y / H)

    return (psi_dipole + psi_shear) * B

def get_velocity(p):
    x, y = p[0], p[1]
    eps = 1e-4

    # Numerical derivatives of stream function: u = d(psi)/dy, v = -d(psi)/dx
    psi_y_p = stream_function(x, y + eps)
    psi_y_m = stream_function(x, y - eps)
    u = (psi_y_p - psi_y_m) / (2.0 * eps)

    psi_x_p = stream_function(x + eps, y)
    psi_x_m = stream_function(x - eps, y)
    v = -(psi_x_p - psi_x_m) / (2.0 * eps)

    # Inward secondary drift (Einstein tea leaf sink)
    bx = np.clip(1.0 - (x / W)**4, 0.0, 1.0)
    by = np.clip(1.0 - (y / H)**4, 0.0, 1.0)
    B = bx * by

    r1_sq = (x + x0)**2 + y**2
    r1 = np.sqrt(r1_sq) + 1e-4
    s1 = sink_alpha * (1.0 - np.exp(-r1_sq / (rc**2))) / (r1 + 0.12)

    r2_sq = (x - x0)**2 + y**2
    r2 = np.sqrt(r2_sq) + 1e-4
    s2 = sink_alpha * (1.0 - np.exp(-r2_sq / (rc**2))) / (r2 + 0.12)

    u -= (s1 * (x + x0) + s2 * (x - x0)) * B
    v -= (s1 * y + s2 * y) * B

    return np.array([u, v, 0.0])

def rk4_step(p, dt):
    k1 = get_velocity(p)
    k2 = get_velocity(p + 0.5 * dt * k1)
    k3 = get_velocity(p + 0.5 * dt * k2)
    k4 = get_velocity(p + dt * k3)
    return p + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


class Tea(Scene):
    def construct(self):
        # 1. Full-bleed background plate
        self.add(Rectangle(width=config.frame_width, height=config.frame_height,
                           fill_color=FILL, fill_opacity=1.0, stroke_width=0))

        # 2. Soft diffused tea liquor wash at eddy cores
        for sgn in [-1, 1]:
            xc = sgn * x0
            for r_val, op, col_idx in [(1.30, 0.035, 6), (1.00, 0.06, 5), (0.75, 0.10, 4), (0.52, 0.15, 3), (0.32, 0.22, 2), (0.16, 0.38, 1)]:
                wash = Dot(np.array([xc, 0.0, 0.0]), radius=r_val, color=TEA_HUES[col_idx]).set_opacity(op)
                self.add(wash)

        # High-precision hydrodynamic vector field (bold stream-aligned arrows)
        y_vals = np.linspace(-H * 0.86, H * 0.86, 17)
        for i, py in enumerate(y_vals):
            x_shift = 0.04 if (i % 2 == 1) else 0.0
            x_vals = np.linspace(-W * 0.88 + x_shift, W * 0.88, 23)
            for px in x_vals:
                if abs(px) > W * 0.94:
                    continue
                v = get_velocity(np.array([px, py, 0.0]))
                speed = np.linalg.norm(v)
                if speed > 0.05:
                    v_dir = v / speed
                    len_seg = min(0.125, 0.055 + 0.04 * speed)
                    p_start = np.array([px - 0.5 * len_seg * v_dir[0], py - 0.5 * len_seg * v_dir[1], 0.0])
                    p_end   = np.array([px + 0.5 * len_seg * v_dir[0], py + 0.5 * len_seg * v_dir[1], 0.0])
                    
                    d_core = min(np.sqrt((px + x0)**2 + py**2), np.sqrt((px - x0)**2 + py**2))
                    col_factor = np.clip(1.0 - d_core / 1.5, 0.0, 1.0)
                    if IS_DARK:
                        col = interpolate_color(ACCENT, ManimColor("#ffe0a0"), col_factor)
                    else:
                        col = interpolate_color(ManimColor("#7a4f24"), ManimColor("#381e0d"), col_factor)
                    op = np.clip(0.52 + 0.42 * col_factor, 0.48, 0.95)
                    
                    arr = Arrow(p_start, p_end, buff=0, stroke_width=2.2,
                                max_tip_length_to_length_ratio=0.50,
                                tip_length=0.050, color=col)
                    arr.set_opacity(op)
                    self.add(arr)

        # RK4 Fluid Streamlines
        seed_points = []
        # Central shear seeds
        for ys in np.linspace(-0.78, 0.78, 14):
            seed_points.append(np.array([0.0, ys, 0.0]))
            seed_points.append(np.array([-0.16, ys, 0.0]))
            seed_points.append(np.array([0.16, ys, 0.0]))
            seed_points.append(np.array([-0.32, ys, 0.0]))
            seed_points.append(np.array([0.32, ys, 0.0]))
        
        # Radiating eddy seeds covering the vortices
        for r_s in [0.42, 0.68, 0.96, 1.22]:
            for th_s in np.linspace(0, 2 * np.pi, 10, endpoint=False):
                seed_points.append(np.array([-x0 + r_s * np.cos(th_s), r_s * np.sin(th_s) * 0.85, 0.0]))
                seed_points.append(np.array([x0 + r_s * np.cos(th_s), r_s * np.sin(th_s) * 0.85, 0.0]))

        # Bottom / top recirculation seeds
        for xs in np.linspace(-W * 0.75, W * 0.75, 11):
            seed_points.append(np.array([xs, -H * 0.80, 0.0]))
            seed_points.append(np.array([xs, H * 0.80, 0.0]))

        dt = 0.012
        n_steps = 280

        computed_trajectories = []
        for idx, p0 in enumerate(seed_points):
            p = p0.copy()
            pts = [p.copy()]
            for step in range(n_steps):
                p = rk4_step(p, dt)
                if abs(p[0]) > W * 0.97 or abs(p[1]) > H * 0.97:
                    break
                d1 = np.sqrt((p[0] + x0)**2 + p[1]**2)
                d2 = np.sqrt((p[0] - x0)**2 + p[1]**2)
                pts.append(p.copy())
                if d1 < 0.032 or d2 < 0.032:
                    break
            
            if len(pts) > 18:
                # Subsample points for smooth representation
                sampled_pts = pts[::2]
                computed_trajectories.append((sampled_pts, idx))

        # Add static guide streamline filaments
        for sampled_pts, idx in computed_trajectories:
            curve = VMobject().set_points_smoothly(sampled_pts)
            col = TEA_HUES[idx % len(TEA_HUES)]
            curve.set_stroke(col, width=0.80, opacity=0.22)
            self.add(curve)

        # Dynamic Fluid Streamlet Pulses (NO DOTS, pure fluid filament flows)
        T_LOOP = 3.0
        time_tracker = ValueTracker(0.0)

        # Select a representative subset of trajectories for fluid motion
        animated_traj_subset = computed_trajectories[::2]
        streamlet_mobs = []

        for sampled_pts, idx in animated_traj_subset:
            col = TEA_HUES[idx % len(TEA_HUES)]
            n_pts = len(sampled_pts)
            for k in range(2):
                u_offset = k / 2.0
                streamlet = VMobject()
                self.add(streamlet)
                streamlet_mobs.append((streamlet, sampled_pts, n_pts, col, u_offset))

        def make_streamlet_updater(mob, pts_list, n_pts, col, u_offset):
            def updater(m):
                t = time_tracker.get_value()
                phase = ((t / T_LOOP) + u_offset) % 1.0
                
                # Window of points along trajectory
                window_size = max(5, int(n_pts * 0.22))
                center_idx = int(phase * n_pts)
                start_idx = max(0, center_idx - window_size // 2)
                end_idx = min(n_pts, start_idx + window_size)

                if end_idx - start_idx > 3:
                    sub_pts = pts_list[start_idx:end_idx]
                    m.set_points_smoothly(sub_pts)
                    # Fade near edges of trajectory
                    prog = center_idx / float(n_pts)
                    alpha = np.sin(np.pi * prog) ** 0.8
                    m.set_stroke(col, width=1.3 + 1.1 * prog, opacity=alpha * 0.85)
                else:
                    m.set_stroke(opacity=0)
            return updater

        for mob, pts_list, n_pts, col, u_offset in streamlet_mobs:
            mob.add_updater(make_streamlet_updater(mob, pts_list, n_pts, col, u_offset))

        self.play(time_tracker.animate.set_value(T_LOOP), run_time=T_LOOP, rate_func=linear)
