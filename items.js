// items.js
// Data-only item model: printable name, emoji, examine text, visibility + portability,
// plus small interaction hooks you can call from your action system.

// -----------------------------------------------------------------------------
// Canonical item IDs
// -----------------------------------------------------------------------------
const ITEM = Object.freeze({
  WALL: "WALL",
  WOOD_WALL: "WOOD_WALL",
  TREE: "TREE",
  CAMPFIRE: "CAMPFIRE",
  DOOR_CLOSED: "DOOR_CLOSED",
  DOOR_OPEN: "DOOR_OPEN",
  DOOR_LOCKED: "DOOR_LOCKED",
  TEDDYBEAR: "TEDDYBEAR",
  CHICKEN: "CHICKEN",
  CHICKEN_IN_WEB: "CHICKEN_IN_WEB",
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
  RIVER: "RIVER",
  RIVER_TILE: "RIVER_TILE",
  EMPTY_BOTTLE: "EMPTY_BOTTLE",
  WATER_BOTTLE: "WATER_BOTTLE",
  FISHING_ROD: "FISHING_ROD",
  COIN: "COIN",

  ALPHAPARTICLE: "ALPHAPARTICLE",

  MICROWAVE: "MICROWAVE",
  TIME_LEVER: "TIME_LEVER",

  MAGNET_STRING: "MAGNET_STRING",
  STRING_STICK: "STRING_STICK",
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
    visible: false,
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

  [ITEM.WOOD_WALL]: {
    id: ITEM.WOOD_WALL,
    name: "Wooden Wall",
    emoji: "🪵",
    synonyms: ["wood wall", "wooden wall", "planks", "timber wall"],
    examine: "Rough wooden planks lashed together into a sturdy wall.",
    visible: false,
    portable: false,
    asciiTile: [
      "||=|=|=||",
      "||=|=|=||",
      "||=|=|=||",
      "||=|=|=||",
      "||=|=|=||",
    ],
  },

  [ITEM.DOOR_LOCKED]: {
    id: ITEM.DOOR_LOCKED,
    name: "Locked Door",
    emoji: "🔒",
    synonyms: ["door", "locked door"],
    examine: "A locked door. The keyhole looks inviting.",
    visible: true,
    portable: false,
    asciiTile: [
      "|=======|",
      "||  _  ||",
      "|| |_| ||",
      "||  O  ||",
      "||_XXX_||",
    ],
  },

  [ITEM.DOOR_CLOSED]: {
    id: ITEM.DOOR_CLOSED,
    name: "Closed Door",
    emoji: "🚪",
    synonyms: ["door", "closed door"],
    examine: "A closed door set into the wall. It blocks the way.",
    visible: true,
    portable: false,
    asciiTile: [
   "|=======|",
   "||     ||",
   "||  _ O||",
   "|| |_| ||",
   "||_ _ _||",
    ],
  },

 [ITEM.DOOR_OPEN]: {
    id: ITEM.DOOR_OPEN,
    name: "Open Door",
    emoji: "🚪",
    synonyms: ["door", "open door"],
    examine: "A open door set into the wall.",
    visible: true,
    portable: false,
    asciiTile: [
   "|=======|",
   "||     ||",
   "||     ||",
   "||     ||",
   "||     ||",
    ],
  },


 [ITEM.TREE]: {
    id: ITEM.TREE,
    name: "Tree",
    emoji: "🌲",
    synonyms: ["tree"],
    examine: "A spooky tree",
    visible: false,
    portable: false,
    asciiTile: [
      "  /^^^\\  ",
      " /^^^^^\\ ",
      "/^^^|^^^\\",
      "   |||   ",
      "   |||   "
    ],
  },

 [ITEM.CAMPFIRE]: {
    id: ITEM.CAMPFIRE,
    name: "Campfire",
    emoji: "🔥",
    synonyms: ["campfire", "fire", "bonfire", "flames"],
    examine: "A roaring campfire crackles in the middle of the clearing, throwing orange light across the trees.",
    visible: true,
    portable: false,
    takeText: "It's far too hot to pick up.",
    asciiTile: [
      "   ( )   ",
      "  (   )  ",
      " (  ^  ) ",
      "  \\|||/  ",
      "   /_\\   ",
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

 [ITEM.CHICKEN_IN_WEB]: {
    id: ITEM.CHICKEN_IN_WEB,
    name: "Chicken In Web",
    emoji: "🐔",
    synonyms: [
      "chicken",
      "chick",
      "chiccie",
      "hen",
      "bird",
      "chicken in web",
      "chicken_in_web",
      "web chicken",
      "trapped chicken",
      "stuck chicken",
      "chicken in spider web",
    ],
    examine: "A poor chicken trapped by spider webs. The spiders next meal?",
    visible: true,
    portable: false,
    takeText: "The chicken is stuck fast in the web.",
    eatText: "That's the spiders food",
    asciiTile: [
      "    ^.   ",
      "    Bc   ",
      " __/~\\__ ",
      "(((\\_/)))",
      "  _) (_  ",
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
    examine: ({ state }) =>
      state?.flags?.grateKeyTaken
        ? "A heavy iron grate set into the ground. Whatever was glinting inside is gone."
        : "A heavy iron grate set into the ground. Something shiny glints inside.",
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
    synonyms: ["rope", "cord", "line", "string", "twine","web","webs"],
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
     "    ^    ",
     "    \\    ",
     "    |    ",
     "    /    ",
     "         "
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
     "   /-o\\  ",
     "   \\_ /  ",
     "   <|/   ",
     "   <|\\   ",
     "   <|/   "
   ]
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
     "   .-.   ",
     "  (   )  ",
     "   '-'   ",
     "         "
   ]
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
    asciiTile: [
     "         ",
     "   .-.   ",
     "  (   )  ",
     "   '-'   ",
     "         "
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
     "   ____  ",
     "  // \\\   ",
     "  (( ))  ",
     "  ^   ^  ",
     "  -   +  "
   ]
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
    asciiTile: [
     "     a l ",
     "  s v  e ",
     " ~  l~   ",
     "l~    v  ",
     "    e    "
   ]
  },

  [ITEM.STICK]: {
    id: ITEM.STICK,
    name: "Stick",
    emoji: "🪵",
    synonyms: ["stick", "branch", "wooden stick"],
    examine: "A sturdy stick. Straight enough to be useful.",
    visible: true,
    portable: true,
    asciiTile: [
     "    (|   ",
     "   -{]`  ",
     "    |}o  ",
     "    {]   ",
     "    /`   "
   ]
  },

  [ITEM.RIVER]: {
    id: ITEM.RIVER,
    name: "River",
    emoji: "🌊",
    synonyms: ["river", "water", "stream"],
    examine: "Cold, fast water rushes past the bank.",
    visible: true,
    portable: false,
    takeText: "You can't carry an entire river.",
    asciiTile: [
      "~~~~~~~~~",
      " ~~ ~~ ~~",
      "~~~~~~~~~",
      " ~~ ~~ ~~",
      "~~~~~~~~~",
    ],
  },

  [ITEM.RIVER_TILE]: {
    id: ITEM.RIVER_TILE,
    name: "River Water",
    emoji: "🌊",
    synonyms: [],
    examine: "Fast, cold water.",
    visible: false,
    portable: false,
    asciiTile: [
      "~~~~~~~~~",
      " ~~ ~~ ~~",
      "~~~~~~~~~",
      " ~~ ~~ ~~",
      "~~~~~~~~~",
    ],
  },

  [ITEM.EMPTY_BOTTLE]: {
    id: ITEM.EMPTY_BOTTLE,
    name: "Empty Bottle",
    emoji: "🧴",
    synonyms: ["empty bottle", "bottle", "glass bottle", "flask"],
    examine: "An empty bottle. Good for collecting liquids.",
    visible: true,
    portable: true,
    asciiTile: [
      "   ___   ",
      "  /   \\  ",
      "  |   |  ",
      "  |   |  ",
      "  \\___/  ",
    ],
  },

  [ITEM.WATER_BOTTLE]: {
    id: ITEM.WATER_BOTTLE,
    name: "Bottle of Water",
    emoji: "💧",
    synonyms: ["water bottle", "bottle of water", "full bottle"],
    examine: "A bottle filled with river water.",
    visible: true,
    portable: true,
    asciiTile: [
      "   ___   ",
      "  /~~~\\  ",
      "  |~~~|  ",
      "  |~~~|  ",
      "  \\___/  ",
    ],
  },

  [ITEM.COIN]: {
    id: ITEM.COIN,
    name: "Coin",
    emoji: "💰",
    synonyms: ["coin", "money"],
    examine: "A coin.",
    visible: true,
    portable: true,
    asciiTile: [
     "   ___   ",
     "  /   \\  ",
     " {  $  } ",
     "  \\   /  ",
     "   ---   "
   ]

  },

  [ITEM.FISHING_ROD]: {
    id: ITEM.FISHING_ROD,
    name: "Fishing Rod",
    emoji: "🎣",
    synonyms: ["fishing rod", "rod"],
    examine: "A homemade fishing rod. Crude, but it should do the job.",
    visible: true,
    portable: true,

      asciiTile: [
     
     "     0   ",
     "    / \\  ",
     "   {   \\ ",
     "  /     U",
     " }       "
   ]

  },

// ✅ Add these 2 defs into ITEM_DEFS (anywhere sensible)

  // ---------------- ✅ INTERMEDIATE: MAGNET ON STRING ----------------
  [ITEM.MAGNET_STRING]: {
    id: ITEM.MAGNET_STRING,
    name: "Magnet on a String",
    emoji: "🧲",
    synonyms: [
      "string",
      "magnet",
      "magnet string",
      "magnet on string",
      "magnet-on-a-string",
      "magnet tied to string",
      "string with magnet",
      "magnet rope",
      "magnet line",
    ],
    examine: "A magnet tied securely to a length of string. It dangles ominously.",
    visible: true,
    portable: true,
    eatText: "That seems like a very bad idea.",
    asciiTile: [
      "   ____  ",
      "  // \\\\  ",
      "  (( ))  ",
      "   ||    ",
      "   {}    ",
    ],
  },

  // ---------------- ✅ INTERMEDIATE: STRING ON STICK ----------------
  [ITEM.STRING_STICK]: {
    id: ITEM.STRING_STICK,
    name: "String on a Stick",
    emoji: "🪵",
    synonyms: [
      "stick",
      "string stick",
      "string on stick",
      "string-on-a-stick",
      "stick with string",
      "stick tied to string",
      "rod base",
      "unfinished rod",
    ],
    examine: "A stick with string tied to it. It feels like it’s missing something important on the end.",
    visible: true,
    portable: true,
    eatText: "It's mostly wood and regret.",
    asciiTile: [
      "    (|   ",
      "   -{|   ",
      "    |}   ",
      "    |    ",
      "   /     ",
    ],
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
