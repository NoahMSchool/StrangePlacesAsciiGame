// game_commands.js
// Command execution + crafting/recipes. Depends on GameCore being loaded first.

(function () {
  const G = window.GameCore;
  if (!G) {
    console.error("GameCore not found. Load game_core.js before game_commands.js");
    return;
  }

  // ---------------- helpers ----------------

  function formatProducedList(produceIds) {
    const ids = (produceIds || []).filter(Boolean);
    if (ids.length === 0) return "";
    const parts = ids.map((id) => G.formatItem(id)); // includes emoji + name
    return ` (${parts.join(", ")})`;
  }

  function formatItemEmojiOnly(id) {
    const def = G.getItemDef(id);
    return def?.emoji ?? "❓";
  }

  function formatEmojiList(ids) {
    const list = (ids || []).filter(Boolean);
    if (list.length === 0) return "(nothing)";
    return list.map(formatItemEmojiOnly).join(" ");
  }

  function formatRecipeSummaryLine(consume, produce) {
    return `(used: ${formatEmojiList(consume)} → made: ${formatEmojiList(produce)})`;
  }

  function sayRecipeResult(sayFn, text, consume, produce) {
    const suffix = formatProducedList(produce);
    const summary = formatRecipeSummaryLine(consume, produce);
    G.saySafe(sayFn, (text || "Done.") + suffix + "\n" + summary);
  }

  // ---------------- availability helpers (prevent partial consume bugs) ----------------

  function isEntryWithCoord(e) {
    return Array.isArray(e) && e.length === 2 && Array.isArray(e[1]);
  }
  function entryId(e) {
    return isEntryWithCoord(e) ? e[0] : e;
  }
  function entryCoord(e) {
    return isEntryWithCoord(e) ? e[1] : null;
  }

  function countInRoom(room, itemId) {
    if (!room || !Array.isArray(room.items)) return 0;
    let n = 0;
    for (const e of room.items) if (entryId(e) === itemId) n++;
    return n;
  }

  function countInInv(itemId) {
    return G.state.inventory.filter((x) => x === itemId).length;
  }

  function canConsumeAllHere(consumeIds) {
    const want = new Map();
    for (const id of (consumeIds || [])) {
      if (!id) continue;
      want.set(id, (want.get(id) || 0) + 1);
    }

    const room = G.getRoom(G.state.currentRoom);

    for (const [id, needed] of want.entries()) {
      const have = countInInv(id) + countInRoom(room, id);
      if (have < needed) return false;
    }
    return true;
  }

  // ---------------- RECIPES / CRAFTING ----------------

  function combineItems(itemIds, sayFn) {
    const inputs = itemIds.filter(Boolean);
    if (inputs.length < 2 || inputs.length > 3) {
      G.saySafe(sayFn, "That command needs 2 or 3 things.");
      return;
    }

    for (const id of inputs) {
      if (!G.isInInventory(id) && !G.isInRoom(id)) {
        G.saySafe(sayFn, `You can't find ${G.formatItem(id)} here.`);
        return;
      }
    }

    const recipe = typeof window.findRecipe === "function" ? window.findRecipe(inputs) : null;
    if (!recipe) return G.saySafe(sayFn, "Nothing happens.");

    const consume = Array.isArray(recipe.consume)
      ? recipe.consume
      : (Array.isArray(recipe.inputs) ? recipe.inputs : inputs);

    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);

    // Prevent “half-used” bugs: never remove anything unless we can remove everything.
    if (!canConsumeAllHere(consume)) {
      G.saySafe(sayFn, "You can't do that right now.");
      return;
    }

    const allInputsInInventory = inputs.every(G.isInInventory);
    const placeResult = allInputsInInventory ? "inventory" : "room";

    if (placeResult === "inventory") {
      const space = G.MAX_INVENTORY_SIZE - G.state.inventory.length;
      const needed = produce.filter(Boolean).length;
      if (needed > space) {
        G.saySafe(
          sayFn,
          `You don't have enough space to carry that. (${G.state.inventory.length}/${G.MAX_INVENTORY_SIZE})`
        );
        return;
      }
    }

    for (const id of consume) {
      const removedFrom = G.removeOne(id);
      if (!removedFrom) {
        G.saySafe(sayFn, `You can't seem to use ${G.formatItem(id)} right now.`);
        return;
      }
    }

    for (const outId of produce) {
      if (!outId) continue;
      if (placeResult === "inventory") G.addToInventory(outId);
      else G.addToRoom(outId);
    }

    sayRecipeResult(sayFn, recipe.text || "Done.", consume, produce);
  }

  // ---------------- ACTION RECIPES (EAT / PUSH / PULL / OPEN / UNLOCK / CLOSE) ----------------

  function listAllRecipes() {
    return window.RECIPES ? Object.values(window.RECIPES) : [];
  }

  function findActionRecipe(action, targetId) {
    const a = String(action || "").toUpperCase();
    return (
      listAllRecipes().find(
        (r) => r && String(r.action || "").toUpperCase() === a && r.target === targetId
      ) || null
    );
  }

  function hasAllRequired(requireIds) {
    if (!Array.isArray(requireIds) || requireIds.length === 0) return true;
    const have = G.allAvailableItemsSet();
    return requireIds.every((id) => have.has(id));
  }

  function coordToDir(coord) {
    // must match rooms.js edgeCoordForDir layout (7x7)
    const x = coord?.[0],
      y = coord?.[1];
    if (x == null || y == null) return null;

    // MID=3 in 7x7
    if (x === 3 && y === 0) return "NORTH";
    if (x === 3 && y === 6) return "SOUTH";
    if (x === 0 && y === 3) return "WEST";
    if (x === 6 && y === 3) return "EAST";
    return null;
  }

  function isDoorOpenId(id) {
    return typeof ITEM !== "undefined" && id === ITEM.DOOR_OPEN;
  }

  function replaceRoomItemKeepingCoord(room, fromId, toId) {
    if (!room || !Array.isArray(room.items)) return false;

    const idx = room.items.findIndex((e) => entryId(e) === fromId);
    if (idx < 0) return false;

    const c = entryCoord(room.items[idx]) ?? null;
    if (!c) return false;

    room.items[idx] = [toId, c];

    // If this is an edge midpoint, also update exits barrier
    const dir = coordToDir(c);
    if (dir && room.exits && room.exits[dir] && typeof room.exits[dir] === "object") {
      // If open door -> no barrier (movement allowed)
      // Otherwise barrier is the new door state item id (locked/closed/etc)
      room.exits[dir].barrier = isDoorOpenId(toId) ? null : toId;
    }

    return true;
  }

  function lockedDoorFailMessage(verb, targetId) {
    // Nice default, but don’t hard-crash if you haven’t added DOOR_LOCKED yet.
    if (verb === "OPEN" && typeof ITEM !== "undefined" && targetId === ITEM.DOOR_LOCKED) return "It's locked.";
    return null;
  }

  function doAction(action, targetId, sayFn) {
    if (!targetId) return;

    const verb = String(action || "").toUpperCase();

    const inRoom = G.isInRoom(targetId);
    const inInv = G.isInInventory(targetId);

    // Presence rules:
    // - EAT: can be in room OR inventory
    // - others: must be in room
    if (verb === "EAT") {
      if (!inRoom && !inInv) return G.saySafe(sayFn, "You can't see that here.");
    } else {
      if (!inRoom) return G.saySafe(sayFn, "You can't see that here.");
    }

    const recipe = findActionRecipe(verb, targetId);

    if (!recipe) {
      if (verb === "EAT") return G.saySafe(sayFn, G.cantEatMessage(targetId));
      return G.saySafe(sayFn, "Nothing happens.");
    }

    if (!hasAllRequired(recipe.requires)) {
      const have = G.allAvailableItemsSet();
      const missing = (recipe.requires || []).filter((id) => !have.has(id));
      return G.saySafe(sayFn, `You can't do that yet. You need: ${missing.map(G.formatItem).join(", ")}.`);
    }

    const consume = Array.isArray(recipe.consume) ? recipe.consume : [targetId];
    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);
    const placeResult = recipe.placeResult === "inventory" ? "inventory" : "room";

    if (placeResult === "inventory") {
      const space = G.MAX_INVENTORY_SIZE - G.state.inventory.length;
      const needed = produce.filter(Boolean).length;
      if (needed > space) {
        return G.saySafe(
          sayFn,
          `You don't have enough space to carry that. (${G.state.inventory.length}/${G.MAX_INVENTORY_SIZE})`
        );
      }
    }

    // ✅ Don’t partially consume (this was the “door disappears” bug)
    if (!canConsumeAllHere(consume)) {
      const nicer = lockedDoorFailMessage(verb, targetId);
      return G.saySafe(sayFn, nicer || "You can't do that.");
    }

    // ✅ keepCoord simple rule:
    // replace FIRST item in consume with FIRST item in produce, keeping coord
    // then consume the rest normally, and add any extra outputs normally.
    if (recipe.keepCoord && consume.length >= 1 && produce.length >= 1) {
      const fromId = consume[0];
      const toId = produce[0];

      // Only makes sense if the replaced thing is in the room
      if (G.isInRoom(fromId)) {
        const room = G.getRoom(G.state.currentRoom);

        // Consume everything except the first (we replace it instead)
        for (let i = 1; i < consume.length; i++) {
          const id = consume[i];
          const removedFrom = G.removeOne(id);
          if (!removedFrom) return G.saySafe(sayFn, "You can't do that right now.");
        }

        // Replace the first consumed item in-place
        const ok = replaceRoomItemKeepingCoord(room, fromId, toId);
        if (!ok) return G.saySafe(sayFn, "You can't do that right now.");

        // Add any extra produced items
        for (let i = 1; i < produce.length; i++) {
          const outId = produce[i];
          if (!outId) continue;
          if (placeResult === "inventory") G.addToInventory(outId);
          else G.addToRoom(outId);
        }

        sayRecipeResult(sayFn, recipe.text || "Done.", consume, produce);
        return;
      }
      // If not in room, just fall through to normal consume/produce.
    }

    // Normal path
    for (const id of consume) {
      const removedFrom = G.removeOne(id);
      if (!removedFrom) {
        return G.saySafe(sayFn, `You can't seem to ${verb.toLowerCase()} ${G.formatItem(targetId)} right now.`);
      }
    }

    for (const outId of produce) {
      if (!outId) continue;
      if (placeResult === "inventory") G.addToInventory(outId);
      else G.addToRoom(outId);
    }

    sayRecipeResult(sayFn, recipe.text || "Done.", consume, produce);
  }

  // ---------------- MAKE system ----------------

  function recipeProduces(recipe, targetId) {
    const produced = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);
    return produced.includes(targetId);
  }

  function canMake(recipe) {
    const have = G.allAvailableItemsSet();
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    return inputs.every((id) => have.has(id));
  }

  function missingFor(recipe) {
    const have = G.allAvailableItemsSet();
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    return inputs.filter((id) => !have.has(id));
  }

  function makeTarget(targetId, sayFn) {
    if (!window.RECIPES) {
      G.saySafe(
        sayFn,
        'MAKE needs recipes.js to expose RECIPES. Add:\nwindow.RECIPES = RECIPES;\nwindow.findRecipe = findRecipe;'
      );
      return;
    }

    const targetDef = G.getItemDef(targetId);
    const targetName = targetDef ? targetDef.name : targetId;

    const candidates = listAllRecipes().filter((r) => recipeProduces(r, targetId));
    if (candidates.length === 0) return G.saySafe(sayFn, `You don't know how to make ${targetName}.`);

    const doable = candidates.find(canMake);
    const chosen = doable || candidates[0];

    if (!canMake(chosen)) {
      const miss = missingFor(chosen);
      G.saySafe(sayFn, `You can't make ${targetName} yet. You need: ${miss.map(G.formatItem).join(", ")}.`);
      return;
    }

    combineItems(chosen.inputs, sayFn);
  }

  // ---------------- COMMAND EXECUTION ----------------

  function executeCommand(cmdStr, sayFn) {
    const parts = String(cmdStr || "").trim().split(/\s+/).filter(Boolean);
    const verb = (parts[0] || "").toUpperCase();
    const a = parts[1] || null;
    const b = parts[2] || null;
    const c = parts[3] || null;

    // Aliases
    if (verb === "L") return G.renderRoom(sayFn);
    if (verb === "I") return G.showInventory(sayFn);

    if (verb === "LOOK") {
      if (!a) G.renderRoom(sayFn);
      else G.examineItem(a, sayFn);
      return;
    }

    if (verb === "GO") {
      if (!a) return G.saySafe(sayFn, "Go where?");
      G.goDir(a, sayFn);
      return;
    }

    if (verb === "TAKE") {
      if (!a) return G.saySafe(sayFn, "Take what?");
      if (a === "ALL") return G.takeAll(sayFn);
      return G.takeItem(a, sayFn);
    }

    if (verb === "DROP") {
      if (!a) return G.saySafe(sayFn, "Drop what?");
      if (a === "ALL") return G.dropAll(sayFn);
      return G.dropItem(a, sayFn);
    }

    if (verb === "INVENTORY" || verb === "INV") {
      G.showInventory(sayFn);
      return;
    }

    if (verb === "COMBINE") {
      return combineItems([a, b, c].filter(Boolean), sayFn);
    }

    if (verb === "MAKE") {
      if (!a) return G.saySafe(sayFn, "Make what?");
      return makeTarget(a, sayFn);
    }

    // Recipe-driven actions:
    if (verb === "EAT") {
      if (!a) return G.saySafe(sayFn, "Eat what?");
      return doAction("EAT", a, sayFn);
    }

    if (verb === "PUSH") {
      if (!a) return G.saySafe(sayFn, "Push what?");
      return doAction("PUSH", a, sayFn);
    }

    if (verb === "PULL") {
      if (!a) return G.saySafe(sayFn, "Pull what?");
      return doAction("PULL", a, sayFn);
    }

    if (verb === "UNLOCK") {
      if (!a) return G.saySafe(sayFn, "Unlock what?");
      return doAction("UNLOCK", a, sayFn);
    }

    if (verb === "OPEN") {
      if (!a) return G.saySafe(sayFn, "Open what?");
      return doAction("OPEN", a, sayFn);
    }

    if (verb === "CLOSE") {
      if (!a) return G.saySafe(sayFn, "Close what?");
      return doAction("CLOSE", a, sayFn);
    }

    if (verb === "HELP") {
      return G.helpText(sayFn);
    }

    // Keep USE mapped to crafting for now
    if (verb === "USE") {
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);
      if (!a) return G.saySafe(sayFn, "Use what?");
      return G.saySafe(sayFn, `You can't figure out how to use ${G.formatItem(a)} here.`);
    }

    G.saySafe(sayFn, `(No handler yet for ${cmdStr})`);
  }

  function executeParseResult(parseResult, sayFn) {
    if (!parseResult) return;

    for (const cmdStr of parseResult.known || []) executeCommand(cmdStr, sayFn);

    for (const u of parseResult.unknown || []) {
      if (u?.error) G.saySafe(sayFn, u.error);
      else G.saySafe(sayFn, `I don't understand "${u?.raw ?? "that"}".`);
    }
  }

  function executeKnownCommand(cmdStr, sayFn) {
    executeCommand(cmdStr, sayFn);
  }

  function resetGame({ roomId } = {}) {
    G.state.currentRoom = roomId ?? window.START_ROOM;
    G.state.inventory.length = 0;
  }

  // ---------------- EXPOSE RUNTIME ----------------
  window.GameRuntime = {
    state: G.state,
    resetGame,
    getItemDef: G.getItemDef,

    getCurrentRoom: G.getCurrentRoom,
    renderRoom: G.renderRoom,
    showInventory: G.showInventory,

    executeCommand,
    executeKnownCommand,
    executeParseResult,

    // actions
    goDir: G.goDir,
    takeItem: G.takeItem,
    dropItem: G.dropItem,
    examineItem: G.examineItem,

    // crafting
    combineItems,
    makeTarget,

    // new action system (optional external use)
    doAction,
  };
})();