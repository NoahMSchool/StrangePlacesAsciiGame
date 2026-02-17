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

  function ensureRoomItemsArray(roomId = state.currentRoom) {
    const room = getRoom(roomId);
    if (!room) return null;
    if (!Array.isArray(room.items)) room.items = [];
    return room;
  }

  // Remove one instance of itemId from inventory or room.
  // Prefer inventory if present there.
  function removeOne(itemId) {
    const invIdx = state.inventory.indexOf(itemId);
    if (invIdx >= 0) {
      state.inventory.splice(invIdx, 1);
      return "inventory";
    }

    const room = ensureRoomItemsArray();
    if (room) {
      const roomIdx = room.items.indexOf(itemId);
      if (roomIdx >= 0) {
        room.items.splice(roomIdx, 1);
        return "room";
      }
    }
    return null;
  }

  function addToInventory(itemId) {
    state.inventory.push(itemId);
  }

  function addToRoom(itemId) {
    const room = ensureRoomItemsArray();
    if (!room) return;
    room.items.push(itemId);
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
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "You can't do that right now.");

    if (!isInRoom(itemId)) return saySafe(sayFn, "You can't see that here.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");
    if (!def.portable) return saySafe(sayFn, "You can't pick that up.");

    room.items = room.items.filter((x) => x !== itemId);
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

    room.items.push(itemId);

    saySafe(sayFn, `Dropped. (${def.emoji} ${def.name})`);
  }

  function takeAll(sayFn) {
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "There's nothing to take.");

    const candidates = room.items.filter((id) => {
      const def = getItemDef(id);
      return def && def.portable && def.visible !== false;
    });

    if (candidates.length === 0) {
      saySafe(sayFn, "There's nothing here you can take.");
      return;
    }

    for (const id of [...candidates]) {
      takeItem(id, sayFn);
    }
  }

  function dropAll(sayFn) {
    if (state.inventory.length === 0) {
      saySafe(sayFn, "You're not carrying anything.");
      return;
    }

    for (const id of [...state.inventory]) {
      dropItem(id, sayFn);
    }
  }

  // ---------------- COMBINE ----------------
  // Supports recipes with:
  //   inputs: [...]
  //   consume: [...]   (optional; default = inputs)
  //   produce: [...]   (optional; default = [output] if output exists)
  // Leaves any inputs not listed in consume where they are (e.g. CHICKEN stays).
  //
  // Placement rule for produced items:
  //   - If ALL inputs were in inventory -> produced items go to inventory.
  //   - Otherwise -> produced items go to the room.
  function combineItems(itemIds, sayFn) {
    const inputs = itemIds.filter(Boolean);
    if (inputs.length < 2 || inputs.length > 3) {
      saySafe(sayFn, "That command needs 2 or 3 things.");
      return;
    }

    // Verify all inputs exist somewhere (room or inventory)
    for (const id of inputs) {
      if (!isInInventory(id) && !isInRoom(id)) {
        const def = getItemDef(id);
        const name = def ? def.name : id;
        saySafe(sayFn, `You can't find ${name} here.`);
        return;
      }
    }

    const recipe = (typeof window.findRecipe === "function")
      ? window.findRecipe(inputs)
      : null;

    if (!recipe) {
      saySafe(sayFn, "Nothing happens.");
      return;
    }

    const consume = Array.isArray(recipe.consume) ? recipe.consume : (Array.isArray(recipe.inputs) ? recipe.inputs : inputs);
    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);

    // Decide where results go
    const allInputsInInventory = inputs.every(isInInventory);
    const placeResult = allInputsInInventory ? "inventory" : "room";

    // Consume specified items (one-by-one)
    for (const id of consume) {
      const removedFrom = removeOne(id);
      if (!removedFrom) {
        // If this happens, your world state diverged; fail safely.
        const def = getItemDef(id);
        saySafe(sayFn, `You can't seem to use ${def ? def.name : id} right now.`);
        return;
      }
    }

    // Produce outputs
    for (const outId of produce) {
      if (!outId) continue;
      if (placeResult === "inventory") addToInventory(outId);
      else addToRoom(outId);
    }

    if (recipe.text) saySafe(sayFn, recipe.text);
    else saySafe(sayFn, "Done.");

    // Optional: if you produced something in the room, refresh room text feel
    // (comment out if you prefer less spam)
    // if (placeResult === "room") renderRoom(sayFn);
  }

  // ---------------- COMMAND EXECUTION ----------------

  function executeCommand(cmdStr, sayFn) {
    const parts = String(cmdStr || "").trim().split(/\s+/).filter(Boolean);
    const verb = parts[0] || "";
    const a = parts[1] || null;
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
      if (a === "ALL") return takeAll(sayFn);
      return takeItem(a, sayFn);
    }

    if (verb === "DROP") {
      if (!a) return saySafe(sayFn, "Drop what?");
      if (a === "ALL") return dropAll(sayFn);
      return dropItem(a, sayFn);
    }

    if (verb === "INVENTORY" || verb === "INV") {
      showInventory(sayFn);
      return;
    }

    if (verb === "USE") {
      return saySafe(sayFn, `(USE not wired yet: ${a}${b ? " " + b : ""}${c ? " " + c : ""})`);
    }

    if (verb === "COMBINE") {
      return combineItems([a, b, c].filter(Boolean), sayFn);
    }

    saySafe(sayFn, `(No handler yet for ${cmdStr})`);
  }

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

  function executeKnownCommand(cmdStr, sayFn) {
    executeCommand(cmdStr, sayFn);
  }

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
    combineItems,
  };
})();
