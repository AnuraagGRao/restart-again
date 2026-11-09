export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type TileType = 
  | "empty" 
  | "solid" 
  | "spike_up" 
  | "spike_down" 
  | "spike_left" 
  | "spike_right"
  | "dash_crystal"
  | "checkpoint"
  | "portal";

export interface DashCrystal {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  respawnTimer: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  active: boolean;
}

export interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  targetRoom: number;
  targetSpawn: Vector2D;
}

export interface RoomData {
  id: number;
  name: string;
  widthTiles: number;
  heightTiles: number;
  tiles: TileType[][];
  spawn: Vector2D;
  crystals: DashCrystal[];
  checkpoints: Checkpoint[];
  portals: Portal[];
}

