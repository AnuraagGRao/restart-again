import { Input } from "./Input.ts";
import { Sound } from "./Audio.ts";
import { Particles } from "./Particles.ts";
import { Rect, RoomData, Vector2D } from "./Types.ts";
import { TILE_SIZE } from "./Level.ts";

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: number; // -1 or 1

  // Ground & Coyote
  isGrounded: boolean;
  coyoteTimer: number;

  // Wall Mechanics
  isOnWall: boolean;
  wallDir: number; // -1 (left wall) or 1 (right wall)
  wallJumpLockTimer: number;

  // Air Dash Mechanics
  hasDash: boolean;
  isDashing: boolean;
  dashTimer: number;
  dashDir: Vector2D;

  // Hit-Stop / Freeze-frame
  freezeTimer: number;

  // Death / Respawn flow state
  isDead: boolean;
  respawnTimer: number;
  checkpointSpawn: Vector2D;

  // Stats
  deaths: number;
  loopCount: number;
}

export class PhysicsEngine {
  // Kinetic Constants
  public static readonly RUN_SPEED = 140.0;
  public static readonly GRAVITY = 850.0;
  public static readonly FAST_FALL_GRAVITY = 1600.0;
  public static readonly JUMP_FORCE = -275.0;
  public static readonly WALL_SLIDE_SPEED = 55.0;
  public static readonly WALL_JUMP_FORCE_X = 175.0;
  public static readonly WALL_JUMP_FORCE_Y = -250.0;
  public static readonly DASH_SPEED = 320.0;
  public static readonly DASH_DURATION = 0.14;
  public static readonly COYOTE_TIME = 0.10; // 100ms
  public static readonly RESPAWN_DELAY = 0.11; // 110ms instant flow state!

  public screenShake = 0;

  public update(player: PlayerState, room: RoomData, dt: number): void {
    // 1. Process Freeze-Frame / Hit-Stop
    if (player.freezeTimer > 0) {
      player.freezeTimer = Math.max(0, player.freezeTimer - dt);
      return; // Freeze movement for punchy impact
    }

    // 2. Process Respawn Timer if Dead
    if (player.isDead) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        this.respawn(player, room);
      }
      return;
    }

    // Manual instant restart key ('R')
    if (Input.restartJustPressed) {
      this.killPlayer(player, room);
      return;
    }

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update timers
    if (player.coyoteTimer > 0) player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
    if (player.wallJumpLockTimer > 0) player.wallJumpLockTimer = Math.max(0, player.wallJumpLockTimer - dt);

    // Update dash crystals
    for (const c of room.crystals) {
      if (!c.active) {
        c.respawnTimer -= dt;
        if (c.respawnTimer <= 0) {
          c.active = true;
          Particles.emitCrystalBurst(c.x + 6, c.y + 6);
        }
      }
    }

    // 3. Process Air Dash
    if (player.isDashing) {
      player.dashTimer -= dt;
      player.vx = player.dashDir.x * PhysicsEngine.DASH_SPEED;
      player.vy = player.dashDir.y * PhysicsEngine.DASH_SPEED;

      // Emit shadow after-images
      Particles.emitGhost(player.x, player.y, player.w, player.h, "#00f0ff", player.facing);

      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.vx *= 0.4;
        player.vy *= 0.4;
      }
    } else {
      // Check Dash Input (8-Way Directional Dash)
      if (Input.dashJustPressed && player.hasDash) {
        this.triggerDash(player);
      } else {
        // Standard Horizontal Zero-Inertia Movement
        if (player.wallJumpLockTimer <= 0) {
          const move = Input.moveX;
          player.vx = move * PhysicsEngine.RUN_SPEED;
          if (move !== 0) player.facing = move;
        }

        // Check Jump
        if (Input.jumpJustPressed) {
          // A. Ground / Coyote Jump
          if (player.isGrounded || player.coyoteTimer > 0) {
            player.vy = PhysicsEngine.JUMP_FORCE;
            player.isGrounded = false;
            player.coyoteTimer = 0;
            Input.consumeJumpBuffer();
            Sound.playJump();
            Particles.emitDust(player.x + player.w / 2, player.y + player.h);
          }
          // B. Wall Jump
          else if (player.isOnWall) {
            player.vx = -player.wallDir * PhysicsEngine.WALL_JUMP_FORCE_X;
            player.vy = PhysicsEngine.WALL_JUMP_FORCE_Y;
            player.facing = -player.wallDir;
            player.wallJumpLockTimer = 0.12; // 120ms horizontal lock away from wall
            player.isOnWall = false;
            Input.consumeJumpBuffer();
            Sound.playWallKick();
            Particles.emitWallSparks(player.x + (player.wallDir > 0 ? player.w : 0), player.y + 4, player.wallDir);
          }
        }

        // Variable Jump: Release jump button early to fast-fall (snappy Celeste feel)
        const currentGravity = (player.vy < 0 && !Input.jumpHeld) 
          ? PhysicsEngine.FAST_FALL_GRAVITY 
          : PhysicsEngine.GRAVITY;

        // Wall Slide Friction
        if (player.isOnWall && player.vy > PhysicsEngine.WALL_SLIDE_SPEED) {
          player.vy = PhysicsEngine.WALL_SLIDE_SPEED;
          Particles.emitWallSparks(player.x + (player.wallDir > 0 ? player.w : 0), player.y + 8, player.wallDir);
        } else {
          player.vy += currentGravity * dt;
        }
      }
    }

    // Clamp maximum fall speed
    if (player.vy > 380) player.vy = 380;

    // 4. Integrate Movement & Tile Collisions (Sub-step X and Y)
    this.moveX(player, room, player.vx * dt);
    this.moveY(player, room, player.vy * dt);

    // 5. Environmental Interactions (Hazards, Crystals, Portals)
    this.checkCollisionsAndHazards(player, room);
  }

  private triggerDash(player: PlayerState): void {
    player.hasDash = false;
    player.isDashing = true;
    player.dashTimer = PhysicsEngine.DASH_DURATION;
    player.freezeTimer = 0.04; // 40ms freeze frame hit-stop!
    this.screenShake = 5.0;

    let dirX = Input.moveX;
    let dirY = Input.moveY;

    // Default to facing direction if neutral input
    if (dirX === 0 && dirY === 0) {
      dirX = player.facing;
      dirY = 0;
    }

    // Normalize diagonal dash vector (unit length 1.0)
    const len = Math.hypot(dirX, dirY);
    player.dashDir = { x: dirX / len, y: dirY / len };
    Sound.playDash();
  }

  private moveX(player: PlayerState, room: RoomData, amount: number): void {
    player.x += amount;
    player.isOnWall = false;
    player.wallDir = 0;

    const bounds = this.getTileBounds(player, room);
    for (let r = bounds.minY; r <= bounds.maxY; r++) {
      for (let c = bounds.minX; c <= bounds.maxX; c++) {
        if (room.tiles[r]?.[c] === "solid") {
          if (amount > 0) {
            player.x = c * TILE_SIZE - player.w;
            player.isOnWall = true;
            player.wallDir = 1;
          } else if (amount < 0) {
            player.x = (c + 1) * TILE_SIZE;
            player.isOnWall = true;
            player.wallDir = -1;
          }
          player.vx = 0;
          return;
        }
      }
    }
  }

  private moveY(player: PlayerState, room: RoomData, amount: number): void {
    const wasGrounded = player.isGrounded;
    player.y += amount;
    player.isGrounded = false;

    const bounds = this.getTileBounds(player, room);
    for (let r = bounds.minY; r <= bounds.maxY; r++) {
      for (let c = bounds.minX; c <= bounds.maxX; c++) {
        if (room.tiles[r]?.[c] === "solid") {
          if (amount > 0) {
            player.y = r * TILE_SIZE - player.h;
            player.vy = 0;
            player.isGrounded = true;
            player.hasDash = true; // Reset dash on ground touch!

            if (!wasGrounded) {
              Particles.emitDust(player.x + player.w / 2, player.y + player.h);
            }
          } else if (amount < 0) {
            player.y = (r + 1) * TILE_SIZE;
            player.vy = 0;
          }
          return;
        }
      }
    }

    // Lost ground: start coyote timer if walked off edge
    if (wasGrounded && !player.isGrounded && player.vy >= 0) {
      player.coyoteTimer = PhysicsEngine.COYOTE_TIME;
    }
  }

  private checkCollisionsAndHazards(player: PlayerState, room: RoomData): void {
    const playerRect: Rect = { x: player.x, y: player.y, w: player.w, h: player.h };

    // A. Check Hazards (Spikes & Death Voids)
    const bounds = this.getTileBounds(player, room);
    for (let r = bounds.minY; r <= bounds.maxY; r++) {
      for (let c = bounds.minX; c <= bounds.maxX; c++) {
        const tile = room.tiles[r]?.[c];
        if (tile && tile.startsWith("spike")) {
          // Precise inner hitbox for spikes
          const spikeRect: Rect = {
            x: c * TILE_SIZE + 2,
            y: r * TILE_SIZE + 2,
            w: TILE_SIZE - 4,
            h: TILE_SIZE - 4,
          };
          if (this.rectsIntersect(playerRect, spikeRect)) {
            this.killPlayer(player, room);
            return;
          }
        }
      }
    }

    // B. Check Dash Crystals
    for (const crystal of room.crystals) {
      if (crystal.active && this.rectsIntersect(playerRect, crystal)) {
        crystal.active = false;
        crystal.respawnTimer = 2.5; // 2.5s respawn
        player.hasDash = true;
        Sound.playCrystalPickup();
        Particles.emitCrystalBurst(crystal.x + crystal.w / 2, crystal.y + crystal.h / 2);
      }
    }

    // C. Check Checkpoints
    for (const cp of room.checkpoints) {
      const cpRect: Rect = { x: cp.x, y: cp.y, w: 16, h: 24 };
      if (this.rectsIntersect(playerRect, cpRect) && !cp.active) {
        cp.active = true;
        player.checkpointSpawn = { x: cp.x, y: cp.y - 2 };
        Particles.emitCrystalBurst(cp.x + 8, cp.y + 12);
      }
    }

    // D. Check Out of Bounds / Void
    if (player.y > room.heightTiles * TILE_SIZE + 32) {
      this.killPlayer(player, room);
    }
  }

  public killPlayer(player: PlayerState, _room: RoomData): void {
    if (player.isDead) return;
    player.isDead = true;
    player.respawnTimer = PhysicsEngine.RESPAWN_DELAY;
    player.deaths += 1;
    this.screenShake = 10.0;
    Sound.playDeath();
    Particles.emitDeathShatter(player.x + player.w / 2, player.y + player.h / 2);
  }

  public respawn(player: PlayerState, room: RoomData): void {
    player.isDead = false;
    player.x = player.checkpointSpawn.x;
    player.y = player.checkpointSpawn.y;
    player.vx = 0;
    player.vy = 0;
    player.isDashing = false;
    player.hasDash = true;
    player.isGrounded = false;
    Sound.playRespawn();
    Particles.emitDust(player.x + player.w / 2, player.y + player.h);

    // Reset room crystals
    for (const c of room.crystals) {
      c.active = true;
      c.respawnTimer = 0;
    }
  }

  private getTileBounds(player: PlayerState, room: RoomData) {
    return {
      minX: Math.max(0, Math.floor(player.x / TILE_SIZE)),
      maxX: Math.min(room.widthTiles - 1, Math.floor((player.x + player.w - 1) / TILE_SIZE)),
      minY: Math.max(0, Math.floor(player.y / TILE_SIZE)),
      maxY: Math.min(room.heightTiles - 1, Math.floor((player.y + player.h - 1) / TILE_SIZE)),
    };
  }

  private rectsIntersect(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }
}

