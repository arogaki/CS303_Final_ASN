# WebGL 3D Maze Generator with Pathfinding

A sophisticated 3D maze visualization application built with WebGL, featuring dynamic maze generation, pathfinding algorithms, and interactive camera controls. This project demonstrates comprehensive computer graphics concepts from Dave Shreiner's "Interactive Computer Graphics" textbook.

## 🎯 Features Overview & Textbook Connections

### 1. **Dynamic Maze Generation Algorithm**
- **Implementation**: `maze.js` lines 138-196
- **Algorithm**: Randomized Depth-First Search (DFS)
- **Code Breakdown**:
```javascript
// Initialize maze grid with all walls intact (lines 142-152)
for (let i = 0; i < mazeSize; i++) {
    maze[i] = [];
    for (let j = 0; j < mazeSize; j++) {
        maze[i][j] = {
            visited: false,
            walls: [true, true, true, true] // [top, right, bottom, left]
        };
    }
}

// Stack-based DFS implementation (lines 154-185)
const stack = [];
maze[startY][startX].visited = true;
stack.push({x: startX, y: startY});

while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current.x, current.y);
    
    if (neighbors.length > 0) {
        // Choose random neighbor and carve path
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const next = neighbors[randomIndex];
        removeWallBetween(current, next);
        maze[next.y][next.x].visited = true;
        stack.push(next);
    } else {
        stack.pop(); // Backtrack
    }
}
```

### 2. **Pathfinding System**
- **Implementation**: `maze.js` lines 253-320
- **Algorithm**: Breadth-First Search (BFS)
- **Code Breakdown**:
```javascript
// BFS queue initialization (lines 256-265)
// We will use it for main character and enemy
const queue = [];
const visited = Array(mazeSize).fill().map(() => Array(mazeSize).fill(false));
const parent = Array(mazeSize).fill().map(() => Array(mazeSize).fill(null));

// BFS traversal (lines 273-300)
while (queue.length > 0) {
    const current = queue.shift();
    
    if (current.x === mazeSize - 1 && current.y === mazeSize - 1) {
        break; // Found exit
    }
    
    // Check all four directions
    for (let i = 0; i < 4; i++) {
        if (!maze[current.y][current.x].walls[i]) { // No wall in this direction
            const newX = current.x + dx[i];
            const newY = current.y + dy[i];
            
            if (!visited[newY][newX]) {
                visited[newY][newX] = true;
                parent[newY][newX] = {x: current.x, y: current.y};
                queue.push({x: newX, y: newY});
            }
        }
    }
}

// Path reconstruction (lines 302-312)
let current = {x: mazeSize - 1, y: mazeSize - 1};
let newPath = [current];
while (current.x !== startX || current.y !== startY) {
    current = parent[current.y][current.x];
    newPath.push(current);
}
newPath.reverse();
```

### 3. **3D Geometry Generation**
- **Implementation**: `maze.js` lines 337-508
- **Wall Creation Logic** (lines 428-508):
```javascript
function createWall(vertices, normals, colors, indices, x1, y, z1, x2, y, z2, indexOffset) {
    const isHorizontal = z1 === z2;
    
    if (isHorizontal) {
        // Horizontal wall vertices (8 vertices for 3D box)
        vertices.push(
            vec4(x1, y, z1, 1.0),                           // bottom left
            vec4(x2, y, z2, 1.0),                           // bottom right
            vec4(x2, y + wallHeight, z2, 1.0),              // top right
            vec4(x1, y + wallHeight, z1, 1.0),              // top left
            vec4(x1, y, z1 - wallThickness, 1.0),           // back bottom left
            vec4(x2, y, z2 - wallThickness, 1.0),           // back bottom right
            vec4(x2, y + wallHeight, z2 - wallThickness, 1.0), // back top right
            vec4(x1, y + wallHeight, z1 - wallThickness, 1.0)  // back top left
        );
        
        // Normal vectors for lighting calculations
        normals.push(vec4(0, 0, 1, 0));  // Front face normal
        normals.push(vec4(0, 0, 1, 0));
        // ... (repeated for all vertices)
    }
    
    // Index generation for triangulation (lines 490-508)
    const faces = [
        [0, 1, 2, 3],     // Front face
        [4, 5, 6, 7],     // Back face
        [3, 2, 6, 7],     // Top face
        [0, 1, 5, 4],     // Bottom face
        [1, 2, 6, 5],     // Right face
        [0, 3, 7, 4]      // Left face
    ];
    
    for (const face of faces) {
        indices.push(
            face[0] + indexOffset, face[1] + indexOffset, face[2] + indexOffset,
            face[0] + indexOffset, face[2] + indexOffset, face[3] + indexOffset
        );
    }
}
```

### 4. **Camera System Implementation**
- **Implementation**: `maze.js` lines 581-608
- **Mathematical Foundation**:
```javascript
function updateCamera() {
    const rad = cameraAngle * Math.PI / 180.0;
    
    // Spherical coordinate conversion (Chapter 5.3 - Positioning of the Camera)
    const baseDistance = 3.0;
    const distance = baseDistance + (mazeSize - 10) * 0.2; // Dynamic scaling
    
    // Minimum angle offset to prevent gimbal lock-like issues
    const minAngleOffset = 0.1;
    const adjustedRad = Math.max(rad, minAngleOffset);
    
    // Eye position calculation using trigonometry
    eye = vec3(
        distance * Math.sin(adjustedRad), // X component
        distance * Math.cos(adjustedRad), // Y component (elevation)
        0                                 // Z component (fixed)
    );
    
    at = vec3(0, 0, 0);  // Look-at point (maze center)
    up = vec3(0, 1, 0);  // Consistent up vector
}
```

### 5. **Lighting System (Phong Model)**
- **Vertex Shader** (`index.html` lines 78-102):
```glsl
attribute vec4 vPosition;
attribute vec4 vNormal;
attribute vec4 vColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 fNormal;
varying vec3 fPosition;
varying vec4 fColor;

void main() {
    // Transform vertex to eye coordinates (Chapter 5.7)
    fPosition = (modelViewMatrix * vPosition).xyz;
    
    // Transform normal to eye coordinates (Chapter 6.4.1)
    fNormal = normalMatrix * vNormal.xyz;
    
    fColor = vColor;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}
```

- **Fragment Shader** (`index.html` lines 104-157):
```glsl
precision mediump float;

varying vec3 fNormal;
varying vec3 fPosition;
varying vec4 fColor;

uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;
uniform float shininess;
uniform vec4 lightPosition;
uniform float brightness;

void main() {
    vec3 N = normalize(fNormal);
    vec3 L = normalize(lightPosition.xyz);  // Light direction
    vec3 V = normalize(-fPosition);         // View direction
    vec3 R = reflect(-L, N);                // Reflection vector
    
    // Phong lighting model components (Chapter 6.3)
    vec4 ambient = ambientProduct;
    
    float Kd = max(dot(L, N), 0.0);
    vec4 diffuse = Kd * diffuseProduct;
    
    float Ks = pow(max(dot(V, R), 0.0), shininess);
    vec4 specular = Ks * specularProduct;
    
    vec4 color = fColor * (ambient + diffuse + specular);
    gl_FragColor = vec4(color.rgb * brightness, color.a);
}
```

### 6. **WebGL Buffer Management**
- **Implementation**: `maze.js` lines 409-427
```javascript
function createWallsGeometry() {
    // Vertex data arrays
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // ... geometry generation ...
    
    // Buffer creation and data upload (Chapter 2.8.1)
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
}
```

### 7. **Rendering Pipeline**
**Textbook Reference**: Chapter 12 - From Geometry to Pixels
- **Implementation**: `maze.js` lines 609-664
```javascript
function render(timestamp) {
    // Clear buffers (Chapter 12.2.4)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    updateCamera();
    
    // Matrix calculations (Chapter 4.11)
    const modelViewMatrix = lookAt(eye, at, up);
    const projectionMatrix = perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    
    // Uniform matrix uploads
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), 
                       false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), 
                       false, flatten(projectionMatrix));
    
    // Normal matrix for lighting (Chapter 6.4.1)
    const normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), 
                       false, flatten(normalMatrix));
    
    // Lighting parameters (Chapter 6.7)
    const ambientProduct = mult(ambientColor, materialAmbient);
    const diffuseProduct = mult(diffuseColor, materialDiffuse);
    const specularProduct = mult(specularColor, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    gl.uniform1f(gl.getUniformLocation(program, "brightness"), brightness);
    
    drawWalls();
    requestAnimationFrame(render);
}
```

### 8. **Event-Driven User Interface**
**Textbook Reference**: Chapter 3 - Interaction and Animation
- **Implementation**: `maze.js` lines 67-105
```javascript
// Maze size control (Chapter 3.5.5 - Sliders)
document.getElementById("mazeSize").addEventListener("input", function(event) {
    mazeSize = parseInt(event.target.value);
    document.getElementById("sizeValue").textContent = mazeSize;
    document.getElementById("sizeValueCopy").textContent = mazeSize;
    console.log("Maze size changed to:", mazeSize + "×" + mazeSize);
});

// Camera angle control
document.getElementById("cameraAngle").addEventListener("input", function(event) {
    cameraAngle = event.target.value;
    document.getElementById("angleValue").textContent = cameraAngle;
    updateCamera();
});

// Light direction controls (Chapter 3.5.3 - Radio buttons)
const lightDirectionRadios = document.querySelectorAll('input[name="lightDirection"]');
lightDirectionRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        updateLightDirection(this.value);
    });
});

### **Single Draw Call Optimization**
- All maze walls rendered in single `drawElements` call
- Geometry batching reduces GPU state changes
- Index buffer usage for vertex reuse

### **Dynamic Scaling Algorithm**
```javascript
// Camera distance scales with maze size
const distance = baseDistance + (mazeSize - 10) * 0.2;
```

## 📁 File Architecture

```
├── index.html          # HTML structure, vertex/fragment shaders, UI controls
├── maze.js            # Core application logic, WebGL implementation, algorithms
├── initShaders.js     # Shader compilation and linking utilities
├── MVnew.js          # Matrix and vector mathematics library
└── README.md         # This comprehensive documentation
```

## 🚀 Usage & Controls

1. **Maze Size Adjustment**: 5×5 to 25×25 grid dimensions
2. **Camera Control**: 0° (near top-down) to 90° (side view)
3. **Lighting Control**: Brightness and directional lighting
4. **Maze Regeneration**: Create new random layouts
5. **Real-time Interaction**: All controls update immediately
