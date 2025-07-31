
// Constants
const DISTANCE_SCALE_FACTOR = 5.0; // Scale factor for distances
const EARTH_DISTANCE_SUN = 1.0 * DISTANCE_SCALE_FACTOR; // 1 AU (Astronomical Unit) = average distance from Earth to Sun

class Universe {
    constructor(G = 2.0) {
        this.G = G;
    }
}

class Sun {
    constructor(universe, mass) {
        this.universe = universe;
        this.mass = mass;
        this.position = { x: 0, y: 0 };
    }
}

class Planet {
    constructor(sun, mass, distance, speedFactor = 1.0, angleDeg = 90) {
        this.sun = sun;
        this.mass = mass;
        this.position = { x: distance, y: 0 };
        const G = sun.universe.G;
        const vCircular = Math.sqrt(G * sun.mass / distance);
        const initialSpeed = vCircular * speedFactor;
        const angleRad = angleDeg * Math.PI / 180;
        this.velocity = {
            x: initialSpeed * Math.cos(angleRad),
            y: initialSpeed * Math.sin(angleRad),
        };
    }

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

class Simulation {
    constructor(bodies, dt = 0.01) {
        this.bodies = bodies;
        this.dt = dt;
    }

    update() {
        for (const body of this.bodies) {
            body.update(this.dt);
        }
    }
}

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

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw Sun
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 10, 0, Math.PI * 2);
        ctx.fill();

        // draw trajectory
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
const universe = new Universe(2.0);
const sun = new Sun(universe, 15.0);
const planet = new Planet(sun, 1.0, EARTH_DISTANCE_SUN, 0.6);
const sim = new Simulation([planet]);
const canvas = document.getElementById('orbitCanvas');
const renderer = new Renderer(sim, canvas);
renderer.start();
