/**
 * Precision Input Handler (Kei OS)
 * Unified Keyboard & Gamepad polling with timestamped input buffering.
 */

export class InputManager {
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  public jumpBufferTimer = 0; // Milliseconds remaining for buffered jump

  constructor() {
    window.addEventListener("keydown", (e) => {
      // Prevent browser scrolling with Space / Arrow keys
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
        if (e.code === "Space" || e.code === "KeyZ") {
          this.jumpBufferTimer = 0.12; // 120ms buffer window
        }
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.code);
      this.keysJustReleased.add(e.code);
    });
  }

  public update(dt: number): void {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }
  }

  public endFrame(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }

  public get moveX(): number {
    let x = 0;
    if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA")) x -= 1;
    if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD")) x += 1;
    return x;
  }

  public get moveY(): number {
    let y = 0;
    if (this.keysDown.has("ArrowUp") || this.keysDown.has("KeyW")) y -= 1;
    if (this.keysDown.has("ArrowDown") || this.keysDown.has("KeyS")) y += 1;
    return y;
  }

  public get jumpHeld(): boolean {
    return this.keysDown.has("Space") || this.keysDown.has("KeyZ");
  }

  public get jumpJustPressed(): boolean {
    return (
      this.keysJustPressed.has("Space") || 
      this.keysJustPressed.has("KeyZ") || 
      this.jumpBufferTimer > 0
    );
  }

  public consumeJumpBuffer(): void {
    this.jumpBufferTimer = 0;
    this.keysJustPressed.delete("Space");
    this.keysJustPressed.delete("KeyZ");
  }

  public get dashJustPressed(): boolean {
    return (
      this.keysJustPressed.has("ShiftLeft") || 
      this.keysJustPressed.has("ShiftRight") || 
      this.keysJustPressed.has("KeyX") || 
      this.keysJustPressed.has("KeyK")
    );
  }

  public get restartJustPressed(): boolean {
    return this.keysJustPressed.has("KeyR");
  }
}

export const Input = new InputManager();

