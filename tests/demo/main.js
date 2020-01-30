import Stage from '../../src/lib/stage';
import Actor from '../../src/lib/actor';
import InputHandler from '../../src/lib/inputHandler';

class Line extends Actor {
    constructor(bounds) {
        super(bounds);
    }

    render = () => {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }
}

//**************************************************************

class Tower extends Actor {
    constructor(hp, atkspeed, atk, def, targetingMode, range, x, y) {
        super({});
        this.hp = hp;
        this.atkspeed = atkspeed;
        this.atk = atk;
        this.def = def;
        this.targetingMode = targetingMode;
        this.range = range;
        this.positionX = (x + 1) * 50 - 25;
        this.positionY = (y + 1) * 50 - 25;
        this.aimAngle = 0.0
    }

    render = () => {
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("T", this.positionX, this.positionY + 10);

        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(this.positionX, this.positionY, this.range * 50, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    turnToTarget(target) {
        if (target == null || target.isDead()) {
            return
        }
        let targetPosition = target.getPosition()
    }


    //Function to subtract health.
    takeDamage(damage) {
        this.hp -= damage;
    }

    //Function to add health.
    healDamage(heal) {
        this.hp += heal;
    }

    //Function to change targeting mode.
    setMode(targetingMode) {
        this.targetingMode = targetingMode;
    }

    //Function to change tower range.
    setRange(range) {
        this.range = range;
    }
}

//**************************************************************

class Spawner extends Actor {
    constructor(x, y) {
        super({});
        this.x = (x + 1) * 50;
        this.y = (y + 1) * 50;
        this.path = null;
        this.mobs = null;
        this.startTime = 0.0;
    }

    render = () => {
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.x - 49, this.y - 49, 49, 49);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("S", this.x - 25, this.y - 15);
    }

    /*
     * takes a list of lists where the inner list is
     * [timing, mob]
     * the list must be sorted in order of increasing timing
     */
    setMobs(mobs) {
        this.mobs = mobs
        this.startTime = 0.0
    }

    spawnMobs(deltaTime) {
        this.startTime += deltaTime
        while (this.mobs.length > 0 && this.mobs[0][0] <= this.startTime) {
            let toSpawn = this.mobs[0]
            //console.log(toSpawn)
            this.mobs.shift()
            //console.log(this.mobs)
            //this.spawn(toSpawn)
        }
    }

    /*
     * adds mob to world, sets coordinates to the spawner's, copies the path to the mob
     */
    spawn(mob) {

    }

    mobsRemaining() {
        return this.mobs.length
    }
}

//**************************************************************

class EndPoint extends Actor {
    constructor(x, y) {
        super({});
        this.x = (x + 1) * 50;
        this.y = (y + 1) * 50;
    }

    render = () => {
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(this.x - 49, this.y - 49, 49, 49);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("E", this.x - 25, this.y - 15);
    }
}

//**************************************************************

class Block extends Actor {
    constructor(x, y) {
        super({});
        this.x = (x + 1) * 50;
        this.y = (y + 1) * 50;
    }

    render = () => {
        // this.ctx.fillStyle = "white";
        // this.ctx.fillRect(this.x - 49, this.y - 49, 49, 49);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("B", this.x - 25, this.y - 15);
    }
}

//**************************************************************

class Node extends Actor {
    constructor(bounds) {
        super(bounds);
    }

    render = () => {
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }
}

//**************************************************************

class PathLine extends Actor {
    constructor(bounds) {
        super(bounds);
    }

    render = () => {
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }
}

//**************************************************************

/*
 * To use pather, follow directions directly below. Any other functions are likely not useful
 * outside of this context.
 */


/*
 * generates a path given a matrix and starting coordinates
 * After creating Pather object, call initializeGraph(matrix) with a matrix with the following encoding:
 * 
 * 0's are a section of the map that the pather can traverse.
 * 1's are a section of the map that the pather cannot traverse.
 * 2's are a section of the map that represents a possible end point.
 * any other encodings are ignored and treated as 1's.
 * 
 * call initializeGraph(matrix) whenever the map changes, or the paths created may not be accurate.
 * call findShortestPathToEnds(xStart, yStart) to generate a new list of lists representation of the coordinates traversed 
 * 
 * example usage:
   let p = new Pather()
   let matrix = [
            [0, 1],
            [2, 2]
        ]
        let start = [0, 0]
        let expected = [[0, 0],[1, 0]]
        p.initializeGraph(matrix)
        let path = p.findShortestPathToEnds(start[0], start[1])
 */
class Pather {
    constructor() {
        this.graph = null
        this.map = null
        this.endpoints = null
    }

    /*
     * Takes a matrix to create a graph representation made of nodes
     * adjacent values in the matrix can be linked in node form if their values are 1
     * values that are 0 do not link
     */
    initializeGraph(matrix) {
        this.graph = this.matrixToGraph(matrix)
        this.graph.wipeAllPathData()
    }
    /*
     * converts a matrix into a graph/node representation
     */
    matrixToGraph(matrix) {
        let g = new Graph()
        let nodeMatrix = new Array(matrix.length)
        for (let i = 0; i < matrix.length; i++) {
            nodeMatrix[i] = new Array(matrix[0].length)
        }
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                let val = matrix[i][j]
                if (val == 0 || val == 2) {
                    let n = new PathNode(j, i, val)
                    g.addNode(n)
                    nodeMatrix[i][j] = n
                }
            }
        }
        //console.log(nodeMatrix.length + " by " + nodeMatrix[0].length)

        this.connectAdjacents(nodeMatrix)
        return g
    }

    /*
     * sets references to neighboring nodes determined by their place in the matrix of nodes. 
     * connects up, down, left, right to the center node.
     */
    connectAdjacents(nodeMatrix) {
        for (let i = 0; i < nodeMatrix.length; i++) {
            for (let j = 0; j < nodeMatrix[0].length; j++) {
                let n = nodeMatrix[i][j]
                if (nodeMatrix[i][j] === undefined) {
                    continue;
                }
                if (j > 0) //add left neighbor
                {
                    if (!(nodeMatrix[i][j - 1] === undefined)) {
                        n.adjacentNodes.push([nodeMatrix[i][j - 1], 1])
                    }
                }
                if (j < nodeMatrix[0].length - 1) //add right neighbor
                {
                    if (!(nodeMatrix[i][j + 1] === undefined)) {
                        n.adjacentNodes.push([nodeMatrix[i][j + 1], 1])
                    }
                }
                if (i > 0) //add above neighbor
                {
                    if (!(nodeMatrix[i - 1][j] === undefined)) {
                        n.adjacentNodes.push([nodeMatrix[i - 1][j], 1])
                    }
                }
                if (i < nodeMatrix.length - 1) //add below neighbor
                {
                    if (!(nodeMatrix[i + 1][j] === undefined)) {
                        n.adjacentNodes.push([nodeMatrix[i + 1][j], 1])
                    }
                }
            }
        }
    }

    /*
     * given the start and end coordinates, return a list of coordinates in the format [x, y]
     * the order of these coordinates determines the path from start to end
     */
    findShortestPathToEnds(xStart, yStart) {
        this.graph.wipeAllPathData()
        let startNode = this.graph.getNode(xStart, yStart)
        this.findShortestPaths(startNode)
        let shortest = this.searchShortestPathToEnds()
        let shortestpath = shortest.shortestPath
        shortestpath.push(shortest)
        let result = this.convertPathToListOfLists(shortestpath)
        return result
    }


    /*
     * searches among the nodes for the endpoint nodes, from there, find the endpoint with the shortest path and return path, null if none are found
     */
    searchShortestPathToEnds() {
        let shortest = null;
        let shortestDistance = Number.MAX_SAFE_INTEGER
        for (let i = 0; i < this.graph.nodes.length; i++) {
            let node = this.graph.nodes[i]
            if (node.id == 2 && node.distance < shortestDistance) {
                shortest = node;
                shortestDistance = node.distance
            }
        }
        if (shortest == null) {
            return null
        }
        return shortest
    }

    convertPathToListOfLists(path) {
        let result = []
        for (let i = 0; i < path.length; i++) {
            data = path[i]
            let data = [data.y, data.x]
            result.push(data)
        }
        return result;
    }

    /*
     *given a source node, calculate the shortest path to every node that the specified node can reach.
     *
     */
    findShortestPaths(source) {
        source.setDistance(0)
        let unsettledNodes = []
        let settledNodes = []

        unsettledNodes.push(source)
        let a = 0
        while (unsettledNodes.length != 0) {
            a++
            let currentNode = this.getLowestDistanceNode(unsettledNodes)
            unsettledNodes.splice(unsettledNodes.indexOf(currentNode), 1)

            for (let i = 0; i < currentNode.adjacentNodes.length; i++) {
                let adjacentNode = currentNode.adjacentNodes[i][0]
                let edgeWeight = currentNode.adjacentNodes[i][1]
                if (!settledNodes.includes(adjacentNode) && !unsettledNodes.includes(adjacentNode)) {
                    this.calculateMinimumDistance(adjacentNode, edgeWeight, currentNode)
                    unsettledNodes.push(adjacentNode)
                }
            }
            settledNodes.push(currentNode)
        }
        //console.log(a + " iterations")
    }

    /*
     * return the node in the list that is not settled with the shortest path
     */
    getLowestDistanceNode(unsettledNodes) {
        let lowest = null
        let lowestDistance = Number.MAX_SAFE_INTEGER
        for (let i = 0; i < unsettledNodes.length; i++) {
            let nodeDistance = unsettledNodes[i].distance
            if (nodeDistance < lowestDistance) {
                lowestDistance = nodeDistance
                lowest = unsettledNodes[i]
            }
        }

        return lowest;
    }

    calculateMinimumDistance(evaluationNode, edgeWeight, sourceNode) {
        let sourceDistance = sourceNode.distance
        if (sourceDistance + edgeWeight < evaluationNode.distance) {
            evaluationNode.setDistance(sourceDistance + edgeWeight)
            let shortestPath = []
            for (let i = 0; i < sourceNode.shortestPath.length; i++) {
                shortestPath.push(sourceNode.shortestPath[i])
            }
            shortestPath.push(sourceNode)
            evaluationNode.setShortestPath(shortestPath)
        }
    }

}

/*
 * Node used in graph 
 */
class PathNode {
    constructor(x, y, id) {
        this.distance = Number.MAX_SAFE_INTEGER;
        this.shortestPath = [];
        this.adjacentNodes = [];
        this.x = x;
        this.y = y;
        this.id = id;
    }
    setShortestPath(path) {
        this.shortestPath = path;
    }
    setDistance(distance) {
        this.distance = distance;
    }
}

/*
 * graph construct to contain nodes
 */
class Graph {
    constructor() {
        this.nodes = []
    }

    /*
     * iterates through all nodes in graph
     * resets all pathing information
     * to run another pathing check, run this first
     */
    wipeAllPathData() {
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i]
            node.setShortestPath(node)
            node.distance = Number.MAX_SAFE_INTEGER
        }

    }
    /*
     * searches and returns for a node with given x y coordinates
     */
    getNode(x, y) {
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i]
            if (node.x == x && node.y == y) {
                return node;
            }
        }
        return null;
    }
    addNode(node) {
        this.nodes.push(node)
    }
}

//**************************************************************

let stage = new Stage(document.querySelector('#main'));

for (let i = 0; i <= 600; i += 50) {
    for (let j = 0; j <= 600; j += 50) {
        stage.addActor(new Node({ x: i - 25, y: j - 25, width: 2, height: 2 }));
    }
    stage.addActor(new Line({ x: i, y: 0, width: 1, height: 600 }));
    stage.addActor(new Line({ x: 0, y: i, width: 600, height: 1 }));
}

stage.addActor(new Tower(0, 0, 0, 0, "nearest", 3, 10, 10));
stage.addActor(new Tower(0, 0, 0, 0, "nearest", 3, 0, 0));
stage.addActor(new Tower(0, 0, 0, 0, "nearest", 3, 5, 8));
stage.addActor(new Tower(0, 0, 0, 0, "nearest", 3, 8, 4));
stage.addActor(new Spawner(1, 1));
stage.addActor(new EndPoint(11, 11));
stage.addActor(new Block(0, 6));
stage.addActor(new Block(1, 6));
stage.addActor(new Block(2, 6));
stage.addActor(new Block(3, 6));
stage.addActor(new Block(4, 6));
stage.addActor(new Block(5, 6));
stage.addActor(new Block(7, 6));
stage.addActor(new Block(8, 6));
stage.addActor(new Block(9, 6));
stage.addActor(new Block(10, 6));
stage.addActor(new Block(11, 6));

let p = new Pather()
let matrix = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //0
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //1
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //2
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //3
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], //4
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //5
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1], //6
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //7
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], //8
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //9
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], //10
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], //11
  //[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ), _]
];
let start = [1, 1];
p.initializeGraph(matrix);
let path = p.findShortestPathToEnds(start[0], start[1]);
console.log(path);

for (let i = 0; i < path.length - 1; i++) {
    if (path[i][0] == path[i + 1][0]) {
        stage.addActor(new PathLine({ x: (path[i][1] + 1) * 50 - 25, y: (path[i][0] + 1) * 50 - 25, width: 50, height: 3 }));
    }
    else if (path[i][1] == path[i + 1][1]) {
        stage.addActor(new PathLine({ x: (path[i][1] + 1) * 50 - 25, y: (path[i][0] + 1) * 50 - 25, width: 3, height: 50 }));
    }
}

stage.start();