/**
 * WebGL Maze with Pathfinding - maze.js
 * 
 * This file contains:
 * 1. WebGL initialization
 * 2. Maze generation using randomized DFS
 * 3. Maze geometry creation and rendering
 * 4. Phong shading implementation
 */

// Global variables
let gl;                       // WebGL context
let program;                  // Shader program
let maze = [];                // Maze grid
const mazeSize = 10;          // Size of the maze (NxN)
const cellSize = 0.15;        // Size of each cell
const wallHeight = 0.1;       // Height of the walls
const wallThickness = 0.02;   // Thickness of the walls

// Time tracking for animation
let lastTime = 0;             // Time of last frame

// Camera and view variables
let cameraAngle = 90;         // Camera angle in degrees
let eye = vec3(0, 2, 0);      // Camera position
let at = vec3(0, 0, 0);       // Look-at point
let up = vec3(0, 0, -1);      // Up vector

// Lighting parameters
let lightPosition = vec4(0.0, 2.0, 0.0, 0.0);  // Directional light, default from top
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
    
    // Set up light direction controls
    const lightDirectionRadios = document.querySelectorAll('input[name="lightDirection"]');
    lightDirectionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateLightDirection(this.value);
        });
    });
    
    // Initial light direction setup
    updateLightDirection('top');
    
    // Set up regenerate maze button
    document.getElementById("regenerate").addEventListener("click", regenerateMaze);
    
    // Generate the initial maze
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

// Regenerate the maze
function regenerateMaze() {
    console.log("Regenerating maze");
    
    // Generate new maze
    generateMaze();
    
    // Solve the new maze
    solveMaze();
    
    // Recreate geometry
    createGeometry();
}

// Generate a random maze using the Depth-First Search algorithm
function generateMaze() {
    // Clear existing maze if any
    maze = [];
    
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
    
    // Start at the entrance (top-left)
    const startX = 0;
    const startY = 0;
    
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
    
    // Shuffle directions for more randomness
    const directions = [0, 1, 2, 3];
    shuffleArray(directions);
    
    // Check each direction in random order
    for (let i = 0; i < 4; i++) {
        const dir = directions[i];
        const newX = x + dx[dir];
        const newY = y + dy[dir];
        
        if (newX >= 0 && newX < mazeSize && 
            newY >= 0 && newY < mazeSize && 
            !maze[newY][newX].visited) {
            neighbors.push({x: newX, y: newY, direction: dir});
        }
    }
    
    return neighbors;
}

// Shuffle array elements using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
    let newPath = [current];
    
    while (current.x !== startX || current.y !== startY) {
        current = parent[current.y][current.x];
        newPath.push(current);
    }
    
    // Reverse the path to go from entrance to exit
    newPath.reverse();
}

// Create the geometry for the walls and sphere
function createGeometry() {
    console.log("Creating geometry");
    
    // Clear existing buffers if they exist
    if (wallsBuffer) {
        gl.deleteBuffer(wallsBuffer);
        gl.deleteBuffer(wallsNormalBuffer);
        gl.deleteBuffer(wallsColorBuffer);
        gl.deleteBuffer(wallsIndexBuffer);
    }
    
    createWallsGeometry();
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

/**
 * Update the light direction based on the selected option
 * @param {String} direction - Direction option ('top', 'topRight', or 'topLeft')
 */
function updateLightDirection(direction) {
    console.log("Updating light direction to:", direction);
    
    // Reset light position based on selected direction
    switch(direction) {
        case 'top':
            // Light directly from above (reversed Y direction)
            lightPosition = vec4(0.0, -2.0, 0.0, 0.0);
            break;
        case 'topRight':
            // Light from top-right (reversed Y d2irection)
            lightPosition = vec4(1.5, -2.0, 1.5, 0.0);
            break;
        case 'topLeft':
            // Light from top-left (reversed Y direction)
            lightPosition = vec4(-1.5, -2.0, 1.5, 0.0);
            break;
        default:
            // Default to top if unknown value (reversed Y direction)
            lightPosition = vec4(0.0, -2.0, 0.0, 0.0);
    }
    
    // No need to call render explicitly as it will update on the next animation frame
}

// Update the camera position based on the camera angle
function updateCamera() {
    // Convert angle to radians (0° = top view, 90° = side view)
    const rad = cameraAngle * Math.PI / 180.0;
    
    // Calculate camera position with elevation change
    // At 0°: camera is directly above (0, 3, 0)
    // At 90°: camera is at side level (3, 0, 0)
    const distance = 3.0; // Distance from maze center
    
    eye = vec3(
        distance * Math.sin(rad), // X position: 0 at top, max at side
        distance * Math.cos(rad), // Y position: max at top, 0 at side
        0                         // Z position: always 0 (looking along Z-axis)
    );
    
    // Always look at the center of the maze
    at = vec3(0, 0, 0);
    
    // Simple, consistent up vector
    // Always point "up" in the world Y direction
    up = vec3(0, 1, 0);
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