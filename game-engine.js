// 3D Game Engine mit Three.js
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
        this.currentGame = null;
        this.gameInstances = {};
        
        this.stats = {
            score: 0,
            level: 1,
            lives: 3,
            bestScore: 0
        };
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupControls();
        this.setupLighting();
        this.setupEventListeners();
        
        // Load saved stats
        this.loadStats();
        
        console.log('Game Engine initialized');
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
    }

    setupControls() {
        // OrbitControls für Debug/Editor-Modus
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
    }

    setupLighting() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional Light (Sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Point Lights für dynamische Beleuchtung
        const pointLight1 = new THREE.PointLight(0xff6b6b, 0.8, 20);
        pointLight1.position.set(-10, 5, -10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.8, 20);
        pointLight2.position.set(10, 5, 10);
        this.scene.add(pointLight2);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        // Game Events
        window.gameEvents.on('gameStart', (gameType) => {
            this.startGame(gameType);
        });

        window.gameEvents.on('gamePause', () => {
            this.pauseGame();
        });

        window.gameEvents.on('gameResume', () => {
            this.resumeGame();
        });

        window.gameEvents.on('gameRestart', () => {
            this.restartGame();
        });

        window.gameEvents.on('gameOver', (finalScore) => {
            this.endGame(finalScore);
        });

        window.gameEvents.on('backToMenu', () => {
            this.backToMenu();
        });

        window.gameEvents.on('scoreUpdate', (score) => {
            this.updateScore(score);
        });

        window.gameEvents.on('levelUpdate', (level) => {
            this.updateLevel(level);
        });

        window.gameEvents.on('livesUpdate', (lives) => {
            this.updateLives(lives);
        });
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Game Management
    startGame(gameType) {
        console.log('Starting game:', gameType);
        
        this.gameState = 'playing';
        this.stats.score = 0;
        this.stats.level = 1;
        this.stats.lives = 3;
        
        // Clear previous game
        this.clearScene();
        
        // Initialize game instance
        switch (gameType) {
            case 'cube-racer':
                this.currentGame = new CubeRacer(this.scene, this.camera, this.renderer);
                break;
            case 'gravity-balls':
                this.currentGame = new GravityBalls(this.scene, this.camera, this.renderer);
                break;
            case 'space-shooter':
                this.currentGame = new SpaceShooter(this.scene, this.camera, this.renderer);
                break;
            case 'block-puzzle':
                this.currentGame = new BlockPuzzle(this.scene, this.camera, this.renderer);
                break;
            default:
                console.error('Unknown game type:', gameType);
                return;
        }

        this.currentGame.init();
        this.updateUI();
        this.startRenderLoop();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            if (this.currentGame && this.currentGame.pause) {
                this.currentGame.pause();
            }
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            if (this.currentGame && this.currentGame.resume) {
                this.currentGame.resume();
            }
        }
    }

    restartGame() {
        if (this.currentGame) {
            const gameType = this.currentGame.constructor.name.toLowerCase().replace('game', '');
            this.startGame(gameType);
        }
    }

    endGame(finalScore) {
        this.gameState = 'gameOver';
        
        if (finalScore > this.stats.bestScore) {
            this.stats.bestScore = finalScore;
            this.saveStats();
        }
        
        this.showGameOverScreen(finalScore);
        
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }
    }

    backToMenu() {
        this.gameState = 'menu';
        
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }
        
        this.clearScene();
        this.showMainMenu();
    }

    clearScene() {
        // Remove all game objects
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.userData.isGameObject) {
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }

    // UI Management
    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Show mobile controls only on mobile
        const mobileControls = document.getElementById('mobile-controls');
        if (Utils.isMobile()) {
            mobileControls.classList.remove('hidden');
        } else {
            mobileControls.classList.add('hidden');
        }
    }

    showGameScreen() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Show mobile controls on mobile
        const mobileControls = document.getElementById('mobile-controls');
        if (Utils.isMobile()) {
            mobileControls.classList.remove('hidden');
        }
    }

    showGameOverScreen(finalScore) {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('best-score').textContent = this.stats.bestScore;
    }

    updateUI() {
        document.getElementById('score-value').textContent = this.stats.score;
        document.getElementById('level-value').textContent = this.stats.level;
        document.getElementById('lives-value').textContent = this.stats.lives;
    }

    updateScore(score) {
        this.stats.score = score;
        document.getElementById('score-value').textContent = score;
    }

    updateLevel(level) {
        this.stats.level = level;
        document.getElementById('level-value').textContent = level;
    }

    updateLives(lives) {
        this.stats.lives = lives;
        document.getElementById('lives-value').textContent = lives;
    }

    // Render Loop
    startRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const animate = (currentTime) => {
            this.animationId = requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            
            if (this.gameState === 'playing' && this.currentGame) {
                this.currentGame.update(deltaTime);
            }
            
            // Update controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Update input manager
            window.inputManager.update();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    // Stats Management
    saveStats() {
        Utils.saveToStorage('keinplan_stats', this.stats);
    }

    loadStats() {
        const savedStats = Utils.loadFromStorage('keinplan_stats', {
            score: 0,
            level: 1,
            lives: 3,
            bestScore: 0
        });
        this.stats = { ...this.stats, ...savedStats };
    }

    // Utility Methods
    getGameState() {
        return this.gameState;
    }

    getCurrentGame() {
        return this.currentGame;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    // Cleanup
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }
        
        this.clearScene();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Base Game Class
class BaseGame {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.gameObjects = [];
        this.isPaused = false;
        this.isInitialized = false;
    }

    init() {
        this.isInitialized = true;
        console.log(`${this.constructor.name} initialized`);
    }

    update(deltaTime) {
        if (this.isPaused || !this.isInitialized) return;
        
        this.gameObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
        });
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    addGameObject(obj) {
        obj.userData.isGameObject = true;
        this.gameObjects.push(obj);
        this.scene.add(obj);
    }

    removeGameObject(obj) {
        const index = this.gameObjects.indexOf(obj);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
            this.scene.remove(obj);
            
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    }

    cleanup() {
        this.gameObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.gameObjects = [];
        this.isInitialized = false;
    }
}
