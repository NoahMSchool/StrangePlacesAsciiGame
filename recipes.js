// recipes.js

const keyOf = (items) => [...items].sort().join("+");

const RECIPES = Object.freeze({

  // ---------------------------------------------------------------------------
  // Fishing rod recipes (now supports 2-step crafting)
  // ---------------------------------------------------------------------------

  // magnet + string = magnet-on-a-string (interim)
  [keyOf([ITEM.MAGNET, ITEM.ROPE])]: {
    inputs: [ITEM.MAGNET, ITEM.ROPE],
    consume: [ITEM.MAGNET, ITEM.ROPE],
    produce: [ITEM.MAGNET_STRING],
    text: "You tie the magnet onto the end of the string.",
  },

  // string + stick = stick-with-string (interim)
  [keyOf([ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.ROPE, ITEM.STICK],
    consume: [ITEM.ROPE, ITEM.STICK],
    produce: [ITEM.STRING_STICK],
    text: "You tie the string securely to the stick.",
  },

  // magnet-string + stick = fishing rod
  [keyOf([ITEM.MAGNET_STRING, ITEM.STICK])]: {
    inputs: [ITEM.MAGNET_STRING, ITEM.STICK],
    consume: [ITEM.MAGNET_STRING, ITEM.STICK],
    produce: [ITEM.FISHING_ROD],
    text: "You fasten the magnet-string to the stick. A weird little fishing rod!",
  },

  // string-stick + magnet = fishing rod
  [keyOf([ITEM.STRING_STICK, ITEM.MAGNET])]: {
    inputs: [ITEM.STRING_STICK, ITEM.MAGNET],
    consume: [ITEM.STRING_STICK, ITEM.MAGNET],
    produce: [ITEM.FISHING_ROD],
    text: "You attach the magnet to the end of the string-stick. A weird little fishing rod!",
  },

  // (keep original 3-item shortcut too)
  [keyOf([ITEM.MAGNET, ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.MAGNET, ITEM.ROPE, ITEM.STICK],
    consume: [ITEM.MAGNET, ITEM.ROPE, ITEM.STICK],
    produce: [ITEM.FISHING_ROD],
    text: "You tie the string to the stick and fasten the magnet to the end. A weird little fishing rod!",
  },

  // ---------------------------------------------------------------------------
  // Existing recipes
  // ---------------------------------------------------------------------------

  // 🌽 CORN + 🐔 CHICKEN = 🥚 EGG + 🐔 CHICKEN
  [keyOf([ITEM.CORN, ITEM.CHICKEN])]: {
    inputs: [ITEM.CORN, ITEM.CHICKEN],
    consume: [ITEM.CORN],           // only corn disappears
    produce: [ITEM.EGG],            // chicken remains automatically
    text: "The chicken happily pecks at the corn and lays an egg. Cluck!",
  },

  // 🎣 Fishing rod + grate = key (rod/grate stay)
  [keyOf([ITEM.FISHING_ROD, ITEM.GRATE])]: {
    inputs: [ITEM.FISHING_ROD, ITEM.GRATE],
    consume: [],               // consume nothing
    produce: [ITEM.KEY],       // produce a key
    text: "You lower the rod through the grate and snag something metal. A key!",
  },

  // 🪵🧵 String-on-a-stick + grate → not enough reach
  [keyOf([ITEM.STRING_STICK, ITEM.GRATE])]: {
    inputs: [ITEM.STRING_STICK, ITEM.GRATE],
    consume: [],
    produce: [],
    text: "You lower the string into the grate, but it’s too light to catch anything. It needs something heavy or magnetic on the end.",
  },

  // 🧲🧵 Magnet-on-a-string + grate → no rigidity
  [keyOf([ITEM.MAGNET_STRING, ITEM.GRATE])]: {
    inputs: [ITEM.MAGNET_STRING, ITEM.GRATE],
    consume: [],
    produce: [],
    text: "You dangle the magnet into the grate, but the string has no reach. You need something rigid to guide it.",
  },


  // ---------------- ACTION RECIPE: PUSH LEAVES reveals GRATE ----------------
  // This makes PUSH LEAVES work, and it will NOT make EAT LEAVES work.
  PUSH_LEAVES_REVEAL_GRATE: {
    action: "PUSH",
    target: ITEM.LEAVES,
    consume: [ITEM.LEAVES],   // remove leaves
    produce: [ITEM.GRATE],    // reveal grate
    placeResult: "room",
    text: "You push aside the leaves, revealing a grate.",
  },

  // Egg + microwave => dinosaur egg
  [keyOf([ITEM.EGG, ITEM.MICROWAVE])]: {
    inputs: [ITEM.EGG, ITEM.MICROWAVE],
    consume: [ITEM.EGG],
    produce: [ITEM.DINOSAUR_EGG],
    text: "The microwave hums loudly. When it stops, the egg has grown… scaly.",
  },

});

function findRecipe(inputs) {
  return RECIPES[keyOf(inputs)] ?? null;
}

window.RECIPES = RECIPES;
window.findRecipe = findRecipe;
