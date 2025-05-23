/**
 * WebGL Maze Ball - ball.js
 * 
 * This file contains:
 * 1. Ball geometry creation
 * 2. Ball rendering
 * 3. Ball animation along path
 */

// Create a global Ball object immediately
window.Ball = {};

(function() {
    // Private variables
    let gl;                       // WebGL context
    let program;                  // Shader program
    let spherePosition = [];      // Current position of the sphere
    let path = [];                // Path from start to end
    let pathIndex = 0;            // Current index in the path
    let animationSpeed = 0.005;   // Speed of animation
    let lastTime = 0;             // Time of last frame

    // Buffer objects
    let sphereBuffer;
    let sphereNormalBuffer;
    let sphereColorBuffer;
    let sphereIndexBuffer;
    let sphereCount = 0;

    // Maze properties needed for ball positioning
    let mazeSize;
    let cellSize;
    let wallHeight;

    /**
     * Initialize the ball module
     * @param {WebGLRenderingContext} glContext - WebGL context
     * @param {WebGLProgram} shaderProgram - Shader program
     * @param {Number} mazeSizeParam - Size of the maze grid
     * @param {Number} cellSizeParam - Size of each cell
     * @param {Number} wallHeightParam - Height of walls
     */
    function initBall(glContext, shaderProgram, mazeSizeParam, cellSizeParam, wallHeightParam) {
        gl = glContext;
        program = shaderProgram;
        mazeSize = mazeSizeParam;
        cellSize = cellSizeParam;
        wallHeight = wallHeightParam;
        
        // Initial position will be set when maze is generated
        spherePosition = [0, 0];
        console.log("Ball initialized with: ", mazeSizeParam, cellSizeParam, wallHeightParam);
    }

    /**
     * Set the path for the ball to follow
     * @param {Array} newPath - Array of points forming the path
     */
    function setPath(newPath) {
        path = newPath;
        pathIndex = 0;
        if (path && path.length > 0) {
            spherePosition = [path[0].x, path[0].y];
            console.log("Ball path set, length: ", path.length);
        } else {
            console.error("Attempting to set empty or invalid path");
        }
    }

    /**
     * Reset the ball position to the start of the path
     */
    function resetBallPosition() {
        pathIndex = 0;
        if (path && path.length > 0) {
            spherePosition = [path[0].x, path[0].y];
            console.log("Ball position reset");
        } else {
            console.error("Attempting to reset position with empty path");
        }
    }

    /**
     * Create a sphere for the path follower
     */
    function createSphereGeometry() {
        if (!gl) {
            console.error("WebGL context not initialized in ball.js");
            return;
        }
        
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
        
        // Clean up existing buffers if they exist
        if (sphereBuffer) {
            gl.deleteBuffer(sphereBuffer);
            gl.deleteBuffer(sphereNormalBuffer);
            gl.deleteBuffer(sphereColorBuffer);
            gl.deleteBuffer(sphereIndexBuffer);
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
        console.log("Sphere geometry created, vertex count: ", vertices.length);
    }

    /**
     * Draw the sphere
     * @param {Array} eye - Camera position
     * @param {Array} at - Look-at point
     * @param {Array} up - Up vector
     */
    function drawSphere(eye, at, up) {
        if (!gl || !program || !sphereBuffer) {
            console.error("Cannot draw sphere: missing initialization");
            return;
        }
        
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

    /**
     * Update the sphere position along the path
     * @param {Number} deltaTime - Time since last update
     */
    function updateSpherePosition(deltaTime) {
        if (!path || path.length < 2) {
            console.error("Cannot update sphere: invalid path");
            return;
        }
        
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

    // Expose functions to the global Ball object
    Ball.initBall = initBall;
    Ball.setPath = setPath;
    Ball.resetBallPosition = resetBallPosition;
    Ball.createSphereGeometry = createSphereGeometry;
    Ball.drawSphere = drawSphere;
    Ball.updateSpherePosition = updateSpherePosition;
    
    console.log("Ball.js module loaded");
})(); 