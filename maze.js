/**
 * WebGL Maze with Pathfinding - maze.js
 * 
 * This file contains:
 * 1. WebGL initialization
 * 2. Maze generation using randomized DFS
 * 3. Maze geometry creation and rendering
 * 4. Sphere geometry creation and animation
 * 5. Pathfinding solver
 * 6. Phong shading implementation
 */

// Global variables
let gl;                       // WebGL context
let program;                  // Shader program
let maze = [];                // Maze grid
const mazeSize = 10;          // Size of the maze (NxN)
const cellSize = 0.18;        // Size of each cell
const wallHeight = 0.1;       // Height of the walls
const wallThickness = 0.02;   // Thickness of the walls

// Sphere animation variables
let spherePosition = [];      // Current position of the sphere
let path = [];                // Path from start to end
let pathIndex = 0;            // Current index in the path
let animationSpeed = 0.005;   // Speed of animation
let lastTime = 0;             // Time of last frame

// Camera and view variables
let cameraAngle = 90;         // Camera angle in degrees
let eye = vec3(0, 2, 0);      // Camera position
let at = vec3(0, 0, 0);       // Look-at point
let up = vec3(0, 0, -1);      // Up vector

// Lighting parameters
const lightPosition = vec4(1.0, 2.0, 1.0, 0.0);  // Directional light
const ambientColor = vec4(0.2, 0.2, 0.2, 1.0);
const diffuseColor = vec4(0.8, 0.8, 0.8, 1.0);
const specularColor = vec4(1.0, 1.0, 1.0, 1.0);
const materialAmbient = vec4(0.2, 0.2, 0.2, 1.0);
const materialDiffuse = vec4(0.8, 0.8, 0.8, 1.0);
const materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
const materialShininess = 100.0;

// Visual control variables
let brightness = 1.0;         // Brightness control value

// Buffer objects
let wallsBuffer;
let wallsNormalBuffer;
let wallsColorBuffer;
let wallsIndexBuffer;
let wallsCount = 0;

let sphereBuffer;
let sphereNormalBuffer;
let sphereColorBuffer;
let sphereIndexBuffer;
let sphereCount = 0;

// Initialize WebGL when the page loads
window.onload = function init() {
    // Get the canvas element and set up WebGL context
    const canvas = document.getElementById("gl-canvas");
    
    // Set canvas to 80% of window dimensions for a smaller view
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    
    if (!gl) {
        alert("WebGL is not available");
        return;
    }
    
    // Set the viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    // Initialize shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Set up camera angle control
    document.getElementById("cameraAngle").addEventListener("input", function(event) {
        cameraAngle = event.target.value;
        document.getElementById("angleValue").textContent = cameraAngle;
        updateCamera();
    });
    
    // Set up brightness control
    document.getElementById("brightness").addEventListener("input", function(event) {
        brightness = event.target.value;
        document.getElementById("brightnessValue").textContent = parseFloat(brightness).toFixed(1);
    });
    
    // Generate the maze
    generateMaze();
    
    // Solve the maze to find a path
    solveMaze();
    
    // Create the geometry for the walls and sphere
    createGeometry();
    
    // Handle window resizing
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
    
    // Start the rendering loop
    render();
};

// Generate a random maze using the Depth-First Search algorithm
function generateMaze() {
    // Initialize maze grid with all walls intact
    for (let i = 0; i < mazeSize; i++) {
        maze[i] = [];
        for (let j = 0; j < mazeSize; j++) {
            maze[i][j] = {
                visited: false,
                // Walls: [top, right, bottom, left]
                walls: [true, true, true, true]
            };
        }
    }
    
    // Stack for DFS
    const stack = [];
    
    // Start at a random cell
    const startX = 0;
    const startY = 0;
    spherePosition = [startX, startY];
    
    // Mark the start cell as visited
    maze[startY][startX].visited = true;
    stack.push({x: startX, y: startY});
    
    // While there are unvisited cells
    while (stack.length > 0) {
        // Get the current cell
        const current = stack[stack.length - 1];
        
        // Get unvisited neighbors
        const neighbors = getUnvisitedNeighbors(current.x, current.y);
        
        if (neighbors.length > 0) {
            // Choose a random neighbor
            const randomIndex = Math.floor(Math.random() * neighbors.length);
            const next = neighbors[randomIndex];
            
            // Remove the wall between current and chosen neighbor
            removeWallBetween(current, next);
            
            // Mark the chosen neighbor as visited
            maze[next.y][next.x].visited = true;
            
            // Push the chosen neighbor to the stack
            stack.push(next);
        } else {
            // Backtrack
            stack.pop();
        }
    }
    
    // Set entrance and exit
    maze[0][0].walls[3] = false; // Remove left wall at entrance
    maze[mazeSize-1][mazeSize-1].walls[1] = false; // Remove right wall at exit
}

// Get unvisited neighbors of a cell
function getUnvisitedNeighbors(x, y) {
    const neighbors = [];
    
    // Directions: [up, right, down, left]
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];
    
    for (let i = 0; i < 4; i++) {
        const newX = x + dx[i];
        const newY = y + dy[i];
        
        if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && !maze[newY][newX].visited) {
            neighbors.push({x: newX, y: newY, direction: i});
        }
    }
    
    return neighbors;
}

// Remove the wall between two cells
function removeWallBetween(a, b) {
    // Determine which walls to remove based on the direction
    if (b.direction === 0) { // Up
        maze[a.y][a.x].walls[0] = false;
        maze[b.y][b.x].walls[2] = false;
    } else if (b.direction === 1) { // Right
        maze[a.y][a.x].walls[1] = false;
        maze[b.y][b.x].walls[3] = false;
    } else if (b.direction === 2) { // Down
        maze[a.y][a.x].walls[2] = false;
        maze[b.y][b.x].walls[0] = false;
    } else if (b.direction === 3) { // Left
        maze[a.y][a.x].walls[3] = false;
        maze[b.y][b.x].walls[1] = false;
    }
}

// Solve the maze using BFS to find the shortest path
function solveMaze() {
    // Queue for BFS
    const queue = [];
    
    // Visited cells
    const visited = Array(mazeSize).fill().map(() => Array(mazeSize).fill(false));
    
    // Parent cells (to reconstruct the path)
    const parent = Array(mazeSize).fill().map(() => Array(mazeSize).fill(null));
    
    // Start at the entrance
    const startX = 0;
    const startY = 0;
    visited[startY][startX] = true;
    queue.push({x: startX, y: startY});
    
    // Directions: [up, right, down, left]
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];
    
    // BFS to find the path
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Check if we've reached the exit
        if (current.x === mazeSize - 1 && current.y === mazeSize - 1) {
            break;
        }
        
        // Check each direction
        for (let i = 0; i < 4; i++) {
            // Skip if there's a wall in this direction
            if (maze[current.y][current.x].walls[i]) {
                continue;
            }
            
            const newX = current.x + dx[i];
            const newY = current.y + dy[i];
            
            // Skip if out of bounds or already visited
            if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize || visited[newY][newX]) {
                continue;
            }
            
            // Mark as visited
            visited[newY][newX] = true;
            
            // Save the parent
            parent[newY][newX] = {x: current.x, y: current.y};
            
            // Add to queue
            queue.push({x: newX, y: newY});
        }
    }
    
    // Reconstruct the path from exit to entrance
    let current = {x: mazeSize - 1, y: mazeSize - 1};
    path = [current];
    
    while (current.x !== startX || current.y !== startY) {
        current = parent[current.y][current.x];
        path.push(current);
    }
    
    // Reverse the path to go from entrance to exit
    path.reverse();
}

// Create the geometry for the walls and sphere
function createGeometry() {
    createWallsGeometry();
    createSphereGeometry();
}

// Create the geometry for the maze walls
function createWallsGeometry() {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    let indexOffset = 0;
    
    // Calculate maze center offset
    const offsetX = -((mazeSize * cellSize) / 2);
    const offsetZ = -((mazeSize * cellSize) / 2);
    
    // Create walls for each cell
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            const x = j * cellSize + offsetX;
            const z = i * cellSize + offsetZ;
            
            // Create each wall if it exists
            if (maze[i][j].walls[0]) { // Top wall
                createWall(
                    vertices, normals, colors, indices,
                    x, 0, z,
                    x + cellSize, 0, z,
                    indexOffset
                );
                indexOffset += 8; // 8 vertices per wall
            }
            
            if (maze[i][j].walls[1]) { // Right wall
                createWall(
                    vertices, normals, colors, indices,
                    x + cellSize, 0, z,
                    x + cellSize, 0, z + cellSize,
                    indexOffset
                );
                indexOffset += 8;
            }
            
            if (maze[i][j].walls[2]) { // Bottom wall
                createWall(
                    vertices, normals, colors, indices,
                    x, 0, z + cellSize,
                    x + cellSize, 0, z + cellSize,
                    indexOffset
                );
                indexOffset += 8;
            }
            
            if (maze[i][j].walls[3]) { // Left wall
                createWall(
                    vertices, normals, colors, indices,
                    x, 0, z,
                    x, 0, z + cellSize,
                    indexOffset
                );
                indexOffset += 8;
            }
        }
    }
    
    // Create floor
    const floorSize = mazeSize * cellSize;
    createFloor(
        vertices, normals, colors, indices,
        offsetX, -wallHeight/2, offsetZ,
        floorSize, wallHeight/2, floorSize,
        indexOffset
    );
    
    // Set up buffer objects
    wallsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    wallsNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    wallsColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    wallsIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallsIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    wallsCount = indices.length;
}

// Create a wall segment
function createWall(vertices, normals, colors, indices, x1, y, z1, x2, y, z2, indexOffset) {
    // Calculate the direction of the wall
    const isHorizontal = z1 === z2;
    
    // Set up vertices for a 3D wall
    if (isHorizontal) {
        // Horizontal wall (along x-axis)
        vertices.push(
            vec4(x1, y, z1, 1.0),                           // 0: bottom left
            vec4(x2, y, z2, 1.0),                           // 1: bottom right
            vec4(x2, y + wallHeight, z2, 1.0),              // 2: top right
            vec4(x1, y + wallHeight, z1, 1.0),              // 3: top left
            vec4(x1, y, z1 - wallThickness, 1.0),           // 4: back bottom left
            vec4(x2, y, z2 - wallThickness, 1.0),           // 5: back bottom right
            vec4(x2, y + wallHeight, z2 - wallThickness, 1.0), // 6: back top right
            vec4(x1, y + wallHeight, z1 - wallThickness, 1.0)  // 7: back top left
        );
        
        // Normals
        normals.push(vec4(0, 0, 1, 0));  // Front face
        normals.push(vec4(0, 0, 1, 0));
        normals.push(vec4(0, 0, 1, 0));
        normals.push(vec4(0, 0, 1, 0));
        normals.push(vec4(0, 0, -1, 0)); // Back face
        normals.push(vec4(0, 0, -1, 0));
        normals.push(vec4(0, 0, -1, 0));
        normals.push(vec4(0, 0, -1, 0));
    } else {
        // Vertical wall (along z-axis)
        vertices.push(
            vec4(x1, y, z1, 1.0),                           // 0: bottom left
            vec4(x1, y, z2, 1.0),                           // 1: bottom right
            vec4(x1, y + wallHeight, z2, 1.0),              // 2: top right
            vec4(x1, y + wallHeight, z1, 1.0),              // 3: top left
            vec4(x1 - wallThickness, y, z1, 1.0),           // 4: back bottom left
            vec4(x1 - wallThickness, y, z2, 1.0),           // 5: back bottom right
            vec4(x1 - wallThickness, y + wallHeight, z2, 1.0), // 6: back top right
            vec4(x1 - wallThickness, y + wallHeight, z1, 1.0)  // 7: back top left
        );
        
        // Normals
        normals.push(vec4(1, 0, 0, 0));  // Front face
        normals.push(vec4(1, 0, 0, 0));
        normals.push(vec4(1, 0, 0, 0));
        normals.push(vec4(1, 0, 0, 0));
        normals.push(vec4(-1, 0, 0, 0)); // Back face
        normals.push(vec4(-1, 0, 0, 0));
        normals.push(vec4(-1, 0, 0, 0));
        normals.push(vec4(-1, 0, 0, 0));
    }
    
    // Colors (gray for walls)
    const wallColor = vec4(0.7, 0.7, 0.7, 1.0); // Brighter gray for better visibility
    for (let i = 0; i < 8; i++) {
        colors.push(wallColor);
    }
    
    // Indices for all faces
    const faces = [
        [0, 1, 2, 3],     // Front face
        [4, 5, 6, 7],     // Back face
        [3, 2, 6, 7],     // Top face
        [0, 1, 5, 4],     // Bottom face
        [1, 2, 6, 5],     // Right face
        [0, 3, 7, 4]      // Left face
    ];
    
    // Add indices for each face
    for (const face of faces) {
        indices.push(
            face[0] + indexOffset,
            face[1] + indexOffset,
            face[2] + indexOffset,
            face[0] + indexOffset,
            face[2] + indexOffset,
            face[3] + indexOffset
        );
    }
}

// Create a floor
function createFloor(vertices, normals, colors, indices, x, y, z, width, height, depth, indexOffset) {
    // Vertices for the floor
    vertices.push(
        vec4(x, y, z, 1.0),                    // 0: bottom front left
        vec4(x + width, y, z, 1.0),            // 1: bottom front right
        vec4(x + width, y, z + depth, 1.0),    // 2: bottom back right
        vec4(x, y, z + depth, 1.0),            // 3: bottom back left
        vec4(x, y + height, z, 1.0),           // 4: top front left
        vec4(x + width, y + height, z, 1.0),   // 5: top front right
        vec4(x + width, y + height, z + depth, 1.0), // 6: top back right
        vec4(x, y + height, z + depth, 1.0)    // 7: top back left
    );
    
    // Normals
    // Top face
    normals.push(vec4(0, 1, 0, 0));
    normals.push(vec4(0, 1, 0, 0));
    normals.push(vec4(0, 1, 0, 0));
    normals.push(vec4(0, 1, 0, 0));
    // Bottom face
    normals.push(vec4(0, -1, 0, 0));
    normals.push(vec4(0, -1, 0, 0));
    normals.push(vec4(0, -1, 0, 0));
    normals.push(vec4(0, -1, 0, 0));
    
    // Colors (dark gray for the floor)
    const floorColor = vec4(0.3, 0.3, 0.3, 1.0);
    for (let i = 0; i < 8; i++) {
        colors.push(floorColor);
    }
    
    // Indices for the top face (only rendering top face)
    indices.push(
        4 + indexOffset,
        5 + indexOffset,
        6 + indexOffset,
        4 + indexOffset,
        6 + indexOffset,
        7 + indexOffset
    );
}

// Create a sphere for the path follower
function createSphereGeometry() {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // Sphere parameters
    const radius = 0.04;
    const latitudeBands = 20;
    const longitudeBands = 20;
    
    // Generate sphere vertices
    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let long = 0; long <= longitudeBands; long++) {
            const phi = long * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            // Calculate vertex position
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            // Add vertex and normal
            vertices.push(vec4(radius * x, radius * y, radius * z, 1.0));
            normals.push(vec4(x, y, z, 0.0));
            
            // Color (red for the sphere)
            colors.push(vec4(1.0, 0.0, 0.0, 1.0));
        }
    }
    
    // Generate indices
    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let long = 0; long < longitudeBands; long++) {
            const first = lat * (longitudeBands + 1) + long;
            const second = first + longitudeBands + 1;
            
            indices.push(first);
            indices.push(second);
            indices.push(first + 1);
            
            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }
    
    // Set up buffer objects
    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    sphereNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    sphereColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    sphereCount = indices.length;
}

// Update the camera position based on the camera angle
function updateCamera() {
    // FIX: Fix the function name collision by using Math.PI directly
    const rad = cameraAngle * Math.PI / 180.0;
    
    eye = vec3(
        2 * Math.sin(rad),
        2 * Math.cos(rad),
        0
    );
    
    // Keep the camera pointed at the center of the maze
    at = vec3(0, 0, 0);
    
    // Adjust the up vector based on camera angle
    if (cameraAngle < 45) {
        up = vec3(0, 0, -1);
    } else {
        up = vec3(0, 1, 0);
    }
}

// Render the scene
function render(timestamp) {
    // Calculate time delta
    if (!lastTime) {
        lastTime = timestamp || 0;
    }
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Update camera position
    updateCamera();
    
    // Set up view and projection matrices
    const modelViewMatrix = lookAt(eye, at, up);
    const projectionMatrix = perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    
    // Set uniform matrices
    const modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    const projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    // Set up normal matrix
    const normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    const normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
    
    // Set up lighting
    const ambientProduct = mult(ambientColor, materialAmbient);
    const diffuseProduct = mult(diffuseColor, materialDiffuse);
    const specularProduct = mult(specularColor, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    
    // Set brightness uniform
    gl.uniform1f(gl.getUniformLocation(program, "brightness"), brightness);
    
    // Draw the walls
    drawWalls();
    
    // Update and draw the sphere
    updateSpherePosition(deltaTime);
    drawSphere();
    
    // Request next frame
    requestAnimationFrame(render);
}

// Draw the maze walls
function drawWalls() {
    // Set up vertex position attribute
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Set up normal attribute
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsNormalBuffer);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    // Set up color attribute
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsColorBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    // Draw the walls
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallsIndexBuffer);
    gl.drawElements(gl.TRIANGLES, wallsCount, gl.UNSIGNED_SHORT, 0);
}

// Draw the sphere
function drawSphere() {
    // Set up vertex position attribute
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Set up normal attribute
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    // Set up color attribute
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    // Calculate sphere position
    const offsetX = -((mazeSize * cellSize) / 2);
    const offsetZ = -((mazeSize * cellSize) / 2);
    
    const x = (spherePosition[0] + 0.5) * cellSize + offsetX;
    const y = wallHeight / 2 + 0.04; // Just above the floor
    const z = (spherePosition[1] + 0.5) * cellSize + offsetZ;
    
    // Apply model transformation to the sphere
    const sphereModelView = mult(lookAt(eye, at, up), translate(x, y, z));
    
    // Update the model-view matrix
    const modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(sphereModelView));
    
    // Update normal matrix for the sphere
    const normalMatrix = [
        vec3(sphereModelView[0][0], sphereModelView[0][1], sphereModelView[0][2]),
        vec3(sphereModelView[1][0], sphereModelView[1][1], sphereModelView[1][2]),
        vec3(sphereModelView[2][0], sphereModelView[2][1], sphereModelView[2][2])
    ];
    const normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
    
    // Draw the sphere
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereCount, gl.UNSIGNED_SHORT, 0);
}

// Update the sphere position along the path
function updateSpherePosition(deltaTime) {
    if (pathIndex >= path.length - 1) {
        // Restart animation when reached the end
        pathIndex = 0;
        spherePosition = [path[0].x, path[0].y];
        return;
    }
    
    // Current and next positions in the path
    const current = path[pathIndex];
    const next = path[pathIndex + 1];
    
    // Linear interpolation between current and next
    const t = animationSpeed * deltaTime;
    
    // Update position
    spherePosition[0] += (next.x - spherePosition[0]) * t;
    spherePosition[1] += (next.y - spherePosition[1]) * t;
    
    // Check if close enough to the next position
    const dx = next.x - spherePosition[0];
    const dy = next.y - spherePosition[1];
    const distSquared = dx * dx + dy * dy;
    
    if (distSquared < 0.001) {
        // Move to the next position in the path
        pathIndex++;
    }
} 