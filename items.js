// items.js
// Data-only item model: printable name, emoji, examine text, visibility + portability,
// plus small interaction hooks you can call from your action system.

// -----------------------------------------------------------------------------
// Canonical item IDs
// -----------------------------------------------------------------------------
const ITEM = Object.freeze({
  WALL: "WALL",
  TEDDYBEAR: "TEDDYBEAR",
  CHICKEN: "CHICKEN",
  DINOSAUR: "DINOSAUR",
  GRATE: "GRATE",
  CORN: "CORN",
  LAMP: "LAMP",
  ROPE: "ROPE",
  HOOK: "HOOK",
  KEY: "KEY",
  EGG: "EGG",
  DINOSAUR_EGG: "DINOSAUR_EGG",

  MAGNET: "MAGNET",
  LEAVES: "LEAVES",
  STICK: "STICK",
  FISHING_ROD: "FISHING_ROD",
  COIN: "COIN",

  // ✅ Fix: this was referenced in ITEM_DEFS but missing from ITEM
  ALPHAPARTICLE: "ALPHAPARTICLE",

  // ✅ New items
  MICROWAVE: "MICROWAVE",
  TIME_LEVER: "TIME_LEVER",
});

// -----------------------------------------------------------------------------
// Item definitions
// -----------------------------------------------------------------------------

/**
 * ItemDef shape:
 * {
 *   id: ITEM.*,
 *   name: "Printable Name",
 *   emoji: "🧲",
 *   synonyms: ["magnet", ...],  // used to build parser noun lookup
 *   examine: "Short description shown when EXAMINE/LOOK item",
 *   visible: true|false,        // should it appear in room listing
 *   portable: true|false,       // can TAKE pick it up
 * }
 */

const ITEM_DEFS = Object.freeze({
  [ITEM.WALL]: {
    id: ITEM.WALL,
    name: "Wall",
    emoji: "🧱",
    synonyms: ["wall"],
    examine: "A boring wall.",
    visible: true,
    portable: false,
    eatText: "WTF?",
    asciiTile: [
      "#########",
      "#########",
      "#########",
      "#########",
      "#########",
    ],
  },

  [ITEM.TEDDYBEAR]: {
    id: ITEM.TEDDYBEAR,
    name: "Teddybear",
    emoji: "🧸",
    synonyms: ["teddy", "bear", "ted"],
    examine: "A cute old Teddybear.",
    visible: true,
    portable: true,
    eatText: "Do you want fluff in your mouth?",
    asciiTile: [
      "  n___n  ",
      " {~._.~} ",
      "  ( Y )  ",
      " ()~*~() ",
      " (_)-(_) ",
    ],
  },

  [ITEM.CHICKEN]: {
    id: ITEM.CHICKEN,
    name: "Chicken",
    emoji: "🐔",
    synonyms: ["chicken", "chick", "chiccie", "hen", "bird"],
    examine: "A suspiciously alert chicken watches your every move.",
    visible: true,
    portable: true,
    eatText: "You don't want to eat little chiccie do you?",
    asciiTile: [
      "    ^.   ",
      "    Bc   ",
      " __/~\\__ ",
      "(((\\_/)))",
      "  _) (_  ",
    ],
  },

  [ITEM.CORN]: {
    id: ITEM.CORN,
    name: "Corn",
    emoji: "🌽",
    synonyms: ["corn", "cob"],
    examine: "A juicy corn on the cob.",
    visible: true,
    portable: true,
    eatText: "I think someone else would enjoy this more than you",
    asciiTile: [
      " ____    ",
      "(CORN)   ",
      "  -- -   ",
      " =  -    ",
      "         ",
    ],
  },

  [ITEM.DINOSAUR]: {
    id: ITEM.DINOSAUR,
    name: "Dinosaur",
    emoji: "🦖",
    synonyms: ["dinosaur", "dino", "trex"],
    examine: "A rather large beast from the distant past.",
    visible: true,
    portable: false,
    takeText: "That would be the last think you ever try to take",
    eatText: "Your stomach would explode",
    asciiTile: [
      "     ___ ",
      "    (_o \\",
      "   ^--/ |",
      " _/     /",
      "<_.||-|| ",
    ],
  },

  [ITEM.ALPHAPARTICLE]: {
    id: ITEM.ALPHAPARTICLE,
    name: "Alpha Particle",
    emoji: "⚛",
    synonyms: ["alpha", "helium", "he"],
    examine: "A highly ionising particle, also a Helium nucleus. (can cause mutations)",
    visible: true,
    portable: true,
    takeText: "Try hold it far away so you dont get ionised",
    eatText: "You should not have alpha particles inside your body",
    asciiTile: [
      " __A__   ",
      "(-) (+)  ",
      "{alpha}  ",
      "(+) (-)  ",
      " --_--   ",
    ],
  },

  [ITEM.GRATE]: {
    id: ITEM.GRATE,
    name: "Grate",
    emoji: "🕳️",
    synonyms: ["grate", "grating", "metal grate", "iron grate"],
    examine: "A heavy iron grate set into the ground. Something dark lies beneath.",
    visible: true,
    portable: false,
    eatText: "Your dentist would not like that",
    asciiTile: [
      "G R A T ",
      " E G R  ",
      "A T E G ",
      " R A T  ",
      "E G R A ",
    ],
  },

  [ITEM.LAMP]: {
    id: ITEM.LAMP,
    name: "Lamp",
    emoji: "🏮",
    synonyms: ["lamp", "lantern", "light"],
    examine: "An old lamp. It looks like it *might* still work.",
    visible: true,
    portable: true,
  },

  [ITEM.ROPE]: {
    id: ITEM.ROPE,
    name: "String",
    emoji: "🧵",
    synonyms: ["rope", "cord", "line", "string", "twine"],
    examine: "A length of string. Useful for tying things together.",
    visible: true,
    portable: true,
    asciiTile: [
      "   |\\    ",
      "   {     ",
      "   }     ",
      "  /      ",
      "         ",
    ],
  },

  [ITEM.HOOK]: {
    id: ITEM.HOOK,
    name: "Hook",
    emoji: "🪝",
    synonyms: ["hook", "peg"],
    examine: "A small metal hook. It could be attached to something.",
    visible: true,
    portable: true,
    asciiTile: [
      "   ^     ",
      "   \\     ",
      "   |     ",
      "   /     ",
      "         ",
    ],
  },

  [ITEM.KEY]: {
    id: ITEM.KEY,
    name: "Key",
    emoji: "🔑",
    synonyms: ["key", "small key", "brass key"],
    examine: "A small brass key with worn teeth.",
    visible: true,
    portable: true,
    asciiTile: [
      "  /-o\\   ",
      "  \\_ /   ",
      "  <|/    ",
      "  <|\\    ",
      "  <|/    ",
    ],
  },

  [ITEM.EGG]: {
    id: ITEM.EGG,
    name: "Egg",
    emoji: "🥚",
    synonyms: ["egg","chicken egg"],
    examine: "A fragile egg. Best handled gently. Maybe it will hatch?",
    visible: true,
    portable: true,
    eatText: "It sounds like it has a creature inside",
    asciiTile: [
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
    ],
  },
  [ITEM.DINOSAUR_EGG]: {
  id: ITEM.DINOSAUR_EGG,
  name: "Dino Egg", 
  emoji: "🥚", // visually different
  synonyms: ["dinosaur egg", "big egg", "strange egg", "egg"],
  examine: "A large egg with a leathery shell. Something prehistoric moves inside.",
  visible: true,
  portable: true,
  eatText: "That would crunch.",
  },

  [ITEM.MAGNET]: {
    id: ITEM.MAGNET,
    name: "Magnet",
    emoji: "🧲",
    synonyms: ["magnet"],
    examine: "A strong magnet. It tugs faintly toward metal objects.",
    visible: true,
    portable: true,
    asciiTile: [
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
    ],
  },

  [ITEM.LEAVES]: {
    id: ITEM.LEAVES,
    name: "Pile of Leaves",
    emoji: "🍂",
    synonyms: ["pile of leaves", "leaves", "leaf pile"],
    examine: "A messy pile of dry leaves. Something might be hidden under them.",
    visible: true,
    portable: false,
    eatText: "You can't eat that.",
  },

  [ITEM.STICK]: {
    id: ITEM.STICK,
    name: "Stick",
    emoji: "🪵",
    synonyms: ["stick", "branch", "wooden stick"],
    examine: "A sturdy stick. Straight enough to be useful.",
    visible: true,
    portable: true,
  },

  [ITEM.COIN]: {
    id: ITEM.COIN,
    name: "Coin",
    emoji: "💰",
    synonyms: ["coin", "money"],
    examine: "A coin.",
    visible: true,
    portable: true,
  },

  [ITEM.FISHING_ROD]: {
    id: ITEM.FISHING_ROD,
    name: "Fishing Rod",
    emoji: "🎣",
    synonyms: ["fishing rod", "rod"],
    examine: "A homemade fishing rod. Crude, but it should do the job.",
    visible: true,
    portable: true,
  },

  // ---------------- ✅ NEW: MICROWAVE ----------------
  [ITEM.MICROWAVE]: {
    id: ITEM.MICROWAVE,
    name: "Microwave",
    emoji: "📡",
    synonyms: ["microwave", "micro wave", "oven", "microwave oven"],
    examine: "A slightly greasy microwave. The door squeaks when you touch it. The buttons look tempting.",
    visible: true,
    portable: false,
    eatText: "Please don't try to eat a microwave.",
    // (optional) give it an ascii tile later; your renderer can handle missing tiles now
  },

  // ---------------- ✅ NEW: TIME MACHINE LEVER ----------------
  [ITEM.TIME_LEVER]: {
    id: ITEM.TIME_LEVER,
    name: "Time Machine Lever",
    emoji: "🕹️",
    synonyms: ["lever", "time lever", "time machine lever", "switch"],
    examine: "A chunky lever labelled: PAST ⟷ FUTURE. It hums quietly, like it wants to be pulled.",
    visible: true,
    portable: false,
    eatText: "Probably not edible. Also, what?",
  },
});

// -----------------------------------------------------------------------------
// Helper: build NOUN_SYNONYMS for your parser from ITEM_DEFS
// -----------------------------------------------------------------------------
function buildNounSynonymsFromItems(itemDefs = ITEM_DEFS) {
  const out = {};
  for (const def of Object.values(itemDefs)) {
    out[def.id] = [...(def.synonyms ?? [])];
  }
  return out;
}
