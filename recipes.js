// recipes.js

const keyOf = (items) => [...items].sort().join("+");

const RECIPES = Object.freeze({

  // ---------------------------------------------------------------------------
  // Fishing rod recipes (now supports 2-step crafting)
  // ---------------------------------------------------------------------------

  UNLOCK_LOCKED_DOOR: {
    action: "UNLOCK",
    target: ITEM.DOOR_LOCKED,
    requires: [ITEM.KEY],
    consume: [ITEM.DOOR_LOCKED, ITEM.KEY],
    produce: [ITEM.DOOR_CLOSED],
    keepCoord: true,          
    placeResult: "room",
    successSfx: "Audio/recipes/freesound_community-unlock_door-90282.mp3",
    missingRequiresText: "The lock won't budge. You need a key.",
    text: "You unlock the door. The key breaks.",
  },

  UNLOCK_KAON_DOOR: {
    action: "UNLOCK",
    target: ITEM.KAON_LOCKED_DOOR,
    requires: [ITEM.KAON],
    consume: [ITEM.KAON_LOCKED_DOOR, ITEM.KAON],
    produce: [ITEM.DOOR_OPEN],
    keepCoord: true,
    placeResult: "room",
    missingRequiresText: "The lock vibrates and rejects you. Maybe this particle is kaeyon.",
    text: "The kaon resonates with the lock. The door clicks open.",
  },

  OPEN_CLOSED_DOOR: {
    action: "OPEN",
    target: ITEM.DOOR_CLOSED,
    consume: [ITEM.DOOR_CLOSED],
    produce: [ITEM.DOOR_OPEN],
    keepCoord: true,          // ✅ this is the magic bit
    placeResult: "room",
    successSfx: "Audio/recipes/dragon-studio-opening-door-sfx-454240.mp3",
    text: "You open the door.",
  },

  CLOSE_OPEN_DOOR: {
    action: "CLOSE",
    target: ITEM.DOOR_OPEN,
    consume: [ITEM.DOOR_OPEN],
    produce: [ITEM.DOOR_CLOSED],
    keepCoord: true,          // ✅ this is the magic bit
    placeResult: "room",
    successSfx: "Audio/recipes/freesound_community-door-open-and-close-with-a-creak-102380.mp3",
    text: "You close the door.",
  },

  // hook + string = hook-on-a-string (interim)
  [keyOf([ITEM.HOOK, ITEM.ROPE])]: {
    inputs: [ITEM.HOOK, ITEM.ROPE],
    consume: [ITEM.HOOK, ITEM.ROPE],
    produce: [ITEM.MAGNET_STRING],
    text: "You tie the hook onto the end of the string.",
  },

  // string + stick = stick-with-string (interim)
  [keyOf([ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.ROPE, ITEM.STICK],
    consume: [ITEM.ROPE, ITEM.STICK],
    produce: [ITEM.STRING_STICK],
    text: "You tie the string securely to the stick.",
  },

  // hook-string + stick = fishing rod
  [keyOf([ITEM.MAGNET_STRING, ITEM.STICK])]: {
    inputs: [ITEM.MAGNET_STRING, ITEM.STICK],
    consume: [ITEM.MAGNET_STRING, ITEM.STICK],
    produce: [ITEM.FISHING_ROD],
    text: "You fasten the hook-string to the stick. A weird little fishing rod!",
  },

  // string-stick + hook = fishing rod
  [keyOf([ITEM.STRING_STICK, ITEM.HOOK])]: {
    inputs: [ITEM.STRING_STICK, ITEM.HOOK],
    consume: [ITEM.STRING_STICK, ITEM.HOOK],
    produce: [ITEM.FISHING_ROD],
    text: "You attach the hook to the end of the string-stick. A weird little fishing rod!",
  },

  // (keep original 3-item shortcut too)
  [keyOf([ITEM.HOOK, ITEM.ROPE, ITEM.STICK])]: {
    inputs: [ITEM.HOOK, ITEM.ROPE, ITEM.STICK],
    consume: [ITEM.HOOK, ITEM.ROPE, ITEM.STICK],
    produce: [ITEM.FISHING_ROD],
    text: "You tie the string to the stick and fasten the hook to the end. A weird little fishing rod!",
  },

  // ---------------------------------------------------------------------------
  // Existing recipes
  // ---------------------------------------------------------------------------

  // 🌽 CORN + 🐔 CHICKEN = 🥚 EGG + 🐔 CHICKEN
  [keyOf([ITEM.CORN, ITEM.CHICKEN])]: {
    inputs: [ITEM.CORN, ITEM.CHICKEN],
    consume: [ITEM.CORN],           // only corn disappears
    produce: [ITEM.EGG],            // chicken remains automatically
    successSfx: "Audio/recipes/the-vampires-monster-chicken-laying-an-egg-330874.mp3",
    text: "The chicken happily pecks at the corn and lays an egg. Cluck!",
  },

  // 🎣 Fishing rod + grate = key (rod/grate stay)
  [keyOf([ITEM.FISHING_ROD, ITEM.GRATE])]: {
    inputs: [ITEM.FISHING_ROD, ITEM.GRATE],
    consume: [ITEM.FISHING_ROD],
    produce: [ITEM.KEY],
    setFlag: "grateKeyTaken",
    text: "You lower the rod through the grate and snag something metal. The rod slips from your hands and disappears below. You pull up a key.",
  },

  // 🪵🧵 String-on-a-stick + grate → not enough reach
  [keyOf([ITEM.STRING_STICK, ITEM.GRATE])]: {
    inputs: [ITEM.STRING_STICK, ITEM.GRATE],
    consume: [],
    produce: [],
    text: "You lower the string into the grate, but it’s too light to catch anything. It needs a hook on the end.",
  },

  // 🪝🧵 Hook-on-a-string + grate → no rigidity
  [keyOf([ITEM.MAGNET_STRING, ITEM.GRATE])]: {
    inputs: [ITEM.MAGNET_STRING, ITEM.GRATE],
    consume: [],
    produce: [],
    text: "You dangle the hook into the grate, but the string has no reach. You need something rigid to guide it.",
  },

  [keyOf([ITEM.EMPTY_BUCKET, ITEM.RIVER])]: {
    inputs: [ITEM.EMPTY_BUCKET, ITEM.RIVER],
    consume: [ITEM.EMPTY_BUCKET],
    produce: [ITEM.WATER_BUCKET],
    placeResult: "inventory",
    successSfx: "Audio/recipes/ksjsbwuil-apple-pay-success-sound-effect-481188.mp3",
    text: "You dip the container into the river and fill it with water.",
  },

  [keyOf([ITEM.WATER_BUCKET, ITEM.CAMPFIRE])]: {
    inputs: [ITEM.WATER_BUCKET, ITEM.CAMPFIRE],
    consume: [ITEM.CAMPFIRE, ITEM.WATER_BUCKET],
    produce: [ITEM.CAMPFIRE_OUT, ITEM.EMPTY_BUCKET],
    keepCoord: true,
    placeResult: "inventory",
    setFlag: "fireOut",
    successSfx: "Audio/recipes/djartmusic-short-fire-whoosh_1-317280.mp3",
    text: "You pour the water over the flames. The fire hisses and dies out.",
  },

  EXTINGUISH_CAMPFIRE: {
    action: "EXTINGUISH",
    target: ITEM.CAMPFIRE,
    requires: [ITEM.WATER_BUCKET],
    consume: [ITEM.CAMPFIRE, ITEM.WATER_BUCKET],
    produce: [ITEM.CAMPFIRE_OUT, ITEM.EMPTY_BUCKET],
    keepCoord: true,
    placeResult: "inventory",
    setFlag: "fireOut",
    successSfx: "Audio/recipes/djartmusic-short-fire-whoosh_1-317280.mp3",
    missingRequiresText: "You need water to put out the fire.",
    repeatText: "The fire is already out.",
    text: "You pour the water over the flames. The fire hisses and dies out.",
  },

  OPEN_FRIDGE_FIND_BUCKET: {
    action: "OPEN",
    target: ITEM.FRIDGE,
    consume: [],
    produce: [ITEM.EMPTY_BUCKET],
    placeResult: "room",
    setFlag: "fridgeOpened",
    repeatText: "The fridge is already open. Just cold air and old shelves now.",
    text: "You open the fridge. Inside you find an empty bucket.",
  },


  // ---------------- ACTION RECIPE: PUSH LEAVES reveals GRATE ----------------
  // This makes PUSH LEAVES work, and it will NOT make EAT LEAVES work.
  PUSH_LEAVES_REVEAL_GRATE: {
    action: "PUSH",
    target: ITEM.LEAVES,
    consume: [ITEM.LEAVES],   // remove leaves
    produce: [ITEM.GRATE],    // reveal grate
    placeResult: "room",
    keepCoord: true,          
    text: "You push aside the leaves, revealing a grate.",
  },

  SEARCH_LEAVES_REVEAL_GRATE: {
    action: "SEARCH",
    target: ITEM.LEAVES,
    consume: [ITEM.LEAVES],
    produce: [ITEM.GRATE],
    placeResult: "room",
    keepCoord: true,
    text: "You search through the leaves and reveal a grate.",
  },

  SEARCH_BED_REVEAL_BOOK: {
    action: "SEARCH",
    target: ITEM.BED,
    consume: [],
    produce: [ITEM.STRANGE_PLACES_BOOK],
    placeResult: "room",
    setFlag: "bedBookFound",
    repeatText: "You already checked under the bed. There's nothing else there.",
    text: "You reach under the bed and pull out a book titled \"Strange Places.\"",
  },

  FREE_CHICKEN: {
    action: "PUSH",
    target: ITEM.CHICKEN_IN_WEB,
    requires: [ITEM.STICK],
    consume: [ITEM.CHICKEN_IN_WEB],
    produce: [ITEM.CHICKEN, ITEM.ROPE],
    placeResult: "room",
    successSfx: "Audio/recipes/alex_jauk-chicken-noise-228106.mp3",
    missingRequiresText: "The webbing is too tough to tear by hand. You need something sturdy, like a stick.",
    text: "Squaaawk! You free the chicken from the web. It eyes you suspicisouly. Strings of web are all over the floor",
  },

  PUSH_TIME_LEVER: {
    action: "PUSH",
    target: ITEM.TIME_LEVER,
    consume: [],
    produce: [],
    placeResult: "room",
    setFlag: "timeForward1000",
    successSfx: "Audio/recipes/freesound_community-sci-fi-portal-83746.mp3",
    repeatText: "The lever is already set forward. Time won't jump again.",
    text: "You push the lever forward. You go forward 1000 years.",
  },

  PULL_TIME_LEVER: {
    action: "PULL",
    target: ITEM.TIME_LEVER,
    consume: [],
    produce: [],
    placeResult: "room",
    setFlag: "timeForward1000",
    successSfx: "Audio/recipes/freesound_community-sci-fi-portal-83746.mp3",
    repeatText: "The lever is already set forward. Time won't jump again.",
    text: "You pull the lever. Time lurches forward 1000 years.",
  },

  [keyOf([ITEM.EGG, ITEM.OIL_DRUM])]: {
    inputs: [ITEM.EGG, ITEM.OIL_DRUM],
    consume: [ITEM.EGG],
    produce: [],
    placeResult: "room",
    setFlag: "eggOilExperimentReady",
    text: "You drop the egg into the oil drum. It vanishes with a strange plop.",
  },

  // Egg + microwave => dinosaur egg
  [keyOf([ITEM.EGG, ITEM.MICROWAVE])]: {
    inputs: [ITEM.EGG, ITEM.MICROWAVE],
    consume: [ITEM.EGG],
    produce: [ITEM.DINOSAUR_EGG],
    text: "The microwave hums loudly. When it stops, the egg has grown… scaly.",
  },

  [keyOf([ITEM.DOWNQUARK, ITEM.ANTISTRANGEQUARK])]: {
    inputs: [ITEM.DOWNQUARK, ITEM.ANTISTRANGEQUARK],
    consume: [ITEM.DOWNQUARK, ITEM.ANTISTRANGEQUARK],
    produce: [ITEM.KAON],
    text: "The quarks bind in a flash and settle into a kaon.",
  },

  [keyOf([ITEM.UPQUARK, ITEM.ANTISTRANGEQUARK])]: {
    inputs: [ITEM.UPQUARK, ITEM.ANTISTRANGEQUARK],
    consume: [ITEM.UPQUARK, ITEM.ANTISTRANGEQUARK],
    produce: [ITEM.KAON],
    text: "The quarks recombine into a kaon with a sharp pop of energy.",
  },

  [keyOf([ITEM.UPQUARK, ITEM.UPQUARK, ITEM.DOWNQUARK])]: {
    inputs: [ITEM.UPQUARK, ITEM.UPQUARK, ITEM.DOWNQUARK],
    consume: [ITEM.UPQUARK, ITEM.UPQUARK, ITEM.DOWNQUARK],
    produce: [ITEM.PROTON],
    text: "Two up quarks and a down quark bind into a proton.",
  },

  [keyOf([ITEM.DOWNQUARK, ITEM.DOWNQUARK, ITEM.UPQUARK])]: {
    inputs: [ITEM.DOWNQUARK, ITEM.DOWNQUARK, ITEM.UPQUARK],
    consume: [ITEM.DOWNQUARK, ITEM.DOWNQUARK, ITEM.UPQUARK],
    produce: [ITEM.NEUTRON],
    text: "Two down quarks and an up quark lock together as a neutron.",
  },

  [keyOf([ITEM.PROTON, ITEM.PROTON, ITEM.NEUTRON, ITEM.NEUTRON])]: {
    inputs: [ITEM.PROTON, ITEM.PROTON, ITEM.NEUTRON, ITEM.NEUTRON],
    consume: [ITEM.PROTON, ITEM.PROTON, ITEM.NEUTRON, ITEM.NEUTRON],
    produce: [ITEM.ALPHAPARTICLE],
    text: "The particles fuse into an alpha particle.",
  },

  IONISE_CHICKEN_TO_DINOSAUR: {
    action: "IONISE",
    target: ITEM.CHICKEN,
    requires: [ITEM.ALPHAPARTICLE],
    consume: [ITEM.CHICKEN, ITEM.ALPHAPARTICLE],
    produce: [ITEM.DINOSAUR],
    placeResult: "room",
    missingRequiresText: "You need an alpha particle to ionise the chicken.",
    text: "You ionise the chicken. It grows rapidly, feathers hardening into scales. Dinosaur.",
  },

  THROW_ALPHA_AT_CHICKEN_TO_DINOSAUR: {
    action: "THROW",
    target: ITEM.CHICKEN,
    requires: [ITEM.ALPHAPARTICLE],
    consume: [ITEM.CHICKEN, ITEM.ALPHAPARTICLE],
    produce: [ITEM.DINOSAUR],
    placeResult: "room",
    missingRequiresText: "Throw what? You need an alpha particle to mutate the chicken.",
    text: "You throw the alpha particle at the chicken. There is a blinding flash. Dinosaur.",
  },

  [keyOf([ITEM.DINOSAUR, ITEM.CAVE_GUARD])]: {
    inputs: [ITEM.DINOSAUR, ITEM.CAVE_GUARD],
    consume: [ITEM.CAVE_GUARD],
    produce: [],
    setFlag: "caveGuardScaredOff",
    text: "The cave guard sees the dinosaur and bolts into the darkness. The way is clear.",
  },

  [keyOf([ITEM.DINOSAUR_FOSSILS, ITEM.MUSEUM_MAN])]: {
    inputs: [ITEM.DINOSAUR_FOSSILS, ITEM.MUSEUM_MAN],
    consume: [ITEM.DINOSAUR_FOSSILS],
    produce: [ITEM.MEDAL],
    placeResult: "inventory",
    setFlag: "museumFossilTradeDone",
    repeatText: "You've already made the fossil trade.",
    text: "The mueseam man gasps and carefully takes the fossils. \"Perfect! A real exhibit!\" He awards you a medal.",
  },

  [keyOf([ITEM.STRANGE_PLACES_BOOK, ITEM.LIBRARIAN])]: {
    inputs: [ITEM.STRANGE_PLACES_BOOK, ITEM.LIBRARIAN],
    consume: [ITEM.STRANGE_PLACES_BOOK, ITEM.PHYSICS_TEXTBOOK],
    produce: [ITEM.PHYSICS_TEXTBOOK],
    placeResult: "inventory",
    text: "You hand over Strange Places. The librarian swaps it for the physics textbook.",
  },

});

function findRecipe(inputs) {
  return RECIPES[keyOf(inputs)] ?? null;
}

window.RECIPES = RECIPES;
window.findRecipe = findRecipe;
