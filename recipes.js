// recipes.js

// For your parser, COMBINE outputs: `COMBINE A B` or `COMBINE A B C`
// so recipes should match by sorted inputs (order-independent).

const keyOf = (items) => [...items].sort().join("+");

const RECIPES = Object.freeze({
  // magnet + string + stick = fishing rod
  [keyOf([ITEM.MAGNET, ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.MAGNET, ITEM.ROPE, ITEM.STICK],
    output: ITEM.FISHING_ROD,
    text: "You tie the string to the stick and fasten the magnet to the end. A weird little fishing rod!",
    // Suggested behavior for your action system:
    // - remove inputs from inventory
    // - add output to inventory
  },
});

// Helper to look up a recipe with 2 or 3 inputs.
function findRecipe(inputs) {
  return RECIPES[keyOf(inputs)] ?? null;
}
