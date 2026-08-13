"""Small Worlds at Dusk — a Watts-Strogatz small-world network, force-directed.

A ring lattice with a few edges rewired into long-range shortcuts, then laid out
with a spring (Fruchterman-Reingold) layout so it reads as an organic network, not
dots on a ring. Shortcuts and hubs carry the blue accent. Two variants. 3:2.
"""
import os
import numpy as np
from manim import Scene, Line, Dot, Circle, VGroup, ManimColor, config

INK = ManimColor(os.environ.get("INK", "#211512"))
ACCENT = ManimColor(os.environ.get("ACCENT", "#6b7fb0"))

config.frame_height = 2.4
config.frame_width = config.frame_height * 1.5
config.pixel_height = 1000
config.pixel_width = 1500


def build_ws(rng, n, k, p):
    ring, rewired = [], []
    seen = set()
    for i in range(n):
        for j in range(1, k + 1):
            a, b = i, (i + j) % n
            if rng.random() < p:
                c = int(rng.integers(n))
                g = 0
                while (c == a or (min(a, c), max(a, c)) in seen) and g < 60:
                    c = int(rng.integers(n)); g += 1
                edge = (a, c)
                rewired.append(edge)
            else:
                edge = (a, b)
                ring.append(edge)
            seen.add((min(edge), max(edge)))
    return ring, rewired


def spring_layout(n, edges, rng, iters=220):
    P = rng.normal(0, 0.5, (n, 2))
    k = 1.1 / np.sqrt(n)
    temp = 0.5
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b); adj[b].append(a)
    for _ in range(iters):
        disp = np.zeros((n, 2))
        diff = P[:, None, :] - P[None, :, :]
        dist = np.hypot(diff[..., 0], diff[..., 1]) + 1e-6
        rep = (k * k / dist ** 2)[..., None] * diff
        for i in range(n):
            rep[i, i] = 0
        disp += rep.sum(axis=1)
        for a, b in edges:
            d = P[a] - P[b]; dd = np.hypot(*d) + 1e-6
            f = (dd * dd / k) * (d / dd)
            disp[a] -= f; disp[b] += f
        length = np.hypot(disp[:, 0], disp[:, 1]) + 1e-9
        P += (disp / length[:, None]) * np.minimum(length, temp)[:, None]
        temp *= 0.985
    return P


class Network(Scene):
    def construct(self):
        rng = np.random.default_rng(11)
        n, k = 22, 2
        ring, rewired = build_ws(rng, n, k, 0.12)
        P = spring_layout(n, ring + rewired, rng)

        # normalise to the frame, uniform scale (no squishing)
        P -= P.mean(axis=0)
        s = min(1.62 / (np.abs(P[:, 0]).max() + 1e-6), 1.02 / (np.abs(P[:, 1]).max() + 1e-6))
        P *= s
        pos = [np.array([P[i, 0], P[i, 1], 0]) for i in range(n)]

        deg = np.zeros(n)
        for a, b in ring + rewired:
            deg[a] += 1; deg[b] += 1
        hubs = set(int(i) for i in np.argsort(deg)[-4:])

        for a, b in ring:
            self.add(Line(pos[a], pos[b], color=INK).set_stroke(width=1.7, opacity=0.5))
        for a, b in rewired:
            self.add(Line(pos[a], pos[b], color=ACCENT).set_stroke(width=2.5, opacity=0.95))

        marks = VGroup()
        for i in range(n):
            if i in hubs:
                marks.add(Dot(pos[i], radius=0.058, color=ACCENT))
                marks.add(Circle(radius=0.10, stroke_width=2.0, color=ACCENT).move_to(pos[i]))
            else:
                marks.add(Dot(pos[i], radius=0.046, color=INK))
        self.add(marks)
