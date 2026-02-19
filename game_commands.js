// game_commands.js
// Command execution + crafting/recipes. Depends on GameCore being loaded first.

(function () {
  const G = window.GameCore;
  if (!G) {
    console.error("GameCore not found. Load game_core.js before game_commands.js");
    return;
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

    const recipe = (typeof window.findRecipe === "function") ? window.findRecipe(inputs) : null;
    if (!recipe) return G.saySafe(sayFn, "Nothing happens.");

    const consume = Array.isArray(recipe.consume)
      ? recipe.consume
      : (Array.isArray(recipe.inputs) ? recipe.inputs : inputs);

    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : (recipe.output ? [recipe.output] : []);

    const allInputsInInventory = inputs.every(G.isInInventory);
    const placeResult = allInputsInInventory ? "inventory" : "room";

    if (placeResult === "inventory") {
      const space = G.MAX_INVENTORY_SIZE - G.state.inventory.length;
      const needed = produce.filter(Boolean).length;
      if (needed > space) {
        G.saySafe(sayFn, `You don't have enough space to carry that. (${G.state.inventory.length}/${G.MAX_INVENTORY_SIZE})`);
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

    G.saySafe(sayFn, recipe.text || "Done.");
  }

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

    if (verb === "EAT") {
      if (!a) return G.saySafe(sayFn, "Eat what?");
      return G.eatItem(a, sayFn);
    }

    if (verb === "HELP") {
      return G.helpText(sayFn);
    }

    if (verb === "USE") {
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);
      if (!a) return G.saySafe(sayFn, "Use what?");
      return G.saySafe(sayFn, `You can't figure out how to use ${G.formatItem(a)} here.`);
    }

    G.saySafe(sayFn, `(No handler yet for ${cmdStr})`);
  }

  function executeParseResult(parseResult, sayFn) {
    if (!parseResult) return;

    for (const cmdStr of parseResult.known || []) {
      executeCommand(cmdStr, sayFn);
    }

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
    combineItems,
    makeTarget,
  };
})();
