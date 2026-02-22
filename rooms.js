// rooms.js

const ROOM = Object.freeze({
  CLEARING: "CLEARING",
  ENTRANCE_HALL: "ENTRANCE_HALL",
  DINING_ROOM: "DINING_ROOM",
  PLAYROOM: "PLAYROOM",
  KITCHEN: "KITCHEN",
  BANK: "BANK",
  NOAHROOM: "NOAHROOM",

  DARKFOREST: "DARKFOREST",
  DARKCLEARING: "DARKCLEARING",
  SHED: "SHED",
  COTTAGE_BEDROOM: "COTTAGE_BEDROOM",
  COTTAGE_STOREROOM: "COTTAGE_STOREROOM",
  COTTAGE_KITCHEN: "COTTAGE_KITCHEN",
  MINE_ENTRANCE: "MINE_ENTRANCE",
  MINE_CAVERN: "MINE_CAVERN",
  SHIPWRECK_FOREST: "SHIPWRECK_FOREST",
  RIVER: "RIVER",
  SPIDERFOREST: "SPIDERFOREST",
});

const ROOM_DEFS = {

  [ROOM.DARKFOREST]: {
    id: ROOM.DARKFOREST,
    name: "Dark Forest",
    desc: ({ room }) => {
      const ids = (room?.items || []).map((entry) => (Array.isArray(entry) ? entry[0] : entry));
      const fireText = ids.includes(ITEM.CAMPFIRE_OUT)
        ? "A doused campfire smolders in the middle, sending up thin smoke."
        : "A roaring campfire burns in the middle, spitting sparks into the dark.";
      return `The trees stand too close together. ${fireText} There’s a narrow gap to the east.`;
    },
    items: [
      [ITEM.TREE, [1, 1]],
      [ITEM.TREE, [3, 1]],
      [ITEM.TREE, [5, 1]],
      [ITEM.TREE, [1, 3]],
      [ITEM.CAMPFIRE, [3, 3]],
      [ITEM.TREE, [3, 5]],
      [ITEM.TREE, [1, 5]],
      [ITEM.TREE, [5, 5]],
    ],
    exits: { EAST: ROOM.DARKCLEARING },
  },

  [ROOM.DARKCLEARING]: {
    id: ROOM.DARKCLEARING,
    name: "Dark Clearing",
    desc: ({ room }) => {
      const items = room?.items || [];
      const ids = items.map((entry) => (Array.isArray(entry) ? entry[0] : entry));

      let doorText = "A door stands to the east for no obvious reason.";
      if (ids.includes(ITEM.DOOR_LOCKED)) {
        doorText = "A locked door stands to the east for no obvious reason.";
      } else if (ids.includes(ITEM.DOOR_CLOSED)) {
        doorText = "A closed door stands to the east for no obvious reason.";
      } else if (ids.includes(ITEM.DOOR_OPEN)) {
        doorText = "An open doorway leads east.";
      }

      return `A bare clearing with flattened leaves. A path slopes down to the south. ${doorText}`;
    },
    items: [[ITEM.LEAVES, [5, 4]]],
    exits: {
      NORTH: ROOM.SHIPWRECK_FOREST,
      SOUTH: ROOM.RIVER,
      WEST: ROOM.DARKFOREST,
      EAST: { to: ROOM.MINE_ENTRANCE, barrier: ITEM.DOOR_LOCKED },
    },
  },

  [ROOM.SHIPWRECK_FOREST]: {
    id: ROOM.SHIPWRECK_FOREST,
    name: "Shipwreck Forest",
    desc: "Trees crowd around a ruined shipwreck lodged impossibly in the forest floor. A weathered painting of Captian Hook is nailed to the hull.",
    items: [
      [ITEM.SHIPWRECK, [2, 2]],
      [ITEM.SHIPWRECK, [3, 2]],
      [ITEM.SHIPWRECK, [4, 2]],
      [ITEM.SHIPWRECK, [2, 3]],
      [ITEM.SHIPWRECK, [3, 3]],
      [ITEM.SHIPWRECK, [4, 3]],
      [ITEM.CAPTIAN_HOOK_PAINTING, [3, 3]],
    ],
    exits: {
      SOUTH: ROOM.DARKCLEARING,
    },
  },

  [ROOM.SHED]: {
    id: ROOM.SHED,
    name: "Cottage Entrance",
    desc: "A curious wooden cottage sits in the gloom. The entrance room is bare except for a note on the floor.",
    items: [[ITEM.NOTE, [3, 3]]],
    exits: {
      SOUTH: ROOM.MINE_ENTRANCE,
      NORTH: ROOM.COTTAGE_BEDROOM,
      WEST: ROOM.COTTAGE_STOREROOM,
      EAST: ROOM.COTTAGE_KITCHEN,
    },
  },

  [ROOM.COTTAGE_BEDROOM]: {
    id: ROOM.COTTAGE_BEDROOM,
    name: "Cottage Bedroom",
    desc: "A small wooden bedroom with a low ceiling and stale air.",
    items: [
      [ITEM.BED, [2, 2]],
      [ITEM.BED, [3, 2]],
      [ITEM.BED, [4, 2]],
      [ITEM.BED, [2, 3]],
      [ITEM.BED, [3, 3]],
      [ITEM.BED, [4, 3]],
      [ITEM.BED, [2, 4]],
      [ITEM.BED, [3, 4]],
      [ITEM.BED, [4, 4]],
    ],
    exits: { SOUTH: ROOM.SHED },
  },

  [ROOM.COTTAGE_STOREROOM]: {
    id: ROOM.COTTAGE_STOREROOM,
    name: "Cottage Storeroom",
    desc: "Shelves sag under old crates. An oil drum rests in the corner.",
    items: [[ITEM.OIL_DRUM, [3, 3]]],
    exits: { EAST: ROOM.SHED },
  },

  [ROOM.COTTAGE_KITCHEN]: {
    id: ROOM.COTTAGE_KITCHEN,
    name: "Cottage Kitchen",
    desc: "A cramped kitchen of warped boards. A humming fridge stands against the wall with a fridge magnet on its door.",
    items: [
      [ITEM.FRIDGE, [3, 3]],
      [ITEM.MAGNET, [4, 3]],
    ],
    exits: { WEST: ROOM.SHED },
  },

  [ROOM.MINE_ENTRANCE]: {
    id: ROOM.MINE_ENTRANCE,
    name: "Mine Entrance",
    desc: "A timbered tunnel mouth yawns into darkness. Warning signs hang from bent nails. A wooden cottage sits up to the north.",
    items: [],
    exits: {
      WEST: ROOM.DARKCLEARING,
      NORTH: ROOM.SHED,
      EAST: { to: ROOM.MINE_CAVERN, barrier: ITEM.HEALTH_INSPECTOR },
    },
  },

  [ROOM.MINE_CAVERN]: {
    id: ROOM.MINE_CAVERN,
    name: "Mine Cavern",
    desc: "A vast cavern opens ahead, dripping and echoing.",
    items: [[ITEM.CORN, [3, 3]]],
    exits: {
      WEST: ROOM.MINE_ENTRANCE,
    },
  },

  [ROOM.RIVER]: {
    id: ROOM.RIVER,
    name: "River Bank",
    desc: "A fast river moves past without making much sound. The surface reflects the sky, but the colours are wrong.",
    items: [
      [ITEM.TREE, [1, 1]],
      [ITEM.TREE, [5, 1]],
      [ITEM.STICK, [2, 2]],
      [ITEM.SIGN, [4, 2]],
      [ITEM.RIVER, [3, 4]],
      [ITEM.RIVER_TILE, [1, 4]],
      [ITEM.RIVER_TILE, [2, 4]],
      [ITEM.RIVER_TILE, [4, 4]],
      [ITEM.RIVER_TILE, [5, 4]],
      [ITEM.RIVER_TILE, [1, 5]],
      [ITEM.RIVER_TILE, [2, 5]],
      [ITEM.RIVER_TILE, [3, 5]],
      [ITEM.RIVER_TILE, [4, 5]],
      [ITEM.RIVER_TILE, [5, 5]],
    ],
    exits: {
      NORTH: ROOM.DARKCLEARING,
      EAST: ROOM.SPIDERFOREST,
    },
  },

  [ROOM.SPIDERFOREST]: {
    id: ROOM.SPIDERFOREST,
    name: "Spider Forest",
    desc: "Webs hang between the trees at head height. Some are old. Some are not. The only clear way back is west.",
    items: [
      [ITEM.TREE, [2, 2]],
      [ITEM.TREE, [4, 2]],
      [ITEM.TREE, [2, 4]],
      [ITEM.TREE, [4, 4]],
      ITEM.CHICKEN_IN_WEB,
    ],
    exits: { WEST: ROOM.RIVER },
  },

  [ROOM.CLEARING]: {
    id: ROOM.CLEARING,
    name: "Forest Clearing",
    desc: "A neat circle of grass in the forest. The house to the north looks closer than it should.",
    items: [
      [ITEM.CHICKEN, [5, 3]],
      ITEM.STICK,
      ITEM.LEAVES,
      ITEM.CORN,
      ITEM.MAGNET,
      ITEM.ROPE,
    ],
    exits: {
      NORTH: ROOM.ENTRANCE_HALL,
      EAST: { to: ROOM.BANK, barrier: ITEM.DOOR_CLOSED },
    },
  },

  [ROOM.ENTRANCE_HALL]: {
    id: ROOM.ENTRANCE_HALL,
    name: "Entrance Hall",
    desc: "A tall hall with a chandelier that isn’t quite still. Your footsteps sound a fraction late.",
    items: [ITEM.DINOSAUR],
    exits: {
      SOUTH: ROOM.CLEARING,
      WEST: ROOM.DINING_ROOM,
      EAST: ROOM.PLAYROOM,
      NORTH: { to: ROOM.KITCHEN, barrier: ITEM.DOOR_CLOSED },
    },
  },

  [ROOM.DINING_ROOM]: {
    id: ROOM.DINING_ROOM,
    name: "Dining Room",
    desc: "A long table laid for a meal that never started. The chairs are all slightly misaligned.",
    items: [],
    exits: { EAST: ROOM.ENTRANCE_HALL },
  },

  [ROOM.PLAYROOM]: {
    id: ROOM.PLAYROOM,
    name: "Playroom",
    desc: "Rows of toys watch from the shelves. One space is empty, recently.",
    items: [ITEM.MAGNET],
    exits: { WEST: ROOM.ENTRANCE_HALL },
  },

  [ROOM.BANK]: {
    id: ROOM.BANK,
    name: "Bank",
    desc: "Coins are piled everywhere, but the room still feels empty. The air smells faintly of paper and dust.",
    items: [
      ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN,
      ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN,
      ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN, ITEM.COIN,
    ],
    exits: {
      WEST: { to: ROOM.CLEARING, barrier: ITEM.DOOR_OPEN },
    },
  },

  [ROOM.KITCHEN]: {
    id: ROOM.KITCHEN,
    name: "Kitchen",
    desc: "Hanging pans sway slightly, though the air is still. Something here was used not long ago.",
    items: [
      [ITEM.ROPE, [2, 1]],
      [ITEM.MICROWAVE, [4, 4]],
    ],
    exits: {
      SOUTH: ROOM.ENTRANCE_HALL,
      NORTH: ROOM.NOAHROOM,
    },
  },

  [ROOM.NOAHROOM]: {
    id: ROOM.NOAHROOM,
    name: "Noahs Room",
    desc: "A test room. Things are placed carefully, as if waiting to see what you’ll do.",
    items: [
      [ITEM.TEDDYBEAR, [2, 1]],
      [ITEM.TEDDYBEAR, [3, 5]],
      [ITEM.TEDDYBEAR, [4, 3]],
      [ITEM.CHICKEN, [5, 3]],
    ],
    exits: { SOUTH: ROOM.KITCHEN },
  },
};

// -----------------------------------------------------------------------------
// Coordinate helpers (7x7, avoid borders)
// -----------------------------------------------------------------------------

const ROOM_SIZE = 7; // 0..6
const MIN_INTERIOR = 1;
const MAX_INTERIOR = ROOM_SIZE - 2; // 5

const MID = Math.floor(ROOM_SIZE / 2); // 3

function edgeCoordForDir(dir) {
  const d = String(dir || "").toUpperCase();
  if (d === "NORTH") return [MID, 0];
  if (d === "SOUTH") return [MID, ROOM_SIZE - 1];
  if (d === "WEST") return [0, MID];
  if (d === "EAST") return [ROOM_SIZE - 1, MID];
  return [MID, MID];
}

function borderItemAtDirection(room, dir) {
  const [x, y] = edgeCoordForDir(dir);
  const hit = (room?.items || []).find(
    (e) => Array.isArray(e) && e[1]?.[0] === x && e[1]?.[1] === y
  );
  return hit ? hit[0] : null;
}

function entryToId(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}

function roomHasItemAt(room, itemId, coord) {
  return (room?.items || []).some(
    (e) => Array.isArray(e) && e[0] === itemId && e[1]?.[0] === coord[0] && e[1]?.[1] === coord[1]
  );
}

function isExitObject(exit) {
  return exit && typeof exit === "object" && !Array.isArray(exit);
}

function exitToRoomId(exit) {
  if (typeof exit === "string") return exit;
  if (isExitObject(exit)) return exit.to ?? null;
  return null;
}

function exitBarrier(exit) {
  if (isExitObject(exit)) return exit.barrier ?? null;
  return null;
}

function isDoorBarrier(barrierId) {
  return barrierId === ITEM.DOOR_CLOSED || barrierId === ITEM.DOOR_LOCKED;
}

// Put door items into room.items based on exits[].barrier
function normaliseExitBarriers(room) {
  if (!room) return;
  if (!Array.isArray(room.items)) room.items = [];

  const exits = room.exits || {};
  for (const [dir, exit] of Object.entries(exits)) {
    if (!isExitObject(exit)) continue;

    const barrier = exit.barrier ?? null;
    if (!barrier) continue;

    const coord = edgeCoordForDir(dir);
    if (!roomHasItemAt(room, barrier, coord)) {
      room.items.push([barrier, coord]);
    }
  }
}

// Put WALL items around borders except where there is an exit opening OR a door.
// This is for ASCII rendering (so borders are correct per-room).
function normaliseBorderWalls(room) {
  if (!room) return;
  if (!Array.isArray(room.items)) room.items = [];

  // Determine which directions should NOT get walls at the edge midpoint
  // - if there is an exit (string or object) => opening
  // - if there is a door barrier item => door (also not wall)
  const blockWallAt = new Set(); // of "x,y"

  const exits = room.exits || {};
  for (const [dir, exit] of Object.entries(exits)) {
    const to = exitToRoomId(exit);
    if (!to) continue; // not an exit
    const coord = edgeCoordForDir(dir);

    // openings and doors both mean: don't place a wall tile here
    blockWallAt.add(`${coord[0]},${coord[1]}`);
  }

  // Also: if a door barrier item exists at an edge coordinate, it should override wall
  // (we still ensure no wall gets placed there)
  for (const entry of room.items) {
    if (!Array.isArray(entry)) continue;
    const id = entry[0];
    const c = entry[1];
    if (!c) continue;
    if (isDoorBarrier(id)) blockWallAt.add(`${c[0]},${c[1]}`);
  }

  // Helper: place a wall if nothing else already occupies that coordinate
  function placeWallAt(x, y) {
    const key = `${x},${y}`;
    if (blockWallAt.has(key)) return;

    const occupied = (room.items || []).some(
      (e) => Array.isArray(e) && e[1]?.[0] === x && e[1]?.[1] === y
    );
    if (occupied) return;

    room.items.push([ITEM.WALL, [x, y]]);
  }

  // Fill the entire border with walls (except openings/doors)
  for (let x = 0; x < ROOM_SIZE; x++) {
    placeWallAt(x, 0);                 // top
    placeWallAt(x, ROOM_SIZE - 1);     // bottom
  }
  for (let y = 0; y < ROOM_SIZE; y++) {
    placeWallAt(0, y);                 // left
    placeWallAt(ROOM_SIZE - 1, y);     // right
  }
}

const BORDER_THEMES = Object.freeze({
  [ROOM.DARKFOREST]: {
    NORTH: ITEM.TREE,
    SOUTH: ITEM.TREE,
    EAST: ITEM.TREE,
    WEST: ITEM.TREE,
  },
  [ROOM.SPIDERFOREST]: {
    NORTH: ITEM.TREE,
    SOUTH: ITEM.TREE,
    EAST: ITEM.TREE,
    WEST: ITEM.TREE,
  },
  [ROOM.CLEARING]: {
    SOUTH: ITEM.TREE,
    WEST: ITEM.TREE,
  },
  [ROOM.DARKCLEARING]: {
    NORTH: ITEM.TREE,
    SOUTH: ITEM.TREE,
    WEST: ITEM.TREE,
  },
  [ROOM.SHIPWRECK_FOREST]: {
    NORTH: ITEM.TREE,
    SOUTH: ITEM.TREE,
    EAST: ITEM.TREE,
    WEST: ITEM.TREE,
  },
  [ROOM.RIVER]: {
    NORTH: ITEM.TREE,
    EAST: ITEM.TREE,
    WEST: ITEM.TREE,
    SOUTH: ITEM.RIVER_TILE,
  },
  [ROOM.SHED]: {
    NORTH: ITEM.WOOD_WALL,
    SOUTH: ITEM.WOOD_WALL,
    EAST: ITEM.WOOD_WALL,
    WEST: ITEM.WOOD_WALL,
  },
  [ROOM.COTTAGE_BEDROOM]: {
    NORTH: ITEM.WOOD_WALL,
    SOUTH: ITEM.WOOD_WALL,
    EAST: ITEM.WOOD_WALL,
    WEST: ITEM.WOOD_WALL,
  },
  [ROOM.COTTAGE_STOREROOM]: {
    NORTH: ITEM.WOOD_WALL,
    SOUTH: ITEM.WOOD_WALL,
    EAST: ITEM.WOOD_WALL,
    WEST: ITEM.WOOD_WALL,
  },
  [ROOM.COTTAGE_KITCHEN]: {
    NORTH: ITEM.WOOD_WALL,
    SOUTH: ITEM.WOOD_WALL,
    EAST: ITEM.WOOD_WALL,
    WEST: ITEM.WOOD_WALL,
  },
});

function coordIsOnSide(coord, side) {
  const x = coord?.[0];
  const y = coord?.[1];
  if (x == null || y == null) return false;
  if (side === "NORTH") return y === 0;
  if (side === "SOUTH") return y === ROOM_SIZE - 1;
  if (side === "WEST") return x === 0;
  if (side === "EAST") return x === ROOM_SIZE - 1;
  return false;
}

function applyBorderTheme(room) {
  if (!room || !Array.isArray(room.items)) return;
  const theme = BORDER_THEMES[room.id];
  if (!theme) return;

  room.items = room.items.map((entry) => {
    if (!Array.isArray(entry)) return entry;
    const id = entry[0];
    const coord = entry[1];

    // Only swap generated border WALL tiles. Exits and doors are preserved.
    if (id !== ITEM.WALL) return entry;

    for (const [side, borderItem] of Object.entries(theme)) {
      if (coordIsOnSide(coord, side)) {
        return [borderItem, coord];
      }
    }
    return entry;
  });
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function coordKey(x, y) {
  return `${x},${y}`;
}

function randomInteriorCoord(used) {
  for (let attempts = 0; attempts < 200; attempts++) {
    const x = randInt(MIN_INTERIOR, MAX_INTERIOR);
    const y = randInt(MIN_INTERIOR, MAX_INTERIOR);
    const key = coordKey(x, y);
    if (!used.has(key)) {
      used.add(key);
      return [x, y];
    }
  }

  for (let x = MIN_INTERIOR; x <= MAX_INTERIOR; x++) {
    for (let y = MIN_INTERIOR; y <= MAX_INTERIOR; y++) {
      const key = coordKey(x, y);
      if (!used.has(key)) {
        used.add(key);
        return [x, y];
      }
    }
  }

  return [MIN_INTERIOR, MIN_INTERIOR];
}

function isItemWithCoord(entry) {
  return Array.isArray(entry) && entry.length === 2 && Array.isArray(entry[1]);
}

function getItemId(entry) {
  return isItemWithCoord(entry) ? entry[0] : entry;
}

function getItemCoord(entry) {
  return isItemWithCoord(entry) ? entry[1] : null;
}

function normalizeRoomItems() {
  for (const roomId of Object.keys(ROOM_DEFS)) {
    const room = ROOM_DEFS[roomId];
    if (!room?.items) continue;

    const used = new Set();

    // Reserve explicitly-defined coordinates first
    for (const entry of room.items) {
      const c = getItemCoord(entry);
      if (c) used.add(coordKey(c[0], c[1]));
    }

    // Fill in missing coordinates with random interior ones
    room.items = room.items.map(entry => {
      if (isItemWithCoord(entry)) return entry;

      const id = entry;
      const coord = randomInteriorCoord(used);
      return [id, coord];
    });
  }
}

// Run once at load:
// 1) add door items from exit barriers
// 2) add border walls except openings/doors
// 3) apply room-specific border themes
// 4) randomise interior coords for items without coords
for (const r of Object.values(ROOM_DEFS)) normaliseExitBarriers(r);
for (const r of Object.values(ROOM_DEFS)) normaliseBorderWalls(r);
for (const r of Object.values(ROOM_DEFS)) applyBorderTheme(r);
normalizeRoomItems();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getRoom(id) {
  return ROOM_DEFS[id];
}

// Returns:
//   { to: ROOM_ID } on success
//   { blocked: true, reason: "door"|"wall", barrier: ITEM_ID|null } if blocked
//   null if invalid / no exit
function tryMoveRoom(currentRoomId, direction) {
  const room = ROOM_DEFS[currentRoomId];
  const dir = String(direction || "").toUpperCase();
  const exit = room?.exits?.[dir];

  // No exit at all => wall
  if (!exit) {
    return {
      blocked: true,
      reason: "wall",
      barrier: borderItemAtDirection(room, dir) ?? null,
    };
  }

  // Old format: exits: { NORTH: "KITCHEN" }
  if (typeof exit === "string") {
    return { to: exit };
  }

  // New format
  const to = exit.to ?? null;
  const barrier = exit.barrier ?? null;

  // Dynamic gate: inspector only blocks until the campfire is put out.
  if (
    barrier === ITEM.HEALTH_INSPECTOR &&
    window.GameCore?.state?.flags?.fireOut
  ) {
    // Once condition is met, clear the barrier permanently.
    exit.barrier = null;
    if (Array.isArray(room.items)) {
      room.items = room.items.filter(
        (e) =>
          !(Array.isArray(e) && e[0] === ITEM.HEALTH_INSPECTOR && e[1]?.[0] === ROOM_SIZE - 1 && e[1]?.[1] === MID)
      );
    }
    return { to };
  }

  if (!to) {
    return { blocked: true, reason: "wall", barrier: null };
  }

  // Step 1: any barrier blocks
  // Step 1+: barriers block UNLESS it's an open door
  if (barrier && barrier !== ITEM.DOOR_OPEN) {
    return { blocked: true, reason: "barrier", barrier };
  }

  return { to };
}

// Keep backwards compatibility: old callers can still use moveRoom() and get null / roomId
function moveRoom(currentRoomId, direction) {
  const r = tryMoveRoom(currentRoomId, direction);
  return r?.to ?? null;
}


function getMoveBlockedMessage(result) {
  if (!result || !result.blocked) return null;

  if (result.reason === "barrier") {
    if (result.barrier === ITEM.DOOR_CLOSED) return "The door is closed.";
    if (result.barrier === ITEM.DOOR_LOCKED) return "It's locked.";
    if (result.barrier === ITEM.HEALTH_INSPECTOR) {
      return "The Health and Safety Inspector blocks your way. \"No entry while you've got an open fire.\"";
    }
    const def = result.barrier ? ITEM_DEFS?.[result.barrier] : null;
    const name = def?.name ?? "something";
    return `The ${name.toLowerCase()} blocks your way.`;
  }

  if (result.reason === "wall") {
    if (result.barrier === ITEM.TREE) return "Trees block your way.";
    if (result.barrier === ITEM.RIVER || result.barrier === ITEM.RIVER_TILE) {
      return "A river blocks your way.";
    }
    if (result.barrier === ITEM.WOOD_WALL) return "A wooden wall blocks your way.";
    if (result.barrier === ITEM.WALL) return "A wall blocks your way.";
  }

  return "You can't go that way.";

}

// List visible items in a room using ITEM_DEFS
function getVisibleItems(roomId) {
  const room = ROOM_DEFS[roomId];
  if (!room) return [];

  const seen = new Set();
  const out = [];

  for (const entry of room.items || []) {
    const id = getItemId(entry);
    if (!id || seen.has(id)) continue;

    const def = ITEM_DEFS[id];
    if (!def || def.visible === false) continue;

    seen.add(id);
    out.push(`${def.emoji} ${def.name}`);
  }

  return out;
}

// -----------------------------------------------------------------------------
// Expose for file://
// -----------------------------------------------------------------------------
/*
window.ROOM = ROOM;
window.ROOM_DEFS = ROOM_DEFS;
window.getRoom = getRoom;
window.moveRoom = moveRoom;
window.tryMoveRoom = tryMoveRoom;                 // ✅ NEW
window.getMoveBlockedMessage = getMoveBlockedMessage; // ✅ NEW
window.getVisibleItems = getVisibleItems;
*/
