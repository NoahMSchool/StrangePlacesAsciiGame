
//function start() {
  // body...
//}

console.log("hello")

const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const filler_characters = ["-", "=", "/", ";", ":", ",", "~", ".", ","];

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


class TileGrid{
  constructor(gridsize){
    this.gridsize = gridsize;
    this.tiles = [];

    for (var i = gridsize - 1; i >= 0; i--) {
      var current_row = []
      for (var j = gridsize - 1; j >= 0; j--) {
        let keys = Object.keys(default_tiles);
        let randomKey = keys[Math.floor(Math.random() * keys.length)];
        current_row.push(default_tiles[randomKey])
      }
      this.tiles.push(current_row)
    }
    console.log(this.tiles)
  }

  get_grid_display(){
    var tilelist = this.tiles
    var string = "";

    //console.log(tilelist);
    for (var rownum = 0; rownum < tilelist.length; rownum++) {
      //console.log(tilelist[row])
      for (var i = 0; i <tileheight; i++) {
        for (var columnnum = 0;columnnum<tilelist[rownum].length;columnnum++){
          string += tilelist[rownum][columnnum][i]

          //console.log(row[column][i]);
        }
          string+="\n"
      }
    }
    console.log("hellothere")
    console.log(string)
    return string
  }
}


class Player{
  constructor(name){
    this.name = name;
    this.items = ["nothing"];
    this.display_tile = "";
  };

  get_display_tile(){
    return this.display_tile;
  }
}

class item{
  constructor(item_name){
    this.item_name = item_name;
  }
}

var map = new TileGrid(7)
document.getElementById("asciiOutput").textContent = map.get_grid_display();

