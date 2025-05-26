# WebGL 3D迷路ジェネレーター（経路探索機能付き）

WebGLを使用して構築された高度な3D迷路可視化アプリケーション。動的迷路生成、経路探索アルゴリズム、インタラクティブなカメラ制御を特徴とします。このプロジェクトは、Dave Shreinerの「Interactive Computer Graphics」教科書の包括的なコンピュータグラフィックス概念を実証しています。

## 🎯 機能概要と教科書との関連

### 1. **動的迷路生成アルゴリズム**
**教科書参照**: 第10章 - 手続き的手法
- **実装場所**: `maze.js` 138-196行
- **アルゴリズム**: ランダム化深度優先探索（DFS）
- **コード詳細**:
```javascript
// 全ての壁を持つ迷路グリッドの初期化（142-152行）
for (let i = 0; i < mazeSize; i++) {
    maze[i] = [];
    for (let j = 0; j < mazeSize; j++) {
        maze[i][j] = {
            visited: false,
            walls: [true, true, true, true] // [上, 右, 下, 左]
        };
    }
}

// スタックベースDFS実装（154-185行）
const stack = [];
maze[startY][startX].visited = true;
stack.push({x: startX, y: startY});

while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current.x, current.y);
    
    if (neighbors.length > 0) {
        // ランダムな隣接セルを選択し、経路を作成
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const next = neighbors[randomIndex];
        removeWallBetween(current, next);
        maze[next.y][next.x].visited = true;
        stack.push(next);
    } else {
        stack.pop(); // バックトラック
    }
}
```

### 2. **経路探索システム**
**教科書参照**: 第9章 - モデリングと階層（木の走査）
- **実装場所**: `maze.js` 253-320行
- **アルゴリズム**: 幅優先探索（BFS）
- **コード詳細**:
```javascript
// BFSキューの初期化（256-265行）
const queue = [];
const visited = Array(mazeSize).fill().map(() => Array(mazeSize).fill(false));
const parent = Array(mazeSize).fill().map(() => Array(mazeSize).fill(null));

// BFS走査（273-300行）
while (queue.length > 0) {
    const current = queue.shift();
    
    if (current.x === mazeSize - 1 && current.y === mazeSize - 1) {
        break; // 出口発見
    }
    
    // 4方向をチェック
    for (let i = 0; i < 4; i++) {
        if (!maze[current.y][current.x].walls[i]) { // この方向に壁がない
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

// 経路の再構築（302-312行）
let current = {x: mazeSize - 1, y: mazeSize - 1};
let newPath = [current];
while (current.x !== startX || current.y !== startY) {
    current = parent[current.y][current.x];
    newPath.push(current);
}
newPath.reverse();
```

### 3. **3Dジオメトリ生成**
**教科書参照**: 第4章 - 幾何オブジェクトと変換
- **実装場所**: `maze.js` 337-508行
- **壁作成ロジック**（428-508行）:
```javascript
function createWall(vertices, normals, colors, indices, x1, y, z1, x2, y, z2, indexOffset) {
    const isHorizontal = z1 === z2;
    
    if (isHorizontal) {
        // 水平壁の頂点（3Dボックス用の8頂点）
        vertices.push(
            vec4(x1, y, z1, 1.0),                           // 左下
            vec4(x2, y, z2, 1.0),                           // 右下
            vec4(x2, y + wallHeight, z2, 1.0),              // 右上
            vec4(x1, y + wallHeight, z1, 1.0),              // 左上
            vec4(x1, y, z1 - wallThickness, 1.0),           // 奥左下
            vec4(x2, y, z2 - wallThickness, 1.0),           // 奥右下
            vec4(x2, y + wallHeight, z2 - wallThickness, 1.0), // 奥右上
            vec4(x1, y + wallHeight, z1 - wallThickness, 1.0)  // 奥左上
        );
        
        // ライティング計算用の法線ベクトル
        normals.push(vec4(0, 0, 1, 0));  // 前面の法線
        normals.push(vec4(0, 0, 1, 0));
        // ... (全頂点に対して繰り返し)
    }
    
    // 三角形分割用のインデックス生成（490-508行）
    const faces = [
        [0, 1, 2, 3],     // 前面
        [4, 5, 6, 7],     // 背面
        [3, 2, 6, 7],     // 上面
        [0, 1, 5, 4],     // 下面
        [1, 2, 6, 5],     // 右面
        [0, 3, 7, 4]      // 左面
    ];
    
    for (const face of faces) {
        indices.push(
            face[0] + indexOffset, face[1] + indexOffset, face[2] + indexOffset,
            face[0] + indexOffset, face[2] + indexOffset, face[3] + indexOffset
        );
    }
}
```

### 4. **カメラシステム実装**
**教科書参照**: 第5章 - ビューイング
- **実装場所**: `maze.js` 581-608行
- **数学的基礎**:
```javascript
function updateCamera() {
    const rad = cameraAngle * Math.PI / 180.0;
    
    // 球面座標変換（第5.3章 - カメラの位置決め）
    const baseDistance = 3.0;
    const distance = baseDistance + (mazeSize - 10) * 0.2; // 動的スケーリング
    
    // ジンバルロック様の問題を防ぐ最小角度オフセット
    const minAngleOffset = 0.1;
    const adjustedRad = Math.max(rad, minAngleOffset);
    
    // 三角法を使用した視点位置計算
    eye = vec3(
        distance * Math.sin(adjustedRad), // X成分
        distance * Math.cos(adjustedRad), // Y成分（高度）
        0                                 // Z成分（固定）
    );
    
    at = vec3(0, 0, 0);  // 注視点（迷路中心）
    up = vec3(0, 1, 0);  // 一貫したアップベクトル
}
```

### 5. **ライティングシステム（Phongモデル）**
**教科書参照**: 第6章 - ライティングとシェーディング
- **頂点シェーダー**（`index.html` 78-102行）:
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
    // 頂点を視点座標系に変換（第5.7章）
    fPosition = (modelViewMatrix * vPosition).xyz;
    
    // 法線を視点座標系に変換（第6.4.1章）
    fNormal = normalMatrix * vNormal.xyz;
    
    fColor = vColor;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}
```

- **フラグメントシェーダー**（`index.html` 104-157行）:
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
    vec3 L = normalize(lightPosition.xyz);  // 光の方向
    vec3 V = normalize(-fPosition);         // 視線方向
    vec3 R = reflect(-L, N);                // 反射ベクトル
    
    // Phongライティングモデルの成分（第6.3章）
    vec4 ambient = ambientProduct;
    
    float Kd = max(dot(L, N), 0.0);
    vec4 diffuse = Kd * diffuseProduct;
    
    float Ks = pow(max(dot(V, R), 0.0), shininess);
    vec4 specular = Ks * specularProduct;
    
    vec4 color = fColor * (ambient + diffuse + specular);
    gl_FragColor = vec4(color.rgb * brightness, color.a);
}
```

### 6. **WebGLバッファ管理**
**教科書参照**: 第2章 - グラフィックスプログラミング
- **実装場所**: `maze.js` 409-427行
```javascript
function createWallsGeometry() {
    // 頂点データ配列
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // ... ジオメトリ生成 ...
    
    // バッファ作成とデータアップロード（第2.8.1章）
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

### 7. **レンダリングパイプライン**
**教科書参照**: 第12章 - ジオメトリからピクセルへ
- **実装場所**: `maze.js` 609-664行
```javascript
function render(timestamp) {
    // バッファクリア（第12.2.4章）
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    updateCamera();
    
    // 行列計算（第4.11章）
    const modelViewMatrix = lookAt(eye, at, up);
    const projectionMatrix = perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    
    // ユニフォーム行列のアップロード
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), 
                       false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), 
                       false, flatten(projectionMatrix));
    
    // ライティング用法線行列（第6.4.1章）
    const normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), 
                       false, flatten(normalMatrix));
    
    // ライティングパラメータ（第6.7章）
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

### 8. **イベント駆動ユーザーインターフェース**
**教科書参照**: 第3章 - インタラクションとアニメーション
- **実装場所**: `maze.js` 67-105行
```javascript
// 迷路サイズ制御（第3.5.5章 - スライダー）
document.getElementById("mazeSize").addEventListener("input", function(event) {
    mazeSize = parseInt(event.target.value);
    document.getElementById("sizeValue").textContent = mazeSize;
    document.getElementById("sizeValueCopy").textContent = mazeSize;
    console.log("迷路サイズ変更:", mazeSize + "×" + mazeSize);
});

// カメラ角度制御
document.getElementById("cameraAngle").addEventListener("input", function(event) {
    cameraAngle = event.target.value;
    document.getElementById("angleValue").textContent = cameraAngle;
    updateCamera();
});

// 光の方向制御（第3.5.3章 - ラジオボタン）
const lightDirectionRadios = document.querySelectorAll('input[name="lightDirection"]');
lightDirectionRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        updateLightDirection(this.value);
    });
});
```

## 🏗️ 高度な技術概念

### **行列数学実装**
**教科書参照**: 第4.5章 - 行列とベクトル型
- 行列演算に`MVnew.js`ライブラリを使用
- 変換に同次座標を実装
- 変換の適切な行列乗算順序

### **隠面除去**
**教科書参照**: 第12.6.5章 - zバッファアルゴリズム
```javascript
// 初期化で深度テストを有効化
gl.enable(gl.DEPTH_TEST);

// 各フレームで深度バッファをクリア
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
```

### **頂点属性管理**
**教科書参照**: 第2.4.5章 - 頂点属性
```javascript
function drawWalls() {
    // 位置属性
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // 法線属性
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsNormalBuffer);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    // 色属性
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsColorBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    // インデックス描画
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallsIndexBuffer);
    gl.drawElements(gl.TRIANGLES, wallsCount, gl.UNSIGNED_SHORT, 0);
}
```

## 📚 教科書章マッピング

| 機能 | 教科書章 | 実装場所 |
|------|----------|----------|
| WebGL設定 | 第2章 | `maze.js` 41-66行 |
| イベント処理 | 第3章 | `maze.js` 67-105行 |
| 3Dジオメトリ | 第4章 | `maze.js` 337-508行 |
| カメラシステム | 第5章 | `maze.js` 581-608行 |
| ライティングモデル | 第6章 | シェーダー + `maze.js` 555-580行 |
| レンダリングパイプライン | 第12章 | `maze.js` 609-664行 |
| 手続き的生成 | 第10章 | `maze.js` 138-196行 |
| 木の走査 | 第9章 | `maze.js` 253-320行 |

## 🔧 パフォーマンス最適化

### **バッファ再利用戦略**
```javascript
// 効率的なバッファ管理
if (wallsBuffer) {
    gl.deleteBuffer(wallsBuffer);
    gl.deleteBuffer(wallsNormalBuffer);
    gl.deleteBuffer(wallsColorBuffer);
    gl.deleteBuffer(wallsIndexBuffer);
}
```

### **単一描画呼び出し最適化**
- 全ての迷路壁を単一の`drawElements`呼び出しで描画
- ジオメトリバッチングによりGPU状態変更を削減
- 頂点再利用のためのインデックスバッファ使用

### **動的スケーリングアルゴリズム**
```javascript
// カメラ距離が迷路サイズに応じてスケール
const distance = baseDistance + (mazeSize - 10) * 0.2;
```

## 📁 ファイル構成

```
├── index.html          # HTML構造、頂点/フラグメントシェーダー、UIコントロール
├── maze.js            # コアアプリケーションロジック、WebGL実装、アルゴリズム
├── initShaders.js     # シェーダーコンパイルとリンクユーティリティ
├── MVnew.js          # 行列とベクトル数学ライブラリ
└── README.md         # この包括的なドキュメント
```

## 🚀 使用方法とコントロール

1. **迷路サイズ調整**: 5×5から25×25のグリッド寸法
2. **カメラ制御**: 0°（ほぼ真上）から90°（側面）
3. **ライティング制御**: 明度と指向性ライティング
4. **迷路再生成**: 新しいランダムレイアウトの作成
5. **リアルタイムインタラクション**: 全てのコントロールが即座に更新

## 🛠️ 開発インサイト

### **アルゴリズム計算量**
- **迷路生成**: O(n²)時間、O(n²)空間
- **経路探索**: O(n²)時間、O(n²)空間
- **レンダリング**: フレームあたりO(壁数)

### **メモリ管理**
- 動的バッファ割り当て/解放
- 効率的な頂点データパッキング
- 最小限のGPUメモリ使用

### **クロスプラットフォーム互換性**
- WebGL 1.0互換性
- レスポンシブデザイン原則
- モダンブラウザサポート

## 🎓 学習目標と教育価値

### **コンピュータグラフィックス概念の習得**
1. **3Dジオメトリ処理**: 頂点、法線、インデックスの理解
2. **行列変換**: モデルビュー、投影行列の実践的応用
3. **ライティングモデル**: Phongシェーディングの実装
4. **アルゴリズム設計**: DFS、BFSの3D環境での応用

### **WebGL技術の理解**
1. **シェーダープログラミング**: GLSL頂点・フラグメントシェーダー
2. **バッファ管理**: 効率的なGPUメモリ使用
3. **レンダリングパイプライン**: グラフィックスパイプラインの実践

### **数学的基礎の応用**
1. **線形代数**: ベクトル・行列演算の実用化
2. **三角法**: カメラ位置計算での応用
3. **グラフ理論**: 迷路表現と探索アルゴリズム

このプロジェクトは、理論的知識と実践的実装を結びつけ、コンピュータグラフィックスの包括的な理解を促進します。