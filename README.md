# Re:Start A:Gain? ⚡

> **2D Precision Masocore Platformer inspired by Kaizo Trap, Celeste, and Super Meat Boy.**

Part of the **Kei OS** / **Weekend Stuff** fleet.

---

## ⚡ Mechanics & Features

- **Kinematics & Movement**:
  - Zero-inertia horizontal movement (`140 px/s`) with crisp deceleration.
  - Variable jump height with coyote time (`100ms`) and jump input buffering (`120ms`).
  - Wall sliding & wall kicking with a 120ms directional lock out to prevent accidental re-clings.
  - **8-Way Air Dash (`320 px/s`)**: 40ms freeze-frame hit-stop, direction-locked velocity, and camera shake.
  - **Instant Flow Respawn**: Sub-120ms death-to-checkpoint loop. No loading screens, no game-over friction.
- **Audio Architecture**:
  - 100% Procedural Web Audio API DSP sound synthesizer. Zero audio assets or MP3 files required.
  - Square wave jumps, bandpass noise dash bursts, crystal arpeggios, sawtooth death crunch, and rewind sweeps.
- **Visuals**:
  - Native 480x270 pixel art canvas rendered with integer scaling and CRT scanlines.
  - Dynamic dash ghost trails, landing dust puffs, spark particles, and camera shake.
- **Engine Size**:
  - Entire production bundle compiles into **<17 KB** of pure TypeScript and canvas code.

---

## 🎮 Controls

| Action | Keyboard |
|---|---|
| Move Left / Right | `A` / `D` or `ArrowLeft` / `ArrowRight` |
| Look Up / Down | `W` / `S` or `ArrowUp` / `ArrowDown` |
| Jump / Wall Kick | `Space` / `Z` / `W` / `Up` |
| 8-Way Air Dash | `J` / `X` / `Shift` |
| Quick Restart / Suicide | `R` |

---

## 🚀 Quickstart

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Compile optimized production bundle
npm run build
```

Run with the single-click Windows launcher:
```powershell
./run_game.bat
```
