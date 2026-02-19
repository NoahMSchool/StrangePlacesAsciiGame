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
  MAGNET: "MAGNET",
  LEAVES: "LEAVES",
  STICK: "STICK",
  FISHING_ROD: "FISHING_ROD",
  COIN: "COIN",
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
 *
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
    ]
  },
  [ITEM.TEDDYBEAR] : {
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
     " (_)-(_) "
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
    ]
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
     " ____  ",
     "(CORN) ",
     "  -- -   ",
     " =  -  ",
     "       "
   ]
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
     "<_.||-|| "
   ]
  },

  [ITEM.ALPHAPARTICLE]: {
    id: ITEM.ALPHAPARTICLE,
    name: "Alpha Particle",
    emoji: "⚛",
    synonyms: ["alpha", "Helium", "He"],
    examine: "A highly ionising particle, also a Helium neucleus. (can cause mutations)",
    visible: true,
    portable: true,
    takeText: "Try hold it far away so you dont get ionised",
    eatText: "You should not have alpha particles inside your body",
    asciiTile: [
     " __A__ ",
     "(-) (+)",
     "{alpha}",
     "(+) (-)",
     " --_-- "
   ]
  },


  [ITEM.GRATE]: {
    id: ITEM.GRATE,
    name: "Grate",
    emoji: "🕳️",
    synonyms: ["grate", "grating", "metal grate", "iron grate"],
    examine: "A heavy iron grate set into the ground. Something dark lies beneath.",
    visible: true,     // you can toggle this via the leaves interaction
    portable: false,
    eatText: "Your dentist would not like that",
    asciiTile: [
     "G R A T",
     " E G R ",
     "A T E G",
     " R A T ",
     "E G R A"
   ]
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
    // Keep rope synonyms so existing parser works, but add "string" too.
    synonyms: ["rope", "cord", "line", "string", "twine"],
    examine: "A length of string. Useful for tying things together.",
    visible: true,
    portable: true,
    asciiTile: [
     "   |\\  ",
     "   {   ",
     "   }   ",
     "  /    ",
     "       "
   ]
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
     "   ^   ",
     "   \\   ",
     "   |   ",
     "   /   ",
     "       "
   ]
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
     "  /-o\\ ",
     "  \\_ / ",
     "  <|/  ",
     "  <|\\  ",
     "  <|/  "
   ]
  },

  [ITEM.EGG]: {
    id: ITEM.EGG,
    name: "Egg",
    emoji: "🥚",
    synonyms: ["egg"],
    examine: "A fragile egg. Best handled gently. Maybe it will hatch?",
    visible: true,
    portable: true,
    eatText: "It sounds like it has a creature inside",
    asciiTile: [
     "       ",
     "       ",
     "       ",
     "       ",
     "       "
   ]

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
     "       ",
     "       ",
     "       ",
     "       ",
     "       "
   ]
  },

  // ---- Example: leaves you can push to reveal a grate ----
  [ITEM.LEAVES]: {
    id: ITEM.LEAVES,
    name: "Pile of Leaves",
    emoji: "🍂",
    synonyms: ["pile of leaves", "leaves", "leaf pile"],
    examine: "A messy pile of dry leaves. Something might be hidden under them.",
    visible: true,
    portable: false,
  },

  // ---- Needed for magnet + string + stick = fishing rod ----
  [ITEM.STICK]: {
    id: ITEM.STICK,
    name: "Stick",
    emoji: "🪵",
    synonyms: ["stick", "branch", "wooden stick"],
    examine: "A sturdy stick. Straight enough to be useful.",
    visible: true,
    portable: true,
  },

  // ---- Needed for magnet + string + stick = fishing rod ----
  [ITEM.COIN]: {
    id: ITEM.COIN,
    name: "Coin",
    emoji: "💰",
    synonyms: ["money"],
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

/*
window.ITEM = ITEM;
window.ITEM_DEFS = ITEM_DEFS;
window.buildNounSynonymsFromItems = buildNounSynonymsFromItems;
*/

