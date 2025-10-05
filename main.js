// Haupt-JavaScript für die KeinPlan 3D-Minigame-Webapp
class App {
    constructor() {
        this.gameEngine = null;
        this.isLoading = true;
        this.loadingProgress = 0;
        
        this.init();
    }

    async init() {
        console.log('KeinPlan 3D Minigames - Initializing...');
        
        try {
            await this.showLoadingScreen();
            await this.initializeGameEngine();
            await this.setupEventListeners();
            await this.hideLoadingScreen();
            
            console.log('App initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Fehler beim Laden der Anwendung. Bitte Seite neu laden.');
        }
    }

    async showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loader = loadingScreen.querySelector('.loader');
        const progressText = loadingScreen.querySelector('p');
        
        // Simuliere Ladevorgang
        const loadingSteps = [
            'Lade 3D-Engine...',
            'Initialisiere Spiele...',
            'Lade Assets...',
            'Bereite Benutzeroberfläche vor...',
            'Fertig!'
        ];
        
        for (let i = 0; i < loadingSteps.length; i++) {
            progressText.textContent = loadingSteps[i];
            this.loadingProgress = (i + 1) / loadingSteps.length * 100;
            
            // Lade-Animation
            if (loader) {
                loader.style.transform = `scale(${0.8 + this.loadingProgress / 100 * 0.4})`;
            }
            
            await this.delay(800 + Math.random() * 400);
        }
    }

    async initializeGameEngine() {
        // Warte bis Three.js geladen ist
        if (typeof THREE === 'undefined') {
            await this.waitForThreeJS();
        }
        
        // Game Engine initialisieren
        this.gameEngine = new GameEngine('game-canvas');
        
        // Mobile Detection
        if (Utils.isMobile()) {
            this.enableMobileOptimizations();
        }
        
        // Performance-Optimierungen
        this.optimizePerformance();
    }

    async waitForThreeJS() {
        return new Promise((resolve) => {
            const checkThree = () => {
                if (typeof THREE !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkThree, 100);
                }
            };
            checkThree();
        });
    }

    async setupEventListeners() {
        // Game Card Clicks
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const gameType = card.dataset.game;
                this.startGame(gameType);
            });
            
            // Hover-Effekte für Desktop
            if (!Utils.isMobile()) {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-10px) scale(1.02)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0) scale(1)';
                });
            }
        });
        
        // Game Controls
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.backToMenu();
        });
        
        // Game Over Buttons
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
            this.backToMenu();
        });
        
        // Mobile Action Buttons
        document.getElementById('jump-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMobileJump();
        });
        
        document.getElementById('action-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMobileAction();
        });
        
        // Window Events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Game Events
        window.gameEvents.on('gameStart', (gameType) => {
            this.onGameStart(gameType);
        });
        
        window.gameEvents.on('gamePause', () => {
            this.onGamePause();
        });
        
        window.gameEvents.on('gameResume', () => {
            this.onGameResume();
        });
        
        window.gameEvents.on('gameOver', (score) => {
            this.onGameOver(score);
        });
        
        window.gameEvents.on('backToMenu', () => {
            this.backToMenu();
        });
    }

    async hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainMenu = document.getElementById('main-menu');
        
        // Fade-out Animation
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease-out';
        
        await this.delay(500);
        
        loadingScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        
        this.isLoading = false;
    }

    startGame(gameType) {
        if (this.isLoading) return;
        
        console.log('Starting game:', gameType);
        
        // UI Updates
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Mobile Controls anzeigen
        if (Utils.isMobile()) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
        
        // Game starten
        window.gameEvents.emit('gameStart', gameType);
    }

    togglePause() {
        const gameState = this.gameEngine.getGameState();
        
        if (gameState === 'playing') {
            window.gameEvents.emit('gamePause');
        } else if (gameState === 'paused') {
            window.gameEvents.emit('gameResume');
        }
    }

    restartGame() {
        window.gameEvents.emit('gameRestart');
    }

    backToMenu() {
        // UI Updates
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        
        // Mobile Controls verstecken
        document.getElementById('mobile-controls').classList.add('hidden');
        
        // Game stoppen
        window.gameEvents.emit('backToMenu');
    }

    playAgain() {
        const gameState = this.gameEngine.getGameState();
        if (gameState === 'gameOver') {
            this.restartGame();
        }
    }

    handleMobileJump() {
        // Mobile Jump Action
        console.log('Mobile jump triggered');
    }

    handleMobileAction() {
        // Mobile Action Button
        console.log('Mobile action triggered');
    }

    handleResize() {
        if (this.gameEngine) {
            // Game Engine wird automatisch über window.resize Event aktualisiert
            console.log('Window resized');
        }
    }

    handleKeyboard(e) {
        // Globale Keyboard-Shortcuts
        switch (e.key.toLowerCase()) {
            case 'escape':
                if (this.gameEngine.getGameState() === 'playing') {
                    this.togglePause();
                } else if (this.gameEngine.getGameState() === 'paused') {
                    this.backToMenu();
                }
                break;
            case 'f11':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                if (this.gameEngine.getGameState() === 'menu') {
                    // Mute/Unmute (falls Sound implementiert wird)
                    console.log('Toggle mute');
                }
                break;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    enableMobileOptimizations() {
        // Touch-Optimierungen
        document.body.classList.add('mobile-optimized');
        
        // Verhindere Zoom bei Double-Tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Verhindere Kontext-Menü bei Long-Press
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // iOS Safari Optimierungen
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.classList.add('ios-optimized');
            
            // Verhindere Bounce-Scroll
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
        }
    }

    optimizePerformance() {
        // Performance-Monitoring
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    console.warn('High memory usage detected');
                    this.triggerGarbageCollection();
                }
            }, 10000);
        }
        
        // FPS-Monitoring
        this.monitorFPS();
        
        // Adaptive Quality
        this.adaptiveQuality();
    }

    monitorFPS() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 60;
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // FPS-basierte Optimierungen
                if (fps < 30) {
                    this.reduceQuality();
                } else if (fps > 55) {
                    this.increaseQuality();
                }
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }

    adaptiveQuality() {
        // Automatische Qualitätsanpassung basierend auf Gerät
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            canvas.style.imageRendering = pixelRatio > 1 ? 'auto' : 'pixelated';
        }
    }

    reduceQuality() {
        // Qualität reduzieren bei niedrigen FPS
        console.log('Reducing quality for better performance');
    }

    increaseQuality() {
        // Qualität erhöhen bei guten FPS
        console.log('Increasing quality for better visuals');
    }

    triggerGarbageCollection() {
        // Force garbage collection (falls verfügbar)
        if (window.gc) {
            window.gc();
        }
    }

    // Event Handlers
    onGameStart(gameType) {
        console.log('Game started:', gameType);
        document.body.classList.add('game-active');
    }

    onGamePause() {
        console.log('Game paused');
        document.body.classList.add('game-paused');
        
        // Pause-Overlay
        this.showPauseOverlay();
    }

    onGameResume() {
        console.log('Game resumed');
        document.body.classList.remove('game-paused');
        
        // Pause-Overlay entfernen
        this.hidePauseOverlay();
    }

    onGameOver(score) {
        console.log('Game over, final score:', score);
        document.body.classList.remove('game-active');
        
        // Game Over Screen anzeigen
        setTimeout(() => {
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('game-over-screen').classList.remove('hidden');
        }, 1000);
    }

    showPauseOverlay() {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.innerHTML = `
                <div class="pause-content">
                    <h2>Pausiert</h2>
                    <p>Drücke ESC oder klicke "Weiter" um fortzufahren</p>
                    <button onclick="app.onGameResume()">Weiter</button>
                    <button onclick="app.backToMenu()">Menü</button>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                color: white;
                font-family: 'Orbitron', monospace;
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }

    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff4444;
                color: white;
                padding: 2rem;
                border-radius: 10px;
                font-family: 'Roboto', sans-serif;
                text-align: center;
                z-index: 10000;
                max-width: 400px;
            ">
                <h3>Fehler</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #ff4444;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">Neu laden</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    // Utility Methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup
    destroy() {
        if (this.gameEngine) {
            this.gameEngine.dispose();
        }
        
        // Event Listeners entfernen
        window.gameEvents.clear();
        
        console.log('App destroyed');
    }
}

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});

// Service Worker für Offline-Funktionalität (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
