# CS303_Final_ASN(Aran, Shuja, Nairran)
# WebGL 3D Maze Game

A sophisticated 3D maze game built with WebGL featuring dynamic maze generation, intelligent AI ghosts, particle effects, and immersive 3D graphics with realistic lighting.

WebGL 3D Maze Game

## 🎮 Features

### Core Gameplay
- **3D First-Person Navigation**: Navigate through a 3D maze using WASD controls
- **Multiple Game Objectives**: Collect all pellets while avoiding intelligent AI ghosts
- **Power-Up System**: Collect power pellets to temporarily turn ghosts vulnerable
- **Dash Mechanic**: Space key activates a 1.5x speed boost for 3 seconds (20-second cooldown)
- **Lives System**: Start with 3 lives, lose one when caught by ghosts
- **Scoring System**: Earn points for collecting pellets (10 pts) and power pellets (50 pts), with bonus multipliers for eating ghosts

### Maze Generation Algorithms
1. **Perfect Maze (Depth-First Search)**: Single solution path with no loops
2. **Imperfect Maze**: Perfect maze with additional random wall removals creating multiple paths
3. **Pac-Man Style**: Open corridor design optimized for gameplay with strategic wall placements

### Intelligent AI Ghost System
- **4 Different AI Behaviors**:
  - 🔴 **Chase (A* Pathfinding)**: Optimal pathfinding directly toward player
  - 🩷 **Scatter (Heuristic)**: Semi-predictable movement with randomness
  - 🩵 **Ambush (BFS)**: Breadth-first search pathfinding for ambush tactics
  - 🟠 **Random**: Weighted random movement with player bias
- **Dynamic State Management**: Normal, Frightened, Eaten, Returning, Respawning states
- **Grace Period**: Initial invincibility period when ghosts spawn
- **Smart Respawn System**: 15-second respawn timer with power mode considerations

### Visual Effects & Graphics
- **Real-time Particle System**: 6 different particle effect types
- **Phong Lighting Model**: Ambient, diffuse, and specular lighting
- **Dynamic Camera System**: Adjustable viewing angle (0°-90°)
- **Smooth Animations**: Interpolated movement for player and ghosts
- **Alpha Blending**: Transparent particle effects and respawning ghosts

## 🛠️ Technical Implementation

### Computer Graphics Concepts Used

#### 3D Rendering Pipeline
- **Vertex Processing**: 3D coordinates transformed through model-view and projection matrices
- **Fragment Shading**: Per-pixel lighting calculations using Phong reflection model
- **Depth Testing**: Proper 3D occlusion with Z-buffer
- **Alpha Blending**: Transparency effects for particles and ghost states

#### Lighting Model
- **Phong Illumination**: Complete implementation with ambient, diffuse, and specular components
- **Directional Lighting**: Top-right directional light source
- **Normal Vector Transformation**: Proper normal matrix calculations for lighting
- **Material Properties**: Configurable ambient, diffuse, specular, and shininess parameters

#### 3D Transformations
- **Model Matrix**: Object positioning and world space transformations
- **View Matrix**: Camera positioning using lookAt transformation
- **Projection Matrix**: Perspective projection with configurable field of view
- **Normal Matrix**: Inverse transpose for proper normal vector transformation

#### Geometric Modeling
- **Procedural Sphere Generation**: Parametric sphere creation for player, ghosts, and particles
- **Box Geometry**: Wall and floor generation with proper normals
- **Mesh Tessellation**: Sphere subdivision for smooth curved surfaces

### WebGL Implementation

#### Shader Programming
- **Vertex Shader**: Handles vertex transformation, normal calculation, and attribute passing
- **Fragment Shader**: Implements Phong lighting with brightness control
- **Uniform Variables**: Matrix transformations, lighting parameters, material properties
- **Attribute Variables**: Vertex positions, normals, colors

#### Rendering Optimization
- **Frustum Culling**: Objects outside view frustum are not rendered
- **Dynamic Geometry Updates**: Only moving objects regenerate geometry
- **Batch Rendering**: Similar objects rendered in batches
- **State Management**: Efficient WebGL state changes

### Algorithm Implementation

#### Pathfinding Algorithms
- **Breadth-First Search (BFS)**: Unweighted shortest path for ambush behavior
- **Wall Collision Detection**: Sophisticated maze wall validation
- **Dynamic Pathfinding**: Real-time path calculation for moving targets

#### Maze Generation
- **Depth-First Search (DFS)**: Recursive backtracking for perfect mazes
- **Wall Removal Algorithm**: Strategic wall elimination for imperfect mazes
- **Pac-Man Layout Generator**: Custom algorithm for gameplay-optimized layouts
- **Connectivity Validation**: Ensures all areas remain accessible

#### Physics & Animation
- **Linear Interpolation**: Smooth movement between discrete grid positions
- **Collision Detection**: Grid-based collision with wall validation
- **Particle Physics**: Basic physics simulation with gravity and velocity
- **Time-based Animation**: Frame-rate independent movement

## 🎯 Game Mechanics

### Power System
- **Power Pellets**: Large golden orbs that activate "Power Mode"
- **Power Mode Duration**: 8 seconds of ghost vulnerability
- **Visual Feedback**: Ghosts turn blue, flashing warning before mode ends

### Ghost AI Behavior
- **Adaptive Movement Speed**: Distance-based movement intervals for dynamic difficulty
- **State-based Behavior**: Different AI patterns based on ghost state
- **Emergency Rescue System**: Automatic repositioning if ghosts get stuck in walls
- **Respawn Management**: Smart respawn timing considering power mode duration

### User Interface
- **Real-time Statistics**: Live tracking of score, lives, pellets, and ghosts
- **Visual Status Indicators**: Power mode timer, dash cooldown, respawn timers
- **Interactive Controls**: Camera angle, brightness, maze size customization
- **Responsive Design**: Adaptive UI for different screen sizes

## 📋 Prerequisites

- Modern web browser with WebGL support

## 🎮 Controls

- **W/A/S/D** - Move Forward/Left/Backward/Right
- **Space** - Activate Dash (1.5x speed for 3 seconds, 20-second cooldown)

## 🔧 Configuration Options

### Maze Settings
- **Maze Type**: Perfect, Imperfect, or Pac-Man style
- **Maze Size**: 5×5 to 25×25 grid
- **Camera Angle**: 0° (top-down) to 90° (side view)
- **Brightness**: 0.1 to 2.0 lighting intensity

### Game Recommendations
- **For Gameplay**: Use Pac-Man or Imperfect maze types
- **For Challenge**: Perfect maze has no loops, making escape more difficult
- **Visual Experience**: Adjust camera angle and brightness for optimal viewing

## 🏗️ Project Structure

```
CS303_Final_ASN/
├── index.html          # Main HTML with UI and shaders
├── maze.js            # Core game logic and WebGL rendering from the textbook
├── initShaders.js     # WebGL shader initialization utilities
├── MVnew.js          # Matrix and vector mathematics library from the textbook
└── README.md         # This documentation
```

## 🎨 Technical Highlights

### Advanced Features
- **Multi-threaded Pathfinding**: Efficient AI computation without blocking rendering
- **Dynamic Particle System**: Real-time particle generation and physics
- **Adaptive Difficulty**: Ghost behavior changes based on player proximity

## 🔮 Future Enhancements

- **Texture Mapping**: Wall and floor textures for enhanced visuals
- **Sound System**: 3D positional audio for immersive experience
- **Multiplayer Support**: Network-based multiplayer functionality
- **Level Progression**: Multiple maze levels with increasing difficulty

## 📄 License

This project is created for educational purposes demonstrating computer graphics and WebGL programming concepts.

Developers: Aran, Shuja, and Nairran.
