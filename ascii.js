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

function intialise_tilegrid(){
  let tiles = []
    for (var i = gridsize - 1; i >= 0; i--) {
      var current_row = []
      for (var j = gridsize - 1; j >= 0; j--) {
        //let keys = Object.keys(default_tiles);
        //let randomKey = keys[Math.floor(Math.random() * keys.length)];
        current_row.push(default_tiles["blank"])
      }
      tiles.push(current_row)
    }
    // console.log(tiles)
    return tiles
}
function grid_to_room(room){
  let newtiles = intialise_tilegrid()
  if (true) {
    for (var i = 0; i < (gridsize); i++) {
        newtiles[i][0] = ITEM_DEFS.WALL.asciiTile
        newtiles[i][gridsize-1] = ITEM_DEFS.WALL.asciiTile
        newtiles[0][i] = ITEM_DEFS.WALL.asciiTile
        newtiles[gridsize-1][i] = ITEM_DEFS.WALL.asciiTile
    }
  }
  for (var i = 0; i < room.items.length; i++) {
    let item_coord = room.items[i]
    let roomrow = item_coord[1][1]//[0]
    let roomcolumn = item_coord[1][0]
    let item = ITEM_DEFS[item_coord[0]]
    let item_ascii = item.asciiTile
    newtiles[roomrow][roomcolumn] = item_ascii
  }
  return newtiles
}

function get_grid_display(gridtiles){
  let string = ""
    for (var rownum = 0; rownum < gridtiles.length; rownum++) {
      for (var i = 0; i <tileheight; i++) {
        for (var columnnum = 0;columnnum<gridtiles[rownum].length;columnnum++){
          string += gridtiles[rownum][columnnum][i].slice(0,tilewidth)
        }
          string+="\n"
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
      };
    }
    return newstring
}

function getRoomTile(room = ROOM_DEFS.NOAHROOM) {
  gridtiles = grid_to_room(room)
  return get_grid_display(gridtiles)
}



