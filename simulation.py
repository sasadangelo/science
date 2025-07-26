import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

class Universe:
    def __init__(self, G=2.0):
        self.G = G
        self.bodies = []  # For future extension to hold all bodies

class Sun:
    def __init__(self, universe, mass):
        self.universe = universe
        self.mass = mass

class Planet:
    def __init__(self, sun, mass, distance, speed_factor=1.0, angle_deg=90):
        self.sun = sun
        self.mass = mass
        self.position = np.array([distance, 0.0], dtype=float)

        G = self.sun.universe.G
        v_circular = np.sqrt(G * sun.mass / distance)
        initial_speed = v_circular * speed_factor

        angle_rad = np.radians(angle_deg)
        v_x = initial_speed * np.cos(angle_rad)
        v_y = initial_speed * np.sin(angle_rad)
        self.velocity = np.array([v_x, v_y], dtype=float)

class Simulation:
    def __init__(self, universe, bodies, dt=0.01, steps=2000):
        self.universe = universe
        self.bodies = bodies
        self.dt = dt
        self.steps = steps
        self.trajectories = {body: [] for body in bodies}

    def update_body(self, body):
        G = self.universe.G
        r = np.linalg.norm(body.position)
        acc = -G * body.sun.mass * body.position / r**3
        body.velocity += acc * self.dt
        body.position += body.velocity * self.dt

    def run(self):
        for _ in range(self.steps):
            for body in self.bodies:
                self.update_body(body)
                self.trajectories[body].append(body.position.copy())

    def get_trajectory(self, body):
        return np.array(self.trajectories[body])

class Renderer:
    def __init__(self, simulation, bodies, xlim=(-10, 10), ylim=(-10, 10), title="2D Orbit Simulation"):
        self.simulation = simulation
        self.bodies = bodies
        self.xlim = xlim
        self.ylim = ylim
        self.title = title

        # Retrieve trajectories from simulation
        self.trajectories = {body: simulation.get_trajectory(body) for body in bodies}

        self.fig, self.ax = plt.subplots()
        self.ax.set_aspect('equal')
        self.ax.set_xlim(*self.xlim)
        self.ax.set_ylim(*self.ylim)
        self.ax.set_title(self.title)

        # Draw the Sun as a large yellow dot at the origin
        self.central_mass, = self.ax.plot(0, 0, 'yo', markersize=20)

        # Prepare plot elements for each body (dot + path)
        self.dots = []
        self.paths = []
        dot_colors = ['ro', 'go', 'bo', 'co', 'mo']
        path_colors = ['b', 'g', 'r', 'c', 'm']
        for i, body in enumerate(bodies):
            dot, = self.ax.plot([], [], dot_colors[i % len(dot_colors)], markersize=6)
            path, = self.ax.plot([], [], path_colors[i % len(path_colors)] + '-', alpha=0.6)
            self.dots.append(dot)
            self.paths.append(path)

    def init(self):
        for dot, path in zip(self.dots, self.paths):
            dot.set_data([], [])
            path.set_data([], [])
        return (*self.dots, *self.paths, self.central_mass)

    def update(self, frame):
        for i, body in enumerate(self.bodies):
            traj = self.trajectories[body]
            x_vals = traj[:, 0]
            y_vals = traj[:, 1]
            self.dots[i].set_data([x_vals[frame]], [y_vals[frame]])
            self.paths[i].set_data(x_vals[:frame], y_vals[:frame])
        return (*self.dots, *self.paths, self.central_mass)

    def animate(self, interval=10):
        anim = FuncAnimation(self.fig, self.update, frames=self.simulation.steps,
                             init_func=self.init, blit=True, interval=interval)
        plt.show()

# === Set up Universe, Sun, Planet, Simulation ===
universe = Universe(G=2.0)
sun = Sun(universe=universe, mass=15.0)
planet = Planet(sun=sun, mass=1.0, distance=5.0, speed_factor=0.6)

sim = Simulation(universe=universe, bodies=[planet], dt=0.01, steps=2000)
sim.run()

# === Visualize the simulation ===
renderer = Renderer(simulation=sim, bodies=[planet])
renderer.animate()
