// game.js
// Runtime that executes parsed commands against your rooms/items/recipes.
// file:// friendly (globals on window.*)

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

  // ---------------- NEW: room item entry helpers ----------------

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

  // Random interior coord (7x7, not on border)
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

    // Visible items
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

    // Exits
    const exits = Object.keys(room.exits || {});
    saySafe(sayFn, "Exits: " + (exits.length ? exits.join(", ") : "(none)"));
  }

  function showInventory(sayFn) {
    if (state.inventory.length === 0) {
      saySafe(sayFn, "You are carrying: (nothing)");
      return;
    }
    const list = state.inventory.map(formatItem);
    saySafe(sayFn, "You are carrying: " + list.join(", "));
  }

  // ---------------- WORLD QUERIES ----------------

  function isInRoom(itemId, roomId = state.currentRoom) {
    const room = getRoom(roomId);
    return roomHasItem(room, itemId);
  }

  function isInInventory(itemId) {
    return state.inventory.includes(itemId);
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

    // Put it somewhere sensible in the new format
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
    const next = window.moveRoom ? window.moveRoom(state.currentRoom, direction) : null;
    if (!next) return saySafe(sayFn, "You can't go that way.");

    state.currentRoom = next;
    renderRoom(sayFn);
  }

  function eatItem(itemId, sayFn) {
    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");

    if (!isInInventory(itemId) && !isInRoom(itemId)) {
      return saySafe(sayFn, "You can't see that here.");
    }

    if (!def.edible) {
      return saySafe(sayFn, def.eatText || "You can't eat that.");
    }

    // remove from wherever it is
    removeOne(itemId);

    saySafe(sayFn, def.eatText || "You eat it.");
  }

  function takeItem(itemId, sayFn) {
    const room = ensureRoomItemsArray();
    if (!room) return saySafe(sayFn, "You can't do that right now.");

    if (!roomHasItem(room, itemId)) return saySafe(sayFn, "You can't see that here.");

    const def = getItemDef(itemId);
    if (!def) return saySafe(sayFn, "That doesn't exist.");
    if (!def.portable) {
      return saySafe(sayFn, def.takeText || "You can't pick that up.");
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

    // Put it back into the room with a random interior coordinate
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

  // ---------------- RECIPES / CRAFTING ----------------

  // COMBINE: uses recipe matching by inputs (order independent) via window.findRecipe(inputs)
  function combineItems(itemIds, sayFn) {
    const inputs = itemIds.filter(Boolean);
    if (inputs.length < 2 || inputs.length > 3) {
      saySafe(sayFn, "That command needs 2 or 3 things.");
      return;
    }

    // Verify all inputs exist somewhere (room or inventory)
    for (const id of inputs) {
      if (!isInInventory(id) && !isInRoom(id)) {
        saySafe(sayFn, `You can't find ${formatItem(id)} here.`);
        return;
      }
    }

    const recipe = (typeof window.findRecipe === "function") ? window.findRecipe(inputs) : null;
    if (!recipe) {
      saySafe(sayFn, "Nothing happens.");
      return;
    }

    const consume = Array.isArray(recipe.consume)
      ? recipe.consume
      : (Array.isArray(recipe.inputs) ? recipe.inputs : inputs);

    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);

    // Place result:
    // - If ALL inputs were in inventory -> produced items go to inventory.
    // - Otherwise -> produced items go to room.
    const allInputsInInventory = inputs.every(isInInventory);
    const placeResult = allInputsInInventory ? "inventory" : "room";

    // Consume specified items (one-by-one)
    for (const id of consume) {
      const removedFrom = removeOne(id);
      if (!removedFrom) {
        saySafe(sayFn, `You can't seem to use ${formatItem(id)} right now.`);
        return;
      }
    }

    // Produce outputs
    for (const outId of produce) {
      if (!outId) continue;
      if (placeResult === "inventory") addToInventory(outId);
      else addToRoom(outId); // <-- now drops with coords
    }

    saySafe(sayFn, recipe.text || "Done.");
  }

  // MAKE: player supplies target item, engine finds a recipe that produces it.
  // Requires window.RECIPES to be exposed (recipes.js should do: window.RECIPES = RECIPES).
  function recipeProduces(recipe, targetId) {
    const produced = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);
    return produced.includes(targetId);
  }

  function listAllRecipes() {
    return window.RECIPES ? Object.values(window.RECIPES) : [];
  }

  function canMake(recipe) {
    const have = allAvailableItemsSet();
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    return inputs.every((id) => have.has(id));
  }

  function missingFor(recipe) {
    const have = allAvailableItemsSet();
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    return inputs.filter((id) => !have.has(id));
  }

  function makeTarget(targetId, sayFn) {
    if (!window.RECIPES) {
      saySafe(
        sayFn,
        'MAKE needs recipes.js to expose RECIPES. Add:\nwindow.RECIPES = RECIPES;\nwindow.findRecipe = findRecipe;'
      );
      return;
    }

    const targetDef = getItemDef(targetId);
    const targetName = targetDef ? targetDef.name : targetId;

    const candidates = listAllRecipes().filter((r) => recipeProduces(r, targetId));
    if (candidates.length === 0) {
      saySafe(sayFn, `You don't know how to make ${targetName}.`);
      return;
    }

    // Prefer a recipe you can make now; otherwise pick first and explain missing parts.
    const doable = candidates.find(canMake);
    const chosen = doable || candidates[0];

    if (!canMake(chosen)) {
      const miss = missingFor(chosen);
      saySafe(sayFn, `You can't make ${targetName} yet. You need: ${miss.map(formatItem).join(", ")}.`);
      return;
    }

    // Use the same logic as COMBINE (consume/produce rules)
    combineItems(chosen.inputs, sayFn);
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

    if (verb === "COMBINE") {
      return combineItems([a, b, c].filter(Boolean), sayFn);
    }

    // MAKE <target>
    if (verb === "MAKE") {
      if (!a) return saySafe(sayFn, "Make what?");
      return makeTarget(a, sayFn);
    }

    if (verb === "EAT") {
      if (!a) return saySafe(sayFn, "Eat what?");
      return eatItem(a, sayFn);
    }

    // Placeholder for future:
    if (verb === "USE") {
      // If USE has 2 or 3 nouns, route to recipe system (same as COMBINE)
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);

      // Otherwise it's a single-target "use" (you can expand later)
      if (!a) return saySafe(sayFn, "Use what?");
      return saySafe(sayFn, `You can't figure out how to use ${formatItem(a)} here.`);
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

  // ---------------- EXPOSE ----------------

  window.GameRuntime = {
    state,
    resetGame,
    getItemDef,

    getCurrentRoom,
    renderRoom,
    showInventory,

    executeCommand,
    executeKnownCommand,
    executeParseResult,

    // actions
    goDir,
    takeItem,
    dropItem,
    examineItem,
    combineItems,
    makeTarget,
  };
})();
