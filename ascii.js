//console.log("hello")

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

"teddybear" : [
 "  n___n  ",
 " {~._.~} ",
 "  ( Y )  ",
 " ()~*~() ",
 " (_)-(_) "
],
"chicken" : [
 "    ^.   ",
 "    Bc   ",
 " __/~\\__ ",
 "(((\\_/)))",
 "  _) (_  ",
]
};

const tileheight = 5;
const tilewidth = 9;

const gridsize = 7;

var gridstring = ""

// --------- NEW: safe ascii tile helpers ---------

function logNoAsciiTile(itemDefOrId) {
  const name =
    (itemDefOrId && typeof itemDefOrId === "object" && itemDefOrId.name)
      ? itemDefOrId.name
      : String(itemDefOrId);

  console.log(`%cNo Ascii Map for Tile: ${name}`, "color: red; font-weight: bold;");
}

function isValidAsciiTile(tile) {
  return (
    Array.isArray(tile) &&
    tile.length >= tileheight &&
    tile.every(line => typeof line === "string")
  );
}

function safeAsciiTileForItem(itemId, itemDef) {
  const tile = itemDef?.asciiTile;
  if (isValidAsciiTile(tile)) return tile;

  logNoAsciiTile(itemDef || itemId);

  // Fallback (pick one):
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
  let newtiles = intialise_tilegrid()

  // Safe wall borders (in case WALL has no asciiTile)
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
        const safeTile = isValidAsciiTile(tile) ? tile : default_tiles["randomchar"]
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
