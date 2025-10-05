// 3D Block Puzzle - Strategisches 3D-Puzzle
class BlockPuzzle extends BaseGame {
    constructor(scene, camera, renderer) {
        super(scene, camera, renderer);
        
        this.grid = [];
        this.blocks = [];
        this.selectedBlock = null;
        this.targetPattern = [];
        this.currentPattern = [];
        
        this.score = 0;
        this.moves = 0;
        this.level = 1;
        this.maxMoves = 20;
        
        this.gridSize = 4;
        this.blockSize = 1;
        this.gridSpacing = 1.2;
        
        this.cameraAngle = 0;
        this.cameraDistance = 12;
        this.cameraHeight = 8;
        
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.particles = [];
        this.highlights = [];
    }

    init() {
        super.init();
        this.createGrid();
        this.createBlocks();
        this.generateTargetPattern();
        this.setupCamera();
        this.createUI();
        
        console.log('3D Block Puzzle initialized');
    }

    createGrid() {
        const gridGeometry = new THREE.PlaneGeometry(
            this.gridSize * this.gridSpacing,
            this.gridSize * this.gridSpacing
        );
        const gridMaterial = new THREE.MeshPhongMaterial({
            color: 0x333366,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -0.1;
        grid.receiveShadow = true;
        this.addGameObject(grid);
        
        // Grid-Linien
        this.createGridLines();
    }

    createGridLines() {
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x666699,
            transparent: true,
            opacity: 0.5
        });
        
        const points = [];
        const spacing = this.gridSpacing;
        const halfSize = (this.gridSize * spacing) / 2;
        
        // Vertikale Linien
        for (let i = 0; i <= this.gridSize; i++) {
            const x = -halfSize + i * spacing;
            points.push(new THREE.Vector3(x, 0, -halfSize));
            points.push(new THREE.Vector3(x, 0, halfSize));
        }
        
        // Horizontale Linien
        for (let i = 0; i <= this.gridSize; i++) {
            const z = -halfSize + i * spacing;
            points.push(new THREE.Vector3(-halfSize, 0, z));
            points.push(new THREE.Vector3(halfSize, 0, z));
        }
        
        lineGeometry.setFromPoints(points);
        const gridLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        this.addGameObject(gridLines);
    }

    createBlocks() {
        this.grid = [];
        this.blocks = [];
        
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let z = 0; z < this.gridSize; z++) {
                this.grid[x][z] = null;
                
                // Zufällige Block-Erstellung
                if (Math.random() > 0.3) {
                    this.createBlock(x, z);
                }
            }
        }
    }

    createBlock(gridX, gridZ) {
        const blockTypes = ['cube', 'sphere', 'pyramid', 'cylinder'];
        const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        
        let geometry, color;
        switch (blockType) {
            case 'cube':
                geometry = new THREE.BoxGeometry(this.blockSize * 0.9, this.blockSize, this.blockSize * 0.9);
                color = new THREE.Color().setHSL(0.1, 0.8, 0.6);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(this.blockSize * 0.5, 12, 8);
                color = new THREE.Color().setHSL(0.3, 0.8, 0.6);
                break;
            case 'pyramid':
                geometry = new THREE.ConeGeometry(this.blockSize * 0.5, this.blockSize, 4);
                color = new THREE.Color().setHSL(0.6, 0.8, 0.6);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(this.blockSize * 0.4, this.blockSize * 0.4, this.blockSize, 8);
                color = new THREE.Color().setHSL(0.8, 0.8, 0.6);
                break;
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        const block = new THREE.Mesh(geometry, material);
        
        // Position berechnen
        const worldPos = this.gridToWorld(gridX, gridZ);
        block.position.set(worldPos.x, this.blockSize / 2, worldPos.z);
        
        block.castShadow = true;
        block.receiveShadow = true;
        
        block.userData.type = 'block';
        block.userData.blockType = blockType;
        block.userData.gridX = gridX;
        block.userData.gridZ = gridZ;
        block.userData.color = color;
        block.userData.selected = false;
        
        this.grid[gridX][gridZ] = block;
        this.blocks.push(block);
        this.addGameObject(block);
        
        // Highlight für ausgewählte Blöcke
        this.createBlockHighlight(block);
    }

    createBlockHighlight(block) {
        const highlightGeometry = new THREE.BoxGeometry(this.blockSize * 1.1, 0.1, this.blockSize * 1.1);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5
        });
        
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.copy(block.position);
        highlight.position.y = 0.05;
        highlight.visible = false;
        
        block.userData.highlight = highlight;
        this.highlights.push(highlight);
        this.addGameObject(highlight);
    }

    generateTargetPattern() {
        this.targetPattern = [];
        this.currentPattern = [];
        
        // Erstelle ein zufälliges Ziel-Pattern
        const patternSize = Math.min(3 + this.level, this.gridSize);
        const patternBlocks = [];
        
        for (let i = 0; i < patternSize; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const z = Math.floor(Math.random() * this.gridSize);
            
            if (!patternBlocks.find(b => b.x === x && b.z === z)) {
                patternBlocks.push({ x, z });
            }
        }
        
        this.targetPattern = patternBlocks;
        
        // Zeige das Ziel-Pattern
        this.showTargetPattern();
    }

    showTargetPattern() {
        // Erstelle visuelle Anzeige des Ziel-Patterns
        this.targetPattern.forEach((pos, index) => {
            const targetGeometry = new THREE.RingGeometry(0.4, 0.6, 16);
            const targetMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const target = new THREE.Mesh(targetGeometry, targetMaterial);
            const worldPos = this.gridToWorld(pos.x, pos.z);
            target.position.set(worldPos.x, 0.01, worldPos.z);
            target.rotation.x = -Math.PI / 2;
            
            this.addGameObject(target);
        });
    }

    setupCamera() {
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const x = Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = Math.sin(this.cameraAngle) * this.cameraDistance;
        
        this.camera.position.set(x, this.cameraHeight, z);
        this.camera.lookAt(0, 0, 0);
    }

    createUI() {
        // UI-Elemente werden über HTML gesteuert
        this.updateUI();
    }

    updateUI() {
        // Update UI über Game Events
        window.gameEvents.emit('scoreUpdate', this.score);
        window.gameEvents.emit('levelUpdate', this.level);
        
        // Moves-Anzeige
        const movesElement = document.getElementById('moves-value');
        if (movesElement) {
            movesElement.textContent = `${this.moves}/${this.maxMoves}`;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.updateInput(deltaTime);
        this.updateCamera(deltaTime);
        this.updateAnimations(deltaTime);
        this.updateParticles(deltaTime);
        this.updateBlockHighlights();
        
        // Auto-Kamera-Rotation
        this.cameraAngle += deltaTime * 0.05;
    }

    updateInput(deltaTime) {
        if (this.isAnimating) return;
        
        const movement = window.inputManager.getMovementInput();
        
        // Kamera-Rotation mit Pfeiltasten
        if (movement.x !== 0) {
            this.cameraAngle += movement.x * deltaTime * 2;
        }
        
        // Block-Auswahl mit Maus/Touch
        if (window.inputManager.getActionInput()) {
            this.handleBlockSelection();
        }
        
        // Kamera-Zoom mit Mausrad
        if (window.inputManager.isKeyDown('KeyQ')) {
            this.cameraDistance = Math.min(20, this.cameraDistance + 1);
        }
        if (window.inputManager.isKeyDown('KeyE')) {
            this.cameraDistance = Math.max(5, this.cameraDistance - 1);
        }
    }

    handleBlockSelection() {
        const mouse = window.inputManager.getMousePosition();
        const touch = window.inputManager.getTouchPosition();
        
        if (mouse || touch) {
            const position = mouse || touch;
            const block = this.getBlockAtScreenPosition(position.x, position.y);
            
            if (block) {
                this.selectBlock(block);
            }
        }
    }

    getBlockAtScreenPosition(screenX, screenY) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Screen-Koordinaten zu normalisierten Geräte-Koordinaten
        mouse.x = (screenX / window.innerWidth) * 2 - 1;
        mouse.y = -(screenY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        
        const intersects = raycaster.intersectObjects(this.blocks);
        
        if (intersects.length > 0) {
            return intersects[0].object;
        }
        
        return null;
    }

    selectBlock(block) {
        if (this.selectedBlock === block) {
            // Block abwählen
            this.deselectBlock();
            return;
        }
        
        if (this.selectedBlock) {
            // Versuche Block zu bewegen
            if (this.canMoveBlock(this.selectedBlock, block)) {
                this.moveBlock(this.selectedBlock, block);
            } else {
                // Neue Auswahl
                this.deselectBlock();
                this.selectBlock(block);
            }
        } else {
            // Neue Auswahl
            this.selectedBlock = block;
            block.userData.selected = true;
            if (block.userData.highlight) {
                block.userData.highlight.visible = true;
            }
            
            // Block-Animation
            this.animateBlockSelection(block, true);
        }
    }

    deselectBlock() {
        if (this.selectedBlock) {
            this.selectedBlock.userData.selected = false;
            if (this.selectedBlock.userData.highlight) {
                this.selectedBlock.userData.highlight.visible = false;
            }
            this.animateBlockSelection(this.selectedBlock, false);
            this.selectedBlock = null;
        }
    }

    canMoveBlock(fromBlock, toBlock) {
        if (!fromBlock || !toBlock) return false;
        if (fromBlock === toBlock) return false;
        
        const fromGridX = fromBlock.userData.gridX;
        const fromGridZ = fromBlock.userData.gridZ;
        const toGridX = toBlock.userData.gridX;
        const toGridZ = toBlock.userData.gridZ;
        
        // Prüfe ob Ziel-Position leer ist
        const targetGridPos = this.grid[toGridX][toGridZ];
        if (targetGridPos && targetGridPos !== fromBlock) return false;
        
        // Prüfe ob Bewegung in einer Linie ist (horizontal oder vertikal)
        const isHorizontal = fromGridZ === toGridZ;
        const isVertical = fromGridX === toGridX;
        
        if (!isHorizontal && !isVertical) return false;
        
        // Prüfe ob Pfad frei ist
        return this.isPathClear(fromGridX, fromGridZ, toGridX, toGridZ);
    }

    isPathClear(fromX, fromZ, toX, toZ) {
        const stepX = fromX === toX ? 0 : (toX > fromX ? 1 : -1);
        const stepZ = fromZ === toZ ? 0 : (toZ > fromZ ? 1 : -1);
        
        let currentX = fromX + stepX;
        let currentZ = fromZ + stepZ;
        
        while (currentX !== toX || currentZ !== toZ) {
            if (this.grid[currentX][currentZ] !== null) {
                return false;
            }
            currentX += stepX;
            currentZ += stepZ;
        }
        
        return true;
    }

    moveBlock(fromBlock, toBlock) {
        const fromGridX = fromBlock.userData.gridX;
        const fromGridZ = fromBlock.userData.gridZ;
        const toGridX = toBlock.userData.gridX;
        const toGridZ = toBlock.userData.gridZ;
        
        // Grid aktualisieren
        this.grid[fromGridX][fromGridZ] = null;
        this.grid[toGridX][toGridZ] = fromBlock;
        
        // Block-Position aktualisieren
        fromBlock.userData.gridX = toGridX;
        fromBlock.userData.gridZ = toGridZ;
        
        // Animation
        this.animateBlockMove(fromBlock, toGridX, toGridZ);
        
        this.moves++;
        this.updateUI();
        
        this.deselectBlock();
        
        // Prüfe ob Pattern erreicht wurde
        setTimeout(() => {
            this.checkPattern();
        }, 500);
        
        // Prüfe Game Over
        if (this.moves >= this.maxMoves) {
            setTimeout(() => {
                this.gameOver();
            }, 1000);
        }
    }

    animateBlockSelection(block, selected) {
        const targetScale = selected ? 1.1 : 1.0;
        const targetY = selected ? this.blockSize / 2 + 0.2 : this.blockSize / 2;
        
        this.animationQueue.push({
            type: 'selection',
            block: block,
            targetScale: targetScale,
            targetY: targetY,
            duration: 0.2
        });
    }

    animateBlockMove(block, toGridX, toGridZ) {
        const targetPos = this.gridToWorld(toGridX, toGridZ);
        
        this.animationQueue.push({
            type: 'move',
            block: block,
            targetPosition: targetPos,
            duration: 0.5
        });
    }

    updateAnimations(deltaTime) {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        this.isAnimating = true;
        const animation = this.animationQueue[0];
        
        if (!animation.started) {
            animation.started = true;
            animation.startTime = Date.now();
            
            if (animation.type === 'selection') {
                animation.startScale = animation.block.scale.x;
                animation.startY = animation.block.position.y;
            } else if (animation.type === 'move') {
                animation.startPosition = animation.block.position.clone();
            }
        }
        
        const elapsed = (Date.now() - animation.startTime) / 1000;
        const progress = Math.min(elapsed / animation.duration, 1);
        
        if (animation.type === 'selection') {
            const easedProgress = Utils.easeInOutCubic(progress);
            animation.block.scale.setScalar(
                Utils.lerp(animation.startScale, animation.targetScale, easedProgress)
            );
            animation.block.position.y = Utils.lerp(animation.startY, animation.targetY, easedProgress);
        } else if (animation.type === 'move') {
            const easedProgress = Utils.easeInOutCubic(progress);
            animation.block.position.lerpVectors(animation.startPosition, animation.targetPosition, easedProgress);
        }
        
        if (progress >= 1) {
            this.animationQueue.shift();
        }
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

    updateBlockHighlights() {
        this.highlights.forEach(highlight => {
            if (highlight.visible) {
                highlight.rotation.y += 0.02;
            }
        });
    }

    checkPattern() {
        this.currentPattern = [];
        
        this.targetPattern.forEach(targetPos => {
            const block = this.grid[targetPos.x][targetPos.z];
            if (block) {
                this.currentPattern.push({
                    x: targetPos.x,
                    z: targetPos.z,
                    block: block
                });
            }
        });
        
        if (this.currentPattern.length === this.targetPattern.length) {
            this.levelComplete();
        }
    }

    levelComplete() {
        this.score += 1000 + (this.maxMoves - this.moves) * 50;
        this.level++;
        this.moves = 0;
        this.maxMoves = Math.min(25, this.maxMoves + 2);
        
        // Level-Complete-Effekt
        this.createLevelCompleteEffect();
        
        // Neues Level
        setTimeout(() => {
            this.clearLevel();
            this.createBlocks();
            this.generateTargetPattern();
            this.updateUI();
        }, 2000);
    }

    createLevelCompleteEffect() {
        // Partikel-Effekt für Level-Abschluss
        this.targetPattern.forEach(pos => {
            const worldPos = this.gridToWorld(pos.x, pos.z);
            this.createParticleExplosion(worldPos, 0x00ff00);
        });
    }

    createParticleExplosion(position, color) {
        for (let i = 0; i < 20; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.y += 1;
            
            this.addGameObject(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    Utils.random(-5, 5),
                    Utils.random(5, 10),
                    Utils.random(-5, 5)
                ),
                life: 2,
                maxLife: 2
            });
        }
    }

    clearLevel() {
        // Alle Blöcke entfernen
        this.blocks.forEach(block => {
            this.scene.remove(block);
            if (block.geometry) block.geometry.dispose();
            if (block.material) block.material.dispose();
            
            if (block.userData.highlight) {
                this.scene.remove(block.userData.highlight);
                block.userData.highlight.geometry.dispose();
                block.userData.highlight.material.dispose();
            }
        });
        
        this.blocks = [];
        this.highlights = [];
        this.grid = [];
        
        // Grid neu initialisieren
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let z = 0; z < this.gridSize; z++) {
                this.grid[x][z] = null;
            }
        }
    }

    gridToWorld(gridX, gridZ) {
        const halfSize = (this.gridSize * this.gridSpacing) / 2;
        return {
            x: -halfSize + gridX * this.gridSpacing,
            z: -halfSize + gridZ * this.gridSpacing
        };
    }

    worldToGrid(worldX, worldZ) {
        const halfSize = (this.gridSize * this.gridSpacing) / 2;
        const gridX = Math.round((worldX + halfSize) / this.gridSpacing);
        const gridZ = Math.round((worldZ + halfSize) / this.gridSpacing);
        
        return {
            x: Utils.clamp(gridX, 0, this.gridSize - 1),
            z: Utils.clamp(gridZ, 0, this.gridSize - 1)
        };
    }

    updateCamera(deltaTime) {
        this.updateCameraPosition();
    }

    gameOver() {
        window.gameEvents.emit('gameOver', this.score);
    }
}
