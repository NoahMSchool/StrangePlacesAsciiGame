
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const filler_characters = ["-", "=", "/", ";", ":", ",", "~", ".", ","," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "];
const wall_characters = ["|","|","#","#","|","|","!","#",":","{","}","[","]","\\","/","(",")",]
const fire_characters = ["/","/","/","\\","\\","\\","`", "#", "*", "^", " ", " ", " ", " ", " "]

const default_tiles = {
"wall" : [
 "#########",
 "#########",
 "#########",
 "#########",
 "#########",
],
"blank" : [
"         ",
"         ",
"         ",
"         ",
"         ",
],
"randomchar" : [
"?????????",
"?????????",
"?????????",
"?????????",
"?????????"
],
"randomletter" : [
"&&&&&&&&&",
"&&&&&&&&&",
"&&&&&&&&&",
"&&&&&&&&&",
"&&&&&&&&&"
],

"fire" : [
"/////////",
"/////////",
"/////////",
"/////////",
"/////////"
],

};

const tileheight = 5;
const tilewidth = 9;

const gridsize = 7;

var gridstring = ""

// ---------- NEW: one-time warning tracking ----------
const _warnedMissingAscii = new Set();
const _warnedBadSizeAscii = new Set();

function _itemWarnKey(itemDefOrId) {
  if (itemDefOrId && typeof itemDefOrId === "object") {
    // Prefer stable identifiers if present
    return itemDefOrId.id || itemDefOrId.key || itemDefOrId.name || JSON.stringify(itemDefOrId);
  }
  return String(itemDefOrId);
}

// ---------- NEW: safe ascii tile helpers ----------

function logNoAsciiTileOnce(itemDefOrId) {
  const key = _itemWarnKey(itemDefOrId);
  if (_warnedMissingAscii.has(key)) return;
  _warnedMissingAscii.add(key);

  const name =
    (itemDefOrId && typeof itemDefOrId === "object" && itemDefOrId.name)
      ? itemDefOrId.name
      : String(itemDefOrId);

  console.log(`%cNo Ascii Map for Tile: ${name}`, "color: red; font-weight: bold;");
}

function logWrongAsciiSizeOnce(itemDefOrId, width, height) {
  const key = _itemWarnKey(itemDefOrId);
  if (_warnedBadSizeAscii.has(key)) return;
  _warnedBadSizeAscii.add(key);

  const name =
    (itemDefOrId && typeof itemDefOrId === "object" && itemDefOrId.name)
      ? itemDefOrId.name
      : String(itemDefOrId);

  console.log(
    `%cAscii Tile Wrong Size for: ${name} (got ${width}x${height}, expected ${tilewidth}x${tileheight})`,
    "color: orange; font-weight: bold;"
  );
}

function isValidAsciiTile(tile, itemDefOrId) {
  if (!Array.isArray(tile)) return false;

  const height = tile.length;

  // Height check
  if (height !== tileheight) {
    const widthGuess = (typeof tile[0] === "string") ? tile[0].length : 0;
    logWrongAsciiSizeOnce(itemDefOrId, widthGuess, height);
    return false;
  }

  // Width + row type checks
  for (let r = 0; r < tileheight; r++) {
    const row = tile[r];
    if (typeof row !== "string") {
      logWrongAsciiSizeOnce(itemDefOrId, 0, height);
      return false;
    }
    if (row.length !== tilewidth) {
      logWrongAsciiSizeOnce(itemDefOrId, row.length, height);
      return false;
    }
  }

  return true;
}

function safeAsciiTileForItem(itemId, itemDef) {
  const tile = itemDef?.asciiTile;

  if (isValidAsciiTile(tile, itemDef || itemId)) return tile;

  // Missing entirely -> red (once)
  if (!tile) logNoAsciiTileOnce(itemDef || itemId);

  // Wrong size -> orange already logged (once) by isValidAsciiTile

  // Fallback: choose what you prefer:
  // return default_tiles["blank"];
  return default_tiles["randomchar"];
}

// -----------------------------------------------

function intialise_tilegrid(){
  let tiles = []
  for (var i = gridsize - 1; i >= 0; i--) {
    var current_row = []
    for (var j = gridsize - 1; j >= 0; j--) {
      current_row.push(default_tiles["blank"])
    }
    tiles.push(current_row)
  }
  return tiles
}

function grid_to_room(room){
  console.log("%cExits", "color: green; font-weight: bold;", room.exits);

  let newtiles = intialise_tilegrid()

  // Safe wall borders (in case WALL has no asciiTile or wrong size)
  const wallTile = safeAsciiTileForItem("WALL", ITEM_DEFS.WALL);

  for (var i = 0; i < gridsize; i++) {
    newtiles[i][0] = wallTile
    newtiles[i][gridsize-1] = wallTile
    newtiles[0][i] = wallTile
    newtiles[gridsize-1][i] = wallTile
  }

  for (var i = 0; i < (room.items?.length || 0); i++) {
    let item_coord = room.items[i]

    // Expect [ITEM_ID, [x,y]]; if not, skip safely
    if (!Array.isArray(item_coord) || !Array.isArray(item_coord[1]) || item_coord[1].length < 2) {
      continue;
    }

    let roomrow = item_coord[1][1]
    let roomcolumn = item_coord[1][0]

    // Bounds check
    if (
      typeof roomrow !== "number" || typeof roomcolumn !== "number" ||
      roomrow < 0 || roomrow >= gridsize ||
      roomcolumn < 0 || roomcolumn >= gridsize
    ) {
      continue;
    }

    let itemId = item_coord[0]
    let item = ITEM_DEFS[itemId]
    let item_ascii = safeAsciiTileForItem(itemId, item)

    newtiles[roomrow][roomcolumn] = item_ascii
  }

  return newtiles
}

function get_grid_display(gridtiles){
  let string = ""
  for (var rownum = 0; rownum < gridtiles.length; rownum++) {
    for (var i = 0; i < tileheight; i++) {
      for (var columnnum = 0; columnnum < gridtiles[rownum].length; columnnum++){
        const tile = gridtiles[rownum][columnnum]
        const safeTile = isValidAsciiTile(tile, "UNKNOWN_TILE") ? tile : default_tiles["randomchar"]
        string += safeTile[i].slice(0, tilewidth)
      }
      string += "\n"
    }
  }

  let newstring = ""
  for (var i = 0; i < string.length; i++){
    if (string[i] == "?") {
      newstring += filler_characters[Math.floor(Math.random()*filler_characters.length)];
    }
    else if (string[i] == "&") {
      newstring += alphabet[Math.floor(Math.random()*alphabet.length)];
    }
    else if (string[i] == "#") {
      newstring += wall_characters[Math.floor(Math.random()*wall_characters.length)];
    }
    else{
      newstring += string[i]
    }
  }
  return newstring
}

function getRoomTile(room = ROOM_DEFS.NOAHROOM) {
  gridtiles = grid_to_room(room)
  return get_grid_display(gridtiles)
}
