// rooms.js

const ROOM = Object.freeze({
  CLEARING: "CLEARING",
  ENTRANCE_HALL: "ENTRANCE_HALL",
  DINING_ROOM: "DINING_ROOM",
  PLAYROOM: "PLAYROOM",
  KITCHEN: "KITCHEN",
});

const ROOM_DEFS = {

  [ROOM.CLEARING]: {
    id: ROOM.CLEARING,
    name: "Forest Clearing",
    desc: "You are standing in a quiet forest clearing. A large, slightly spooky house lies to the north.",
    items: [
      ITEM.CHICKEN,
      ITEM.STICK,
      ITEM.LEAVES,
    ],
    exits: {
      NORTH: ROOM.ENTRANCE_HALL,
    },
  },

  [ROOM.ENTRANCE_HALL]: {
    id: ROOM.ENTRANCE_HALL,
    name: "Entrance Hall",
    desc: "A tall, dusty hall with a chandelier overhead. Footsteps echo on the wooden floor.",
    items: [],
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

  [ROOM.KITCHEN]: {
    id: ROOM.KITCHEN,
    name: "Kitchen",
    desc: "Pots and pans hang from the ceiling. Something smells faintly of soup.",
    items: [
      ITEM.ROPE, // your "string"
    ],
    exits: {
      SOUTH: ROOM.ENTRANCE_HALL,
    },
  },

};

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
