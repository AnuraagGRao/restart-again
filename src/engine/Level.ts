import { RoomData, TileType } from "./Types.ts";

export const TILE_SIZE = 16;

function createEmptyGrid(cols: number, rows: number): TileType[][] {
  const grid: TileType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < cols; c++) {
      row.push("empty");
    }
    grid.push(row);
  }
  return grid;
}

// =========================================================================
// ROOM 1: THE BOOT CHAMBER (Zero-Inertia Movement & Variable Jump)
// =========================================================================
function buildRoom1(): RoomData {
  const cols = 30;
  const rows = 17;
  const tiles = createEmptyGrid(cols, rows);

  // Border walls & floors
  for (let c = 0; c < cols; c++) {
    tiles[0][c] = "solid";          // Ceiling
    tiles[rows - 1][c] = "solid";   // Floor
  }
  for (let r = 0; r < rows; r++) {
    tiles[r][0] = "solid";          // Left wall
    tiles[r][cols - 1] = "solid";   // Right wall
  }

  // Stepping platforms
  // Small obstacle
  tiles[14][8] = "solid";
  tiles[15][8] = "solid";

  // Hazard pit with spikes
  tiles[15][12] = "spike_up";
  tiles[15][13] = "spike_up";
  tiles[15][14] = "spike_up";

  // Raised platform
  for (let c = 16; c <= 20; c++) {
    tiles[12][c] = "solid";
  }

  // Ceiling spikes testing variable jump height
  tiles[1][12] = "spike_down";
  tiles[1][13] = "spike_down";
  tiles[1][14] = "spike_down";

  // High barrier with checkpoint before portal
  for (let r = 9; r <= 15; r++) {
    tiles[r][23] = "solid";
  }

  return {
    id: 1,
    name: "01 // BOOT CHAMBER",
    widthTiles: cols,
    heightTiles: rows,
    tiles,
    spawn: { x: 3 * TILE_SIZE, y: 14 * TILE_SIZE },
    crystals: [
      { x: 18 * TILE_SIZE, y: 9 * TILE_SIZE, w: 12, h: 12, active: true, respawnTimer: 0 }
    ],
    checkpoints: [
      { x: 21 * TILE_SIZE, y: 11 * TILE_SIZE, active: false }
    ],
    portals: [
      {
        x: 27 * TILE_SIZE,
        y: 13 * TILE_SIZE,
        w: 16,
        h: 32,
        targetRoom: 2,
        targetSpawn: { x: 2 * TILE_SIZE, y: 14 * TILE_SIZE }
      }
    ]
  };
}

// =========================================================================
// ROOM 2: THE VERTICAL SHAFT (Wall-Slide & Wall-Kick Mastery)
// =========================================================================
function buildRoom2(): RoomData {
  const cols = 30;
  const rows = 17;
  const tiles = createEmptyGrid(cols, rows);

  // Borders
  for (let c = 0; c < cols; c++) {
    tiles[0][c] = "solid";
    tiles[rows - 1][c] = "solid";
  }
  for (let r = 0; r < rows; r++) {
    tiles[r][0] = "solid";
    tiles[r][cols - 1] = "solid";
  }

  // Bottom hazard floor except spawn
  for (let c = 5; c < cols - 1; c++) {
    tiles[rows - 2][c] = "spike_up";
  }

  // Vertical shaft 1
  for (let r = 5; r <= 15; r++) {
    tiles[r][8] = "solid";
  }
  for (let r = 2; r <= 12; r++) {
    tiles[r][13] = "solid";
  }

  // Mid-air resting ledge
  tiles[7][17] = "solid";
  tiles[7][18] = "solid";
  tiles[7][19] = "solid";

  // Vertical shaft 2 with spikes on opposite wall
  for (let r = 3; r <= 14; r++) {
    tiles[r][23] = "solid";
    tiles[r][27] = "solid";
  }
  tiles[7][24] = "spike_left";
  tiles[8][24] = "spike_left";

  return {
    id: 2,
    name: "02 // KINETIC SHAFT",
    widthTiles: cols,
    heightTiles: rows,
    tiles,
    spawn: { x: 2 * TILE_SIZE, y: 14 * TILE_SIZE },
    crystals: [
      { x: 10.5 * TILE_SIZE, y: 8 * TILE_SIZE, w: 12, h: 12, active: true, respawnTimer: 0 }
    ],
    checkpoints: [
      { x: 18 * TILE_SIZE, y: 6 * TILE_SIZE, active: false }
    ],
    portals: [
      {
        x: 25 * TILE_SIZE,
        y: 2 * TILE_SIZE,
        w: 16,
        h: 32,
        targetRoom: 3,
        targetSpawn: { x: 2 * TILE_SIZE, y: 14 * TILE_SIZE }
      }
    ]
  };
}

// =========================================================================
// ROOM 3: THE VOID CHASMS (8-Way Air Dash & Mid-Air Crystal Resets)
// =========================================================================
function buildRoom3(): RoomData {
  const cols = 30;
  const rows = 17;
  const tiles = createEmptyGrid(cols, rows);

  // Borders
  for (let c = 0; c < cols; c++) {
    tiles[0][c] = "solid";
    tiles[rows - 1][c] = "solid";
  }
  for (let r = 0; r < rows; r++) {
    tiles[r][0] = "solid";
    tiles[r][cols - 1] = "solid";
  }

  // Starting island
  for (let c = 1; c <= 4; c++) {
    tiles[15][c] = "solid";
  }

  // Giant pit of spikes below
  for (let c = 5; c <= 25; c++) {
    tiles[rows - 2][c] = "spike_up";
  }

  // Floating precision pillars
  tiles[13][10] = "solid";
  tiles[10][16] = "solid";
  tiles[7][22] = "solid";

  // Goal platform
  for (let c = 26; c <= 28; c++) {
    tiles[5][c] = "solid";
  }

  return {
    id: 3,
    name: "03 // VOID RE:IGNITION",
    widthTiles: cols,
    heightTiles: rows,
    tiles,
    spawn: { x: 2 * TILE_SIZE, y: 14 * TILE_SIZE },
    crystals: [
      { x: 7.5 * TILE_SIZE, y: 13.5 * TILE_SIZE, w: 12, h: 12, active: true, respawnTimer: 0 },
      { x: 13.5 * TILE_SIZE, y: 11 * TILE_SIZE, w: 12, h: 12, active: true, respawnTimer: 0 },
      { x: 19.5 * TILE_SIZE, y: 8 * TILE_SIZE, w: 12, h: 12, active: true, respawnTimer: 0 },
    ],
    checkpoints: [
      { x: 16 * TILE_SIZE, y: 9 * TILE_SIZE, active: false }
    ],
    portals: [
      {
        x: 27 * TILE_SIZE,
        y: 3 * TILE_SIZE,
        w: 16,
        h: 32,
        targetRoom: 1, // Loop back for "A:Gain" loop progression!
        targetSpawn: { x: 3 * TILE_SIZE, y: 14 * TILE_SIZE }
      }
    ]
  };
}

export const ROOMS: RoomData[] = [
  buildRoom1(),
  buildRoom2(),
  buildRoom3(),
];

