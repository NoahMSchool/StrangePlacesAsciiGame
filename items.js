// items.js
// Data-only item model: printable name, emoji, examine text, visibility + portability,
// plus small interaction hooks you can call from your action system.

// -----------------------------------------------------------------------------
// Canonical item IDs
// -----------------------------------------------------------------------------
const ITEM = Object.freeze({
  WALL: "WALL",
  WOOD_WALL: "WOOD_WALL",
  FORCE_FIELD: "FORCE_FIELD",
  TREE: "TREE",
  CAMPFIRE: "CAMPFIRE",
  CAMPFIRE_OUT: "CAMPFIRE_OUT",
  DOOR_CLOSED: "DOOR_CLOSED",
  DOOR_OPEN: "DOOR_OPEN",
  DOOR_LOCKED: "DOOR_LOCKED",
  NOTE: "NOTE",
  INSTRUCTIONS_POSTER: "INSTRUCTIONS_POSTER",
  SHIPWRECK: "SHIPWRECK",
  CAPTIAN_HOOK_PAINTING: "CAPTIAN_HOOK_PAINTING",
  BED: "BED",
  STRANGE_PLACES_BOOK: "STRANGE_PLACES_BOOK",
  SIGN: "SIGN",
  OIL_DRUM: "OIL_DRUM",
  FRIDGE: "FRIDGE",
  MEDAL: "MEDAL",
  HEALTH_INSPECTOR: "HEALTH_INSPECTOR",
  EINSTEIN_BARMAN: "EINSTEIN_BARMAN",
  TEDDYBEAR: "TEDDYBEAR",
  CHICKEN: "CHICKEN",
  CHICKEN_IN_WEB: "CHICKEN_IN_WEB",
  DINOSAUR: "DINOSAUR",
  GRATE: "GRATE",
  SEED: "SEED",
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
  EMPTY_BUCKET: "EMPTY_BUCKET",
  WATER_BUCKET: "WATER_BUCKET",
  FISHING_ROD: "FISHING_ROD",
  COIN: "COIN",

  ALPHAPARTICLE: "ALPHAPARTICLE",

  MICROWAVE: "MICROWAVE",
  TIME_LEVER: "TIME_LEVER",

  MAGNET_STRING: "MAGNET_STRING",
  STRING_STICK: "STRING_STICK",
});

const ITEM_DEF_MAP_COLORS = Object.freeze({
  WALL: "#6b7280",
  WOOD_WALL: "#8b5a2b",
  FORCE_FIELD: "#8b5cf6",
  TREE: "#1f6f3f",
  CAMPFIRE: "#ff8a00",
  CAMPFIRE_OUT: "#7c7f87",
  DOOR_CLOSED: "#c07a2f",
  DOOR_OPEN: "#d9a066",
  DOOR_LOCKED: "#b6b6c2",
  NOTE: "#8b7a35",
  INSTRUCTIONS_POSTER: "#6b4f2f",
  SHIPWRECK: "#7a5334",
  CAPTIAN_HOOK_PAINTING: "#5b3f2e",
  BED: "#8ea5b8",
  STRANGE_PLACES_BOOK: "#b3364a",
  SIGN: "#7a5a1f",
  OIL_DRUM: "#3b3f46",
  FRIDGE: "#4f86a9",
  MEDAL: "#a77c22",
  HEALTH_INSPECTOR: "#8a6a00",
  EINSTEIN_BARMAN: "#6c4a2d",
  TEDDYBEAR: "#c58b6f",
  CHICKEN: "#d62828",
  CHICKEN_IN_WEB: "#6f7680",
  DINOSAUR: "#7bc96f",
  GRATE: "#9ca3af",
  SEED: "#6f5a2f",
  CORN: "#b8860b",
  LAMP: "#f4b860",
  ROPE: "#8a5a2b",
  HOOK: "#5f646b",
  KEY: "#8a6a00",
  EGG: "#9f8f67",
  DINOSAUR_EGG: "#6f8f52",
  MAGNET: "#ef4444",
  LEAVES: "#7aa35a",
  STICK: "#b17a50",
  RIVER: "#4da3ff",
  RIVER_TILE: "#4da3ff",
  EMPTY_BUCKET: "#5e89a5",
  WATER_BUCKET: "#60a5fa",
  FISHING_ROD: "#c98c58",
  COIN: "#f2c94c",
  ALPHAPARTICLE: "#b388ff",
  MICROWAVE: "#a0a0a0",
  TIME_LEVER: "#f472b6",
  MAGNET_STRING: "#e57373",
  STRING_STICK: "#c08a5a",
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

const ITEM_DEFS_BASE = {
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

  [ITEM.FORCE_FIELD]: {
    id: ITEM.FORCE_FIELD,
    name: "Force Field",
    emoji: "🌀",
    synonyms: ["force field", "field", "energy wall", "blue wall"],
    examine: "A humming wall of purple circular energy.",
    visible: false,
    portable: false,
    asciiTile: [
      "oOoOoOoOo",
      "OoOoOoOoO",
      "oOoOoOoOo",
      "OoOoOoOoO",
      "oOoOoOoOo",
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

  [ITEM.NOTE]: {
    id: ITEM.NOTE,
    name: "Note",
    emoji: "📝",
    synonyms: ["note", "paper", "letter"],
    examine:
      "The note reads: \"We are leaving this cottage. The walls whisper after dark and the paths do not stay put. If you find this, do not sleep here.\"",
    visible: true,
    portable: true,
    asciiTile: [
      " _______ ",
      "|\\  *  /|",
      "| \\___/ |",
      "|  ---  |",
      "|_______|",
    ],
  },

  [ITEM.INSTRUCTIONS_POSTER]: {
    id: ITEM.INSTRUCTIONS_POSTER,
    name: "Instructions Poster",
    emoji: "📜",
    synonyms: ["poster", "instructions", "instructions poster", "sign"],
    examine: "It reads: \"PULL BACK and PUSH FORWARD\"",
    visible: true,
    portable: false,
    asciiTile: [
      " +-----+ ",
      " |PUSH | ",
      " | /\\  | ",
      " | \\/  | ",
      " +-----+ ",
    ],
  },

  [ITEM.SHIPWRECK]: {
    id: ITEM.SHIPWRECK,
    name: "Shipwreck",
    emoji: "⛵",
    synonyms: ["shipwreck", "wreck", "boat", "ship", "hull"],
    examine: "A shattered wooden shipwreck, impossibly stranded among the trees.",
    visible: true,
    portable: false,
    asciiTile: [
      " __/\\__  ",
      "/_/__\\_\\ ",
      "\\\\_||_// ",
      " /_||_\\  ",
      "    ||   ",
    ],
  },

  [ITEM.CAPTIAN_HOOK_PAINTING]: {
    id: ITEM.CAPTIAN_HOOK_PAINTING,
    name: "Painting",
    emoji: "🖼️",
    synonyms: ["painting", "captian hook", "captain hook", "portrait", "picture"],
    examine: ({ room, isInRoom, isInInventory }) => {
      const hookAlreadyFound = isInRoom?.(ITEM.HOOK) || isInInventory?.(ITEM.HOOK);
      if (!hookAlreadyFound && room && window.GameCore?.addToRoomAtRandomInterior) {
        window.GameCore.addToRoomAtRandomInterior(room, ITEM.HOOK);
        window.Sound?.playSfx?.("Audio/recipes/freesound_community-hook_sound-37232.mp3");
        return "The painting shows Captian Hook glaring into the distance. One hook is real and falls to the ground.";
      }
      return "The painting shows Captian Hook glaring into the distance. The frame has already been picked clean.";
    },
    visible: true,
    portable: false,
    asciiTile: [
      " +-----+ ",
      " |  C  | ",
      " | /)  | ",
      " | /   | ",
      " +-----+ ",
    ],
  },

 [ITEM.BED]: {
    id: ITEM.BED,
    name: "Bed",
    emoji: "🛏️",
    synonyms: [
      "bed",
      "cot",
      "mattress",
      "under bed",
      "under the bed",
      "beneath bed",
      "beneath the bed",
    ],
    examine: "A wooden bedframe with a thin mattress. Something is tucked underneath.",
    visible: true,
    portable: false,
    asciiTile: [
      "_________",
      "|=======|",
      "|  ___  |",
      "|_|___|_|",
      "  | | |  ",
    ],
  },

 [ITEM.STRANGE_PLACES_BOOK]: {
    id: ITEM.STRANGE_PLACES_BOOK,
    name: "Strange Places",
    emoji: "📕",
    synonyms: ["book", "strange places", "red book", "journal"],
    examine: "A worn book titled \"Strange Places\". Many pages are dog-eared and damp.",
    visible: true,
    portable: true,
    asciiTile: [
      " _______ ",
      "/|=====|\\",
      "||     ||",
      "||_____/|",
      "\\_______/",
    ],
  },

 [ITEM.SIGN]: {
    id: ITEM.SIGN,
    name: "Sign",
    emoji: "🪧",
    synonyms: ["sign", "warning sign", "board"],
    examine: "The sign reads: \"No fishing. It is not grate.\"",
    visible: true,
    portable: false,
    asciiTile: [
      " _______ ",
      "| NO F. |",
      "|NOT    |",
      "|GRATE  |",
      "   ||    ",
    ],
  },

 [ITEM.OIL_DRUM]: {
    id: ITEM.OIL_DRUM,
    name: "Oil Drum",
    emoji: "🛢️",
    synonyms: ["oil drum", "drum", "barrel", "oil"],
    examine: "A heavy metal drum with black residue around the cap.",
    visible: true,
    portable: false,
    asciiTile: [
      "  _____  ",
      " /=====\\ ",
      "|  OIL  |",
      "|       |",
      " \\_____/ ",
    ],
  },

 [ITEM.FRIDGE]: {
    id: ITEM.FRIDGE,
    name: "Fridge",
    emoji: "🧊",
    synonyms: ["fridge", "refrigerator"],
    examine: "An old humming fridge. A fridge magnet is stuck to the door, and something bucket-shaped rattles inside.",
    visible: true,
    portable: false,
    asciiTile: [
      " _______ ",
      "| _____ |",
      "||     ||",
      "||  o  ||",
      "||_____||",
    ],
  },

 [ITEM.MEDAL]: {
    id: ITEM.MEDAL,
    name: "Medal",
    emoji: "🏅",
    synonyms: ["medal", "plaque", "inscription"],
    examine: "Congratulations on getting this far and thanks for playing! If you'd like more strange rooms and strange puzzles, please let me know in the Itch comments",
    visible: true,
    portable: true,
    asciiTile: [
      "   .-.   ",
      "  ( * )  ",
      "   `-'   ",
      "   /|\\   ",
      "   \\|/   ",
    ],
  },

  [ITEM.HEALTH_INSPECTOR]: {
    id: ITEM.HEALTH_INSPECTOR,
    name: "Health and Safety Inspector",
    emoji: "🦺",
    synonyms: ["inspector", "health inspector", "safety inspector", "health and safety inspector"],
    examine: ({ state }) =>
      state?.flags?.fireOut
        ? "The inspector gives you an approving nod. \"Fire's out. You're good to proceed.\""
        : "A stern inspector with a clipboard. He keeps pointing at your open fire.",
    visible: true,
    portable: false,
    asciiTile: [
      "   ___   ",
      "  (o o)  ",
      "  /|_|\\  ",
      "   / \\   ",
      "  _| |_  ",
    ],
  },

  [ITEM.EINSTEIN_BARMAN]: {
    id: ITEM.EINSTEIN_BARMAN,
    name: "Einstein Barman",
    emoji: "🧪",
    synonyms: ["einstein", "barman", "einstein barman", "bartender"],
    examine: "A wild-haired barman in a stained apron, muttering equations over empty glasses.",
    visible: true,
    portable: false,
    asciiTile: [
      "   /^^\\  ",
      "  (o  o) ",
      "  / || \\ ",
      "   /  \\  ",
      "  _|==|_ ",
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
      "   /^\\   ",
      "  /^^^\\  ",
      " /^ | ^\\ ",
      "/ ^   ^ \\",
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

 [ITEM.CAMPFIRE_OUT]: {
    id: ITEM.CAMPFIRE_OUT,
    name: "Doused Campfire",
    emoji: "🪵",
    synonyms: ["doused fire", "out fire", "embers", "ashes"],
    examine: "Wet ash and smoking wood. The fire is out.",
    visible: true,
    portable: false,
    asciiTile: [
      "  .---.  ",
      " (_____) ",
      "  /___\\  ",
      "  _|||_  ",
      "   |||   ",
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
      "chicken in web",
      "chicken_in_web",
      "web chicken",
      "trapped chicken",
      "stuck chicken",
      "chicken in spider web",
      "web"
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
      "G R A T  ",
      " E G R   ",
      "A T E G  ",
      " R A T   ",
      "E G R A  ",
    ],
  },

  [ITEM.SEED]: {
    id: ITEM.SEED,
    name: "Seed",
    emoji: "🌱",
    synonyms: ["seed", "planted seed"],
    examine: "A tiny seed is planted in the soil. It looks like it could become corn... but only after a lot of time.",
    visible: true,
    portable: false,
    asciiTile: [
      "         ",
      "    .    ",
      "   /|\\   ",
      "    |    ",
      "         ",
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
      "   /\\    ",
      "   ||    ",
      "   ||    ",
      "   ||    ",
      "   \\/    ",
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
     "    __   ",
     "   |  |  ",
     "   |  |  ",
     "   |  |_ ",
     "    \\__/ ",
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
     "   .--.  ",
     "  (o==)  ",
     "   ||==  ",
     "   ||==  ",
     "   ||==  "
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

  [ITEM.EMPTY_BUCKET]: {
    id: ITEM.EMPTY_BUCKET,
    name: "Empty Bucket",
    emoji: "🪣",
    synonyms: ["empty bucket", "bucket", "pail", "empty bottle", "bottle"],
    examine: "An empty bucket. Good for collecting liquids.",
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

  [ITEM.WATER_BUCKET]: {
    id: ITEM.WATER_BUCKET,
    name: "Water Bucket",
    emoji: "🪣",
    synonyms: ["water bucket", "bucket of water", "full bucket", "water", "water bottle"],
    examine: "A bucket filled with river water.",
    visible: true,
    portable: true,
    asciiTile: [
      "  _____  ",
      " /~~~~~\\ ",
      "|~~~~~~~|",
      "|~~~~~~~|",
      " \\_____/ ",
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

  // ---------------- ✅ INTERMEDIATE: HOOK ON STRING ----------------
  [ITEM.MAGNET_STRING]: {
    id: ITEM.MAGNET_STRING,
    name: "Hook on a String",
    emoji: "🧲",
    synonyms: [
      "string",
      "hook",
      "hook string",
      "hook on string",
      "hook-on-a-string",
      "hook tied to string",
      "string with hook",
      "hook rope",
      "hook line",
    ],
    examine: "A hook tied securely to a length of string. It dangles ominously.",
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
    asciiTile: [
      "    |    ",
      "    |\\   ",
      "    | \\  ",
      "   /___\\ ",
      "  _|___|_",
    ],
  },
};

for (const [id, def] of Object.entries(ITEM_DEFS_BASE)) {
  if (!def || typeof def !== "object") continue;
  if (!def.mapColor && ITEM_DEF_MAP_COLORS[id]) {
    def.mapColor = ITEM_DEF_MAP_COLORS[id];
  }
}

const ITEM_DEFS = Object.freeze(
  Object.fromEntries(
    Object.entries(ITEM_DEFS_BASE).map(([id, def]) => [id, Object.freeze(def)])
  )
);

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
