// rooms.js

const ROOM = Object.freeze({
  CLEARING: "CLEARING",
  ENTRANCE_HALL: "ENTRANCE_HALL",
  DINING_ROOM: "DINING_ROOM",
  PLAYROOM: "PLAYROOM",
  KITCHEN: "KITCHEN",
  BANK: "BANK",
  NOAHROOM: "NOAHROOM",
});

const ROOM_DEFS = {
  [ROOM.CLEARING]: {
    id: ROOM.CLEARING,
    name: "Forest Clearing",
    desc: "You are standing in a quiet forest clearing. A large, slightly spooky house lies to the north.",
    items: [
      [ITEM.CHICKEN, [5, 3]],
      ITEM.STICK,
      ITEM.LEAVES,
      ITEM.CORN,
      ITEM.MAGNET,
      ITEM.ROPE, // your "string"
    ],
    exits: {
      NORTH: ROOM.ENTRANCE_HALL,
      EAST: ROOM.BANK,
    },
  },

  [ROOM.ENTRANCE_HALL]: {
    id: ROOM.ENTRANCE_HALL,
    name: "Entrance Hall",
    desc: "A tall, dusty hall with a chandelier overhead. Footsteps echo on the wooden floor.",
    items: [
      ITEM.DINOSAUR,
    ],
    exits: {
      SOUTH: ROOM.CLEARING,
      WEST: ROOM.DINING_ROOM,
      EAST: ROOM.PLAYROOM,
      NORTH: ROOM.KITCHEN,
    },
  },

  [ROOM.DINING_ROOM]: {
    id: ROOM.DINING_ROOM,
    name: "Dining Room",
    desc: "A long table dominates the room, laid for a meal that never came.",
    items: [],
    exits: {
      EAST: ROOM.ENTRANCE_HALL,
    },
  },

  [ROOM.PLAYROOM]: {
    id: ROOM.PLAYROOM,
    name: "Playroom",
    desc: "Shelves of old toys line the walls. One of them seems to have moved.",
    items: [
      ITEM.MAGNET,
    ],
    exits: {
      WEST: ROOM.ENTRANCE_HALL,
    },
  },

  [ROOM.BANK]: {
    id: ROOM.PLAYROOM,
    name: "Bank",
    desc: "Loads of coins.",
    items: [
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
      ITEM.COIN,
    ],
    exits: {
      WEST: ROOM.CLEARING,
    },
  },

  [ROOM.KITCHEN]: {
    id: ROOM.KITCHEN,
    name: "Kitchen",
    desc: "Pots and pans hang from the ceiling. Something smells faintly of soup.",
    items: [
      // You can still pin specific items if you want:
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
    desc: "Where Noah tests stuff",
    items: [
      [ITEM.TEDDYBEAR, [2, 1]],
      [ITEM.TEDDYBEAR, [3, 5]],
      [ITEM.TEDDYBEAR, [4, 3]],
      [ITEM.CHICKEN, [5, 3]],
    ],
    exits: {
      SOUTH: ROOM.KITCHEN,
    },
  },
};

// -----------------------------------------------------------------------------
// Coordinate helpers (7x7, avoid borders)
// -----------------------------------------------------------------------------

const ROOM_SIZE = 7; // 0..6
const MIN_INTERIOR = 1;
const MAX_INTERIOR = ROOM_SIZE - 2; // 5

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function coordKey(x, y) {
  return `${x},${y}`;
}

function randomInteriorCoord(used) {
  // Try a bunch of times to find an unused interior square
  for (let attempts = 0; attempts < 200; attempts++) {
    const x = randInt(MIN_INTERIOR, MAX_INTERIOR);
    const y = randInt(MIN_INTERIOR, MAX_INTERIOR);
    const key = coordKey(x, y);
    if (!used.has(key)) {
      used.add(key);
      return [x, y];
    }
  }

  // Fallback: scan for any free interior square (guaranteed if not overfull)
  for (let x = MIN_INTERIOR; x <= MAX_INTERIOR; x++) {
    for (let y = MIN_INTERIOR; y <= MAX_INTERIOR; y++) {
      const key = coordKey(x, y);
      if (!used.has(key)) {
        used.add(key);
        return [x, y];
      }
    }
  }

  // If you ever get here, there are more items than interior squares (25)
  // Put it somewhere interior anyway (will overlap)
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

    // Reserve all explicitly-defined coordinates first
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

// Run once at load so every item ends up as [ITEM, [x,y]]
normalizeRoomItems();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getRoom(id) {
  return ROOM_DEFS[id];
}

function moveRoom(currentRoomId, direction) {
  const room = ROOM_DEFS[currentRoomId];
  return room?.exits?.[direction] ?? null;
}

// List visible items in a room using ITEM_DEFS
function getVisibleItems(roomId) {
  const room = ROOM_DEFS[roomId];
  if (!room) return [];

  return room.items
    .map(entry => getItemId(entry))        // <-- NEW: works with [id,[x,y]]
    .map(id => ITEM_DEFS[id])
    .filter(def => def?.visible !== false)
    .map(def => `${def.emoji} ${def.name}`);
}

// -----------------------------------------------------------------------------
// Expose for file://
// -----------------------------------------------------------------------------
/*
window.ROOM = ROOM;
window.ROOM_DEFS = ROOM_DEFS;
window.getRoom = getRoom;
window.moveRoom = moveRoom;
window.getVisibleItems = getVisibleItems;
*/
