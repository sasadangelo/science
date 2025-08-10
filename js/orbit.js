/*!
 * Orbit Simulation - Gravitational 2-body system
 *
 * Copyright (c) 2025 Salvatore D'Angelo
 * MIT License
 *
 * This simulation models the motion of a planet around a sun using Newtonian gravity.
 * Distances are scaled to fit the visualization. Masses are added for both bodies.
 */

// === Constants ===
const EARTH_ECCENTRICITY = 0.0167;  // Orbital eccentricity of Earth
const DISTANCE_SCALE_FACTOR = 5.0;  // Scale factor for astronomical units
const EARTH_DISTANCE_SUN = 1.0 * DISTANCE_SCALE_FACTOR;  // 1 AU scaled
const a = EARTH_DISTANCE_SUN;       // Semi-major axis (AU * scale)
const initialDistance = a * (1 - EARTH_ECCENTRICITY); // Earth's perihelion distance
const MASS_EARTH = 1;         // riferimento massa Terra
const MASS_SUN = 333000 * MASS_EARTH;
const SECONDS_PER_YEAR = 10;      // Durata reale in secondi di 1 anno simulato
const STEPS_PER_YEAR = 80000;     // Numero di passi (step) per simulare 1 anno completo
const TIME_STEP = SECONDS_PER_YEAR / STEPS_PER_YEAR;  // dt, durata temporale di un singolo step
const G_SIMULATION = (4 * Math.PI * Math.PI) / MASS_SUN; // ≈ 0.0001186

/**
 * Calculate the ratio between the real orbital speed (vis-viva) and the circular speed.
 * This gives us a speed factor to adjust the initial velocity for elliptical orbits.
 */
function calculateSpeedFactor(G, M_sun, r, a) {
    const mu = G * M_sun;
    const v = Math.sqrt(mu * (2 / r - 1 / a));  // Vis-viva equation
    const v_c = Math.sqrt(mu / r);              // Circular velocity
    return v / v_c;
}

// === Classes ===

/**
 * Universe class defines global physical constants (like gravitational constant).
 */
class Universe {
    constructor(G = G_SIMULATION) {
        this.G = G;
    }
}
/**
 * Sun class represents the central massive body.
 */
class Sun {
    constructor(universe, mass) {
        this.universe = universe;
        this.mass = mass;  // Mass in simulation units
        this.position = { x: 0, y: 0 };  // Origin of the coordinate system
    }
}

/**
 * Planet class represents a body orbiting the Sun.
 * The speed is calculated based on vis-viva equation.
 */
class Planet {
    constructor(sun, mass, distance, a, angleDeg = 90) {
        this.sun = sun;
        this.mass = mass;
        this.position = { x: distance, y: 0 };
        const G = sun.universe.G;
        const speedFactor = calculateSpeedFactor(G, sun.mass, distance, a);
        const vCircular = Math.sqrt(G * sun.mass / distance);
        const initialSpeed = vCircular * speedFactor;
        const angleRad = angleDeg * Math.PI / 180;
        this.velocity = {
            x: initialSpeed * Math.cos(angleRad),
            y: initialSpeed * Math.sin(angleRad),
        };
    }

    /**
     * Update planet's position using Newtonian gravity and basic Euler integration.
     */
    update(dt) {
        const dx = this.position.x - this.sun.position.x;
        const dy = this.position.y - this.sun.position.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        const accMag = -this.sun.universe.G * this.sun.mass / (r * r * r);

        const ax = accMag * dx;
        const ay = accMag * dy;

        this.velocity.x += ax * dt;
        this.velocity.y += ay * dt;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }
}

/**
 * Simulation class handles updating all bodies in the simulation.
 */
class Simulation {
    constructor(bodies) {
        this.bodies = bodies;
        this.dt = TIME_STEP;
    }

    update() {
        for (const body of this.bodies) {
            body.update(this.dt);
        }
    }
}

/**
 * Renderer class draws the Sun, Planet, and orbital path on a HTML canvas.
 */
class Renderer {
    constructor(sim, canvas) {
        this.sim = sim;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = 50; // 1 unit = 50 px
        this.trajectory = [];
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    draw() {
        const ctx = this.ctx;
        const planet = this.sim.bodies[0];

        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw Sun
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Track and draw trajectory
        this.trajectory.push({ x: planet.position.x, y: planet.position.y });
        ctx.strokeStyle = 'lightblue';
        ctx.beginPath();
        for (let i = 0; i < this.trajectory.length; i++) {
            const p = this.trajectory[i];
            const x = this.centerX + p.x * this.scale;
            const y = this.centerY - p.y * this.scale;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // draw Planet
        ctx.fillStyle = 'deepskyblue';
        const x = this.centerX + planet.position.x * this.scale;
        const y = this.centerY - planet.position.y * this.scale;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    start() {
        const loop = () => {
            this.sim.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }
}

// === Setup Universe ===
const universe = new Universe(G_SIMULATION);
const sun = new Sun(universe, MASS_SUN);
const planet = new Planet(sun, MASS_EARTH, initialDistance, a, 90);
const sim = new Simulation([planet]);
const canvas = document.getElementById('orbitCanvas');
const renderer = new Renderer(sim, canvas);
renderer.start();