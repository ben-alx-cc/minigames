// Space Shooter - 3D Weltraum-Shooter
class SpaceShooter extends BaseGame {
    constructor(scene, camera, renderer) {
        super(scene, camera, renderer);
        
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.asteroids = [];
        this.explosions = [];
        this.stars = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 1;
        
        this.playerSpeed = 15;
        this.bulletSpeed = 30;
        this.enemySpeed = 8;
        
        this.lastShot = 0;
        this.shootCooldown = 150; // ms
        
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 2000; // ms
        
        this.lastAsteroidSpawn = 0;
        this.asteroidSpawnInterval = 3000; // ms
        
        this.backgroundMusic = null;
        this.soundEffects = {};
    }

    init() {
        super.init();
        this.createPlayer();
        this.createStarField();
        this.createAsteroidBelt();
        this.setupCamera();
        this.startEnemyWaves();
        
        console.log('Space Shooter initialized');
    }

    createPlayer() {
        // Player Ship
        const shipGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const shipMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            shininess: 100,
            emissive: 0x004400
        });
        
        this.player = new THREE.Mesh(shipGeometry, shipMaterial);
        this.player.position.set(0, 0, -15);
        this.player.castShadow = true;
        this.player.userData.type = 'player';
        this.player.userData.health = 100;
        this.player.userData.maxHealth = 100;
        
        // Player Glow
        const glowGeometry = new THREE.ConeGeometry(0.7, 2.2, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3
        });
        this.playerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.playerGlow.position.copy(this.player.position);
        
        this.addGameObject(this.player);
        this.addGameObject(this.playerGlow);
        
        // Engine Trail
        this.createEngineTrail();
    }

    createEngineTrail() {
        const trailGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        this.engineTrails = [];
        for (let i = 0; i < 20; i++) {
            const trail = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trail.visible = false;
            this.engineTrails.push(trail);
            this.addGameObject(trail);
        }
    }

    createStarField() {
        const starCount = 200;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 100;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const starField = new THREE.Points(starGeometry, starMaterial);
        this.stars.push(starField);
        this.addGameObject(starField);
    }

    createAsteroidBelt() {
        for (let i = 0; i < 20; i++) {
            this.spawnAsteroid();
        }
    }

    spawnAsteroid() {
        const size = Utils.random(1, 4);
        const geometry = new THREE.SphereGeometry(size, 8, 6);
        
        // Zufällige Form für Asteroid
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const noise = Utils.random(0.8, 1.2);
            positions[i] *= noise;
            positions[i + 1] *= noise;
            positions[i + 2] *= noise;
        }
        geometry.attributes.position.needsUpdate = true;
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 10
        });
        
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.position.set(
            Utils.random(-30, 30),
            Utils.random(-20, 20),
            Utils.random(10, 50)
        );
        
        asteroid.userData.type = 'asteroid';
        asteroid.userData.velocity = new THREE.Vector3(
            Utils.random(-2, 2),
            Utils.random(-2, 2),
            Utils.random(-3, -1)
        );
        asteroid.userData.rotation = new THREE.Vector3(
            Utils.random(-0.02, 0.02),
            Utils.random(-0.02, 0.02),
            Utils.random(-0.02, 0.02)
        );
        asteroid.userData.size = size;
        
        asteroid.castShadow = true;
        asteroid.receiveShadow = true;
        
        this.asteroids.push(asteroid);
        this.addGameObject(asteroid);
    }

    setupCamera() {
        // Third-person Kamera hinter dem Spieler
        this.cameraOffset = new THREE.Vector3(0, 5, 8);
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        if (this.player) {
            const targetPosition = this.player.position.clone().add(this.cameraOffset);
            this.camera.position.lerp(targetPosition, 0.1);
            this.camera.lookAt(this.player.position);
        }
    }

    startEnemyWaves() {
        this.spawnEnemyWave();
    }

    spawnEnemyWave() {
        const enemyCount = 3 + this.wave;
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 500);
        }
        
        // Nächste Welle
        setTimeout(() => {
            this.wave++;
            this.spawnEnemyWave();
        }, enemyCount * 500 + 3000);
    }

    spawnEnemy() {
        const enemyTypes = ['fighter', 'bomber', 'interceptor'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        let enemy;
        switch (enemyType) {
            case 'fighter':
                enemy = this.createFighterEnemy();
                break;
            case 'bomber':
                enemy = this.createBomberEnemy();
                break;
            case 'interceptor':
                enemy = this.createInterceptorEnemy();
                break;
        }
        
        // Position oberhalb des Bildschirms
        enemy.position.set(
            Utils.random(-15, 15),
            Utils.random(10, 20),
            Utils.random(5, 15)
        );
        
        enemy.userData.type = 'enemy';
        enemy.userData.enemyType = enemyType;
        enemy.userData.health = enemy.userData.maxHealth;
        enemy.userData.lastShot = 0;
        enemy.userData.shootCooldown = 1000 + Math.random() * 1000;
        
        this.enemies.push(enemy);
        this.addGameObject(enemy);
    }

    createFighterEnemy() {
        const geometry = new THREE.ConeGeometry(0.4, 1.5, 6);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            shininess: 100,
            emissive: 0x440000
        });
        
        const fighter = new THREE.Mesh(geometry, material);
        fighter.castShadow = true;
        fighter.userData.maxHealth = 50;
        fighter.userData.points = 100;
        
        return fighter;
    }

    createBomberEnemy() {
        const geometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff8844,
            shininess: 50,
            emissive: 0x442200
        });
        
        const bomber = new THREE.Mesh(geometry, material);
        bomber.castShadow = true;
        bomber.userData.maxHealth = 100;
        bomber.userData.points = 200;
        
        return bomber;
    }

    createInterceptorEnemy() {
        const geometry = new THREE.OctahedronGeometry(0.8);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4444ff,
            shininess: 100,
            emissive: 0x000044
        });
        
        const interceptor = new THREE.Mesh(geometry, material);
        interceptor.castShadow = true;
        interceptor.userData.maxHealth = 75;
        interceptor.userData.points = 150;
        
        return interceptor;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBullets(deltaTime);
        this.updateEnemyBullets(deltaTime);
        this.updateAsteroids(deltaTime);
        this.updateCamera(deltaTime);
        this.updateEngineTrail(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateStars(deltaTime);
        
        this.checkCollisions();
        this.checkEnemySpawning();
        this.checkAsteroidSpawning();
    }

    updatePlayer(deltaTime) {
        if (!this.player) return;
        
        const movement = window.inputManager.getMovementInput();
        
        // Player Movement
        const moveSpeed = this.playerSpeed * deltaTime;
        this.player.position.x += movement.x * moveSpeed;
        this.player.position.y += movement.y * moveSpeed;
        
        // Clamp Player Position
        this.player.position.x = Utils.clamp(this.player.position.x, -15, 15);
        this.player.position.y = Utils.clamp(this.player.position.y, -10, 10);
        
        // Shooting
        const now = Date.now();
        if (window.inputManager.getActionInput() && now - this.lastShot > this.shootCooldown) {
            this.shoot();
            this.lastShot = now;
        }
        
        // Update Glow
        this.playerGlow.position.copy(this.player.position);
        this.playerGlow.rotation.copy(this.player.rotation);
    }

    updateEnemies(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            // Enemy Movement
            enemy.position.z -= this.enemySpeed * deltaTime;
            
            // Enemy Shooting
            const now = Date.now();
            if (now - enemy.userData.lastShot > enemy.userData.shootCooldown) {
                this.enemyShoot(enemy);
                enemy.userData.lastShot = now;
            }
            
            // Enemy Rotation
            enemy.rotation.x += deltaTime * 2;
            enemy.rotation.y += deltaTime * 1.5;
            
            // Remove if off screen
            if (enemy.position.z < -20) {
                this.removeEnemy(enemy, index);
            }
        });
    }

    updateBullets(deltaTime) {
        this.bullets.forEach((bullet, index) => {
            bullet.position.z += this.bulletSpeed * deltaTime;
            
            // Remove if off screen
            if (bullet.position.z > 30) {
                this.removeBullet(bullet, index);
            }
        });
    }

    updateEnemyBullets(deltaTime) {
        this.enemyBullets.forEach((bullet, index) => {
            bullet.position.z -= this.bulletSpeed * deltaTime;
            
            // Remove if off screen
            if (bullet.position.z < -25) {
                this.removeEnemyBullet(bullet, index);
            }
        });
    }

    updateAsteroids(deltaTime) {
        this.asteroids.forEach((asteroid, index) => {
            // Asteroid Movement
            asteroid.position.add(asteroid.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Asteroid Rotation
            asteroid.rotation.x += asteroid.userData.rotation.x;
            asteroid.rotation.y += asteroid.userData.rotation.y;
            asteroid.rotation.z += asteroid.userData.rotation.z;
            
            // Wrap around screen
            if (asteroid.position.x > 35) asteroid.position.x = -35;
            if (asteroid.position.x < -35) asteroid.position.x = 35;
            if (asteroid.position.y > 25) asteroid.position.y = -25;
            if (asteroid.position.y < -25) asteroid.position.y = 25;
            if (asteroid.position.z > 60) asteroid.position.z = 10;
            if (asteroid.position.z < -30) asteroid.position.z = 50;
        });
    }

    updateCamera(deltaTime) {
        this.updateCameraPosition();
    }

    updateEngineTrail(deltaTime) {
        if (!this.player) return;
        
        // Update engine trail particles
        for (let i = this.engineTrails.length - 1; i > 0; i--) {
            const current = this.engineTrails[i];
            const previous = this.engineTrails[i - 1];
            
            current.position.copy(previous.position);
            current.visible = previous.visible;
            
            if (current.material) {
                current.material.opacity = Math.max(0, current.material.opacity - 0.1);
            }
        }
        
        // Add new trail particle
        const movement = window.inputManager.getMovementInput();
        if (movement.x !== 0 || movement.y !== 0) {
            const newTrail = this.engineTrails[0];
            newTrail.position.copy(this.player.position);
            newTrail.position.z += 1;
            newTrail.position.x += (Math.random() - 0.5) * 0.5;
            newTrail.position.y += (Math.random() - 0.5) * 0.5;
            newTrail.visible = true;
            newTrail.material.opacity = 0.8;
        }
    }

    updateExplosions(deltaTime) {
        this.explosions.forEach((explosion, index) => {
            explosion.life -= deltaTime;
            if (explosion.life <= 0) {
                this.scene.remove(explosion.mesh);
                explosion.mesh.geometry.dispose();
                explosion.mesh.material.dispose();
                this.explosions.splice(index, 1);
            } else {
                explosion.mesh.scale.multiplyScalar(1.05);
                explosion.mesh.material.opacity = explosion.life / explosion.maxLife;
            }
        });
    }

    updateStars(deltaTime) {
        this.stars.forEach(starField => {
            starField.rotation.z += deltaTime * 0.1;
        });
    }

    shoot() {
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9
        });
        
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(this.player.position);
        bullet.position.z += 2;
        
        bullet.userData.type = 'playerBullet';
        bullet.userData.damage = 25;
        
        this.bullets.push(bullet);
        this.addGameObject(bullet);
    }

    enemyShoot(enemy) {
        const bulletGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.9
        });
        
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(enemy.position);
        bullet.position.z -= 1;
        
        bullet.userData.type = 'enemyBullet';
        bullet.userData.damage = 15;
        
        this.enemyBullets.push(bullet);
        this.addGameObject(bullet);
    }

    checkCollisions() {
        // Player bullets vs Enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                const distance = bullet.position.distanceTo(enemy.position);
                if (distance < 1.5) {
                    this.hitEnemy(enemy, enemyIndex, bullet.userData.damage);
                    this.removeBullet(bullet, bulletIndex);
                }
            });
        });
        
        // Enemy bullets vs Player
        this.enemyBullets.forEach((bullet, bulletIndex) => {
            if (this.player) {
                const distance = bullet.position.distanceTo(this.player.position);
                if (distance < 1.5) {
                    this.hitPlayer(bullet.userData.damage);
                    this.removeEnemyBullet(bullet, bulletIndex);
                }
            }
        });
        
        // Player vs Enemies
        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.player) {
                const distance = this.player.position.distanceTo(enemy.position);
                if (distance < 2) {
                    this.hitPlayer(50); // Collision damage
                    this.hitEnemy(enemy, enemyIndex, 100); // Instant kill
                }
            }
        });
        
        // Player bullets vs Asteroids
        this.bullets.forEach((bullet, bulletIndex) => {
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                const distance = bullet.position.distanceTo(asteroid.position);
                if (distance < asteroid.userData.size + 0.5) {
                    this.hitAsteroid(asteroid, asteroidIndex);
                    this.removeBullet(bullet, bulletIndex);
                }
            });
        });
    }

    hitEnemy(enemy, index, damage) {
        enemy.userData.health -= damage;
        
        if (enemy.userData.health <= 0) {
            this.destroyEnemy(enemy, index);
        }
    }

    destroyEnemy(enemy, index) {
        // Score
        this.score += enemy.userData.points;
        window.gameEvents.emit('scoreUpdate', this.score);
        
        // Explosion
        this.createExplosion(enemy.position, enemy.material.color);
        
        // Remove enemy
        this.removeEnemy(enemy, index);
        
        // Chance für PowerUp
        if (Math.random() < 0.2) {
            this.spawnPowerUp(enemy.position);
        }
    }

    hitPlayer(damage) {
        if (!this.player) return;
        
        this.player.userData.health -= damage;
        
        // Screen flash effect
        this.createScreenFlash();
        
        if (this.player.userData.health <= 0) {
            this.gameOver();
        }
    }

    hitAsteroid(asteroid, index) {
        this.createExplosion(asteroid.position, 0x666666);
        this.removeAsteroid(asteroid, index);
        
        // Chance für neue kleinere Asteroiden
        if (asteroid.userData.size > 2 && Math.random() < 0.5) {
            this.createAsteroidDebris(asteroid.position, asteroid.userData.size);
        }
    }

    createExplosion(position, color) {
        const explosionGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        
        this.addGameObject(explosion);
        
        this.explosions.push({
            mesh: explosion,
            life: 1,
            maxLife: 1
        });
    }

    createScreenFlash() {
        // Einfacher Screen-Flash-Effekt
        const flashGeometry = new THREE.PlaneGeometry(100, 100);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.z = -10;
        
        this.addGameObject(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
            flash.geometry.dispose();
            flash.material.dispose();
        }, 200);
    }

    createAsteroidDebris(position, originalSize) {
        for (let i = 0; i < 3; i++) {
            const debrisSize = originalSize * 0.6;
            const geometry = new THREE.SphereGeometry(debrisSize, 6, 4);
            const material = new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 10
            });
            
            const debris = new THREE.Mesh(geometry, material);
            debris.position.copy(position);
            debris.position.add(new THREE.Vector3(
                Utils.random(-2, 2),
                Utils.random(-2, 2),
                Utils.random(-2, 2)
            ));
            
            debris.userData.type = 'asteroid';
            debris.userData.velocity = new THREE.Vector3(
                Utils.random(-3, 3),
                Utils.random(-3, 3),
                Utils.random(-2, 2)
            );
            debris.userData.rotation = new THREE.Vector3(
                Utils.random(-0.05, 0.05),
                Utils.random(-0.05, 0.05),
                Utils.random(-0.05, 0.05)
            );
            debris.userData.size = debrisSize;
            
            this.asteroids.push(debris);
            this.addGameObject(debris);
        }
    }

    spawnPowerUp(position) {
        const powerUpTypes = ['health', 'speed', 'damage'];
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        let geometry, color;
        switch (powerUpType) {
            case 'health':
                geometry = new THREE.OctahedronGeometry(0.5);
                color = 0x00ff00;
                break;
            case 'speed':
                geometry = new THREE.TetrahedronGeometry(0.5);
                color = 0xffff00;
                break;
            case 'damage':
                geometry = new THREE.ConeGeometry(0.5, 1, 6);
                color = 0xff0000;
                break;
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100,
            emissive: color.clone().multiplyScalar(0.3)
        });
        
        const powerUp = new THREE.Mesh(geometry, material);
        powerUp.position.copy(position);
        powerUp.userData.type = 'powerUp';
        powerUp.userData.powerUpType = powerUpType;
        
        this.powerUps.push(powerUp);
        this.addGameObject(powerUp);
    }

    checkEnemySpawning() {
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            // Spawn wird über Wave-System gesteuert
            this.lastEnemySpawn = now;
        }
    }

    checkAsteroidSpawning() {
        const now = Date.now();
        if (now - this.lastAsteroidSpawn > this.asteroidSpawnInterval) {
            this.spawnAsteroid();
            this.lastAsteroidSpawn = now;
        }
    }

    // Cleanup methods
    removeEnemy(enemy, index) {
        this.enemies.splice(index, 1);
        this.scene.remove(enemy);
        enemy.geometry.dispose();
        enemy.material.dispose();
    }

    removeBullet(bullet, index) {
        this.bullets.splice(index, 1);
        this.scene.remove(bullet);
        bullet.geometry.dispose();
        bullet.material.dispose();
    }

    removeEnemyBullet(bullet, index) {
        this.enemyBullets.splice(index, 1);
        this.scene.remove(bullet);
        bullet.geometry.dispose();
        bullet.material.dispose();
    }

    removeAsteroid(asteroid, index) {
        this.asteroids.splice(index, 1);
        this.scene.remove(asteroid);
        asteroid.geometry.dispose();
        asteroid.material.dispose();
    }

    gameOver() {
        window.gameEvents.emit('gameOver', this.score);
    }
}
