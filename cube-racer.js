// Cube Racer - 3D Labyrinth-Spiel
class CubeRacer extends BaseGame {
    constructor(scene, camera, renderer) {
        super(scene, camera, renderer);
        
        this.player = null;
        this.maze = [];
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.score = 0;
        this.timeBonus = 0;
        this.startTime = 0;
        this.gameTime = 0;
        
        this.playerSpeed = 8;
        this.rotationSpeed = 4;
        this.jumpForce = 12;
        this.gravity = -25;
        
        this.playerVelocity = new THREE.Vector3(0, 0, 0);
        this.playerOnGround = false;
        
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        this.particles = [];
        this.trailParticles = [];
    }

    init() {
        super.init();
        this.createPlayer();
        this.generateMaze();
        this.createCheckpoints();
        this.setupCamera();
        this.startTime = Date.now();
        
        console.log('Cube Racer initialized');
    }

    createPlayer() {
        // Player Cube mit coolen Materialien
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            shininess: 100,
            emissive: 0x004422,
            transparent: true,
            opacity: 0.9
        });
        
        this.player = new THREE.Mesh(geometry, material);
        this.player.position.set(0, 1, 0);
        this.player.castShadow = true;
        this.player.receiveShadow = true;
        
        // Glow-Effekt
        const glowGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        this.playerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.playerGlow.position.copy(this.player.position);
        
        this.addGameObject(this.player);
        this.addGameObject(this.playerGlow);
        
        // Player Trail
        this.createTrailSystem();
    }

    createTrailSystem() {
        const trailGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < 20; i++) {
            const trail = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trail.visible = false;
            this.trailParticles.push(trail);
            this.addGameObject(trail);
        }
    }

    generateMaze() {
        const mazeSize = 20;
        const wallHeight = 2;
        const wallThickness = 0.2;
        
        // Boden
        const floorGeometry = new THREE.PlaneGeometry(mazeSize * 2, mazeSize * 2);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x333366,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.addGameObject(floor);
        
        // Generiere Labyrinth-Wände
        this.generateMazeWalls(mazeSize, wallHeight, wallThickness);
        
        // Dekorative Elemente
        this.addDecorativeElements(mazeSize);
    }

    generateMazeWalls(mazeSize, wallHeight, wallThickness) {
        const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 1);
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x6666aa,
            shininess: 50
        });
        
        // Erstelle ein einfaches Labyrinth-Pattern
        for (let x = -mazeSize; x <= mazeSize; x += 2) {
            for (let z = -mazeSize; z <= mazeSize; z += 2) {
                if (Math.random() > 0.3) { // 70% Chance für Wand
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
                    wall.position.set(x, wallHeight / 2, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    this.maze.push(wall);
                    this.addGameObject(wall);
                }
            }
        }
        
        // Füge zufällige Hindernisse hinzu
        this.addRandomObstacles(mazeSize, wallHeight);
    }

    addRandomObstacles(mazeSize, wallHeight) {
        const obstacleGeometry = new THREE.ConeGeometry(0.5, wallHeight, 8);
        const obstacleMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            shininess: 100
        });
        
        for (let i = 0; i < 15; i++) {
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial.clone());
            obstacle.position.set(
                Utils.random(-mazeSize + 2, mazeSize - 2),
                wallHeight / 2,
                Utils.random(-mazeSize + 2, mazeSize - 2)
            );
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            obstacle.userData.type = 'obstacle';
            this.addGameObject(obstacle);
        }
    }

    addDecorativeElements(mazeSize) {
        // Partikel-System für Atmosphäre
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = Utils.random(-mazeSize, mazeSize);
            particlePositions[i * 3 + 1] = Utils.random(5, 15);
            particlePositions[i * 3 + 2] = Utils.random(-mazeSize, mazeSize);
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x8888ff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.addGameObject(particleSystem);
    }

    createCheckpoints() {
        const checkpointGeometry = new THREE.RingGeometry(0.8, 1, 16);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 5; i++) {
            const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial.clone());
            checkpoint.position.set(
                Utils.random(-15, 15),
                0.1,
                Utils.random(-15, 15)
            );
            checkpoint.rotation.x = -Math.PI / 2;
            checkpoint.userData.type = 'checkpoint';
            checkpoint.userData.index = i;
            checkpoint.userData.collected = false;
            
            // Glow-Effekt
            const glowGeometry = new THREE.RingGeometry(1.2, 1.5, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(checkpoint.position);
            glow.rotation.x = -Math.PI / 2;
            
            this.checkpoints.push(checkpoint);
            this.addGameObject(checkpoint);
            this.addGameObject(glow);
        }
    }

    setupCamera() {
        // Third-person Kamera
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Kamera-Follow für Spieler
        this.cameraOffset = new THREE.Vector3(0, 6, 8);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.updateInput();
        this.updatePlayer(deltaTime);
        this.updateCamera(deltaTime);
        this.updateCheckpoints();
        this.updateTrail();
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.updateScore();
        
        // Game Over Check
        if (this.player.position.y < -10) {
            this.gameOver();
        }
    }

    updateInput() {
        const movement = window.inputManager.getMovementInput();
        this.input.forward = movement.y > 0;
        this.input.backward = movement.y < 0;
        this.input.left = movement.x < 0;
        this.input.right = movement.x > 0;
        this.input.jump = window.inputManager.getJumpInput();
    }

    updatePlayer(deltaTime) {
        if (!this.player) return;
        
        // Movement
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        if (this.input.forward) moveVector.z -= this.playerSpeed * deltaTime;
        if (this.input.backward) moveVector.z += this.playerSpeed * deltaTime;
        if (this.input.left) moveVector.x -= this.playerSpeed * deltaTime;
        if (this.input.right) moveVector.x += this.playerSpeed * deltaTime;
        
        // Rotation basierend auf Bewegung
        if (moveVector.length() > 0) {
            const targetRotation = Math.atan2(moveVector.x, moveVector.z);
            this.player.rotation.y = Utils.lerp(this.player.rotation.y, targetRotation, this.rotationSpeed * deltaTime);
        }
        
        // Jump
        if (this.input.jump && this.playerOnGround) {
            this.playerVelocity.y = this.jumpForce;
            this.playerOnGround = false;
            this.createJumpParticles();
        }
        
        // Gravity
        this.playerVelocity.y += this.gravity * deltaTime;
        
        // Apply movement
        const newPosition = this.player.position.clone();
        newPosition.add(moveVector);
        newPosition.y += this.playerVelocity.y * deltaTime;
        
        // Ground collision
        if (newPosition.y <= 1) {
            newPosition.y = 1;
            this.playerVelocity.y = 0;
            this.playerOnGround = true;
        }
        
        this.player.position.copy(newPosition);
        
        // Update glow
        this.playerGlow.position.copy(this.player.position);
        this.playerGlow.rotation.copy(this.player.rotation);
        
        // Rotation animation
        this.player.rotation.x += deltaTime * 2;
        this.player.rotation.z += deltaTime * 1.5;
    }

    updateCamera(deltaTime) {
        if (!this.player) return;
        
        // Kamera folgt dem Spieler
        const targetPosition = this.player.position.clone().add(this.cameraOffset);
        const currentPosition = this.camera.position.clone();
        
        // Smooth camera movement
        this.camera.position.lerp(targetPosition, deltaTime * 3);
        this.camera.lookAt(this.player.position);
    }

    updateCheckpoints() {
        if (!this.player) return;
        
        this.checkpoints.forEach((checkpoint, index) => {
            if (!checkpoint.userData.collected) {
                const distance = this.player.position.distanceTo(checkpoint.position);
                
                if (distance < 2) {
                    checkpoint.userData.collected = true;
                    checkpoint.visible = false;
                    this.currentCheckpoint++;
                    this.score += 100;
                    
                    // Spezial-Effekt
                    this.createCheckpointEffect(checkpoint.position);
                    
                    // Alle Checkpoints gesammelt?
                    if (this.currentCheckpoint >= this.checkpoints.length) {
                        this.levelComplete();
                    }
                }
            }
        });
    }

    updateTrail() {
        if (!this.player) return;
        
        // Aktualisiere Trail-Partikel
        for (let i = this.trailParticles.length - 1; i > 0; i--) {
            const current = this.trailParticles[i];
            const previous = this.trailParticles[i - 1];
            
            current.position.copy(previous.position);
            current.visible = previous.visible;
            
            if (current.material) {
                current.material.opacity = Math.max(0, current.material.opacity - 0.05);
            }
        }
        
        // Neues Partikel hinzufügen
        if (this.playerVelocity.length() > 5) {
            const newParticle = this.trailParticles[0];
            newParticle.position.copy(this.player.position);
            newParticle.position.y += 0.5;
            newParticle.visible = true;
            newParticle.material.opacity = 0.8;
        }
    }

    updateParticles(deltaTime) {
        // Aktualisiere Partikel-Systeme
        this.particles.forEach((particle, index) => {
            particle.life -= deltaTime;
            if (particle.life <= 0) {
                particle.mesh.visible = false;
                this.particles.splice(index, 1);
            } else {
                particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.mesh.material.opacity = particle.life / particle.maxLife;
            }
        });
    }

    checkCollisions() {
        if (!this.player) return;
        
        // Wand-Kollisionen
        this.maze.forEach(wall => {
            const distance = this.player.position.distanceTo(wall.position);
            if (distance < 1.5) {
                // Einfache Kollisionsbehandlung
                const direction = this.player.position.clone().sub(wall.position).normalize();
                this.player.position.add(direction.multiplyScalar(0.1));
            }
        });
        
        // Hindernis-Kollisionen
        this.scene.traverse((child) => {
            if (child.userData.type === 'obstacle') {
                const distance = this.player.position.distanceTo(child.position);
                if (distance < 1.2) {
                    // Kollision mit Hindernis
                    this.playerHitObstacle();
                }
            }
        });
    }

    updateScore() {
        this.gameTime = (Date.now() - this.startTime) / 1000;
        this.timeBonus = Math.max(0, 300 - this.gameTime) * 10;
        
        const totalScore = this.score + this.timeBonus;
        window.gameEvents.emit('scoreUpdate', Math.floor(totalScore));
    }

    createJumpParticles() {
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(this.player.position);
            particle.position.y += 0.5;
            
            this.addGameObject(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    Utils.random(-5, 5),
                    Utils.random(5, 10),
                    Utils.random(-5, 5)
                ),
                life: 1,
                maxLife: 1
            });
        }
    }

    createCheckpointEffect(position) {
        for (let i = 0; i < 20; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.y += Utils.random(0, 3);
            
            this.addGameObject(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    Utils.random(-10, 10),
                    Utils.random(5, 15),
                    Utils.random(-10, 10)
                ),
                life: 2,
                maxLife: 2
            });
        }
    }

    playerHitObstacle() {
        // Player verliert Leben
        this.stats.lives--;
        window.gameEvents.emit('livesUpdate', this.stats.lives);
        
        if (this.stats.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn
            this.player.position.set(0, 1, 0);
            this.playerVelocity.set(0, 0, 0);
        }
    }

    levelComplete() {
        // Level abgeschlossen
        this.score += 500; // Bonus für Level-Abschluss
        window.gameEvents.emit('levelUpdate', 2); // Nächstes Level
        
        // Neue Checkpoints generieren
        this.currentCheckpoint = 0;
        this.checkpoints.forEach(checkpoint => {
            checkpoint.visible = true;
            checkpoint.userData.collected = false;
            checkpoint.position.set(
                Utils.random(-15, 15),
                0.1,
                Utils.random(-15, 15)
            );
        });
    }

    gameOver() {
        window.gameEvents.emit('gameOver', this.score);
    }
}
