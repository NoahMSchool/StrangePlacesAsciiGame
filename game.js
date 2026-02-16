// A tiny “runtime” that executes parsed commands against your rooms/items.
// Designed for file:// usage (globals on window.*).

(function () {
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

  // ---------------- RENDERING ----------------

  function renderRoom(sayFn) {
    const room = getRoom(state.currentRoom);
    if (!room) {
      saySafe(sayFn, "You are nowhere. (Room not found.)");
      return;
    }

    saySafe(sayFn, `You are in ${room.name}.`);
    saySafe(sayFn, room.desc);

    // Visible items
    const visible = (window.getVisibleItems ? window.getVisibleItems(state.currentRoom) : null);
    if (Array.isArray(visible)) {
      saySafe(sayFn, "You see: " + (visible.length ? visible.join(", ") : "(nothing)"));
    } else {
      // fallback if you haven't got getVisibleItems
      const ids = room.items || [];
      const list = ids
        .map((id) => getItemDef(id))
        .filter((d) => d && d.visible !== false)
        .map((d) => `${d.emoji} ${d.name}`);
      saySafe(sayFn, "You see: " + (list.length ? list.join(", ") : "(nothing)"));
    }

    // Exits
    const exits = Object.keys(room.exits || {});
    saySafe(sayFn, "Exits: " + (exits.length ? exits.join(", ") : "(none)"));
  }

  function showInventory(sayFn) {
    if (state.inventory.length === 0) {
      saySafe(sayFn, "You are carrying: (nothing)");
      return;
    }
    const list = state.inventory.map((id) => {
      const d = getItemDef(id);
      return d ? `${d.emoji} ${d.name}` : id;
    });
    saySafe(sayFn, "You are carrying: " + list.join(", "));
  }

  // ---------------- WORLD QUERIES ----------------

  function isInRoom(itemId, roomId = state.currentRoom) {
    const room = getRoom(roomId);
    return Array.isArray(room?.items) && room.items.includes(itemId);
  }

  function isInInventory(itemId) {
    return state.inventory.includes(itemId);
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
    const next = window.moveRoom ? window.moveRoom(state.currentRoom, direction) : null;
    if (!next) return saySafe(sayFn, "You can't go that way.");

    state.currentRoom = next;
    renderRoom(sayFn);
  }

  function takeItem(itemId, sayFn) {
    const room = getRoom(state.currentRoom);
    if (!room) return saySafe(sayFn, "You can't do that right now.");
    if (!Array.isArray(room.items)) room.items = [];

    if (!isInRoom(itemId)) return saySafe(sayFn, "You can't see that here.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");
    if (!def.portable) return saySafe(sayFn, "You can't pick that up.");

    room.items = room.items.filter((x) => x !== itemId);
    state.inventory.push(itemId);

    saySafe(sayFn, `Taken. (${def.emoji} ${def.name})`);
  }

  function dropItem(itemId, sayFn) {
    const room = getRoom(state.currentRoom);
    if (!room) return saySafe(sayFn, "You can't do that right now.");
    if (!Array.isArray(room.items)) room.items = [];

    if (!isInInventory(itemId)) return saySafe(sayFn, "You're not carrying that.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");

    // remove from inventory
    const idx = state.inventory.indexOf(itemId);
    if (idx >= 0) state.inventory.splice(idx, 1);

    // add to room
    room.items.push(itemId);

    saySafe(sayFn, `Dropped. (${def.emoji} ${def.name})`);
  }

  function takeAll(sayFn) {
    const room = getRoom(state.currentRoom);
    if (!room || !Array.isArray(room.items)) return saySafe(sayFn, "There's nothing to take.");

    // Only portable + visible items
    const candidates = room.items.filter((id) => {
      const def = getItemDef(id);
      return def && def.portable && def.visible !== false;
    });

    if (candidates.length === 0) {
      saySafe(sayFn, "There's nothing here you can take.");
      return;
    }

    // Take one at a time (copy the list because room.items mutates)
    for (const id of [...candidates]) {
      takeItem(id, sayFn);
    }
  }

  function dropAll(sayFn) {
    if (state.inventory.length === 0) {
      saySafe(sayFn, "You're not carrying anything.");
      return;
    }

    // Drop one at a time (copy the list because inventory mutates)
    for (const id of [...state.inventory]) {
      dropItem(id, sayFn);
    }
  }


  // ---------------- COMMAND EXECUTION ----------------

  // Execute ONE canonical command string like:
  // "LOOK", "LOOK GRATE", "GO NORTH", "TAKE EGG", "DROP MAGNET"
  function executeCommand(cmdStr, sayFn) {
    const parts = String(cmdStr || "").trim().split(/\s+/).filter(Boolean);
    const verb = parts[0] || "";
    const a = parts[1] || null;
    // b/c are there for future verbs (USE/COMBINE)
    const b = parts[2] || null;
    const c = parts[3] || null;

    if (verb === "LOOK") {
      if (!a) renderRoom(sayFn);
      else examineItem(a, sayFn);
      return;
    }

    if (verb === "GO") {
      if (!a) return saySafe(sayFn, "Go where?");
      goDir(a, sayFn);
      return;
    }

    if (verb === "TAKE") {
      if (!a) return saySafe(sayFn, "Take what?");

      if (a === "ALL") {
        takeAll(sayFn);
        return;
      }

      takeItem(a, sayFn);
      return;
    }

    if (verb === "DROP") {
      if (!a) return saySafe(sayFn, "Drop what?");

      if (a === "ALL") {
        dropAll(sayFn);
        return;
      }

      dropItem(a, sayFn);
      return;
    }


    if (verb === "INVENTORY" || verb === "INV") {
      showInventory(sayFn);
      return;
    }

    // Placeholder for future:
    if (verb === "USE") {
      return saySafe(sayFn, `(USE not wired yet: ${a}${b ? " " + b : ""}${c ? " " + c : ""})`);
    }
    if (verb === "COMBINE") {
      return saySafe(sayFn, `(COMBINE not wired yet: ${[a, b, c].filter(Boolean).join(" ")})`);
    }

    saySafe(sayFn, `(No handler yet for ${cmdStr})`);
  }

  // Execute a whole parse result (what parseCommands returns).
  // Handles known list + unknown errors.
  function executeParseResult(parseResult, sayFn) {
    if (!parseResult) return;

    for (const cmdStr of parseResult.known || []) {
      executeCommand(cmdStr, sayFn);
    }

    for (const u of parseResult.unknown || []) {
      if (u?.error) saySafe(sayFn, u.error);
      else saySafe(sayFn, `I don't understand "${u?.raw ?? "that"}".`);
    }
  }

  // Convenience for your loop:
  // for (const cmdStr of reply.known) executeKnownCommand(cmdStr, say);
  function executeKnownCommand(cmdStr, sayFn) {
    executeCommand(cmdStr, sayFn);
  }

  // Reset game state (useful for testing)
  function resetGame({ roomId } = {}) {
    state.currentRoom = roomId ?? window.START_ROOM;
    state.inventory.length = 0;
  }

  window.GameRuntime = {
    state,
    resetGame,

    renderRoom,
    showInventory,

    executeCommand,
    executeKnownCommand,
    executeParseResult,

    // actions in case you want them directly
    goDir,
    takeItem,
    dropItem,
    examineItem,
  };
})();
