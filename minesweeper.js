var board = [];
var rows = 16;
var columns = 24;

var minesCount = 70;
var victoryCondition = rows * columns - minesCount
var minesLocations = [];
var matrixTrue = [];

var tilesClicked = 0;
var flagEnabled = false;
var firstCellClicked = false;

var gameOver = false;
var defaultBackgroundColor = "rgb(20, 20, 20)";
var defaultColor = "white";
var fullColor = "rgb(251, 146, 155)";
var overflowBackgroundColor = "red";
var overflowColor = "yellow";

window.onload = function() {
    screen.orientation.lock();
    let smallestSide = window.outerHeight;

    if(window.outerWidth < window.outerHeight) {
        rows = 24;
        columns = 16;
        smallestSide = window.outerWidth;
    }
    let cellLength = Math.min(Math.floor((smallestSide - 20) / 16) - 2, 38);
    let htmlBoard = document.getElementById("board");
    htmlBoard.style.setProperty('--cell-length', cellLength.toString() + "px");
    htmlBoard.style.setProperty('width', ((cellLength + 2)*columns).toString() + "px");
    htmlBoard.style.setProperty('height', ((cellLength + 2)*rows).toString() + "px");
    htmlBoard.style.setProperty('--cell-length', cellLength.toString() + "px");
    let test = getComputedStyle(htmlBoard).getPropertyValue('--cell-length')
    startGame();
}

// Take coordinates of 3-8 neighbor cells
function neighborCells(row, elem, matrix){
    ans = [];
    width = matrix.length;
    height = matrix[0].length;
    for(let i = -1; i <= 1; i++) {
        for(let j = -1; j <= 1; j++) {
            if(row + i >= 0 && row + i < width && elem + j >= 0 && elem + j < height && !(i === 0 && j === 0)){
                ans.push([row+i, elem+j])
            }
        }
    }
    return ans
}

function sum(matrix){
    ans = 0;
    for(let i = 0; i < matrix.length; i++) ans += matrix[i]
    return ans
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}       

// create the true matrix of the game after the first cell is revealed
function makeMatrix(matrix, minesCount, coordinates) {
    
    candidates = Array.from(Array(rows * columns).keys());
    // initialSquare = coordinates[0] * columns + coordinates[1];
    
    
    // candidates = candidates.filter(item => item !== initialSquare);
    neighbors = neighborCells(coordinates[0], coordinates[1], matrix)
    neighbors.push(coordinates)
    for(let i = 0; i< neighbors.length; i++){
        let notCandidate = neighbors[i][0] * columns + neighbors[i][1]
        candidates = candidates.filter(item => item !== notCandidate)
    }
    // console.log(candidates)
    
    mines = []
    for (let i = 0; i< minesCount; i++) {
        temp = getRandomInt(candidates.length);
        mines.push(candidates[temp]);
        candidates = candidates.filter(item => item != candidates[temp])
    }
    setMines(mines)
    // console.log(candidates);
    // console.log(mines);

    // set mines to -1 in matrixTrue
    for (let i = 0; i < mines.length; i++){
        matrix[Math.floor(mines[i]/columns)][mines[i]%columns] = -1;
    }
    
    // fill in all other cells
    matrixTrue = Array(rows).fill().map(() => Array(columns).fill(0));
    for (let j = 0; j < rows; j++){
        for (let i = 0; i< columns; i++){
            if(matrix[j][i] == -1) {
                matrixTrue[j][i] = -1
            }
            else {
                // temp = neighborCellsValues(j, i, matrix);
                temp = neighborCells(j, i, matrix);
                temp = temp.map((elem) => matrix[elem[0]][elem[1]])
                matrixTrue[j][i] = -1 *sum(temp)
            }
        }
    }
    return matrixTrue
}

function setMines(mines) {
    for (let i = 0; i < mines.length; i++){
        r = (Math.floor(mines[i]/columns)).toString()
        c = (Math.floor(mines[i]%columns)).toString()
        minesLocations.push(r + "-" + c)
    }
}

function startGame() {
    document.getElementById("mines-count").innerText = "Mines: " + minesCount;
    document.getElementById("flag-button").addEventListener("click", setFlag)
    document.getElementById("board").addEventListener("contextmenu", (event) => event.preventDefault())
    // setMines()
    // populated with divs
    for (let r = 0; r < rows; r++){
        let row = [];
        for (let c = 0; c < columns; c++) {

            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.addEventListener("click", clickTile);
            ["mousedown", "touchstart"].forEach(type => {
                tile.addEventListener(type, longPressTile);
            });
            ["mouseup", "touchend"].forEach(type => {
                tile.addEventListener(type, releaseTile);
            });
            tile.classList.add('board-cell');

            // if pc then add this event listener 
            if(window.outerWidth > 900){
                tile.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                    console.log("context")
                    tileFlag(tile);
                })
            }
            

            document.getElementById("board").append(tile);
            row.push(tile);
        }
        board.push(row);
    }

    // console.log(board)
}


function setFlag() {
    if(flagEnabled) {
        flagEnabled = false;
        document.getElementById("flag-button").style.backgroundColor = "lightgray";
        document.getElementById('flag-button').innerText = "💣"
    }
    else {
        flagEnabled = true;
        document.getElementById('flag-button').style.backgroundColor = "darkgray"
        document.getElementById('flag-button').innerText = "🚩"

    }
}

function clickTile() {
    let tile = this;

    if(gameOver) return;

    if(!tile.classList.contains("tile-clicked")){
        if (flagEnabled){
            tileFlag(tile);
        }
        else {
            tileOpen(tile)
        }
    }
    else {
        // Reveeal all cells on a previously discovered cell if all mines have been marked
        let coords = tile.id.split("-");
        let r = parseInt(coords[0]);
        let c = parseInt(coords[1]);
        revealCells(r, c);
    }
    console.log(tilesClicked);
    console.log(minesCount);

    // victory condition
    if(tilesClicked === victoryCondition) {
        document.getElementById("mines-count").innerText = "Cleared";
        gameOver = true;
        revealMines();
        for (let i = 0; i < rows; i++){
            for (let j = 0; j < columns; j++) {
                // document.getElementById(board[i][j].id).style.color = fullColor;
                board[i][j].style.color = fullColor;
            }
        }
    }
}

function longPressTile() {
    let tile = this;
    tile.isHeld = true;

    tile.activeHoldTimeoutId = setTimeout(() => {
        if(this.isHeld) {
            if (flagEnabled){
                tileOpen(tile);
            }
            else {
                tileFlag(tile)
            }
        } 
    }, 300);
}
function releaseTile() {
    this.isHeld = false;
    console.log("pivo")
}

function tileOpen(tile) {
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    if(!firstCellClicked) {
        initiateGame(r, c)
        firstCellClicked = true;
    }
    checkMine(r, c);
}

function tileFlag(tile) {
    // console.log(tile)
    if(gameOver) return;

    if(!tile.classList.contains("tile-clicked")){
        if (tile.innerText == ""){
            tile.innerText = "🚩"
            minesCount -= 1;
            document.getElementById("mines-count").innerText = "Mines: " + minesCount;
        }
        else if (tile.innerText === "🚩"){
            tile.innerText = ""
            minesCount += 1;
            document.getElementById("mines-count").innerText = "Mines: " + minesCount;
        }
    }
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    let neighbors = neighborCells(r, c, matrixTrue);
    for(let i = 0; i < neighbors.length; i++){
        checkFullness(neighbors[i][0], neighbors[i][1]);
    }
    return;
}
// invoked if the cell has not been pressed previously
function checkMine(r, c) {
    if (board[r][c].classList.contains("tile-clicked") || board[r][c].innerText == "🚩") return;
    if (minesLocations.includes(board[r][c].id)) {
        document.getElementById("mines-count").innerText = "GAME OVER";
        gameOver = true;
        revealMines();
        return;
    }
    
    board[r][c].classList.add("tile-clicked");
    tilesClicked += 1;

    // console.log(r, c)
    if(matrixTrue[r][c] > 0) {
        board[r][c].innerText = matrixTrue[r][c].toString();
        // board[r][c].classList.add("x" + matrixTrue[r][c].toString())
    }
    else {
        let neighbors = neighborCells(r, c, matrixTrue)
        for (let i = 0; i < neighbors.length; i++) checkMine(neighbors[i][0], neighbors[i][1])
    }
    
}

// reveal all cells around a pressed cell if all mines have been flagged
function revealCells(r, c){
    let neighbors = neighborCells(r, c, matrixTrue);
    let minesTotal = matrixTrue[r][c];
    let minesCurrent = 0;
    
    for(let i = 0; i < neighbors.length; i++){ 
        let temp = board[neighbors[i][0]][neighbors[i][1]];
        if(temp.innerText == "🚩") minesCurrent += 1;
    }
    if (minesCurrent === minesTotal){
        for(let i = 0; i < neighbors.length; i++){
            let temp = board[neighbors[i][0]][neighbors[i][1]];
            if(temp.innerText != "🚩") checkMine(neighbors[i][0], neighbors[i][1])
            
        }
    }
}



function checkFullness(r, c){
    let neighbors = neighborCells(r, c, matrixTrue);
    let minesTotal = matrixTrue[r][c];
    let minesCurrent = 0;
    
    for(let i = 0; i < neighbors.length; i++){ 
        let temp = board[neighbors[i][0]][neighbors[i][1]];
        if(temp.innerText == "🚩") minesCurrent += 1;
    }
    if(minesCurrent == minesTotal){

        // document.getElementById(board[r][c].id).style.color = fullColor;
        board[r][c].style.color = fullColor;
        if(board[r][c].classList.contains("tile-clicked")){
            // document.getElementById(board[r][c].id).style.backgroundColor = defaultBackgroundColor;
            board[r][c].style.backgroundColor = defaultBackgroundColor;
        }

    }
    else if(minesCurrent > minesTotal) {

        if(board[r][c].classList.contains("tile-clicked")){
            // document.getElementById(board[r][c].id).style.color = overflowColor;
            // document.getElementById(board[r][c].id).style.backgroundColor = overflowBackgroundColor;
            board[r][c].style.color = overflowColor;
            board[r][c].style.backgroundColor = overflowBackgroundColor;

        }

    }
    else {
        // document.getElementById(board[r][c].id).style.color = defaultColor;
        board[r][c].style.color = defaultColor;
    }
}
// In case of game over, reveal all mines
function revealMines() {
    for (let r = 0; r< rows; r++){
        for (let c =0; c< columns; c++){
            let tile = board[r][c]
            if(minesLocations.includes(tile.id)) {
                tile.innerText = "💣"
                // tile.style.backgroundColor = "red"

            }
        }
    }
}

function initiateGame(r, c){
    let defaultArray = Array(rows).fill().map(() => Array(columns).fill(0));
    matrixTrue = makeMatrix(defaultArray, minesCount, [r,c])
    console.log(matrixTrue)
}