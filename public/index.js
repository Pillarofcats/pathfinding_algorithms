/*------------------IMPORTS--------------------- */

let Heap = require("heap")

/*------------------ELEMENT SELECTORS--------------------- */
const table = document.querySelector('.board')
const resetBoardBtn = document.querySelector(".reset-board-btn")
const resetPathBtn = document.querySelector(".reset-path-btn")
const selectedPathAlgorithm = document.querySelector(".select-path-algorithm")
const startPathAlgorithm = document.querySelector(".start-path-algorithm")
const selectedMazeGeneration = document.querySelector(".select-maze-algorithm")

//FUNCTION
/*------------------CREATE BOARD (TABLE)--------------------- */

const createBoard = function () {
  //Device dimensions
  const deviceWidth = window.innerWidth
  const deviceHeight = window.innerHeight
  //Setting rows and cols based on user device dimension (cell size for dynamic resolution: 38px)
  const row = Math.floor(deviceHeight/38)
  const col = Math.floor(deviceWidth/38)
  //Create board (table)
  for(let r=0; r < row; r++) {
    //For each row create a table row ("tr")
    let tableRow = document.createElement("tr")
    //Add row coordinate data to tr
    tableRow.dataset.r = `${r}`
    tableRow.draggable = false
    for(let c=0; c < col; c++) {
      //Create x table data ("td") columns for each table row
      let tableData = document.createElement("td")
      //Add dragover event listener to TD so start/end node images can be relocated
      tableData.ondragover =  function (e) {
        //e.target is the element that is being targeted for a drop (table data cell)
        //Prevent default to allow drop
        e.preventDefault()
      }

      //Add drop event listener to TD so start/end node images can be relocated
      tableData.ondrop = function (e) {
        e.preventDefault()
        //e.target is the element that is being targeted for a drop (table data cell)
        //Return if there is already an img in a drop location (prevent dropping image on a cell with image already)
        if(e.target.nodeName === "IMG") {
          return false
        }
        //Select start/end node image that is being dragged
        const draggingImg = document.querySelector("[data-dragging='true']")
        //Update state startLocation if dragged image id is "start-node"
        if(draggingImg.id === "start-node") {
          state.startLocation = e.target.dataset.rc
          //If a wall exists where the image was dropped remove the wall from state wallLocations
          let wallIndexToRemove = state.wallLocations.indexOf(e.target.dataset.rc)
          if(wallIndexToRemove >= 0) {
            state.wallLocations.splice(wallIndexToRemove, 1)
          }
        }
        //Update state endLocation if dragged image id is "end-node"
        if(draggingImg.id === "end-node") {
          state.endLocation = e.target.dataset.rc
          //If a wall exists where the image was dropped remove the wall from state wallLocations
          let wallIndexToRemove = state.wallLocations.indexOf(e.target.dataset.rc)
          if(wallIndexToRemove >= 0) {
            state.wallLocations.splice(wallIndexToRemove, 1)
          }
        }
        //Append start/end node dragging image to the td (cell)
        e.target.appendChild(draggingImg)
      }

      //Set draggable propery to false
      tableData.draggable = false
      //Add row-col coordinate data to td
      tableData.dataset.rc = `${r}-${c}`
      //Add empty "" to data-celltype attribute
      tableData.dataset.celltype = "empty-node"
      //Append td to the current tr
      tableRow.appendChild(tableData)
    }
    //Add the table row (row) with table data (columns in row) to the main table element (class="board")
    table.appendChild(tableRow)
  }
  //Update state with rows, cols
  state.rows = row
  state.cols = col
}

//FUNCTION
/*------------------RETRACE FINAL PATH------------------------*/

function retraceFinalPath(endNode) {
  //Retrace final path
  let nodesFinalPath = [endNode];
  let tempCurrentNode = endNode
  while (tempCurrentNode.parent) {
    tempCurrentNode = tempCurrentNode.parent;
    nodesFinalPath.unshift(tempCurrentNode);
  }
  return nodesFinalPath
}

//FUNCTION
/*------------------DRAW VISITED PATH NODES------------------------*/

function drawNodes(nodesVisited, nodesFinalPath) {
  let animationDelay = 0
  //Visited nodes (green), exclude endNode
  for(let i = 0; i < nodesVisited.length; i++) {
    //Delay animation for each node being set to 'visited-node'
    setTimeout(() => {
      let node = nodesVisited[i]
      //Get current td from table based on node.x node.y
      let currentTD = document.querySelector(`[data-rc="${node.x}-${node.y}"]`)
      //Skip end node, don't add it to 'visited-node'
      if(currentTD.dataset.celltype !== "end-node") {
        currentTD.dataset.celltype = 'visited-node'
      }
    }, i*10)
    animationDelay = i
  }

  if(nodesFinalPath.length >= 1) {
    //Final path nodes (blue), exclude startNode and endNode (i=1; < nodesFinalPath.length-1)
    for(let i=1; i < nodesFinalPath.length-1; i++) {
      animationDelay += 1
      //Delay animation for each node being set to 'final-path-node'
      setTimeout(() => {
        let node = nodesFinalPath[i]
        //Get current td from table based on node.x node.y
        let currentTD = document.querySelector(`[data-rc="${node.x}-${node.y}"]`)
        currentTD.dataset.celltype = 'final-path-node'
      }, animationDelay*10)
    }
  }
  //Pathfinding set false after animation is finished
  setTimeout(() => {
    state.pathFinding = false
  }, animationDelay*10)
}

//FUNCTION
/*------------------INSERT DRAGGABLE START AND END IMAGE INTO TABLE------------------------*/

function insertStartEndPathImages (row, col) {
  //Calculate starting positions of start/end image nodes
  const startEndRowPosition = Math.floor(row/2)
  const startColPosition = Math.floor(col * .2)
  const endColPosition = Math.floor(col * .8)
  //Create img elements
  const startImage = document.createElement("img")
  const endImage = document.createElement("img")
  //Start image attributes
  startImage.src = "./images/start-image.svg"
  startImage.alt = "Start image for start of pathfinding algorithm"
  startImage.draggable = true
  startImage.id = "start-node"
  startImage.dataset.dragging = false
  //End image attributes
  endImage.src = "./images/end-image.svg"
  endImage.alt = "End image for start of pathfinding algorithm"
  endImage.draggable = true
  endImage.id = "end-node"
  startImage.dataset.dragging = false
  //Select starting td elements
  const tdStart = document.querySelector(`[data-rc='${startEndRowPosition}-${startColPosition}']`)
  const tdEnd = document.querySelector(`[data-rc='${startEndRowPosition}-${endColPosition}']`)
  //Add "start-node "end-node" dataset to table data that starts with start-node image and end-node image
  tdStart.dataset.celltype = "start-node"
  tdEnd.dataset.celltype = "end-node"
  //Update location of state for start/end node
  state.startLocation = tdStart.dataset.rc
  state.endLocation = tdEnd.dataset.rc
  //Append start and end images to table data locations
  tdStart.appendChild(startImage)
  tdEnd.appendChild(endImage)
}

//FUNCTION
/*------------------CREATE NODE OBJECT FOR MATRICE------------------------*/
//{}.value is the value of the node ('s' = start node, 'e' = end node, 'w' = wall node, '' = empty node)
//{}.x is the row nukber of the node
//{}.y is the col number of the node
//{}.visited tells if the node has been visited or not within the pathfinding algorithms
//{}.parent points to the previous node moved from
//{}.neighbors is set to an array of nodes around the currentNode on the grid
//{}.f is the best next move (lower value f has priority for best next move) in a path for A* pathfinding equation f = g + h
//{}.g is movement cost for A* pathfinding equation f = g + h
//{}.h is estimated movement cost (guess) for A* pathfinding equation f = g + h

function matriceNode(row, col) {
  return {
    value: "",
    x: row,
    y: col,
    parent: null,
    f: null,
    g: null,
    h: null,
    close: null,
    open: null
  }
}

//FUNCTION
/*------------------CREATE MATRICE WITH WALLS AND IMAGE LOCATIONS TO STATE MATRICE------------------------*/
function createMatriceWithWallsAndImages() {
  //Create matrice
  let matrice = []
  //matrice loop
  for(let r = 0; r < state.rows; r++) {
    //Create a new row
    let row = []
    for(let c = 0; c < state.cols; c++) {
      let node = new matriceNode(r,c)
      //Add matrice node col to current row
      row.push(node)
    }
    //Add row to matrice
    matrice.push(row)
  }
  //Get coordinates of image start-node from state and convert to [x,y] from "row-col"
  let sNX=state.startLocation.split("-")[0]
  let sNY=state.startLocation.split("-")[1]
  //Get coordinates of image end-node from state and convert to [x,y] from "row-col"
  let eNX=state.endLocation.split("-")[0]
  let eNY=state.endLocation.split("-")[1]
  //Get coordinates of all wall-node from state and convert to [[x,y]] from [["row-col"]]
  let wNC = state.wallLocations.map((wall) => {
    return wall.split("-")
  })
  //Add start node to matrice using coordinates
  matrice[sNX][sNY].value = 's'
  //Add end node to matrice using coordinates
  matrice[eNX][eNY].value = 'e'
  //Add wall nodes to matrice using coordinates
  wNC.forEach((wall) => {
    let wNX = wall[0]
    let wNY = wall[1]
    matrice[wNX][wNY].value = 'w'
  })
  //Set state.matrice to created matrice with start/end node and wall nodes
  state.matrice = matrice
}

//FUNCTION
/*------------------A* PATHFINDING------------------------*/
function aStar () {
  //Visited nodes for visual animation
  let nodesVisited = []
  //Used in retrace and end of astar function
  let nodesFinalPath = []
  //Set current node to start node
  let startX = state.startLocation.split("-")[0]
  let startY = state.startLocation.split("-")[1]
  let startNode = state.matrice[startX][startY]
  //Set properties f and g of startNode
  startNode.f = 0
  startNode.g = 0
  //Set end node
  let endX = state.endLocation.split("-")[0]
  let endY = state.endLocation.split("-")[1]
  let endNode = state.matrice[endX][endY]

  //Create new instance of a heap that will hold nodes to travel to and sort them by lowest f value
  let heapOpenList = new Heap(function(nodeA, nodeB) { 
    return nodeA.f - nodeB.f
  })

  //Insert the startNode into openList
  heapOpenList.push(startNode)
  //Set startNode to open
  startNode.open = true

  //Continuously loop while there are nodes in openList, if heap is empty we are done traversing nodes
  //While not empty
  while(heapOpenList.size() > 0) {

    //Get the node with the lowest f value, the heap is sorted so popping will get the lowest f value node available in heapOpenList
    let currentNode = heapOpenList.pop()
    //We have now visited the currentNode, so set to closed
    startNode.close = true

    //Reach the endNode, so retrace the path taken and draw the path
    if(currentNode === endNode) {
      //Retrace final path
      nodesFinalPath = retraceFinalPath(endNode)
      //Draw visited nodes, then final path nodes
      drawNodes(nodesVisited, nodesFinalPath)
      //Draw final path nodes
      return
    }

    //Get the neighbors of the currentNode
    //Temporary array to hold currentNode neighbor nodes
    let neighbors = []
    //Check if neighbor nodes exist, if they do add to neighbors[]
    //If currentNode.x is 0, then x-1 won't exist AND if neighbor is not a wall 'w' && state.matrice[currentNode.x-1][currentNode.y].visited !== true
    if(currentNode.x !== 0 && state.matrice[currentNode.x-1][currentNode.y].value !== 'w') {
      //Row-1 will get node up one from currentNode
      neighbors.unshift(state.matrice[currentNode.x-1][currentNode.y])
    }
    //If currentNode.x is equal to the number of total rows, then x+1 won't exist AND if neighbor is not a wall 'w' && state.matrice[currentNode.x+1][currentNode.y].visited !== true
    if(currentNode.x !== state.rows-1 && state.matrice[currentNode.x+1][currentNode.y].value !== 'w') {
      //Row+1 will get node down one from currentNode
      neighbors.unshift(state.matrice[currentNode.x+1][currentNode.y])
    }
    //If currentNode.y is 0, then y-1 won't exist AND if neighbor is not a wall 'w' && state.matrice[currentNode.x][currentNode.y-1].visited !== true
    if(currentNode.y !== 0 && state.matrice[currentNode.x][currentNode.y-1].value !== 'w') {
      //Col-1 will get node left one from currentNode
      neighbors.unshift(state.matrice[currentNode.x][currentNode.y-1])
    }
    //If currentNode.y is equal to the number of total cols, then y+1 won't exist AND if neighbor is not a wall 'w' && state.matrice[currentNode.x][currentNode.y+1].visited !== true
    if(currentNode.y !== state.cols-1 && state.matrice[currentNode.x][currentNode.y+1].value !== 'w') {
      //Col+1 will get node right one from currentNode
      neighbors.unshift(state.matrice[currentNode.x][currentNode.y+1])
    }

    neighbors.forEach((neighbor) => {
      //We have been to this neighbor, so return
      if(neighbor.close) {
        return
      }

      //Get current weight of currentNode to a neighbor, each movement will add 1
      let gSoFar = currentNode.g + 1

      //Check if neighbor has not been visited yet, or neighbor can be traveled to with a smaller cost from currentNode
      if(!neighbor.open || gSoFar < neighbor.g) {
        //Set neighbor.g to total g cost (gSoFar)
        neighbor.g = gSoFar
        //Get heuristic of neighbor node to endNode
        neighbor.h = Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y)
        //Calculate f cost for neighbor, f = g + h (lower value has priority)
        neighbor.f = neighbor.g + neighbor.h
        //Set neighbor.parent to currentNode
        neighbor.parent = currentNode

        if(!neighbor.open) {
          //If neighbor isn't open, set open and add to heapOpenList
          heapOpenList.push(neighbor)
          neighbor.open = true

          //Visited nodes (green), exclude endNode
          nodesVisited.push(neighbor)
        } 
        else {
          //Neighbor can be traveled to with a smaller f cost
          heapOpenList.updateItem(neighbor)
        }
      }
    })
  }
  //Failed to find a path, draw nodes
  drawNodes(nodesVisited, nodesFinalPath)
  //Pathfinding failed and finished, set state.pathFinding = false
  // state.pathFinding = false
}

//FUNCTION
/*------------------RANDOM MAZE------------------------*/

function randomMaze() {
  let halfCellsInTable = Math.floor((state.rows*state.cols)/3)
  let target
  for(let i=0; i <= halfCellsInTable; i++) {
    do {
      let randRow = Math.floor(Math.random() * state.rows)
      let randCol = Math.floor(Math.random() * state.cols)
      target = document.querySelector(`[data-rc="${randRow}-${randCol}"]`)
    } while(target.dataset.celltype !== "empty-node")
    target.dataset.celltype = "wall-node"
    state.wallLocations.push(target.dataset.rc)
  }
}

//EVENT LISTENER FUNCTION
/*------------------DRAW WALLS WITH MOUSE--------------------- */

//Event listener function - Draw walls on table (SHARED FUNCTION WITH EVENT:MOUSEMOVE & EVENT:TOUCHMOVE)
function drawWallsMouse(e) {
  e.preventDefault()
  //Ignore creating walls when moving over the start-node and end-node
  if(!e.target.dataset.rc || e.target.dataset.celltype === "start-node" || e.target.dataset.celltype === "end-node") {return}
  //Check if e.target is valid, if so proceed
  if(e.target === null || state.previousCellTarget === e.target.dataset.rc) {
    //Element doesn't exist or element doesn't have a nodeName of "TD"
  } else if(e.target.dataset.celltype === "wall-node") {
    //Remove wall node from state.wallLocations
    let wallIndexToRemove = state.wallLocations.indexOf(e.target.dataset.rc)
    if(wallIndexToRemove >= 0) {
      state.wallLocations.splice(wallIndexToRemove, 1)
    }
    //Set cell to empty node
    e.target.dataset.celltype = "empty-node"
  } else {
  //Update state wall locations
  state.wallLocations.push(e.target.dataset.rc)
  //Add .wall class to selected table data (cell coordinates in table)
  e.target.dataset.celltype = "wall-node"
  }
  //Set previous target to current target in state
  state.previousCellTarget = e.target.dataset.rc
}

//EVENT LISTENER FUNCTION
/*------------------DRAW WALLS WITH TOUCH--------------------- */

function drawWallsTouch(e) {
  e.preventDefault()
  //Get coordinates of elements selected with pointermove event listener
  let x = e.clientX
  let y = e.clientY
  let currentTableData = document.elementFromPoint(x,y)

  //Ignore creating walls when moving over the start-node and end-node
  if(!currentTableData.dataset.rc || currentTableData.dataset.celltype === "start-node" || currentTableData.dataset.celltype === "end-node") {return}
  //Check if e.target is valid, if so proceed
  if(currentTableData === null || state.previousCellTarget === currentTableData.dataset.rc) {
    //Element doesn't exist or element doesn't have a nodeName of "TD"
  } else if(currentTableData.dataset.celltype === "wall-node") {
    //Remove wall node from state.wallLocations
    let wallIndexToRemove = state.wallLocations.indexOf(currentTableData.dataset.rc)
    if(wallIndexToRemove >= 0) {
      state.wallLocations.splice(wallIndexToRemove, 1)
    }
    //Set cell to empty node
    currentTableData.dataset.celltype = "empty-node"
  } else {
  //Update state wall locations
  state.wallLocations.push(currentTableData.dataset.rc)
  //Add .wall class to selected table data (cell coordinates in table)
  currentTableData.dataset.celltype = "wall-node"
  }
  //Set previous target to current target in state
  state.previousCellTarget = currentTableData.dataset.rc
}

//EVENT LISTENER FUNCTION
/*------------------START DRAG MOUSE--------------------- */

function startDragImgMouse (e) {
  //e.target is element being dragged (image node)
  e.target.dataset.dragging = true
}

//EVENT LISTENER FUNCTION
/*------------------END DRAG MOUSE--------------------- */

function endDragImgMouse (e) {
  //Valid drop location, update dataset.celltype for cells
  // if(e.dataTransfer.dropEffect === "copy") {
    //Change dragstart cell to dataset.celltype="empty-node"
    //e.target.id will give the image id which is: ["start-node", "end-node"]
    const dragStartTarget = document.querySelector(`[data-celltype='${e.target.id}']`)
    dragStartTarget.dataset.celltype = "empty-node"
    //Change dragend cell to dataset.celltype="${e.target.id}"
    const imgEndTarget = document.querySelector(`#${e.target.id}`)
    imgEndTarget.parentNode.dataset.celltype = `${e.target.id}`
  // }
  //e.target is element being dragged (image node)
  e.target.dataset.dragging = false
}

//EVENT LISTENER FUNCTION
/*------------------START DRAG TOUCH--------------------- */

function dragImgTouch (e) {
  //e.target is element being dragged (image node)
  let touchX = e.clientX
  let touchY = e.clientY

  //Prevent unecessary updates after they have already been applied
  if(e.target.style.position !== "fixed") {
    //Set position of image being dragged to fixed so we can move it based on touch location
    e.target.style.position = "fixed"
    //Set zindex to -1 so we can see the location of the elements beneath the dragging image
    e.target.style.zIndex = -1
    //Set dataset.dragging of image node being dragged to true
    e.target.dataset.dragging = true
  }

  //Constantly update locations of image being dragged by touch
  //Offset the position a bit to match center of touch location (-14,-13)
  e.target.style.left = `${touchX-14}px`
  e.target.style.top = `${touchY-13}px`
}

//EVENT LISTENER FUNCTION
/*------------------END DRAG TOUCH--------------------- */
function dropImgTouch (e) {
  //e.clientX is the horizontal touch location on pointerup event trigger
  //e.clientY is the vertical touch location on pointerup event trigger
  //e.target is the image node being dropped
  //Get touch location to drop image at location
  let touchX = e.clientX
  let touchY = e.clientY
  //Current position of touch pointer on screen 
  //(set the dragging image node zindex to -1 to get touch location underneath image node being dragged)
  let touchElementLocation = document.elementFromPoint(touchX, touchY)
  //If touch location has child nodes (image node) then return || element is not a tabledata (td)
  if(touchElementLocation === null || touchElementLocation.nodeName !== "TD"  || touchElementLocation.hasChildNodes() ) {
    //RESET image node being dragged
    //Remove position of image node bing dragged
    e.target.style.position = ""
    //Remove zindex of image node being dragged
    e.target.style.zIndex = ""
    //Reset dataset.dragging of image node being dragged to false
    e.target.dataset.dragging = false
    return
  }
  //Valid drop, swap location data of image nodes and tabledata
  //Change dragstart cell to dataset.celltype="empty-node"
  //e.target.id will give the image id which is: ["start-node", "end-node"]
  const dragStartTarget = document.querySelector(`[data-celltype='${e.target.id}']`)
  dragStartTarget.dataset.celltype = "empty-node"
  //Change dragend cell to dataset.celltype="${e.target.id}"
  touchElementLocation.dataset.celltype = `${e.target.id}`
  //Update state startLocation if dragged image id is "start-node"
  if(e.target.id === "start-node") {
    state.startLocation = touchElementLocation.dataset.rc
    //If a wall exists where the image was dropped remove the wall from state wallLocations
    let wallIndexToRemove = state.wallLocations.indexOf(touchElementLocation.dataset.rc)
    if(wallIndexToRemove >= 0) {
      state.wallLocations.splice(wallIndexToRemove, 1)
    }
  }
  //Update state endLocation if dragged image id is "start-node"
  if(e.target.id === "end-node") {
    state.endLocation = touchElementLocation.dataset.rc
    //If a wall exists where the image was dropped remove the wall from state wallLocations
    let wallIndexToRemove = state.wallLocations.indexOf(touchElementLocation.dataset.rc)
    if(wallIndexToRemove >= 0) {
      state.wallLocations.splice(wallIndexToRemove, 1)
    }
  }
  //Append image node to tabledata drop location
  touchElementLocation.appendChild(e.target)
  //Remove image node position
  e.target.style.position = ""
  //Remove zindex of image node
  e.target.style.zIndex = ""
  //Set dataset.dragging of image node to false
  e.target.dataset.dragging = false
}

//EVENT LISTENER
/*------------------POINTER DOWN EVENT LISTENER--------------------- */

//Start adding walls or moving start/end image
table.addEventListener("pointerdown", function (e) {
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {return}

  switch(e.pointerType) {
    case "mouse":
      //DRAG AND DROP START/END NODE MOUSE
      if(e.target.parentNode.dataset.celltype === "start-node" || e.target.parentNode.dataset.celltype === "end-node") {
        e.target.addEventListener("dragstart", startDragImgMouse)
        e.target.addEventListener("dragend", endDragImgMouse)
      }
      //DRAW WALLS MOUSE
      //Empty dataset.celltype = "" ,so walls can be added
      //ADDED || e.target.dataset.celltype === "wall-node"
      if(e.target.dataset.celltype === "empty-node" || e.target.dataset.celltype === "wall-node") {
        //Add wall for individual pointerdown
        drawWallsMouse(e)
        //Add mousemove event listener
        this.addEventListener("pointermove", drawWallsMouse)
      }
      break
    case "touch":
      //DRAG AND DROP START/END NODE TOUCH
      if(e.target.parentNode.dataset.celltype === "start-node" || e.target.parentNode.dataset.celltype === "end-node") {
        this.addEventListener("pointermove", dragImgTouch)
      }
      //DRAW WALLS TOUCH - Only add mousemove event listener if 'data-rc' exists (cell coordinate exists in table)
      if(e.target.dataset.celltype === "empty-node" || e.target.dataset.celltype === "wall-node" ) {
        //Add wall for individual pointerdown
        drawWallsTouch(e)
        //Add mousemove event listener
        this.addEventListener("pointermove", drawWallsTouch)
      }
      break
    default:
      break
  }
})

//EVENT LISTENER
/*------------------POINTER UP EVENT LISTENER--------------------- */

//Stop adding walls to table or moving start/end image
table.addEventListener("pointerup", function (e) {
  // e.preventDefault()
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {return}
  
  switch(e.pointerType) {
    case "mouse":
      this.removeEventListener("pointermove", drawWallsMouse)
      break
    case "touch":
      //e.target is the starting tabledata node touched
      if(e.target.nodeName === "TD") {
        this.removeEventListener("pointermove", drawWallsTouch)
      }
      //e.target is the starting image node touched
      if(e.target.nodeName === "IMG") {
        this.removeEventListener("pointermove", dragImgTouch)
        //execute drop of image into tabledata if valid
        dropImgTouch(e)
      }
      break
    default:
      break
  }
})

//EVENT LISTENER
/*------------------RESET BOARD---------------------------- */

//Reset just walls for right now
resetBoardBtn.addEventListener("click", resetBoard)

function resetBoard () {
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {return}
  //Get all table data (td) with node classes and remove them
  let allTD = table.querySelectorAll("[data-celltype='wall-node'], [data-celltype='visited-node'],[data-celltype='final-path-node']")
  //Nothing to remove, so return
  if(allTD.length === 0) {
    return
  }
  //All td that contain path node css classes are removed
  allTD.forEach((td) => {
    //Reset dataset celltype
    td.dataset.celltype = "empty-node"
  })
  //Reset state wallLocations
  state.wallLocations = []
}

//EVENT LISTENER
/*------------------RESET PATH---------------------------- */

resetPathBtn.addEventListener("click", resetPath)

function resetPath() {
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {return}
  //Select all td path node css classes in table
  let allTD = table.querySelectorAll("[data-celltype='visited-node'], [data-celltype='final-path-node']")
  //Nothing to remove, so return
  if(allTD.length === 0) {
    return
  }
  //All td that contain path node css classes are removed
  allTD.forEach((td) => {
    //Reset class name to "td"
    td.dataset.celltype = "empty-node"
  })
}

//EVENT LISTENER
/*------------------PATHFINDING SELECTION---------------------------- */

//Change select element option and update state of pathSelection
selectedPathAlgorithm.addEventListener("change", function (e) {
  //The selected option will be stored in e.target.value
  //Update the value in state
  state.pathSelection = e.target.value
})

//EVENT LISTENER
/*------------------MAZE GENERATION SELECTION---------------------------- */

startPathAlgorithm.addEventListener("click", function (e) {
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {return}
  
  //Pathinding set true, disable clicking until finished
  if(state.pathSelection) {
    //Reset path before starting path algorithm
    resetPath()
    //Create matrice with walls and image nodes, set state.matrice
    createMatriceWithWallsAndImages()
    //Currently path finding
    state.pathFinding = true
  }
  //Execute path finding algorithm for path selection
  switch(state.pathSelection) {
    case "":
      break
    case "A*":
      aStar()
      break
    default:
      break
  }
})

//EVENT LISTENER
/*------------------MAZE GENERATION SELECTION---------------------------- */
//Change select element option and update state of mazeSelection

selectedMazeGeneration.addEventListener("change", function (e) {
  //Currently pathfinding, cancel click
  if(state.pathFinding === true) {
    //Reset maze selection
    selectedMazeGeneration.value = ""
    state.mazeSelection = ""
    return
  }
  //Option selected by user in the select element
  state.mazeSelection = e.target.options[e.target.selectedIndex].value
  //If a valid selection is made do the following
  if(state.mazeSelection) {
    //Reset path before drawing maze
    resetPath()
    //Reset board before drawing maze
    resetBoard()
  }
  //Execute maze generation algorithm for path selection
  switch(state.mazeSelection) {
    case "":
      break
    case "Random Maze":
      randomMaze()
      break
    default:
      break
  }
  //Reset maze selection
  selectedMazeGeneration.value = ""
  state.mazeSelection = ""
})

/*-----------------------------MAIN-------------------------- */

//State
let state = {
  pathSelection: "",
  pathFinding: false,
  mazeSelection: "",
  mazeGenerating: false,
  startLocation: null,
  endLocation: null,
  wallLocations: [],
  matrice: null,
  rows: null,
  cols: null,
  previousCellTarget: null
}

//Create table
createBoard()
//Insert start/end image nodes based on device resolution
insertStartEndPathImages(state.rows, state.cols)
