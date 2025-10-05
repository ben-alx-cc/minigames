// Gravity Balls - Physik-basiertes Ball-Spiel
class GravityBalls extends BaseGame {
    constructor(scene, camera, renderer) {
        super(scene, camera, renderer);
        
        this.balls = [];
        this.targets = [];
        this.obstacles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.gravity = -9.81;
        this.bounceDamping = 0.7;
        this.friction = 0.98;
        
        this.nextBallSpawn = 0;
        this.ballSpawnInterval = 2;
        
        this.particles = [];
        this.trails = [];
        
        this.cameraAngle = 0;
        this.cameraRadius = 15;
        this.cameraHeight = 8;
    }

    init() {
        super.init();
        this.createArena();
        this.createTargets();
        this.createObstacles();
        this.setupCamera();
        this.startBallSpawning();
        
        console.log('Gravity Balls initialized');
    }

    createArena() {
        // Arena-Boden
        const floorGeometry = new THREE.CircleGeometry(20, 32);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x444488,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.addGameObject(floor);
        
        // Arena-Wände (unsichtbare Kollisionsboxen)
        this.createArenaWalls();
        
        // Dekorative Ringe
        this.createDecorativeRings();
    }

    createArenaWalls() {
        const wallHeight = 5;
        const wallThickness = 0.5;
        
        // Ring-Wand
        const wallGeometry = new THREE.TorusGeometry(19, wallThickness, 8, 32);
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x6666aa,
            transparent: true,
            opacity: 0.3
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = wallHeight / 2;
        this.addGameObject(wall);
        
        // Kollisionsboxen für die Wände
        this.arenaWalls = [
            { position: new THREE.Vector3(20, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, 40) },
            { position: new THREE.Vector3(-20, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, 40) },
            { position: new THREE.Vector3(0, wallHeight/2, 20), size: new THREE.Vector3(40, wallHeight, wallThickness) },
            { position: new THREE.Vector3(0, wallHeight/2, -20), size: new THREE.Vector3(40, wallHeight, wallThickness) }
        ];
    }

    createDecorativeRings() {
        // Mehrere Ringe für visuellen Effekt
        for (let i = 1; i <= 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(i * 6, 0.1, 8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(i * 0.1, 0.8, 0.6),
                transparent: true,
                opacity: 0.4
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = 2 + i;
            ring.rotation.x = Math.PI / 2;
            this.addGameObject(ring);
        }
    }

    createTargets() {
        const targetCount = 5 + this.level;
        
        for (let i = 0; i < targetCount; i++) {
            const targetGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
            const targetMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
                shininess: 100,
                emissive: new THREE.Color().setHSL(Math.random(), 0.5, 0.2)
            });
            
            const target = new THREE.Mesh(targetGeometry, targetMaterial);
            
            // Positioniere Ziele in einem Kreis
            const angle = (i / targetCount) * Math.PI * 2;
            const radius = 12 + Math.random() * 4;
            target.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            
            target.userData.type = 'target';
            target.userData.hit = false;
            target.userData.points = 100;
            
            this.targets.push(target);
            this.addGameObject(target);
            
            // Glow-Effekt
            this.createTargetGlow(target);
        }
    }

    createTargetGlow(target) {
        const glowGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.05, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: target.material.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(target.position);
        glow.position.y += 0.1;
        glow.userData.parentTarget = target;
        this.addGameObject(glow);
    }

    createObstacles() {
        const obstacleCount = 3 + this.level;
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacleType = Math.random();
            let obstacle;
            
            if (obstacleType < 0.33) {
                // Box
                obstacle = this.createBoxObstacle();
            } else if (obstacleType < 0.66) {
                // Pyramid
                obstacle = this.createPyramidObstacle();
            } else {
                // Cylinder
                obstacle = this.createCylinderObstacle();
            }
            
            // Zufällige Position
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 8;
            obstacle.position.set(
                Math.cos(angle) * radius,
                obstacle.geometry.parameters.height / 2,
                Math.sin(angle) * radius
            );
            
            obstacle.userData.type = 'obstacle';
            this.obstacles.push(obstacle);
            this.addGameObject(obstacle);
        }
    }

    createBoxObstacle() {
        const geometry = new THREE.BoxGeometry(
            1 + Math.random() * 2,
            1 + Math.random() * 3,
            1 + Math.random() * 2
        );
        const material = new THREE.MeshPhongMaterial({
            color: 0xaa4444,
            shininess: 50
        });
        const box = new THREE.Mesh(geometry, material);
        box.castShadow = true;
        box.receiveShadow = true;
        return box;
    }

    createPyramidObstacle() {
        const geometry = new THREE.ConeGeometry(1 + Math.random(), 2 + Math.random() * 2, 4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x44aa44,
            shininess: 50
        });
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        return pyramid;
    }

    createCylinderObstacle() {
        const geometry = new THREE.CylinderGeometry(
            0.5 + Math.random() * 1,
            0.5 + Math.random() * 1,
            1 + Math.random() * 3,
            8
        );
        const material = new THREE.MeshPhongMaterial({
            color: 0x4444aa,
            shininess: 50
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        return cylinder;
    }

    setupCamera() {
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const x = Math.cos(this.cameraAngle) * this.cameraRadius;
        const z = Math.sin(this.cameraAngle) * this.cameraRadius;
        
        this.camera.position.set(x, this.cameraHeight, z);
        this.camera.lookAt(0, 0, 0);
    }

    startBallSpawning() {
        this.spawnBall();
    }

    spawnBall() {
        const ballGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(0, 10, 0);
        ball.castShadow = true;
        ball.receiveShadow = true;
        
        // Ball-Physik
        ball.userData.velocity = new THREE.Vector3(
            Utils.random(-5, 5),
            0,
            Utils.random(-5, 5)
        );
        ball.userData.type = 'ball';
        ball.userData.life = 30; // 30 Sekunden Lebensdauer
        
        this.balls.push(ball);
        this.addGameObject(ball);
        
        // Trail für Ball
        this.createBallTrail(ball);
        
        // Nächster Ball-Spawn
        this.nextBallSpawn = Date.now() + this.ballSpawnInterval * 1000;
    }

    createBallTrail(ball) {
        const trailGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: ball.material.color,
            transparent: true,
            opacity: 0.6
        });
        
        const trailParticles = [];
        for (let i = 0; i < 15; i++) {
            const trail = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trail.visible = false;
            trailParticles.push(trail);
            this.addGameObject(trail);
        }
        
        ball.userData.trail = trailParticles;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.updateBalls(deltaTime);
        this.updateCamera(deltaTime);
        this.updateTrails(deltaTime);
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.checkBallSpawning();
        this.updateTargets();
        
        // Auto-Kamera-Rotation
        this.cameraAngle += deltaTime * 0.1;
    }

    updateBalls(deltaTime) {
        this.balls.forEach((ball, index) => {
            if (!ball.userData.velocity) return;
            
            // Physik anwenden
            ball.userData.velocity.y += this.gravity * deltaTime;
            ball.userData.velocity.multiplyScalar(this.friction);
            
            // Position aktualisieren
            const deltaPosition = ball.userData.velocity.clone().multiplyScalar(deltaTime);
            ball.position.add(deltaPosition);
            
            // Ball-Rotation basierend auf Geschwindigkeit
            ball.rotation.x += ball.userData.velocity.z * deltaTime * 2;
            ball.rotation.z -= ball.userData.velocity.x * deltaTime * 2;
            
            // Lebensdauer reduzieren
            ball.userData.life -= deltaTime;
            if (ball.userData.life <= 0) {
                this.removeBall(ball, index);
            }
            
            // Ball außerhalb der Arena?
            if (ball.position.length() > 20 || ball.position.y < -5) {
                this.removeBall(ball, index);
            }
        });
    }

    updateCamera(deltaTime) {
        this.updateCameraPosition();
    }

    updateTrails(deltaTime) {
        this.balls.forEach(ball => {
            if (!ball.userData.trail) return;
            
            const trail = ball.userData.trail;
            
            // Trail-Partikel aktualisieren
            for (let i = trail.length - 1; i > 0; i--) {
                const current = trail[i];
                const previous = trail[i - 1];
                
                current.position.copy(previous.position);
                current.visible = previous.visible;
                
                if (current.material) {
                    current.material.opacity = Math.max(0, current.material.opacity - 0.1);
                }
            }
            
            // Neues Trail-Partikel
            if (ball.userData.velocity.length() > 2) {
                const newTrail = trail[0];
                newTrail.position.copy(ball.position);
                newTrail.visible = true;
                newTrail.material.opacity = 0.8;
            }
        });
    }

    updateParticles(deltaTime) {
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
        this.balls.forEach(ball => {
            // Boden-Kollision
            if (ball.position.y <= 0.5) {
                ball.position.y = 0.5;
                ball.userData.velocity.y *= -this.bounceDamping;
                ball.userData.velocity.x *= this.bounceDamping;
                ball.userData.velocity.z *= this.bounceDamping;
                
                // Bounce-Effekt
                this.createBounceEffect(ball.position);
            }
            
            // Wand-Kollisionen
            this.arenaWalls.forEach(wall => {
                const wallPos = wall.position;
                const wallSize = wall.size;
                
                if (ball.position.x > wallPos.x - wallSize.x/2 && ball.position.x < wallPos.x + wallSize.x/2 &&
                    ball.position.z > wallPos.z - wallSize.z/2 && ball.position.z < wallPos.z + wallSize.z/2 &&
                    ball.position.y < wallPos.y + wallSize.y/2 && ball.position.y > wallPos.y - wallSize.y/2) {
                    
                    // Ball zurück in Arena drücken
                    const direction = ball.position.clone().sub(wallPos).normalize();
                    direction.y = 0;
                    ball.position.add(direction.multiplyScalar(0.5));
                    ball.userData.velocity.multiplyScalar(-this.bounceDamping);
                    
                    this.createBounceEffect(ball.position);
                }
            });
            
            // Hindernis-Kollisionen
            this.obstacles.forEach(obstacle => {
                const distance = ball.position.distanceTo(obstacle.position);
                if (distance < 1.5) {
                    const direction = ball.position.clone().sub(obstacle.position).normalize();
                    ball.position.add(direction.multiplyScalar(0.3));
                    ball.userData.velocity.reflect(direction).multiplyScalar(this.bounceDamping);
                    
                    this.createBounceEffect(ball.position);
                }
            });
            
            // Ziel-Kollisionen
            this.targets.forEach(target => {
                if (!target.userData.hit) {
                    const distance = ball.position.distanceTo(target.position);
                    if (distance < 1.2) {
                        this.hitTarget(target, ball);
                    }
                }
            });
        });
    }

    hitTarget(target, ball) {
        target.userData.hit = true;
        target.visible = false;
        
        this.score += target.userData.points;
        window.gameEvents.emit('scoreUpdate', this.score);
        
        // Hit-Effekt
        this.createTargetHitEffect(target.position, target.material.color);
        
        // Prüfe ob alle Ziele getroffen
        const remainingTargets = this.targets.filter(t => !t.userData.hit);
        if (remainingTargets.length === 0) {
            this.levelComplete();
        }
    }

    createBounceEffect(position) {
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.y += 0.5;
            
            this.addGameObject(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    Utils.random(-3, 3),
                    Utils.random(2, 5),
                    Utils.random(-3, 3)
                ),
                life: 1,
                maxLife: 1
            });
        }
    }

    createTargetHitEffect(position, color) {
        for (let i = 0; i < 15; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.y += Utils.random(0, 2);
            
            this.addGameObject(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    Utils.random(-8, 8),
                    Utils.random(5, 12),
                    Utils.random(-8, 8)
                ),
                life: 2,
                maxLife: 2
            });
        }
    }

    removeBall(ball, index) {
        this.balls.splice(index, 1);
        this.scene.remove(ball);
        
        if (ball.geometry) ball.geometry.dispose();
        if (ball.material) ball.material.dispose();
        
        // Trail entfernen
        if (ball.userData.trail) {
            ball.userData.trail.forEach(trail => {
                this.scene.remove(trail);
                trail.geometry.dispose();
                trail.material.dispose();
            });
        }
    }

    checkBallSpawning() {
        if (Date.now() > this.nextBallSpawn) {
            this.spawnBall();
        }
    }

    updateTargets() {
        // Target-Animation
        this.targets.forEach(target => {
            if (!target.userData.hit) {
                target.rotation.y += 0.02;
                target.position.y = 0.1 + Math.sin(Date.now() * 0.002 + target.position.x) * 0.1;
            }
        });
    }

    levelComplete() {
        this.level++;
        this.score += 500; // Level-Bonus
        window.gameEvents.emit('levelUpdate', this.level);
        
        // Neue Ziele erstellen
        this.targets.forEach(target => {
            this.scene.remove(target);
            target.geometry.dispose();
            target.material.dispose();
        });
        this.targets = [];
        
        this.createTargets();
        this.createObstacles();
    }

    gameOver() {
        window.gameEvents.emit('gameOver', this.score);
    }
}
