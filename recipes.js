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

});

function findRecipe(inputs) {
  return RECIPES[keyOf(inputs)] ?? null;
}
