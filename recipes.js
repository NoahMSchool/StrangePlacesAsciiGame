// recipes.js

const keyOf = (items) => [...items].sort().join("+");

const RECIPES = Object.freeze({

  // magnet + string + stick = fishing rod (classic full consume)
  [keyOf([ITEM.MAGNET, ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.MAGNET, ITEM.ROPE, ITEM.STICK],

    consume: [ITEM.MAGNET, ITEM.ROPE, ITEM.STICK],
    produce: [ITEM.FISHING_ROD],

    text: "You tie the string to the stick and fasten the magnet to the end. A weird little fishing rod!",
  },

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

  // silly test
  [keyOf([ITEM.WALL, ITEM.WALL])]: {
    inputs: [ITEM.WALL, ITEM.WALL],
    consume: [ITEM.WALL],
    produce: [ITEM.KEY],

    text: "You bang two walls together and get a key!",
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

});

function findRecipe(inputs) {
  return RECIPES[keyOf(inputs)] ?? null;
}

window.RECIPES = RECIPES;
window.findRecipe = findRecipe;
