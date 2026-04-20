
#!/usr/bin/env python3
"""
Spinning Heptagon with 20 Bouncing Balls
-----------------------------------------

- 20 balls, numbered 1–20, all the same radius.
- Balls drop from the centre, are affected by gravity and friction,
  collide with each other and with the rotating walls of a heptagon.
- The heptagon spins 360° every 5 seconds.
- No external graphics libraries are used; everything is drawn with tkinter.
- Collision detection and response are written from scratch.

Run the script with a standard Python interpreter (Tkinter required).
"""

import tkinter as tk
import math
import numpy as np
from dataclasses import dataclass, field
from typing import List, Tuple

# ----------------------------------------------------------------------
# Configuration constants
# ----------------------------------------------------------------------
WIDTH = 800
HEIGHT = 800
CENTER = np.array([WIDTH / 2.0, HEIGHT / 2.0], dtype=float)

NUM_BALLS = 20
BALL_RADIUS = 15.0
HEPTAGON_RADIUS = 300.0          # distance from centre to a vertex
GRAVITY = 500.0                  # px / s²
TIME_STEP = 1.0 / 60.0           # simulation step (seconds)

# Damping factors to model friction / air resistance
LINEAR_DAMPING = 0.998
ANGULAR_DAMPING = 0.995

# Coefficients used in collisions
BALL_RESTITUTION = 0.8
WALL_RESTITUTION = 0.6
FRICTION_COEFF = 0.2            # same for ball‑ball and ball‑wall

# Colours for the balls (exact order you supplied)
BALL_COLOURS = [
    "#f8b862", "#f6ad49", "#f39800", "#f08300", "#ec6d51",
    "#ee7948", "#ed6d3d", "#ec6800", "#ec6800", "#ee7800",
    "#eb6238", "#ea5506", "#ea5506", "#eb6101", "#e49e61",
    "#e45e32", "#e17b34", "#dd7a56", "#db8449", "#d66a35"
]

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------
def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min_val and max_val."""
    return max(min_val, min(value, max_val))


def nearest_point_on_segment(p: np.ndarray, a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Return the nearest point on segment AB to point P."""
    ap = p - a
    ab = b - a
    ab_sq = np.dot(ab, ab)
    if ab_sq == 0.0:
        return a.copy()
    t = np.dot(ap, ab) / ab_sq
    t = clamp(t, 0.0, 1.0)
    return a + t * ab


# ----------------------------------------------------------------------
# Data classes
# ----------------------------------------------------------------------
@dataclass
class Heptagon:
    """Rotating regular heptagon."""
    centre: np.ndarray
    radius: float                     # circumscribed radius (vertex distance)
    angular_vel: float = 2 * math.pi / 5.0   # rad/s → 360° per 5 s
    angle: float = 0.0                # current orientation

    def vertices(self) -> List[np.ndarray]:
        """List of the 7 vertices in world coordinates."""
        verts = []
        for i in range(7):
            theta = self.angle + 2 * math.pi * i / 7
            x = self.centre[0] + self.radius * math.cos(theta)
            y = self.centre[1] + self.radius * math.sin(theta)
            verts.append(np.array([x, y], dtype=float))
        return verts

    def edges(self) -> List[Tuple[np.ndarray, np.ndarray]]:
        """List of 7 edges as (start, end) point pairs."""
        verts = self.vertices()
        return [(verts[i], verts[(i + 1) % 7]) for i in range(7)]

    def update(self, dt: float):
        """Advance the rotation by dt seconds."""
        self.angle = (self.angle + self.angular_vel * dt) % (2 * math.pi)


@dataclass
class Ball:
    """A single ball with visual representation."""
    id: int
    position: np.ndarray
    velocity: np.ndarray
    radius: float
    colour: str
    angular_vel: float = 0.0                 # spin (rad/s)
    angle: float = 0.0                       # visual spin angle
    mass: float = 1.0
    moment_of_inertia: float = field(init=False)

    # Canvas item IDs – set after drawing
    canvas_oval: int = None
    canvas_line: int = None
    canvas_text: int = None

    def __post_init__(self):
        self.moment_of_inertia = 0.5 * self.mass * self.radius ** 2

    # ------------------------------------------------------------------
    # Rendering helpers
    # ------------------------------------------------------------------
    def draw(self, canvas: tk.Canvas):
        """Create the oval, spin line and number on the canvas."""
        x, y = self.position
        r = self.radius
        self.canvas_oval = canvas.create_oval(
            x - r, y - r, x + r, y + r,
            fill=self.colour, outline=""
        )
        # line that shows spin (radius length)
        end_x = x + r * math.cos(self.angle)
        end_y = y + r * math.sin(self.angle)
        self.canvas_line = canvas.create_line(
            x, y, end_x, end_y,
            fill="black", width=2
        )
        self.canvas_text = canvas.create_text(
            x, y,
            text=str(self.id),
            fill="white",
            font=("Helvetica", 10, "bold")
        )

    def update_visual(self, canvas: tk.Canvas):
        """Move and rotate the graphical items to match physics state."""
        x, y = self.position
        r = self.radius
        # Move oval
        canvas.coords(
            self.canvas_oval,
            x - r, y - r, x + r, y + r
        )
        # Update spin line
        end_x = x + r * math.cos(self.angle)
        end_y = y + r * math.sin(self.angle)
        canvas.coords(
            self.canvas_line,
            x, y, end_x, end_y
        )
        # Move text (centered)
        canvas.coords(
            self.canvas_text,
            x, y
        )


# ----------------------------------------------------------------------
# Collision handling
# ----------------------------------------------------------------------
def resolve_ball_ball(b1: Ball, b2: Ball):
    """Resolve a collision between two balls (impulse based)."""
    delta = b2.position - b1.position
    dist = np.norm(delta)

    # Avoid zero distance – give a tiny separation
    if dist == 0.0:
        normal = np.array([1.0, 0.0])
        dist = 0.001
    else:
        normal = delta / dist

    # Overlap?
    radius_sum = b1.radius + b2.radius
    if dist >= radius_sum:
        return

    penetration = radius_sum - dist

    # ---- Positional correction (to avoid sinking) ----
    percent = 0.8     # usually 20%–80% of penetration is resolved
    slop = 0.01
    correction = max(penetration - slop, 0.0) / (b1.mass + b2.mass) * percent
    correction_vec = correction * normal
    b1.position -= correction_vec * (b2.mass / (b1.mass + b2.mass))
    b2.position += correction_vec * (b1.mass / (b1.mass + b2.mass))

    # ---- Relative velocity along the normal ----
    rel_vel = b1.velocity - b2.velocity
    vel_along_normal = np.dot(rel_vel, normal)

    # Balls moving apart?
    if vel_along_normal > 0:
        return

    # ---- Normal impulse ----
    e = BALL_RESTITUTION
    j = -(1 + e) * vel_along_normal
    j /= (1 / b1.mass + 1 / b2.mass)
    impulse = j * normal

    b1.velocity += impulse / b1.mass
    b2.velocity -= impulse / b2.mass

    # ---- Friction impulse (tangential) ----
    tangent = np.array([-normal[1], normal[0]])   # perpendicular to normal
    vt = np.dot(rel_vel, tangent)
    if abs(vt) > 1e-6:
        # Coulomb friction model
        jt = -vt / (1 / b1.mass + 1 / b2.mass)
        # Clamp magnitude by mu * normal impulse
        jt = max(-FRICTION_COEFF * j, min(jt, FRICTION_COEFF * j))
        friction_impulse = jt * tangent
        b1.velocity += friction_impulse / b1.mass
        b2.velocity -= friction_impulse / b2.mass

        # ---- Spin update due to friction ----
        # Approximate torque τ = r × J = r * J (scalar in 2‑D)
        torque = b1.radius * jt
        b1.angular_vel += torque / b1.moment_of_inertia
        b2.angular_vel -= torque / b2.moment_of_inertia


def resolve_ball_heptagon(ball: Ball, hept: Heptagon):
    """Resolve collisions between a ball and the rotating heptagon walls."""
    for start, end in hept.edges():
        # Nearest point on the wall segment
        nearest = nearest_point_on_segment(ball.position, start, end)
        delta = ball.position - nearest
        dist = np.linalg.norm(delta)

        # No penetration?
        if dist >= ball.radius:
            continue

        # Normal (pointing outward from wall into ball)
        if dist == 0.0:
            # Degenerate case – use a normal pointing away from edge centre
            edge_dir = end - start
            normal = np.array([-edge_dir[1], edge_dir[0]])
            normal = normal / np.linalg.norm(normal)
        else:
            normal = delta / dist

        penetration = ball.radius - dist

        # Wall point velocity due to heptagon rotation (ω × r)
        r_vec = nearest - hept.centre
        wall_vel = hept.angular_vel * np.array([-r_vec[1], r_vec[0]])  # ω cross r

        rel_vel = ball.velocity - wall_vel
        vel_along_normal = np.dot(rel_vel, normal)

        # If moving away, only correct position
        if vel_along_normal > 0:
            ball.position += normal * penetration
            continue

        # Normal impulse
        e = WALL_RESTITUTION
        j = -(1 + e) * vel_along_normal
        j /= (1 / ball.mass)   # wall mass = ∞
        impulse = j * normal
        ball.velocity += impulse / ball.mass

        # Friction impulse (tangential)
        tangent = np.array([-normal[1], normal[0]])
        vt = np.dot(rel_vel, tangent)
        if abs(vt) > 1e-6:
            jt = -vt / (1 / ball.mass)
            jt = max(-FRICTION_COEFF * j, min(jt, FRICTION_COEFF * j))
            friction_impulse = jt * tangent
            ball.velocity += friction_impulse / ball.mass

            # Spin update from friction torque
            torque = ball.radius * jt
            ball.angular_vel += torque / ball.moment_of_inertia

        # Positional correction – push ball out of wall
        ball.position += normal * penetration


# ----------------------------------------------------------------------
# Main simulation and visualisation
# ----------------------------------------------------------------------
class Simulation:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="black")
        self.canvas.pack()

        # Initialise heptagon
        self.heptagon = Heptagon(centre=CENTER, radius=HEPTAGON_RADIUS)

        # Create balls
        self.balls: List[Ball] = []
        for i in range(NUM_BALLS):
            ball = Ball(
                id=i + 1,
                position=CENTER.copy(),
                velocity=np.array([0.0, 0.0], dtype=float),
                radius=BALL_RADIUS,
                colour=BALL_COLOURS[i % len(BALL_COLOURS)],
                angular_vel=np.random.uniform(-2.0, 2.0)   # modest random spin
            )
            ball.draw(self.canvas)
            self.balls.append(ball)

        # Bind Escape to quit
        root.bind("<Escape>", lambda e: root.destroy())

        # start the animation loop
        self.last_time = None
        self._run()

    def _run(self):
        """Main loop – uses after() for ~60 fps."""
       
