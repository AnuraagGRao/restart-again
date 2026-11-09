import { Particles } from "./Particles.ts";
import { PlayerState } from "./Physics.ts";
import { RoomData } from "./Types.ts";
import { TILE_SIZE } from "./Level.ts";

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public cameraX = 0;
  public cameraY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  public render(
    player: PlayerState, 
    room: RoomData, 
    screenShake: number, 
    elapsedTime: number
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Camera Follow (Clamped to Room Bounds)
    const targetCamX = player.x + player.w / 2 - w / 2;
    const targetCamY = player.y + player.h / 2 - h / 2;
    const maxCamX = Math.max(0, room.widthTiles * TILE_SIZE - w);
    const maxCamY = Math.max(0, room.heightTiles * TILE_SIZE - h);

    this.cameraX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * 0.15;
    this.cameraY += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.cameraY) * 0.15;

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0) {
      shakeX = (Math.random() - 0.5) * screenShake;
      shakeY = (Math.random() - 0.5) * screenShake;
    }

    ctx.save();
    ctx.translate(-Math.round(this.cameraX + shakeX), -Math.round(this.cameraY + shakeY));

    // Clear Background with deep dark cyber grid
    ctx.fillStyle = "#07090e";
    ctx.fillRect(this.cameraX, this.cameraY, w, h);

    // Draw Parallax Grid Lines
    ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridStep = 32;
    const startX = Math.floor(this.cameraX / gridStep) * gridStep;
    const startY = Math.floor(this.cameraY / gridStep) * gridStep;
    for (let x = startX; x < this.cameraX + w + gridStep; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, this.cameraY);
      ctx.lineTo(x, this.cameraY + h);
      ctx.stroke();
    }
    for (let y = startY; y < this.cameraY + h + gridStep; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(this.cameraX, y);
      ctx.lineTo(this.cameraX + w, y);
      ctx.stroke();
    }

    // 2. Draw Tiles
    for (let r = 0; r < room.heightTiles; r++) {
      for (let c = 0; c < room.widthTiles; c++) {
        const tile = room.tiles[r][c];
        const tx = c * TILE_SIZE;
        const ty = r * TILE_SIZE;

        if (tile === "solid") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#1e293b";
          ctx.strokeRect(tx + 0.5, ty + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === "spike_up") {
          ctx.fillStyle = "#ff4655";
          ctx.beginPath();
          ctx.moveTo(tx, ty + TILE_SIZE);
          ctx.lineTo(tx + TILE_SIZE / 2, ty + 3);
          ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
        } else if (tile === "spike_down") {
          ctx.fillStyle = "#ff4655";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + TILE_SIZE / 2, ty + TILE_SIZE - 3);
          ctx.lineTo(tx + TILE_SIZE, ty);
          ctx.closePath();
          ctx.fill();
        } else if (tile === "spike_left") {
          ctx.fillStyle = "#ff4655";
          ctx.beginPath();
          ctx.moveTo(tx + TILE_SIZE, ty);
          ctx.lineTo(tx + 3, ty + TILE_SIZE / 2);
          ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
        } else if (tile === "spike_right") {
          ctx.fillStyle = "#ff4655";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + TILE_SIZE - 3, ty + TILE_SIZE / 2);
          ctx.lineTo(tx, ty + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 3. Draw Checkpoints
    for (const cp of room.checkpoints) {
      ctx.fillStyle = cp.active ? "#00f0ff" : "#334155";
      ctx.fillRect(cp.x + 6, cp.y + 4, 4, 20);
      ctx.fillStyle = cp.active ? "#00f0ff" : "#475569";
      ctx.beginPath();
      ctx.arc(cp.x + 8, cp.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Dash Crystals (Golden pulsing diamond)
    const pulse = Math.sin(elapsedTime * 6) * 1.5;
    for (const crys of room.crystals) {
      if (crys.active) {
        ctx.fillStyle = "#ffb800";
        ctx.beginPath();
        const cx = crys.x + crys.w / 2;
        const cy = crys.y + crys.h / 2;
        ctx.moveTo(cx, cy - 6 - pulse);
        ctx.lineTo(cx + 6 + pulse, cy);
        ctx.lineTo(cx, cy + 6 + pulse);
        ctx.lineTo(cx - 6 - pulse, cy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 5. Draw Portals
    for (const p of room.portals) {
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // 6. Draw Ghost Trails
    for (const g of Particles.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.fillStyle = g.color;
      ctx.fillRect(Math.round(g.x), Math.round(g.y), g.w, g.h);
      ctx.restore();
    }

    // 7. Draw Player Character
    if (!player.isDead) {
      const px = Math.round(player.x);
      const py = Math.round(player.y);

      // Main body
      ctx.fillStyle = player.hasDash ? "#00f0ff" : "#e2e8f0";
      ctx.fillRect(px, py, player.w, player.h);

      // Visor / Eye
      ctx.fillStyle = player.hasDash ? "#ffb800" : "#ff4655";
      const eyeX = player.facing > 0 ? px + player.w - 3 : px + 1;
      ctx.fillRect(eyeX, py + 3, 2, 3);

      // Dash Aura if ready
      if (player.hasDash) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.strokeRect(px - 1, py - 1, player.w + 2, player.h + 2);
      }
    }

    // 8. Draw Particles
    for (const p of Particles.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.restore();
    }

    ctx.restore();

    // 9. Draw Screen HUD (Fixed on screen)
    ctx.fillStyle = "rgba(10, 14, 23, 0.75)";
    ctx.fillRect(0, 0, w, 24);

    ctx.font = "10px monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText(`ROOM: ${room.name}`, 12, 16);

    ctx.fillStyle = "#ff4655";
    ctx.fillText(`DEATHS: ${player.deaths}`, w / 2 - 28, 16);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = (elapsedTime % 60).toFixed(1).padStart(4, "0");
    ctx.fillStyle = "#ffb800";
    ctx.fillText(`TIME: ${minutes}:${seconds}`, w - 88, 16);
  }
}

