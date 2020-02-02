import Stage from '../../src/lib/stage';
import Actor from '../../src/lib/actor';
import InputHandler from '../../src/lib/inputHandler';

class World extends Stage{
    constructor(elem){
        super(elem)
        //this.activeEnemies = []
    }


    getActiveEnemies(){
        let enemyLayerID = 9
        let activeEnemies = []
        let enemyLayer = this.children[enemyLayerID]
        if (enemyLayer == null){
            //console.log("no enemies on map")
            return activeEnemies
        }
        //console.log("enemies on map")
        for (let i = 0; i < enemyLayer.length; i++){
            let a = enemyLayer[i]
            if (a instanceof Monster){
                activeEnemies.push(a)
            }
        }
        return activeEnemies
    }
}

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
    constructor(atkspeed, atk, targetingMode, range, x, y) {
        super({});
        this.atkspeed = atkspeed;
        this.atk = atk;
        this.targetingMode = targetingMode;
        this.range = range;
        this.positionX = x
        this.positionY = y
        this.realX = (x + 1) * 50 - 25;
        this.realY = (y + 1) * 50 - 25;
        this.aimAngle = 0.0
        this.target = null
        this.shotTimer = 0
    }

    update = (dt) => {
        if (this.target == null || this.target.hasReachedGoal() || this.target.isDead() || !this.targetInRange()){
            //console.log("seeking target")
            this.findTarget()
        }
        if(this.target == null){
            
        }
        else{
            this.turnToTarget(this.target)
            this.shoot(dt)
        }
    }

    targetInRange(){
        let distance = Math.sqrt(Math.pow(this.positionX - this.target.positionX, 2) + Math.pow(this.positionY - this.target.positionY, 2))
        return distance <= this.range
    }

    shoot(time){
        this.shotTimer += time
        if (this.shotTimer >= this.atkspeed){
            //console.log("shooting!")
            this.shotTimer -= this.atkspeed
            this.fireBulletNoProjectile()
        }
    }

    fireBulletNoProjectile(){
        this.target.takeDamage(this.atk)
    }

    render = (dt) => {

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("T", this.realX, this.realY + 10);

        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(this.realX, this.realY, this.range * 50, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    turnToTarget(target){
        let targetPosition = target.getPosition()
        let currentPosition = [this.positionY, this.positionX]
        //pointing straight up or straight down case to avoid NaN with Math.atan() function
        if (currentPosition[1] - targetPosition[1] == 0)
        {
            if (currentPosition[0] - targetPosition[0] >= 0){
                this.aimAngle = Math.PI*0.5
            }
            else{
                this.aimAngle = Math.PI*1.5
            }
        }
        //general case
        else{
            this.aimAngle = Math.atan((currentPosition[0] - targetPosition[0])/(currentPosition[1] - targetPosition[1]))
        }
    }

    findTarget(){
        let inRange = this.findInRadius(stage.getActiveEnemies())
        this.target = this.prioritizeTarget(inRange)
    }
    findInRadius(entities) {
        let h = this.positionX;
        let k = this.positionY;
        let array = [];
    
        entities.forEach(element => {
            let x = element.positionX;
            let y = element.positionY;
            let distance = Math.sqrt(((x - h) ** 2) + ((y - k) ** 2))
            if (distance <= this.range) {
                array.push(element);
            };
        });
    
        return array;
    }
    prioritizeTarget(entities) {
        let target = entities[0];
    
        switch (this.targetingMode) {
            //Target monster with the lowest HP.
            case "lowestHP":
                entities.forEach(element => {
                    if (element.hp < target.hp) {
                        target = element;
                    }
                });
                break;
            
            //Target monster with the highest HP.
            case "highestHP":
                entities.forEach(element => {
                    if (element.hp > target.hp) {
                        target = element;
                    }
                });
                break;
            
            //Target monster nearest to the end point.
            case "nearest":
                entities.forEach(element => {
                    if (element.distance < target.distance) {
                        target = element;
                    }
                });
                break;
            
            //Target monster furthest to the end point.
            case "furthest":
                entities.forEach(element => {
                    if (element.distance > target.distance) {
                        target = element;
                    }
                });
                break;
        }
    
        return target;
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
function moveOverPath(mob, time){
    if (time == 0 || mob.hasReachedGoal()){
        return
    }
    let speed = mob.getSpeed()
    let currentPosition = mob.getPosition()
    let distanceToTravel = speed * time
    let path = mob.getPath()
    let targetPosition = path[mob.getStep()+1]
    let maximumStepDistance = Math.sqrt(Math.pow(currentPosition[0] - targetPosition[0], 2) + Math.pow(currentPosition[1] - targetPosition[1], 2))
    //snap to next position, recursive call
    if (maximumStepDistance <= distanceToTravel){
        let newDistanceToTravel = distanceToTravel - maximumStepDistance
        let newTime = newDistanceToTravel / speed
        //console.log("time = " + newTime)
        mob.setDistance(mob.getDistance() - maximumStepDistance)
        mob.setStep(mob.getStep() + 1)
        mob.updatePosition(targetPosition)
        moveOverPath(mob, newTime)
        return
    }
    let xFactor = 0
    let yFactor = 0
    //all x movement
    if (currentPosition[0] - targetPosition[0] == 0){
        xFactor = distanceToTravel
        if (currentPosition[1] - targetPosition[1] > 0){
            xFactor = -xFactor
        }
    }
    //all y movement
    else if (currentPosition[1] - targetPosition[1] == 0){
        yFactor = distanceToTravel
        if (currentPosition[0] - targetPosition[0] > 0){
            yFactor = -yFactor
        }
    }
    //mixed movement
    else{
        let angle = Math.atan((currentPosition[0] - targetPosition[0])/(currentPosition[1] - targetPosition[1]))
        xFactor = distanceToTravel * Math.cos(angle)
        yFactor = distanceToTravel * Math.sin(angle)
    }
    
    let newPosition = [currentPosition[0] + yFactor, currentPosition[1] + xFactor]
    mob.updatePosition(newPosition)
    mob.setDistance(mob.getDistance() - distanceToTravel)
    //mob.setStep(mob.getStep()+1)
}

//**************************************************************

class Spawner extends Actor {
    constructor(x, y) {
        super({});
        this.x = x
        this.y = y
        this.realx = (x + 1) * 50;
        this.realy = (y + 1) * 50;
        this.path = null;
        this.mobs = null;
        this.startTime = 0.0;
        this.distance = 0
    }

    update = (dt) => {
        this.spawnMobs(dt)
    }

    setPath(path){
        this.path = path
        this.distance = this.sumPath(path)
    }

    sumPath(path){
        let total = 0
        for(let i = 1; i < path.length; i++){
           total += Math.sqrt(Math.pow(path[i-1][0] - path[i][0], 2) + Math.pow(path[i-1][1] - path[i][1], 2))
       }
        return total
    }

    /*
     *uses realx and realy not x, y, which are virtual representations, not graphical
     */
    render = (dt) => {
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.realx - 49, this.realy - 49, 49, 49);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("S", this.realx - 25, this.realy - 15);
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
            let toSpawn = this.mobs[0][1]
            this.mobs.shift()
            this.spawn(toSpawn)
        }
    }

    /*
     * adds mob to world, sets coordinates to the spawner's, copies the path to the mob
     */
    spawn(mob) {
        mob.updatePosition([this.y, this.x])
        mob.setDistance(this.distance)
        mob.setPath(this.path)
        stage.addActor(mob, 9)
        console.log(mob)
    }

    mobsRemaining() {
        return this.mobs.length
    }
}

//**************************************************************

class EndPoint extends Actor {
    constructor(x, y) {
        super({});
        this.x = (x + 1) * 60;
        this.y = (y + 1) * 60;
    }

    render = (dt) => {
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

    render = (dt) => {
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

    render = (dt) => {
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }
}

//**************************************************************

class PathLine extends Actor {
    constructor(bounds) {
        super(bounds);
    }

    render = (dt) => {
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

class Monster extends Actor {
    constructor(hp, speed, def) {
        super({width: 50, height: 50 });
        //this.route = this.edgePath(path);
        this.vertex = 0;
        this.hp = hp;
        this.maxHp = hp
        this.speed = speed;
        this.def = def;
        this.distance = 0
        this.positionX = 0;
        this.positionY = 0;
        this.path = []
        this.step = 0
        this.reachedGoal = false
        this.dead = false
    }

    render = (dt) => {
        //clearframe
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(this.px, this.py, this.bounds.width, this.bounds.height);

        this.px = Math.round(this.bounds.x);
        this.py = Math.round(this.bounds.y);

        //drawframe
        let ratio = (this.hp / this.maxHp) * 255
        let hexComponent = Math.floor(ratio).toString(16)
        //console.log(ratio + " " +hexComponent)
        let colorString = "#00" + hexComponent + "00"
        this.ctx.fillStyle = colorString;
        this.ctx.fillRect(this.px, this.py, this.bounds.width, this.bounds.height);
    }

    update = (dt) => {
        //console.log("acting! " + this.getPosition() + " hp: " + this.getHp())
        if (this.isDead()){
            console.log("Dead! " + this.getPosition() + " hp: " + this.getHp())
            this.destroy(dt)
        }
        moveOverPath(this, dt)
        this.distance -= this.speed*dt
        this.updateRealPosition()
        if (this.hasReachedGoal()){
            console.log("Reached goal! " + this.getPosition())
            this.destroy(dt)
        }

    }

    /*
     * update position for engine. pass x y values to function that translates virtual to visual position
     */
    updateRealPosition(){
        this.bounds.x = this.positionX * 50
        this.bounds.y = this.positionY * 50
    }

    destroy = (dt) => {
        //Clear boundingbox
        this.ctx.clearRect(this.x, this.y, this.width, this.height);
        
        //Remove actor from stage
        this.stage.removeActor(this)
    }

    hasReachedGoal(){
        this.reachedGoal = this.step + 1 >= this.path.length
        return this.reachedGoal
    }

    setPath(path){
        this.path = path
        this.step = 0
    }

    setStep(step){
        this.step = step
    }

    //Function to subtract health.
    takeDamage(damage) {
        this.hp -= damage;
    }

    //Function to add health.
    healDamage(heal) {
        this.hp += heal;
    }

    //position given in [y, x] format
    updatePosition(position) {
        this.positionX = position[1];
        this.positionY = position[0];
        this.updateRealPosition()
    }

    //Function to change distance.
    setDistance(distance) {
        this.distance = distance;
    }

    getHp(){
        return this.hp
    }
    getSpeed(){
        return this.speed
    }
    getDef(){
        return this.def
    }
    getDistance(){
        return this.distance
    }
    //position given in [y, x] format
    getPosition(){
        return [this.positionY, this.positionX]
    }
    getPath(){
        return this.path
    }
    getStep(){
        return this.step
    }
    isDead(){
        this.dead = this.hp <= 0
        //console.log(this.hp <= 0)
        return this.dead
    }

    edgePath(path) {
        // [y, x] coordinates
        let horizontal = false;
        let vertical = false;
        let edgePath = [];

        if (path[0][0] == path[1][0])
            vertical = true;
        else if (path[0][1] == path[1][1])
            horizontal = true;

        for (let i = 0; i < path.length - 1; i++) {
            if (vertical) {
                if (path[i][0] != path[i + 1][0]) {
                    edgePath.push(path[i]);
                    vertical = false;
                    horizontal = true;
                }
            }
            else if (horizontal) {
                if (path[i][1] != path[i + 1][1]) {
                    edgePath.push(path[i]);
                    vertical = true;
                    horizontal = false;
                }
            }
        }
        edgePath.push(path[path.length - 1]);
        return edgePath;
    }

}

//**************************************************************

let stage = new World(document.querySelector('#main'));

for (let i = 0; i <= 600; i += 50) {
    for (let j = 0; j <= 600; j += 50) {
        stage.addActor(new Node({ x: i - 25, y: j - 25, width: 2, height: 2 }), 0);
    }
    stage.addActor(new Line({ x: i, y: 0, width: 1, height: 600 }), 1);
    stage.addActor(new Line({ x: 0, y: i, width: 600, height: 1 }), 1);
}


stage.addActor(new Tower(30, 1, "nearest", 3, 2, 3), 10);
stage.addActor(new Tower(10, .3, "nearest", 3, 7, 1), 10);
stage.addActor(new Tower(45, 4, "nearest", 2, 3, 8), 10);
stage.addActor(new Tower(60, 8, "nearest", 6, 8, 7), 10);

let p = new Pather()
let matrix = [
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], //0
    [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0], //1
    [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0], //2
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0], //3
    [0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0], //4
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0], //5
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1], //6
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0], //7
    [0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0], //8
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], //9
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], //10
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2], //11
  //[0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11]
];

for(let i = 0; i < matrix.length; i++){
    for(let j = 0; j < matrix[0].length; j++){
        if(matrix[i][j] == 1){
            stage.addActor(new Block(j, i), 5)
        }
    }
}
let start = [1, 1];
p.initializeGraph(matrix);
let path1 = p.findShortestPathToEnds(start[0], start[1]);
let path2 = p.findShortestPathToEnds(6, 2)
let path3 = p.findShortestPathToEnds(8, 5)
let spawnList1 = [
    [30, new Monster(10, .1, 0)],
    [100, new Monster(5, .02, 0)],
    [150, new Monster(20, .07, 0)],
    [250, new Monster(4, .8, 0)]
]
let spawnList2 = [
    [30, new Monster(10, .1, 0)],
    [50, new Monster(5, .02, 0)],
    [70, new Monster(10, .02, 0)],
    [120, new Monster(10, .4, 0)]
]
let spawnList3 = [
    [30, new Monster(10, .1, 0)],
    [90, new Monster(5, .02, 0)],
    [130, new Monster(10, .02, 0)],
    [200, new Monster(10, .4, 0)],
    [230, new Monster(100, .01, 0)]
]
let spawner1 = new Spawner(1, 1)
let spawner2 = new Spawner(6, 2)
let spawner3 = new Spawner(8, 5)
spawner1.setMobs(spawnList1)
spawner2.setMobs(spawnList2)
spawner3.setMobs(spawnList3)
spawner1.setPath(path1)
spawner2.setPath(path2)
spawner3.setPath(path3)
//console.log(path);
/*
for (let i = 0; i < path.length - 1; i++) {
    if (path[i][0] == path[i + 1][0]) {
        stage.addActor(new PathLine({ x: (path[i][1] + 1) * 50 - 25, y: (path[i][0] + 1) * 50 - 25, width: 50, height: 3 }), 7);
    }
    else if (path[i][1] == path[i + 1][1]) {
        stage.addActor(new PathLine({ x: (path[i][1] + 1) * 50 - 25, y: (path[i][0] + 1) * 50 - 25, width: 3, height: 50 }), 7);
    }
}
*/

stage.addActor(new EndPoint(11, 11), 8);
stage.addActor(spawner1, 8);
stage.addActor(spawner2, 8);
stage.addActor(spawner3, 8);

stage.start();