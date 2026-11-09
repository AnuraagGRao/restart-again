export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GhostTrail {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
  facing: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public ghostTrails: GhostTrail[] = [];

  public update(dt: number): void {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    // 2. Update ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.alpha -= dt * 4.5;
      if (g.alpha <= 0) {
        this.ghostTrails.splice(i, 1);
      }
    }
  }

  public emitDust(x: number, y: number, count = 4): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y,
        vx: (Math.random() - 0.5) * 40,
        vy: -Math.random() * 20 - 5,
        size: Math.random() * 2 + 1,
        color: "#94a3b8",
        alpha: 0.8,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
      });
    }
  }

  public emitWallSparks(x: number, y: number, dir: number): void {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x,
        y: y + Math.random() * 8,
        vx: -dir * (Math.random() * 30 + 10),
        vy: -Math.random() * 30,
        size: 1.5,
        color: "#00f0ff",
        alpha: 0.9,
        life: 0,
        maxLife: 0.15,
      });
    }
  }

  public emitGhost(x: number, y: number, w: number, h: number, color: string, facing: number): void {
    this.ghostTrails.push({
      x,
      y,
      w,
      h,
      color,
      alpha: 0.65,
      facing,
    });
  }

  public emitDeathShatter(x: number, y: number): void {
    const colors = ["#00f0ff", "#ff4655", "#ffffff", "#ffb800"];
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  }

  public emitCrystalBurst(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: "#ffb800",
        alpha: 0.9,
        life: 0,
        maxLife: 0.25,
      });
    }
  }
}

export const Particles = new ParticleSystem();

