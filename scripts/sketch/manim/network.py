"""Small Worlds at Dusk — Watts-Strogatz Circular Network with Curved Arc Shortcuts & Signal Dynamics.

A faithful, publication-grade circular small-world network simulation:
- 1:1 circular geometry centered gracefully on the 3:2 card plate.
- N = 20 nodes with k = 2 regular lattice connections (outer scalloped circumference
  and inner concentric arcs).
- Rewired long-range shortcut chords drawn as graceful curved Bézier arcs bowing
  through the interior cavity.
- Permanent stationary nodes with filled cores and technical ink borders.
- Dynamic Small-World Signal Transmission:
  * A luminous signal beam sweeps along the curved shortcut arc across the circle.
  * Target node catches the pulse, activating its local neighborhood along perimeter arcs.
  * Secondary shortcut carries a transversal bridge pulse to demonstrate global reach.
  * Seamless 3.0s looping animation for both Light and Dark theme variants.
"""
import os
import numpy as np
from manim import (Scene, VMobject, Dot, Circle, Rectangle,
                   ManimColor, config, ValueTracker, linear)

config.frame_height = 2.6
config.frame_width  = config.frame_height * 1.5

INK_VAL  = os.environ.get("INK",  "#211512")
FILL_VAL = os.environ.get("FILL", "#f4f0e8")
IS_DARK  = (FILL_VAL.lower() in ["#191212", "#181212", "#110e0e"] or "dark" in os.environ.get("THEME", "").lower())

INK  = ManimColor(INK_VAL)
FILL = ManimColor(FILL_VAL)

if IS_DARK:
    ACCENT        = ManimColor(os.environ.get("ACCENT", "#8fa0cb"))  # luminous dusk periwinkle
    ACCENT_BEAM   = ManimColor("#ffffff")                           # bright traveling spark
    ACCENT_PULSE  = ManimColor("#d8e4fc")                           # active node pulse
    EDGE_BASE_OP  = 0.40
    SHORTCUT_OP   = 0.90
else:
    ACCENT        = ManimColor(os.environ.get("ACCENT", "#6b7fb0"))  # classic dusk cobalt
    ACCENT_BEAM   = ManimColor("#1b2d56")                           # deep traveling beam
    ACCENT_PULSE  = ManimColor("#3a528c")                           # active node pulse
    EDGE_BASE_OP  = 0.50
    SHORTCUT_OP   = 0.92


class Network(Scene):
    def construct(self):
        # 1. Full-bleed background plate
        self.add(Rectangle(width=config.frame_width, height=config.frame_height,
                           fill_color=FILL, fill_opacity=1.0, stroke_width=0))

        # 2. Circular Watts-Strogatz Topology (1:1 circular aspect ratio)
        N = 20
        R = 0.98  # Radius of circle, perfectly proportioned inside 2.6 card height
        angles = [np.pi/2 - i * (2*np.pi / N) for i in range(N)]
        pos = [np.array([R * np.cos(a), R * np.sin(a), 0.0]) for a in angles]

        # Regular ring lattice (k = 2: nearest + next-nearest)
        edges_d1 = [(i, (i + 1) % N) for i in range(N)]
        
        # Rewired long-range shortcuts (curved chords bowing across interior)
        # 4 clean shortcuts connecting distant sectors:
        # Shortcut 1: node 18 (~10:48) to node 7 (~4:12)
        # Shortcut 2: node 16 (~9:36) to node 8 (~4:48)
        # Shortcut 3: node 17 (~10:12) to node 4 (~2:24)
        # Shortcut 4: node 1 (~12:36) to node 10 (~6:00)
        rewired_from = {18: 7, 16: 8, 17: 4, 1: 10}
        
        edges_d2 = []
        shortcuts = []
        for i in range(N):
            j = (i + 2) % N
            if i in rewired_from:
                shortcuts.append((i, rewired_from[i]))
            else:
                edges_d2.append((i, j))

        shortcut_nodes = set([u for e in shortcuts for u in e])

        def build_curved_arc(u, v, kind):
            p_u = pos[u]
            p_v = pos[v]
            d_idx = min((u - v) % N, (v - u) % N)
            
            mid_angle = (angles[u] + angles[v]) / 2.0
            if abs(angles[u] - angles[v]) > np.pi:
                mid_angle += np.pi

            if kind == "outer":
                p_mid = np.array([1.045 * R * np.cos(mid_angle), 1.045 * R * np.sin(mid_angle), 0.0])
            elif kind == "d2":
                p_mid = np.array([0.865 * R * np.cos(mid_angle), 0.865 * R * np.sin(mid_angle), 0.0])
            else: # shortcut chord
                r_mid = max(0.18 * R, 0.62 * R * np.cos(d_idx * np.pi / N))
                p_mid = np.array([r_mid * np.cos(mid_angle), r_mid * np.sin(mid_angle), 0.0])

            return VMobject().set_points_smoothly([p_u, p_mid, p_v])

        # 3. Static Base Graph
        # Outer ring perimeter arcs
        for u, v in edges_d1:
            arc = build_curved_arc(u, v, "outer")
            arc.set_stroke(color=INK, width=1.5, opacity=EDGE_BASE_OP)
            self.add(arc)

        # Distance-2 inner arcs
        for u, v in edges_d2:
            arc = build_curved_arc(u, v, "d2")
            arc.set_stroke(color=INK, width=1.4, opacity=EDGE_BASE_OP * 0.85)
            self.add(arc)

        # Long-range shortcut chords (accent linework)
        shortcut_curves = {}
        for u, v in shortcuts:
            arc = build_curved_arc(u, v, "shortcut")
            arc.set_stroke(color=ACCENT, width=2.4, opacity=SHORTCUT_OP)
            self.add(arc)
            shortcut_curves[(u, v)] = arc

        # Static node anchors (permanent, filled with border)
        node_radius = 0.052
        for i in range(N):
            is_sc = i in shortcut_nodes
            # Base dot
            dot = Dot(pos[i], radius=node_radius, color=ACCENT if is_sc else INK)
            dot.set_opacity(0.85 if is_sc else 0.40)
            # Crisp outline border
            border = Circle(radius=node_radius, stroke_color=INK, stroke_width=2.0).move_to(pos[i])
            self.add(dot, border)

        # 4. DYNAMICS: The Small-World Signal Cascade
        T_LOOP = 3.0
        time_tracker = ValueTracker(0.0)

        # Cascade Sequence:
        # Event 1: Origin cluster around node 18 activates (tau in [0.05, 0.32])
        # Event 2: Shortcut beam travels along curved arc (18 -> 7) during tau in [0.18, 0.46]
        # Event 3: Destination cluster around node 7 & 8 activates (tau in [0.42, 0.68])
        # Event 4: Shortcut beam travels along curved arc (16 -> 8) or (17 -> 4) during tau in [0.58, 0.84]
        # Event 5: Transverse cluster around node 4 activates (tau in [0.80, 0.95])
        # Event 6: Gentle relaxation back to quiescent state by tau = 1.00

        def get_node_activation(i, tau):
            act = 0.0
            # Cluster 1: Around node 18 (nodes 17, 18, 19)
            if i in [17, 18, 19]:
                dist = abs(i - 18)
                t_peak = 0.16 + 0.04 * dist
                d = abs(tau - t_peak)
                act = max(act, (1.0 - 0.20 * dist) * np.exp(-(d**2) / 0.005))

            # Cluster 2: Around node 7 & 8 (nodes 6, 7, 8, 9)
            if i in [6, 7, 8, 9]:
                dist = min(abs(i - 7), abs(i - 8))
                t_peak = 0.46 + 0.04 * dist
                d = abs(tau - t_peak)
                act = max(act, (1.0 - 0.18 * dist) * np.exp(-(d**2) / 0.005))

            # Cluster 3: Around node 4 (nodes 3, 4, 5)
            if i in [3, 4, 5]:
                dist = abs(i - 4)
                t_peak = 0.82 + 0.04 * dist
                d = abs(tau - t_peak)
                act = max(act, (1.0 - 0.20 * dist) * np.exp(-(d**2) / 0.005))

            return np.clip(act, 0.0, 1.0)

        # Dynamic Node Activation Glow (STATIONARY NODES!)
        node_glow_dots = []
        for i in range(N):
            glow = Dot(pos[i], radius=node_radius, color=ACCENT_PULSE if IS_DARK else ACCENT).set_opacity(0)
            self.add(glow)
            node_glow_dots.append((i, glow))

        def make_node_updater(i, g_dot):
            def updater(m):
                t = time_tracker.get_value()
                tau = (t / T_LOOP) % 1.0
                act = get_node_activation(i, tau)
                g_dot.set_opacity(0.95 * act)
            return updater

        for i, g_dot in node_glow_dots:
            g_dot.add_updater(make_node_updater(i, g_dot))

        # Dynamic Traveling Beams on Curved Shortcut Arcs
        # Signal 1: node 18 -> node 7 along curved arc during tau in [0.18, 0.46]
        # Signal 2: node 17 -> node 4 along curved arc during tau in [0.58, 0.82]
        cascade_beams = [
            (18, 7, 0.18, 0.46),
            (17, 4, 0.58, 0.82),
        ]

        beam_actors = []
        for u, v, t_start, t_end in cascade_beams:
            # Generate finely sampled points along the curved arc
            base_arc = build_curved_arc(u, v, "shortcut")
            pts = [base_arc.point_from_proportion(p) for p in np.linspace(0.0, 1.0, 60)]
            
            beam_line = VMobject().set_stroke(color=ACCENT_BEAM, width=4.0, opacity=0)
            self.add(beam_line)
            beam_actors.append((pts, t_start, t_end, beam_line))

        def make_beam_updater(pts, t_start, t_end, b_line):
            n_pts = len(pts)
            def updater(m):
                t = time_tracker.get_value()
                tau = (t / T_LOOP) % 1.0
                if t_start <= tau <= t_end:
                    prog = (tau - t_start) / (t_end - t_start)
                    # Length of traveling beam segment
                    beam_frac = 0.32
                    head = np.clip(prog * (1.0 + beam_frac), 0.0, 1.0)
                    tail = np.clip(head - beam_frac, 0.0, 1.0)
                    
                    idx_start = int(tail * (n_pts - 1))
                    idx_end   = int(head * (n_pts - 1))
                    if idx_end > idx_start:
                        sub_pts = pts[idx_start:idx_end + 1]
                        b_line.set_points_as_corners(sub_pts)
                        # Fade in/out at extremities
                        intensity = np.sin(np.pi * prog) ** 0.6
                        b_line.set_stroke(color=ACCENT_BEAM, width=4.0, opacity=0.95 * intensity)
                    else:
                        b_line.set_stroke(opacity=0)
                else:
                    b_line.set_stroke(opacity=0)
            return updater

        for pts, t_start, t_end, b_line in beam_actors:
            b_line.add_updater(make_beam_updater(pts, t_start, t_end, b_line))

        # Dynamic Perimeter Arc Illumination during local spreading
        ring_glow_arcs = []
        for u, v in edges_d1:
            g_arc = build_curved_arc(u, v, "outer")
            g_arc.set_stroke(color=ACCENT, width=2.6, opacity=0)
            self.add(g_arc)
            ring_glow_arcs.append((u, v, g_arc))

        def make_ring_glow_updater(u, v, g_arc):
            def updater(m):
                t = time_tracker.get_value()
                tau = (t / T_LOOP) % 1.0
                act_u = get_node_activation(u, tau)
                act_v = get_node_activation(v, tau)
                flux = 0.5 * (act_u + act_v) * (min(act_u, act_v) ** 0.5)
                g_arc.set_stroke(opacity=0.85 * np.clip(flux, 0.0, 1.0))
            return updater

        for u, v, g_arc in ring_glow_arcs:
            g_arc.add_updater(make_ring_glow_updater(u, v, g_arc))

        # 5. Play seamless limit cycle
        self.play(time_tracker.animate.set_value(T_LOOP), run_time=T_LOOP, rate_func=linear)
