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
    bgmEnabled: true,
    sfxEnabled: true,
  };

  function applyBgmEnabled() {
    Sound.setBgmEnabled(Settings.bgmEnabled);
    if (Settings.bgmEnabled) {
      Sound.playBgm(DEFAULT_BGM_LOOP, { loop: true });
    } else {
      Sound.stopBgm();
    }
  }

  function applySfxEnabled() {
    Sound.setSfxEnabled(Settings.sfxEnabled);
  }

  // Start ambience immediately (default ON)
  applyBgmEnabled();
  applySfxEnabled();

  // ---------------- helpers ----------------

  function playSuccessSound(recipe) {
    const url = recipe?.successSfx || DEFAULT_SUCCESS_SFX;
    Sound.playSfx(url);
  }

  function recipeSfxEntries() {
    const entries = [];
    if (!window.RECIPES) return entries;
    for (const [id, recipe] of Object.entries(window.RECIPES)) {
      if (recipe?.successSfx) entries.push({ id, url: recipe.successSfx });
    }
    return entries;
  }

  function fileBaseName(path) {
    const p = String(path || "");
    const tail = p.split("/").pop() || p;
    return tail.replace(/\.[^.]+$/, "");
  }

  function runFxTest(arg, sayFn) {
    const entries = recipeSfxEntries();
    if (!entries.length) {
      G.saySafe(sayFn, "FXTEST: no recipe SFX configured.");
      return;
    }

    const q = String(arg || "").trim().toLowerCase();
    if (!q) {
      G.saySafe(sayFn, "FXTEST available effects:");
      for (const e of entries) {
        G.saySafe(sayFn, `- ${e.id} (${fileBaseName(e.url)})`);
      }
      return;
    }

    const exact = entries.find(
      (e) =>
        e.id.toLowerCase() === q ||
        fileBaseName(e.url).toLowerCase() === q ||
        e.url.toLowerCase() === q
    );
    if (exact) {
      Sound.playSfx(exact.url);
      G.saySafe(sayFn, `FXTEST: played ${exact.id}.`);
      return;
    }

    const partial = entries.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        fileBaseName(e.url).toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q)
    );

    if (partial.length === 1) {
      Sound.playSfx(partial[0].url);
      G.saySafe(sayFn, `FXTEST: played ${partial[0].id}.`);
      return;
    }

    if (partial.length > 1) {
      G.saySafe(sayFn, "FXTEST: multiple matches:");
      for (const e of partial) G.saySafe(sayFn, `- ${e.id} (${fileBaseName(e.url)})`);
      return;
    }

    G.saySafe(sayFn, `FXTEST: no effect matched "${arg}".`);
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
    const consumed = (consume || []).filter(Boolean);
    const produced = (produce || []).filter(Boolean);

    if (consumed.length === 0 && produced.length === 0) {
      return "";
    }

    if (consumed.length === 0 && produced.length > 0) {
      return `Found ${formatEmojiList(produced)}`;
    }

    return `(used: ${formatEmojiList(consume)} → made: ${formatEmojiList(produce)})`;
  }

  function sayRecipeResult(sayFn, recipe, consume, produce) {
    const suffix = formatProducedList(produce);
    const summary = formatRecipeSummaryLine(consume, produce);
    const msg = (recipe?.text || "Done.") + suffix + (summary ? "\n" + summary : "");
    G.saySafe(sayFn, msg);

    // ✅ SFX on success (respects Settings.audioEnabled via Sound.setEnabled)
    playSuccessSound(recipe);
  }

  function applyRecipePostEffects(recipe, sayFn) {
    if (!recipe || !recipe.setFlag) return;
    if (!G.state.flags) G.state.flags = {};
    G.state.flags[recipe.setFlag] = true;

    if (recipe.setFlag === "fireOut" && !G.state.flags.inspectorRelocated) {
      const mineEntrance = window.getRoom ? window.getRoom("MINE_ENTRANCE") : null;
      if (mineEntrance?.exits?.EAST && typeof mineEntrance.exits.EAST === "object") {
        mineEntrance.exits.EAST.barrier = null;
      }
      if (Array.isArray(mineEntrance?.items)) {
        mineEntrance.items = mineEntrance.items.filter(
          (e) => !(Array.isArray(e) ? e[0] === ITEM.HEALTH_INSPECTOR : e === ITEM.HEALTH_INSPECTOR)
        );
      }

      const darkForest = window.getRoom ? window.getRoom("DARKFOREST") : null;
      if (darkForest && !G.roomHasItem(darkForest, ITEM.HEALTH_INSPECTOR)) {
        G.addToRoomAtRandomInterior(darkForest, ITEM.HEALTH_INSPECTOR);
      }

      G.state.flags.inspectorRelocated = true;
      G.saySafe(sayFn, "The inspector arrives, checks his clipboard, and nods. \"Good work. That's much safer.\"");
    }

    if (recipe.setFlag === "timeForward1000") {
      const mineField = window.getRoom ? window.getRoom("MINE_CAVERN") : null;
      if (mineField && Array.isArray(mineField.items)) {
        let changed = 0;
        mineField.items = mineField.items.map((entry) => {
          if (Array.isArray(entry)) {
            const id = entry[0];
            const coord = entry[1];
            if (id === ITEM.SEED) {
              changed++;
              return [ITEM.CORN, coord];
            }
            return entry;
          }
          if (entry === ITEM.SEED) {
            changed++;
            return ITEM.CORN;
          }
          return entry;
        });
        if (changed > 0) {
          G.saySafe(sayFn, "Far away in the Mine Field, the seed has become corn.");
        }
      }
    }

    if (recipe.setFlag === "eggOilExperimentReady") {
      const tavern = window.getRoom ? window.getRoom("CAVERN_TAVERN") : null;
      if (tavern?.exits?.SOUTH && typeof tavern.exits.SOUTH === "object") {
        tavern.exits.SOUTH.barrier = null;
      }
      if (Array.isArray(tavern?.items)) {
        const edgeX = 3;
        const edgeY = 6;
        const moved = [];
        tavern.items = tavern.items.map((entry) => {
          if (!Array.isArray(entry) || !Array.isArray(entry[1])) return entry;
          const id = entry[0];
          const c = entry[1];
          if (id === ITEM.EINSTEIN_BARMAN && c[0] === edgeX && c[1] === edgeY) {
            moved.push(true);
            return [ITEM.EINSTEIN_BARMAN, [4, 4]];
          }
          return entry;
        });
        if (!moved.length && !G.roomHasItem(tavern, ITEM.EINSTEIN_BARMAN)) {
          G.addToRoomAtRandomInterior(tavern, ITEM.EINSTEIN_BARMAN);
        }
      }
      G.saySafe(sayFn, "Einstein Barman grins. \"Ja! The experiment is complete. You may pass south.\"");
    }
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

  function countConsumedFromInventory(consumeIds) {
    const want = new Map();
    for (const id of consumeIds || []) {
      if (!id) continue;
      want.set(id, (want.get(id) || 0) + 1);
    }

    let consumed = 0;
    for (const [id, needed] of want.entries()) {
      consumed += Math.min(needed, countInInv(id));
    }
    return consumed;
  }

  function wouldOverflowInventory(consume, produce, placeResult, keepCoordApplies) {
    if (placeResult !== "inventory") return false;

    const totalProduced = (produce || []).filter(Boolean).length;
    const producedToInventory = Math.max(0, totalProduced - (keepCoordApplies ? 1 : 0));
    const consumedFromInventory = countConsumedFromInventory(consume || []);

    const finalCount = G.state.inventory.length - consumedFromInventory + producedToInventory;
    return finalCount > G.MAX_INVENTORY_SIZE;
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
    const inputs = Array.isArray(itemIds) ? itemIds.filter(Boolean) : [];
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
    const placeResult =
      recipe.placeResult === "inventory"
        ? "inventory"
        : recipe.placeResult === "room"
        ? "room"
        : allInputsInInventory
        ? "inventory"
        : "room";

    const keepCoordApplies =
      !!(recipe.keepCoord && consume.length >= 1 && produce.length >= 1 && G.isInRoom(consume[0]));

    if (wouldOverflowInventory(consume, produce, placeResult, keepCoordApplies)) {
      G.saySafe(
        sayFn,
        `You don't have enough space to carry that. (${G.state.inventory.length}/${G.MAX_INVENTORY_SIZE})`
      );
      return;
    }

    if (recipe.keepCoord && consume.length >= 1 && produce.length >= 1) {
      const fromId = consume[0];
      const toId = produce[0];

      if (G.isInRoom(fromId)) {
        const room = G.getRoom(G.state.currentRoom);

        for (let i = 1; i < consume.length; i++) {
          const id = consume[i];
          const removedFrom = G.removeOne(id);
          if (!removedFrom) {
            G.saySafe(sayFn, `You can't seem to use ${G.formatItem(id)} right now.`);
            return;
          }
        }

        const ok = replaceRoomItemKeepingCoord(room, fromId, toId);
        if (!ok) {
          G.saySafe(sayFn, "You can't do that right now.");
          return;
        }

        for (let i = 1; i < produce.length; i++) {
          const outId = produce[i];
          if (!outId) continue;
          if (placeResult === "inventory") G.addToInventory(outId);
          else G.addToRoom(outId);
        }

        sayRecipeResult(sayFn, recipe, consume, produce);
        applyRecipePostEffects(recipe, sayFn);
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

    sayRecipeResult(sayFn, recipe, consume, produce);
    applyRecipePostEffects(recipe, sayFn);
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

    if (recipe.setFlag && G.state.flags?.[recipe.setFlag]) {
      return G.saySafe(sayFn, recipe.repeatText || "You've already done that.");
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

    const keepCoordApplies =
      !!(recipe.keepCoord && consume.length >= 1 && produce.length >= 1 && G.isInRoom(consume[0]));

    if (wouldOverflowInventory(consume, produce, placeResult, keepCoordApplies)) {
      return G.saySafe(
        sayFn,
        `You don't have enough space to carry that. (${G.state.inventory.length}/${G.MAX_INVENTORY_SIZE})`
      );
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

        sayRecipeResult(sayFn, recipe, consume, produce);
        applyRecipePostEffects(recipe, sayFn);
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

    sayRecipeResult(sayFn, recipe, consume, produce);
    applyRecipePostEffects(recipe, sayFn);
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

    const candidates = listAllRecipes().filter(
      (r) => recipeProduces(r, targetId) && Array.isArray(r?.inputs) && r.inputs.length >= 2
    );
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
    const argText = parts.slice(1).join(" ");

    if (verb === "L") return G.renderRoom(sayFn);
    if (verb === "I") return G.showInventory(sayFn);

    if (verb === "LOOK") {
      if (!a) G.renderRoom(sayFn);
      else if (
        typeof ITEM !== "undefined" &&
        a === ITEM.BED &&
        !G.state.flags?.bedBookFound
      ) {
        doAction("SEARCH", ITEM.BED, sayFn);
      } else {
        G.examineItem(a, sayFn);
      }
      return;
    }

    if (verb === "READ") {
      if (!a) return G.saySafe(sayFn, "Read what?");
      G.examineItem(a, sayFn);
      return;
    }

    if (verb === "TALK") {
      if (!a) return G.saySafe(sayFn, "Talk to who?");
      if (typeof ITEM !== "undefined" && a === ITEM.HEALTH_INSPECTOR) {
        if (!G.isInRoom(ITEM.HEALTH_INSPECTOR)) {
          return G.saySafe(sayFn, "They're not here.");
        }
        if (!G.state.flags?.fireOut) {
          return G.saySafe(
            sayFn,
            "The inspector says, \"There's still a fire outside. Put it out first.\""
          );
        }
        return G.saySafe(sayFn, "The inspector says, \"All clear now. Proceed safely.\"");
      }
      if (typeof ITEM !== "undefined" && a === ITEM.EINSTEIN_BARMAN) {
        if (!G.isInRoom(ITEM.EINSTEIN_BARMAN)) {
          return G.saySafe(sayFn, "They're not here.");
        }
        if (!G.state.flags?.eggOilExperimentReady) {
          return G.saySafe(
            sayFn,
            "Einstein Barman says, \"I have been waiting for an egg to complete my master experiment with eggs and oil.\""
          );
        }
        return G.saySafe(
          sayFn,
          "Einstein Barman says, \"Magnificent! Egg plus oil has unlocked new possibilities. The south door is open.\""
        );
      }
      return G.saySafe(sayFn, "They have nothing to say.");
    }

    if (verb === "SLEEP") {
      if (typeof ITEM === "undefined") return G.saySafe(sayFn, "You can't sleep here.");
      if (!a) {
        if (G.isInRoom(ITEM.BED)) return doAction("SEARCH", ITEM.BED, sayFn);
        return G.saySafe(sayFn, "You can't sleep here.");
      }
      if (a === ITEM.BED) return doAction("SEARCH", ITEM.BED, sayFn);
      return G.saySafe(sayFn, "You can't sleep there.");
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

    if (verb === "MCBOOF") {
      if (!a) return G.saySafe(sayFn, "Mcboof what?");
      if (!G.getItemDef(a)) return G.saySafe(sayFn, "That item doesn't exist.");
      G.addToRoom(a);
      return G.saySafe(sayFn, `MCBOOF: spawned ${G.formatItem(a)}.`);
    }

    if (verb === "FXTEST") {
      runFxTest(argText, sayFn);
      return;
    }

    if (verb === "ROCCO") {
      const roomDefs =
        window.ROOM_DEFS ||
        (typeof ROOM_DEFS !== "undefined" ? ROOM_DEFS : null) ||
        {};
      let cleared = 0;

      function edgeCoordForDir(dir) {
        if (dir === "NORTH") return [3, 0];
        if (dir === "SOUTH") return [3, 6];
        if (dir === "WEST") return [0, 3];
        if (dir === "EAST") return [6, 3];
        return null;
      }

      const rooms = Object.values(roomDefs).filter((r) => r && typeof r === "object");
      if (rooms.length === 0 && typeof ROOM !== "undefined" && G.getRoom) {
        for (const roomId of Object.values(ROOM)) {
          const room = G.getRoom(roomId);
          if (room && typeof room === "object" && !rooms.includes(room)) rooms.push(room);
        }
      }
      const currentRoom = G.getRoom ? G.getRoom(G.state.currentRoom) : null;
      if (currentRoom && !rooms.includes(currentRoom)) rooms.push(currentRoom);

      for (const room of rooms) {
        if (!room || typeof room !== "object") continue;
        if (!room.exits || typeof room.exits !== "object") continue;
        if (!Array.isArray(room.items)) room.items = [];

        for (const [dir, exit] of Object.entries(room.exits)) {
          if (!exit || typeof exit !== "object" || Array.isArray(exit)) continue;
          const barrier = exit.barrier ?? null;
          if (!barrier) continue;

          exit.barrier = null;
          cleared++;

          const edge = edgeCoordForDir(String(dir || "").toUpperCase());
          room.items = room.items.filter((e) => {
            if (!Array.isArray(e)) return true;
            const id = e[0];
            const c = e[1];
            if (!Array.isArray(c)) return true;
            if (id !== barrier) return true;
            if (!edge) return false;
            const atEdge = c[0] === edge[0] && c[1] === edge[1];
            const onBorder = c[0] === 0 || c[0] === 6 || c[1] === 0 || c[1] === 6;
            return !(atEdge || onBorder);
          });
        }
      }

      return G.saySafe(sayFn, `ROCCO: removed ${cleared} barrier${cleared === 1 ? "" : "s"}.`);
    }

    if (verb === "INVENTORY" || verb === "INV") {
      G.showInventory(sayFn);
      return;
    }

    function tryImpliedSecondNoun(firstId) {
      if (!firstId || typeof ITEM === "undefined") return false;

      const impliedRules = [
        // River convenience
        { a: ITEM.EMPTY_BUCKET, b: ITEM.RIVER },
        { a: ITEM.WATER_BUCKET, b: ITEM.CAMPFIRE },
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

    function inspectorViolenceWarning(targetId) {
      return (
        typeof ITEM !== "undefined" &&
        targetId === ITEM.HEALTH_INSPECTOR &&
        "Very bad idea. Assaulting a Health and Safety Inspector will not improve your situation."
      );
    }

    if (verb === "PUSH") {
      if (!a) return G.saySafe(sayFn, "Push what?");
      const warning = inspectorViolenceWarning(a);
      if (warning) return G.saySafe(sayFn, warning);
      return doAction("PUSH", a, sayFn);
    }
    if (verb === "HIT") {
      if (!a) return G.saySafe(sayFn, "Hit what?");
      const warning = inspectorViolenceWarning(a);
      if (warning) return G.saySafe(sayFn, warning);
      return doAction("PUSH", a, sayFn);
    }
    if (verb === "FREE") {
      if (!a) return G.saySafe(sayFn, "Free what?");
      return doAction("PUSH", a, sayFn);
    }
    if (verb === "SEARCH") {
      if (!a) return G.saySafe(sayFn, "Search what?");
      return doAction("SEARCH", a, sayFn);
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
      if (b && typeof ITEM !== "undefined" && b === ITEM.KEY) {
        return doAction("UNLOCK", a, sayFn);
      }
      return doAction("OPEN", a, sayFn);
    }
    if (verb === "CLOSE") {
      if (!a) return G.saySafe(sayFn, "Close what?");
      return doAction("CLOSE", a, sayFn);
    }
    if (verb === "EXTINGUISH") {
      if (!a) return G.saySafe(sayFn, "Extinguish what?");
      return doAction("EXTINGUISH", a, sayFn);
    }

    // ✅ Audio setting (optional commands)
    if (verb === "SOUND" || verb === "AUDIO") {
      // SOUND ON / SOUND OFF / SOUND
      const arg = (a || "").toUpperCase();
      if (arg === "ON") {
        Settings.bgmEnabled = true;
        Settings.sfxEnabled = true;
        applyBgmEnabled();
        applySfxEnabled();
        return G.saySafe(sayFn, "Audio: ON");
      }
      if (arg === "OFF") {
        Settings.bgmEnabled = false;
        Settings.sfxEnabled = false;
        applyBgmEnabled();
        applySfxEnabled();
        return G.saySafe(sayFn, "Audio: OFF");
      }
      const next = !(Settings.bgmEnabled && Settings.sfxEnabled);
      Settings.bgmEnabled = next;
      Settings.sfxEnabled = next;
      applyBgmEnabled();
      applySfxEnabled();
      return G.saySafe(sayFn, `Audio: ${next ? "ON" : "OFF"}`);
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
    getAudioEnabled: () => Settings.bgmEnabled && Settings.sfxEnabled,
    setAudioEnabled: (enabled) => {
      const on = !!enabled;
      Settings.bgmEnabled = on;
      Settings.sfxEnabled = on;
      applyBgmEnabled();
      applySfxEnabled();
    },
    toggleAudio: () => {
      const on = !(Settings.bgmEnabled && Settings.sfxEnabled);
      Settings.bgmEnabled = on;
      Settings.sfxEnabled = on;
      applyBgmEnabled();
      applySfxEnabled();
      return on;
    },
    getBgmEnabled: () => Settings.bgmEnabled,
    setBgmEnabled: (enabled) => {
      Settings.bgmEnabled = !!enabled;
      applyBgmEnabled();
    },
    toggleBgm: () => {
      Settings.bgmEnabled = !Settings.bgmEnabled;
      applyBgmEnabled();
      return Settings.bgmEnabled;
    },
    getSfxEnabled: () => Settings.sfxEnabled,
    setSfxEnabled: (enabled) => {
      Settings.sfxEnabled = !!enabled;
      applySfxEnabled();
    },
    toggleSfx: () => {
      Settings.sfxEnabled = !Settings.sfxEnabled;
      applySfxEnabled();
      return Settings.sfxEnabled;
    },
  };
})();
