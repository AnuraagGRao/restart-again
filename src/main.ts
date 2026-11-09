import { Input } from "./engine/Input.ts";
import { ROOMS } from "./engine/Level.ts";
import { Particles } from "./engine/Particles.ts";
import { PhysicsEngine, PlayerState } from "./engine/Physics.ts";
import { GameRenderer } from "./engine/Renderer.ts";

function initGame(): void {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const renderer = new GameRenderer(canvas);
  const physics = new PhysicsEngine();

  let currentRoomIndex = 0;
  let currentRoom = ROOMS[currentRoomIndex];

  const player: PlayerState = {
    x: currentRoom.spawn.x,
    y: currentRoom.spawn.y,
    w: 10,
    h: 14,
    vx: 0,
    vy: 0,
    facing: 1,

    isGrounded: false,
    coyoteTimer: 0,

    isOnWall: false,
    wallDir: 0,
    wallJumpLockTimer: 0,

    hasDash: true,
    isDashing: false,
    dashTimer: 0,
    dashDir: { x: 0, y: 0 },

    freezeTimer: 0,

    isDead: false,
    respawnTimer: 0,
    checkpointSpawn: { ...currentRoom.spawn },

    deaths: 0,
    loopCount: 1,
  };

  let lastTime = performance.now();
  let totalTime = 0;

  // Responsive Canvas Sizing (Maintain 480x270 aspect ratio)
  function resize(): void {
    const targetW = 480;
    const targetH = 270;
    const scale = Math.min(
      (window.innerWidth - 32) / targetW,
      (window.innerHeight - 90) / targetH
    );
    canvas.style.width = `${Math.floor(targetW * scale)}px`;
    canvas.style.height = `${Math.floor(targetH * scale)}px`;
  }

  window.addEventListener("resize", resize);
  resize();

  // Main Loop
  function loop(currentTime: number): void {
    const rawDt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Clamp dt to prevent tunneling after tab-out
    const dt = Math.min(rawDt, 0.05);
    totalTime += dt;

    // 1. Update Input
    Input.update(dt);

    // 2. Update Physics & World
    physics.update(player, currentRoom, dt);
    Particles.update(dt);

    // 3. Check Portal Transitions
    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const portal of currentRoom.portals) {
      if (
        pRect.x < portal.x + portal.w &&
        pRect.x + pRect.w > portal.x &&
        pRect.y < portal.y + portal.h &&
        pRect.y + pRect.h > portal.y
      ) {
        // Transition to target room
        const nextIdx = portal.targetRoom - 1;
        if (nextIdx >= 0 && nextIdx < ROOMS.length) {
          if (nextIdx === 0 && currentRoomIndex === ROOMS.length - 1) {
            player.loopCount += 1; // "A:Gain" loop progression!
          }
          currentRoomIndex = nextIdx;
          currentRoom = ROOMS[currentRoomIndex];
          player.checkpointSpawn = { ...portal.targetSpawn };
          physics.respawn(player, currentRoom);
          break;
        }
      }
    }

    // 4. Render
    renderer.render(player, currentRoom, physics.screenShake, totalTime);

    // 5. Clean up frame inputs
    Input.endFrame();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", initGame);

