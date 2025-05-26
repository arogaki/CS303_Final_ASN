# WebGL 3D Maze Generator with Pathfinding

A sophisticated 3D maze visualization application built with WebGL, featuring dynamic maze generation, pathfinding algorithms, and interactive camera controls.

## English Version

### 🎯 Features Overview

#### 1. **Dynamic Maze Generation**
- **Implementation**: `maze.js` lines 138-196
- **Algorithm**: Randomized Depth-First Search (DFS)
- **Logic**: 
  - Initializes a grid with all walls intact
  - Uses a stack-based DFS to carve paths through the maze
  - Ensures all cells are reachable while maintaining maze properties
  - Creates entrance (top-left) and exit (bottom-right) openings

#### 2. **Pathfinding System**
- **Implementation**: `maze.js` lines 253-320
- **Algorithm**: Breadth-First Search (BFS)
- **Logic**:
  - Finds the shortest path from entrance to exit
  - Uses queue-based BFS for optimal path discovery
  - Reconstructs path using parent tracking
  - Guarantees shortest solution due to BFS properties

#### 3. **3D Visualization Engine**
- **Implementation**: `maze.js` lines 337-508
- **Components**:
  - **Wall Generation** (lines 428-508): Creates 3D wall segments with proper normals
  - **Floor Generation** (lines 509-554): Renders maze floor with appropriate texturing
  - **Geometry Management**: Dynamic vertex buffer creation and management

#### 4. **Interactive Camera System**
- **Implementation**: `maze.js` lines 581-608
- **Features**:
  - **Smooth Elevation Control**: Natural transition from top-down to side view
  - **Automatic Distance Scaling**: Camera distance adjusts based on maze size
  - **Twist-Free Movement**: Consistent up vector prevents disorienting rotations
- **Logic**:
  - Uses trigonometric functions for smooth camera positioning
  - Implements minimum angle offset to ensure maze visibility at 0°
  - Scales viewing distance proportionally to maze dimensions

#### 5. **Advanced Lighting System**
- **Implementation**: 
  - **Setup**: `maze.js` lines 555-580
  - **Shaders**: `index.html` lines 78-157
- **Features**:
  - **Phong Lighting Model**: Ambient, diffuse, and specular components
  - **Multiple Light Directions**: Top, top-right, top-left positioning
  - **Dynamic Brightness Control**: Real-time lighting intensity adjustment
- **Logic**:
  - Per-fragment lighting calculations in fragment shader
  - Normal vector transformations for accurate lighting
  - Material property integration for realistic surface appearance

#### 6. **User Interface Controls**
- **Implementation**: `index.html` lines 58-82, `maze.js` lines 67-105
- **Components**:
  - **Maze Size Slider** (5×5 to 25×25): Dynamic maze dimension control
  - **Camera Angle Slider** (0° to 90°): Smooth viewing angle adjustment
  - **Brightness Control** (0.1 to 2.0): Lighting intensity modification
  - **Light Direction Radio Buttons**: Directional lighting selection
  - **Regenerate Button**: New maze generation trigger

#### 7. **Dynamic Maze Sizing**
- **Implementation**: `maze.js` lines 73-80, 587
- **Logic**:
  - Real-time maze size adjustment without regeneration
  - Automatic camera distance scaling for optimal viewing
  - Efficient geometry recreation for new dimensions
  - Maintains aspect ratio and visual quality across all sizes

### 🏗️ Architecture & Design Philosophy

#### **Modular Design Pattern**
- **Separation of Concerns**: Clear distinction between rendering, logic, and UI
- **Function-Based Architecture**: Each major feature encapsulated in dedicated functions
- **State Management**: Global variables for shared state with local scope for operations

#### **Performance Optimization**
- **Buffer Management**: Efficient WebGL buffer creation and reuse
- **Geometry Batching**: Single draw call for all maze walls
- **Dynamic Updates**: Only regenerate geometry when necessary

#### **User Experience Focus**
- **Intuitive Controls**: Slider-based interface for easy parameter adjustment
- **Visual Feedback**: Real-time updates and smooth transitions
- **Responsive Design**: Automatic scaling and viewport management

### 🔧 Technical Implementation Details

#### **WebGL Pipeline Integration**
1. **Vertex Processing**: Position, normal, and color attribute handling
2. **Matrix Transformations**: Model-view and projection matrix calculations
3. **Fragment Shading**: Per-pixel lighting and color computation
4. **Depth Testing**: Z-buffer for proper 3D rendering

#### **Mathematical Foundations**
- **Vector Mathematics**: 3D vector operations for geometry and lighting
- **Matrix Operations**: Transformation matrix calculations
- **Trigonometry**: Camera positioning and smooth transitions
- **Graph Theory**: Maze representation and pathfinding algorithms

### 📁 File Structure

```
├── index.html          # HTML structure, shaders, and UI controls
├── maze.js            # Core application logic and WebGL implementation
├── initShaders.js     # Shader compilation utilities
├── MVnew.js          # Matrix and vector mathematics library
└── README.md         # This documentation
```

### 🚀 Usage Instructions

1. **Adjust Maze Size**: Use the size slider to set maze dimensions (5×5 to 25×25)
2. **Generate New Maze**: Click "Regenerate Maze" to create a new layout
3. **Control Camera**: Adjust the camera angle slider for different viewing perspectives
4. **Modify Lighting**: Change brightness and light direction for optimal visualization
5. **Explore**: Use the smooth camera controls to examine the maze structure

---

## 日本語版

### 🎯 機能概要

#### 1. **動的迷路生成**
- **実装場所**: `maze.js` 138-196行
- **アルゴリズム**: ランダム化深度優先探索（DFS）
- **ロジック**:
  - すべての壁が intact な状態でグリッドを初期化
  - スタックベースのDFSを使用して迷路に経路を彫る
  - 迷路の性質を維持しながらすべてのセルが到達可能であることを保証
  - 入口（左上）と出口（右下）の開口部を作成

#### 2. **経路探索システム**
- **実装場所**: `maze.js` 253-320行
- **アルゴリズム**: 幅優先探索（BFS）
- **ロジック**:
  - 入口から出口への最短経路を発見
  - 最適経路発見のためのキューベースBFS使用
  - 親追跡を使用した経路再構築
  - BFSの性質により最短解を保証

#### 3. **3D可視化エンジン**
- **実装場所**: `maze.js` 337-508行
- **コンポーネント**:
  - **壁生成** (428-508行): 適切な法線を持つ3D壁セグメントの作成
  - **床生成** (509-554行): 適切なテクスチャリングでの迷路床の描画
  - **ジオメトリ管理**: 動的頂点バッファの作成と管理

#### 4. **インタラクティブカメラシステム**
- **実装場所**: `maze.js` 581-608行
- **機能**:
  - **滑らかな高度制御**: トップダウンからサイドビューへの自然な遷移
  - **自動距離スケーリング**: 迷路サイズに基づくカメラ距離調整
  - **ひねりのない移動**: 一貫したupベクトルで方向感覚の混乱を防止
- **ロジック**:
  - 滑らかなカメラ配置のための三角関数使用
  - 0°での迷路可視性確保のための最小角度オフセット実装
  - 迷路寸法に比例した視距離スケーリング

#### 5. **高度照明システム**
- **実装場所**: 
  - **設定**: `maze.js` 555-580行
  - **シェーダー**: `index.html` 78-157行
- **機能**:
  - **Phong照明モデル**: 環境光、拡散光、鏡面光成分
  - **複数光方向**: 上、右上、左上の配置
  - **動的明度制御**: リアルタイム照明強度調整
- **ロジック**:
  - フラグメントシェーダーでのフラグメント毎照明計算
  - 正確な照明のための法線ベクトル変換
  - リアルな表面外観のための材質プロパティ統合

#### 6. **ユーザーインターフェース制御**
- **実装場所**: `index.html` 58-82行, `maze.js` 67-105行
- **コンポーネント**:
  - **迷路サイズスライダー** (5×5から25×25): 動的迷路寸法制御
  - **カメラ角度スライダー** (0°から90°): 滑らかな視角調整
  - **明度制御** (0.1から2.0): 照明強度変更
  - **光方向ラジオボタン**: 指向性照明選択
  - **再生成ボタン**: 新迷路生成トリガー

#### 7. **動的迷路サイジング**
- **実装場所**: `maze.js` 73-80行, 587行
- **ロジック**:
  - 再生成なしでのリアルタイム迷路サイズ調整
  - 最適表示のための自動カメラ距離スケーリング
  - 新寸法での効率的ジオメトリ再作成
  - 全サイズでのアスペクト比と視覚品質維持

### 🏗️ アーキテクチャ & 設計思想

#### **モジュラー設計パターン**
- **関心の分離**: 描画、ロジック、UIの明確な区別
- **関数ベースアーキテクチャ**: 各主要機能を専用関数でカプセル化
- **状態管理**: 共有状態用グローバル変数と操作用ローカルスコープ

#### **パフォーマンス最適化**
- **バッファ管理**: 効率的なWebGLバッファ作成と再利用
- **ジオメトリバッチング**: 全迷路壁の単一描画呼び出し
- **動的更新**: 必要時のみジオメトリ再生成

#### **ユーザーエクスペリエンス重視**
- **直感的制御**: パラメータ調整の簡単なスライダーベースインターフェース
- **視覚的フィードバック**: リアルタイム更新と滑らかな遷移
- **レスポンシブデザイン**: 自動スケーリングとビューポート管理

### 🔧 技術実装詳細

#### **WebGLパイプライン統合**
1. **頂点処理**: 位置、法線、色属性の処理
2. **行列変換**: モデルビューと投影行列の計算
3. **フラグメントシェーディング**: ピクセル毎照明と色計算
4. **深度テスト**: 適切な3D描画のためのZバッファ

#### **数学的基礎**
- **ベクトル数学**: ジオメトリと照明のための3Dベクトル演算
- **行列演算**: 変換行列計算
- **三角法**: カメラ配置と滑らかな遷移
- **グラフ理論**: 迷路表現と経路探索アルゴリズム

### 📁 ファイル構造

```
├── index.html          # HTML構造、シェーダー、UI制御
├── maze.js            # コアアプリケーションロジックとWebGL実装
├── initShaders.js     # シェーダーコンパイルユーティリティ
├── MVnew.js          # 行列とベクトル数学ライブラリ
└── README.md         # このドキュメント
```

### 🚀 使用方法

1. **迷路サイズ調整**: サイズスライダーで迷路寸法設定（5×5から25×25）
2. **新迷路生成**: 「Regenerate Maze」クリックで新レイアウト作成
3. **カメラ制御**: カメラ角度スライダーで異なる視点調整
4. **照明変更**: 最適可視化のための明度と光方向変更
5. **探索**: 滑らかなカメラ制御で迷路構造検査

---

### 🛠️ Development Notes

**Performance Considerations:**
- Efficient buffer management for large mazes
- Single draw call optimization for wall rendering
- Dynamic geometry generation only when necessary

**Browser Compatibility:**
- Modern browsers with WebGL support
- Responsive design for various screen sizes
- Cross-platform compatibility

**Future Enhancements:**
- Multiple maze generation algorithms
- Advanced pathfinding visualizations
- Texture mapping for enhanced visuals
- VR/AR support integration 