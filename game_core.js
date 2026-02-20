// game_core.js
// Core game state + utilities + world operations (no command parsing)

(function () {
  // ---------------- GAME CONSTANTS ----------------
  const MAX_INVENTORY_SIZE = 5;

  // ---------------- GAME STATE ----------------
  const state = {
    currentRoom: window.START_ROOM,
    inventory: [], // array of ITEM IDs
  };

  // ---------------- UTIL ----------------
  function getRoom(roomId) {
    return window.getRoom ? window.getRoom(roomId) : window.ROOM_DEFS?.[roomId];
  }

  function getItemDef(itemId) {
    return ITEM_DEFS?.[itemId] ?? null;
  }

  function saySafe(sayFn, text) {
    if (typeof sayFn === "function") sayFn(text);
    else console.log(text);
  }

  function ensureRoomItemsArray(roomId = state.currentRoom) {
    const room = getRoom(roomId);
    if (!room) return null;
    if (!Array.isArray(room.items)) room.items = [];
    return room;
  }

  function formatItem(id) {
    const d = getItemDef(id);
    return d ? `${d.emoji} ${d.name}` : id;
  }

  // If EAT has no recipe, this provides the item-specific rejection text.
  function cantEatMessage(itemId) {
    const def = getItemDef(itemId);
    return def?.eatText || "You can't eat that.";
  }

  // ---------------- room item entry helpers ----------------
  function isEntryWithCoord(entry) {
    return Array.isArray(entry) && entry.length === 2 && Array.isArray(entry[1]);
  }

  function entryToId(entry) {
    return isEntryWithCoord(entry) ? entry[0] : entry;
  }

  function entryToCoord(entry) {
    return isEntryWithCoord(entry) ? entry[1] : null;
  }

  function roomItemIds(room) {
    return (room?.items || []).map(entryToId);
  }

  function roomHasItem(room, itemId) {
    return (room?.items || []).some((e) => entryToId(e) === itemId);
  }

  function removeOneFromRoom(room, itemId) {
    if (!room || !Array.isArray(room.items)) return false;
    const idx = room.items.findIndex((e) => entryToId(e) === itemId);
    if (idx >= 0) {
      room.items.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ---------------- coord placement helpers ----------------
  const ROOM_SIZE = 7; // 0..6
  const MIN_INTERIOR = 1;
  const MAX_INTERIOR = ROOM_SIZE - 2; // 5

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function coordKey(x, y) {
    return `${x},${y}`;
  }

  function getUsedCoords(room) {
    const used = new Set();
    for (const entry of room?.items || []) {
      const c = entryToCoord(entry);
      if (c) used.add(coordKey(c[0], c[1]));
    }
    return used;
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

    // fallback scan
    for (let x = MIN_INTERIOR; x <= MAX_INTERIOR; x++) {
      for (let y = MIN_INTERIOR; y <= MAX_INTERIOR; y++) {
        const key = coordKey(x, y);
        if (!used.has(key)) {
          used.add(key);
          return [x, y];
        }
      }
    }

    // overfull; overlap
    return [MIN_INTERIOR, MIN_INTERIOR];
  }

  function addToRoomAtRandomInterior(room, itemId) {
    if (!room) return;
    if (!Array.isArray(room.items)) room.items = [];
    const used = getUsedCoords(room);
    const coord = randomInteriorCoord(used);
    room.items.push([itemId, coord]);
  }

  // ---------------- RENDERING ----------------
  function getCurrentRoom() {
    return getRoom(state.currentRoom);
  }

  function renderRoom(sayFn) {
    const room = getRoom(state.currentRoom);
    if (!room) {
      saySafe(sayFn, "You are nowhere. (Room not found.)");
      return;
    }

    saySafe(sayFn, `You are in ${room.name}.`);
    saySafe(sayFn, room.desc);

    const visible = (window.getVisibleItems ? window.getVisibleItems(state.currentRoom) : null);
    if (Array.isArray(visible)) {
      saySafe(sayFn, "You see: " + (visible.length ? visible.join(", ") : "(nothing)"));
    } else {
      const entries = room.items || [];
      const list = entries
        .map(entryToId)
        .map((id) => getItemDef(id))
        .filter((d) => d && d.visible !== false)
        .map((d) => `${d.emoji} ${d.name}`);
      saySafe(sayFn, "You see: " + (list.length ? list.join(", ") : "(nothing)"));
    }

    const exits = Object.keys(room.exits || {});
    saySafe(sayFn, "Exits: " + (exits.length ? exits.join(", ") : "(none)"));
  }

  function showInventory(sayFn) {
    if (state.inventory.length === 0) {
      saySafe(sayFn, "You are carrying: (nothing)");
      return;
    }
    const list = state.inventory.map(formatItem);
    saySafe(sayFn, `You are carrying (${state.inventory.length}/${MAX_INVENTORY_SIZE}): ` + list.join(", "));
  }

  function helpText(sayFn) {
    saySafe(
      sayFn,
      "This is a game of skill and cunning. Type commands like LOOK (L), GO NORTH, TAKE <item>, DROP <item>, INVENTORY (I), COMBINE, MAKE, EAT, PUSH, PULL, HELP."
    );
  }

  // ---------------- WORLD QUERIES ----------------
  function isInRoom(itemId, roomId = state.currentRoom) {
    const room = getRoom(roomId);
    return roomHasItem(room, itemId);
  }

  function isInInventory(itemId) {
    return state.inventory.includes(itemId);
  }

  function removeOne(itemId) {
    const invIdx = state.inventory.indexOf(itemId);
    if (invIdx >= 0) {
      state.inventory.splice(invIdx, 1);
      return "inventory";
    }

    const room = ensureRoomItemsArray();
    if (room) {
      const removed = removeOneFromRoom(room, itemId);
      if (removed) return "room";
    }
    return null;
  }

  function addToInventory(itemId) {
    state.inventory.push(itemId);
  }

  function addToRoom(itemId) {
    const room = ensureRoomItemsArray();
    if (!room) return;
    addToRoomAtRandomInterior(room, itemId);
  }

  function allAvailableItemsSet() {
    const room = ensureRoomItemsArray();
    const roomItems = room ? roomItemIds(room) : [];
    return new Set([...state.inventory, ...roomItems]);
  }

  // ---------------- ACTIONS ----------------
  function examineItem(itemId, sayFn) {
    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "You see nothing special.");

    if (!isInRoom(itemId) && !isInInventory(itemId)) {
      return saySafe(sayFn, "You can't see that here.");
    }

    saySafe(sayFn, `${def.emoji} ${def.name}: ${def.examine}`);
  }

  function goDir(direction, sayFn) {
    // Use the richer move result if rooms.js exposes it
    const tryMove = window.tryMoveRoom;
    const getMsg = window.getMoveBlockedMessage;

    if (typeof tryMove === "function") {
      const res = tryMove(state.currentRoom, direction);

      if (res?.to) {
        state.currentRoom = res.to;
        renderRoom(sayFn);
        return;
      }

      const msg = (typeof getMsg === "function")
        ? getMsg(res)
        : "You can't go that way.";

      return saySafe(sayFn, msg);
    }

    // Fallback: old behaviour
    const next = window.moveRoom ? window.moveRoom(state.currentRoom, direction) : null;
    if (!next) return saySafe(sayFn, "You can't go that way.");
    state.currentRoom = next;
    renderRoom(sayFn);
  }


  function takeItem(itemId, sayFn) {
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "You can't do that right now.");

    if (!roomHasItem(room, itemId)) return saySafe(sayFn, "You can't see that here.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");
    if (!def.portable) return saySafe(sayFn, def.takeText || "You can't pick that up.");

    if (state.inventory.length >= MAX_INVENTORY_SIZE) {
      return saySafe(sayFn, `Your inventory is full (${MAX_INVENTORY_SIZE} max). Drop something first.`);
    }

    removeOneFromRoom(room, itemId);
    state.inventory.push(itemId);
    saySafe(sayFn, `Taken. (${def.emoji} ${def.name})`);
  }

  function dropItem(itemId, sayFn) {
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "You can't do that right now.");

    if (!isInInventory(itemId)) return saySafe(sayFn, "You're not carrying that.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");

    const idx = state.inventory.indexOf(itemId);
    if (idx >= 0) state.inventory.splice(idx, 1);

    addToRoomAtRandomInterior(room, itemId);
    saySafe(sayFn, `Dropped. (${def.emoji} ${def.name})`);
  }

  function takeAll(sayFn) {
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "There's nothing to take.");

    const candidates = (room.items || [])
      .map(entryToId)
      .filter((id) => {
        const def = getItemDef(id);
        return def && def.portable && def.visible !== false;
      });

    if (candidates.length === 0) return saySafe(sayFn, "There's nothing here you can take.");

    let takenAny = false;
    for (const id of [...candidates]) {
      if (state.inventory.length >= MAX_INVENTORY_SIZE) break;
      takeItem(id, sayFn);
      takenAny = true;
    }

    if (!takenAny) saySafe(sayFn, `Your inventory is full (${MAX_INVENTORY_SIZE} max).`);
    else if (state.inventory.length >= MAX_INVENTORY_SIZE) saySafe(sayFn, `Your inventory is now full (${MAX_INVENTORY_SIZE} max).`);
  }

  function dropAll(sayFn) {
    if (state.inventory.length === 0) return saySafe(sayFn, "You're not carrying anything.");
    for (const id of [...state.inventory]) dropItem(id, sayFn);
  }

  // ---------------- EXPOSE CORE ----------------
  window.GameCore = {
    // constants
    MAX_INVENTORY_SIZE,

    // state
    state,

    // util
    getRoom,
    getItemDef,
    saySafe,
    formatItem,
    cantEatMessage,

    // room entry helpers (useful elsewhere)
    entryToId,
    entryToCoord,
    roomHasItem,
    removeOneFromRoom,
    addToRoomAtRandomInterior,

    // world queries
    isInRoom,
    isInInventory,
    removeOne,
    addToInventory,
    addToRoom,
    allAvailableItemsSet,

    // rendering
    getCurrentRoom,
    renderRoom,
    showInventory,

    // actions
    helpText,
    goDir,
    takeItem,
    dropItem,
    takeAll,
    dropAll,
    examineItem,
  };
})();
