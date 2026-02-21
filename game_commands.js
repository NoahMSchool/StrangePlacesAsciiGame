// game_commands.js
// Command execution + crafting/recipes.
// Depends on GameCore + sound.js being loaded first.

(function () {
  const G = window.GameCore;
  const Sound = window.Sound;

  if (!G) {
    console.error("GameCore not found. Load game_core.js before game_commands.js");
    return;
  }
  if (!Sound) {
    console.error("Sound not found. Load sound.js before game_commands.js");
    return;
  }

  // ---------------- Audio config ----------------

  const DEFAULT_SUCCESS_SFX =
    "Audio/ksjsbwuil-apple-pay-success-sound-effect-481188.mp3";

  const DEFAULT_BGM_LOOP =
    "Audio/freesound_community-eerie-ambience-6836.mp3";

  // Single place to store settings (you can later persist this to localStorage)
  const Settings = {
    audioEnabled: true, // default ON
  };

  function applyAudioEnabled() {
    // Assumes sound.js exposes these:
    //   Sound.setEnabled(boolean)
    //   Sound.playBgm(url, { loop:true })
    //   Sound.stopBgm()
    Sound.setEnabled(Settings.audioEnabled);

    if (Settings.audioEnabled) {
      Sound.playBgm(DEFAULT_BGM_LOOP, { loop: true });
    } else {
      Sound.stopBgm();
    }
  }

  // Start ambience immediately (default ON)
  applyAudioEnabled();

  // ---------------- helpers ----------------

  function playSuccessSound(recipe) {
    const url = recipe?.successSfx || DEFAULT_SUCCESS_SFX;
    Sound.playSfx(url);
  }

  function formatProducedList(produceIds) {
    const ids = (produceIds || []).filter(Boolean);
    if (ids.length === 0) return "";
    const parts = ids.map((id) => G.formatItem(id)); // emoji + name
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

  function sayRecipeResult(sayFn, recipe, consume, produce) {
    const suffix = formatProducedList(produce);
    const summary = formatRecipeSummaryLine(consume, produce);
    G.saySafe(sayFn, (recipe?.text || "Done.") + suffix + "\n" + summary);

    // ✅ SFX on success (respects Settings.audioEnabled via Sound.setEnabled)
    playSuccessSound(recipe);
  }

  function applyRecipePostEffects(recipe) {
    if (!recipe || !recipe.setFlag) return;
    if (!G.state.flags) G.state.flags = {};
    G.state.flags[recipe.setFlag] = true;
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
    for (const id of consumeIds || []) {
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

    const recipe =
      typeof window.findRecipe === "function" ? window.findRecipe(inputs) : null;
    if (!recipe) return G.saySafe(sayFn, "Nothing happens.");

    const consume = Array.isArray(recipe.consume)
      ? recipe.consume
      : Array.isArray(recipe.inputs)
      ? recipe.inputs
      : inputs;

    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : recipe.output
      ? [recipe.output]
      : [];

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

    applyRecipePostEffects(recipe);
    sayRecipeResult(sayFn, recipe, consume, produce);
  }

  // ---------------- ACTION RECIPES ----------------

  function listAllRecipes() {
    return window.RECIPES ? Object.values(window.RECIPES) : [];
  }

  function findActionRecipe(action, targetId) {
    const a = String(action || "").toUpperCase();
    return (
      listAllRecipes().find(
        (r) =>
          r && String(r.action || "").toUpperCase() === a && r.target === targetId
      ) || null
    );
  }

  function hasAllRequired(requireIds) {
    if (!Array.isArray(requireIds) || requireIds.length === 0) return true;
    const have = G.allAvailableItemsSet();
    return requireIds.every((id) => have.has(id));
  }

  function coordToDir(coord) {
    const x = coord?.[0],
      y = coord?.[1];
    if (x == null || y == null) return null;
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

    const dir = coordToDir(c);
    if (dir && room.exits && room.exits[dir] && typeof room.exits[dir] === "object") {
      room.exits[dir].barrier = isDoorOpenId(toId) ? null : toId;
    }

    return true;
  }

  function lockedDoorFailMessage(verb, targetId) {
    if (verb === "OPEN" && typeof ITEM !== "undefined" && targetId === ITEM.DOOR_LOCKED)
      return "It's locked.";
    return null;
  }

  function doAction(action, targetId, sayFn) {
    if (!targetId) return;

    const verb = String(action || "").toUpperCase();

    const inRoom = G.isInRoom(targetId);
    const inInv = G.isInInventory(targetId);

    if (verb === "EAT") {
      if (!inRoom && !inInv) return G.saySafe(sayFn, "You can't see that here.");
    } else {
      if (!inRoom) return G.saySafe(sayFn, "You can't see that here.");
    }

    const recipe = findActionRecipe(verb, targetId);
    if (!recipe) {
      if (verb === "EAT") return G.saySafe(sayFn, G.cantEatMessage(targetId));
      if (
        verb === "OPEN" &&
        typeof ITEM !== "undefined" &&
        targetId === ITEM.DOOR_LOCKED
      ) {
        return G.saySafe(sayFn, "It's locked.");
      }
      return G.saySafe(sayFn, "Nothing happens.");
    }

    if (!hasAllRequired(recipe.requires)) {
      const have = G.allAvailableItemsSet();
      const missing = (recipe.requires || []).filter((id) => !have.has(id));
      if (recipe.missingRequiresText) {
        return G.saySafe(sayFn, recipe.missingRequiresText);
      }
      return G.saySafe(
        sayFn,
        `You can't do that yet. You need: ${missing.map(G.formatItem).join(", ")}.`
      );
    }

    const consume = Array.isArray(recipe.consume) ? recipe.consume : [targetId];
    const produce = Array.isArray(recipe.produce)
      ? recipe.produce
      : recipe.output
      ? [recipe.output]
      : [];

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

    if (!canConsumeAllHere(consume)) {
      const nicer = lockedDoorFailMessage(verb, targetId);
      return G.saySafe(sayFn, nicer || "You can't do that.");
    }

    // keepCoord: replace FIRST consume with FIRST produce at the same coord
    if (recipe.keepCoord && consume.length >= 1 && produce.length >= 1) {
      const fromId = consume[0];
      const toId = produce[0];

      if (G.isInRoom(fromId)) {
        const room = G.getRoom(G.state.currentRoom);

        for (let i = 1; i < consume.length; i++) {
          const id = consume[i];
          const removedFrom = G.removeOne(id);
          if (!removedFrom) return G.saySafe(sayFn, "You can't do that right now.");
        }

        const ok = replaceRoomItemKeepingCoord(room, fromId, toId);
        if (!ok) return G.saySafe(sayFn, "You can't do that right now.");

        for (let i = 1; i < produce.length; i++) {
          const outId = produce[i];
          if (!outId) continue;
          if (placeResult === "inventory") G.addToInventory(outId);
          else G.addToRoom(outId);
        }

        applyRecipePostEffects(recipe);
        sayRecipeResult(sayFn, recipe, consume, produce);
        return;
      }
    }

    // Normal path
    for (const id of consume) {
      const removedFrom = G.removeOne(id);
      if (!removedFrom) {
        return G.saySafe(
          sayFn,
          `You can't seem to ${verb.toLowerCase()} ${G.formatItem(targetId)} right now.`
        );
      }
    }

    for (const outId of produce) {
      if (!outId) continue;
      if (placeResult === "inventory") G.addToInventory(outId);
      else G.addToRoom(outId);
    }

    applyRecipePostEffects(recipe);
    sayRecipeResult(sayFn, recipe, consume, produce);
  }

  // ---------------- MAKE system ----------------

  function recipeProduces(recipe, targetId) {
    const produced = Array.isArray(recipe.produce)
      ? recipe.produce
      : recipe.output
      ? [recipe.output]
      : [];
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
        "MAKE needs recipes.js to expose RECIPES. Add:\nwindow.RECIPES = RECIPES;\nwindow.findRecipe = findRecipe;"
      );
      return;
    }

    const targetDef = G.getItemDef(targetId);
    const targetName = targetDef ? targetDef.name : targetId;

    const candidates = listAllRecipes().filter((r) => recipeProduces(r, targetId));
    if (candidates.length === 0)
      return G.saySafe(sayFn, `You don't know how to make ${targetName}.`);

    const doable = candidates.find(canMake);
    const chosen = doable || candidates[0];

    if (!canMake(chosen)) {
      const miss = missingFor(chosen);
      G.saySafe(
        sayFn,
        `You can't make ${targetName} yet. You need: ${miss.map(G.formatItem).join(", ")}.`
      );
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

    function tryImpliedSecondNoun(firstId) {
      if (!firstId || typeof ITEM === "undefined") return false;

      const impliedRules = [
        // River-bank convenience: bottle + river
        { a: ITEM.EMPTY_BOTTLE, b: ITEM.RIVER },
        // Grate interactions
        { a: ITEM.FISHING_ROD, b: ITEM.GRATE },
        { a: ITEM.STRING_STICK, b: ITEM.GRATE },
        { a: ITEM.MAGNET_STRING, b: ITEM.GRATE },
        // Kitchen convenience
        { a: ITEM.EGG, b: ITEM.MICROWAVE },
      ];

      for (const rule of impliedRules) {
        if (firstId === rule.a && G.isInRoom(rule.b)) {
          combineItems([rule.a, rule.b], sayFn);
          return true;
        }
      }
      return false;
    }

    if (verb === "COMBINE") {
      if (a && !b && tryImpliedSecondNoun(a)) return;
      return combineItems([a, b, c].filter(Boolean), sayFn);
    }
    if (verb === "MAKE") {
      if (!a) return G.saySafe(sayFn, "Make what?");
      return makeTarget(a, sayFn);
    }

    if (verb === "EAT") {
      if (!a) return G.saySafe(sayFn, "Eat what?");
      return doAction("EAT", a, sayFn);
    }
    if (verb === "PUSH") {
      if (!a) return G.saySafe(sayFn, "Push what?");
      return doAction("PUSH", a, sayFn);
    }
    if (verb === "FREE") {
      if (!a) return G.saySafe(sayFn, "Free what?");
      return doAction("PUSH", a, sayFn);
    }
    if (verb === "SEARCH") {
      if (!a) return G.saySafe(sayFn, "Search what?");
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

    // ✅ Audio setting (optional commands)
    if (verb === "SOUND" || verb === "AUDIO") {
      // SOUND ON / SOUND OFF / SOUND
      const arg = (a || "").toUpperCase();
      if (arg === "ON") {
        Settings.audioEnabled = true;
        applyAudioEnabled();
        return G.saySafe(sayFn, "Audio: ON");
      }
      if (arg === "OFF") {
        Settings.audioEnabled = false;
        applyAudioEnabled();
        return G.saySafe(sayFn, "Audio: OFF");
      }
      Settings.audioEnabled = !Settings.audioEnabled;
      applyAudioEnabled();
      return G.saySafe(sayFn, `Audio: ${Settings.audioEnabled ? "ON" : "OFF"}`);
    }

    if (verb === "HELP") return G.helpText(sayFn);

    if (verb === "USE") {
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);
      if (!a) return G.saySafe(sayFn, "Use what?");
      if (tryImpliedSecondNoun(a)) return;
      return G.saySafe(sayFn, `You can't figure out how to use ${G.formatItem(a)} here.`);
    }

    if (verb === "FILL") {
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);
      if (!a) return G.saySafe(sayFn, "Fill what?");
      if (tryImpliedSecondNoun(a)) return;
      return G.saySafe(sayFn, "Fill it with what?");
    }

    if (verb === "COOK") {
      if (a && b) return combineItems([a, b, c].filter(Boolean), sayFn);
      if (!a) return G.saySafe(sayFn, "Cook what?");
      if (tryImpliedSecondNoun(a)) return;
      return G.saySafe(sayFn, "Cook it with what?");
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

  // ---------------- EXPOSE RUNTIME ----------------
  window.GameRuntime = {
    state: G.state,

    executeCommand,
    executeParseResult,

    // rendering helpers used by index.html
    renderRoom: G.renderRoom,
    getCurrentRoom: G.getCurrentRoom,

    // actions/crafting
    doAction,
    combineItems,
    makeTarget,

    // ✅ settings hooks for UI buttons/toggles later
    getAudioEnabled: () => Settings.audioEnabled,
    setAudioEnabled: (enabled) => {
      Settings.audioEnabled = !!enabled;
      applyAudioEnabled();
    },
    toggleAudio: () => {
      Settings.audioEnabled = !Settings.audioEnabled;
      applyAudioEnabled();
      return Settings.audioEnabled;
    },
  };
})();
