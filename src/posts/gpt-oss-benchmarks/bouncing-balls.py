#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
A tiny physics demo (no external libraries except the std‑lib ones that are
allowed).  Twenty coloured balls are released from the centre of a regular
heptagon that rotates at 360°/5 s.  The balls feel gravity, a little air
friction, bounce on the rotating walls and collide with one another.
The number drawn on a ball is only a visual aid – the real “spin” of a ball
is stored as an angular velocity (rad s⁻¹) and is damped by friction.

Only the following modules are used:
    tkinter – GUI & drawing
    math, numpy – vector math
    dataclasses, typing – tidy data containers
    sys – for a clean exit
"""

import sys
import math
import numpy as np
import tkinter as tk
from dataclasses import dataclass, field
from typing import List, Tuple

# ----------------------------------------------------------------------
# --------------------------  SETTINGS  --------------------------------
# ----------------------------------------------------------------------
CANVAS_SIZE = 800                     # width == height (pixels)
CENTER = np.array([CANVAS_SIZE / 2, CANVAS_SIZE / 2])

BALL_RADIUS = 20                      # px, all balls have the same size
HEPTAGON_RADIUS = 300                 # distance from centre to a vertex (px)

GRAVITY = np.array([0, 800.0])         # px·s⁻² (downwards)
AIR_FRICTION = 0.02                    # linear velocity damping per second
WALL_RESTITUTION = 0.65                # <1 → bounce height limited
BALL_RESTITUTION = 0.80                # ball‑ball elasticity
SPIN_FRICTION = 0.4                    # angular damping per second

FPS = 60                               # frames per second
DT = 1.0 / FPS                         # simulation step (seconds)

# Heptagon rotation: 360° in 5 s → 2π rad in 5 s
HEPT_ROT_SPEED = 2 * math.pi / 5.0    # rad s⁻¹

# Colours for the 20 balls (exactly the list you gave)
BALL_COLOURS = [
    "#f8b862", "#f6ad49", "#f39800", "#f08300", "#ec6d51",
    "#ee7948", "#ed6d3d", "#ec6800", "#ec6800", "#ee7800",
    "#eb6238", "#ea5506", "#ea5506", "#eb6101", "#e49e61",
    "#e45e32", "#e17b34", "#dd7a56", "#db8449", "#d66a35"
]

# ----------------------------------------------------------------------
# --------------------------  DATA CLASSES -----------------------------
# ----------------------------------------------------------------------
@dataclass
class Ball:
    """All data that belongs to a single ball."""
    idx: int                                 # number drawn on the ball (1‑20)
    colour: str
    pos: np.ndarray = field(default_factory=lambda: CENTER.copy())
    vel: np.ndarray = field(default_factory=lambda: np.zeros(2))
    ang_vel: float = 0.0                     # spin (rad s⁻¹)
    canvas_oval: int = -1                    # Canvas item id for the circle
    canvas_text: int = -1                    # Canvas item id for the number

# ----------------------------------------------------------------------
# --------------------------  PHYSICS HELPERS -------------------------
# ----------------------------------------------------------------------
def rotate_point(p: np.ndarray, angle: float) -> np.ndarray:
    """Rotate a 2‑D point around the origin by *angle* rad."""
    c, s = math.cos(angle), math.sin(angle)
    return np.array([c * p[0] - s * p[1], s * p[0] + c * p[1]])

def heptagon_vertices(angle: float) -> List[np.ndarray]:
    """Return the 7 vertices of the heptagon (counter‑clockwise) for a given rotation."""
    verts = []
    for i in range(7):
        theta = 2 * math.pi * i / 7 + angle
        verts.append(CENTER + HEPTAGON_RADIUS * np.array([math.cos(theta), math.sin(theta)]))
    return verts

def edge_normals(verts: List[np.ndarray]) -> List[np.ndarray]:
    """Compute outward unit normals for each edge (v_i → v_{i+1})."""
    normals = []
    n = len(verts)
    for i in range(n):
        a = verts[i]
        b = verts[(i + 1) % n]
        edge = b - a
        # outward normal = rotate edge +90° (counter‑clockwise polygon → outward)
        nvec = np.array([-edge[1], edge[0]])
        nvec = nvec / np.linalg.norm(nvec)
        normals.append(nvec)
    return normals

def reflect_velocity(v: np.ndarray, n: np.ndarray, restitution: float) -> np.ndarray:
    """Reflect *v* against a wall with normal *n* (unit) applying restitution."""
    v_n = np.dot(v, n) * n           # normal component
    v_t = v - v_n                    # tangential component
    # Invert normal component and damp it by restitution, keep tangential (maybe damp)
    return v_t - restitution * v_n

def resolve_ball_collision(b1: Ball, b2: Ball):
    """Impulse based elastic collision with coefficient *BALL_RESTITUTION*."""
    delta = b2.pos - b1.pos
    dist = np.linalg.norm(delta)
    if dist == 0.0:                     # avoid division by zero – push them apart a bit
        delta = np.random.rand(2) - 0.5
        dist = np.linalg.norm(delta)
    n = delta / dist                    # unit normal from b1 to b2

    # Relative velocity along the normal
    rel_vel = b2.vel - b1.vel
    vel_along_n = np.dot(rel_vel, n)

    # Balls are separating → no impulse needed
    if vel_along_n > 0:
        return

    # Impulse magnitude (equal masses → simple formula)
    j = -(1 + BALL_RESTITUTION) * vel_along_n / 2.0

    impulse = j * n
    b1.vel -= impulse
    b2.vel += impulse

    # Positional correction – push them just enough apart (simple)
    overlap = 2 * BALL_RADIUS - dist
    correction = (overlap / 2.0) * n
    b1.pos -= correction
    b2.pos += correction

# ----------------------------------------------------------------------
# --------------------------  MAIN APPLICATION ------------------------
# ----------------------------------------------------------------------
class HeptagonBouncingApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("20 Balls inside a spinning heptagon")
        self.canvas = tk.Canvas(root, width=CANVAS_SIZE, height=CANVAS_SIZE,
                                bg="white")
        self.canvas.pack()

        # Create the (single) polygon that will be updated each frame
        self.heptagon_id = self.canvas.create_polygon(
            *self._flatten(heptagon_vertices(0.0)),
            outline="black", fill="", width=2)

        # Build balls
        self.balls: List[Ball] = []
        for i in range(20):
            ball = Ball(
                idx=i + 1,
                colour=BALL_COLOURS[i],
                pos=CENTER.copy(),
                vel=np.zeros(2),
                ang_vel=0.0
            )
            # Circle
            x, y = ball.pos
            ball.canvas_oval = self.canvas.create_oval(
                x - BALL_RADIUS, y - BALL_RADIUS,
                x + BALL_RADIUS, y + BALL_RADIUS,
                fill=ball.colour, outline="black")
            # Number (text)
            ball.canvas_text = self.canvas.create_text(
                x, y, text=str(ball.idx), fill="white",
                font=("Helvetica", 12, "bold"))
            self.balls.append(ball)

        # Time keeping
        self.t = 0.0               # elapsed simulation time
        self.rotation_angle = 0.0  # current heptagon rotation

        # Start the loop
        self._step()

    # ------------------------------------------------------------------
    # Helper to turn list of np.ndarray → flat list of numbers for Canvas
    # ------------------------------------------------------------------
    @staticmethod
    def _flatten(pts: List[np.ndarray]) -> List[float]:
        return [float(coord) for p in pts for coord in p]

    # ------------------------------------------------------------------
    def _step(self):
        """One simulation step – called repeatedly via ``after``."""
        # ----- 1. advance time & rotation --------------------------------
        self.t += DT
        self.rotation_angle = (self.rotation_angle + HEPT_ROT_SPEED * DT) % (2 * math.pi)

        # ----- 2. compute current heptagon geometry --------------------
        verts = heptagon_vertices(self.rotation_angle)
        normals = edge_normals(verts)

        # ----- 3. update ball physics ------------------------------------
        for ball in self.balls:
            # a) gravity
            ball.vel += GRAVITY * DT

            # b) air friction (simple linear damping)
            ball.vel *= (1.0 - AIR_FRICTION * DT)
            ball.ang_vel *= (1.0 - SPIN_FRICTION * DT)

            # c) move
            ball.pos += ball.vel * DT

        # ----- 4. ball‑ball collisions ------------------------------------
        n = len(self.balls)
        for i in range(n):
            for j in range(i + 1, n):
                b1, b2 = self.balls[i], self.balls[j]
                if np.linalg.norm(b2.pos - b1.pos) < 2 * BALL_RADIUS:
                    resolve_ball_collision(b1, b2)

        # ----- 5. wall collisions (with rotating walls) ------------------
        for ball in self.balls:
            for v, nrm in zip(verts, normals):
                # vector from vertex to ball centre
                to_center = ball.pos - v
                dist = np.dot(to_center, nrm)          # signed distance to wall
                if dist < BALL_RADIUS:
                    # Ball is penetrating – check if it is moving into the wall
                    if np.dot(ball.vel, nrm) < 0:
                        # Reflect the velocity
                        ball.vel = reflect_velocity(ball.vel, nrm, WALL_RESTITUTION)
                        # Push the ball just outside the wall
                        ball.pos -= (BALL_RADIUS - dist) * nrm
                    # else: ball is already inside but moving away → just push out
                    else:
                        ball.pos -= (BALL_RADIUS - dist) * nrm

        # ----- 6. keep balls inside the circum‑circle (a safety net) -----
        max_dist = HEPTAGON_RADIUS - BALL_RADIUS
        for ball in self.balls:
            vec = ball.pos - CENTER
            d = np.linalg.norm(vec)
            if d > max_dist:
                # project back onto the allowed circle
                ball.pos = CENTER + vec / d * max_dist
                # reflect velocity against the radial direction
                n = vec / d
                ball.vel = reflect_velocity(ball.vel, n, WALL_RESTITUTION)

        # ----- 7. redraw everything ---------------------------------------
        #   a) heptagon
        self.canvas.coords(self.heptagon_id, *self._flatten(verts))

        #   b) balls
        for ball in self.balls:
            x, y = ball.pos
            self.canvas.coords(
                ball.canvas_oval,
                x - BALL_RADIUS, y - BALL_RADIUS,
                x + BALL_RADIUS, y + BALL_RADIUS)
            self.canvas.coords(ball.canvas_text, x, y)

        # ----- 8. schedule next frame ------------------------------------
        self.root.after(int(DT * 1000), self._step)


# ----------------------------------------------------------------------
def main():
    root = tk.Tk()
    app = HeptagonBouncingApp(root)
    root.protocol("WM_DELETE_WINDOW", lambda: (root.destroy(), sys.exit()))
    root.mainloop()


if __name__ == "__main__":
    main()
