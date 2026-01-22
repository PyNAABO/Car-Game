class GameManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.car = null;
        this.track = null;
        this.aiVehicles = [];
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.cameraMode = 'chase'; // chase, hood, cockpit
        this.lapCount = 1;
        this.totalLaps = 3;
        this.checkpointCount = 0;
        this.totalCheckpoints = 0;
        this.raceStarted = false;
        this.gamePaused = false;
        this.difficulty = 'medium';
        this.raceStartTime = null;
        this.raceTime = 0;
        this.playerPosition = 1;
        this.totalPlayers = 1; // Will include AI vehicles
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Effects
        this.postProcessing = null;
    }

    init() {
        // Initialize Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB);
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Initialize Cannon.js physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Setup lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Setup mouse controls for camera
        this.setupMouseControls();
    }

    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(100, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);
    }

    setupMouseControls() {
        // Mouse movement for camera control
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    startRace() {
        this.raceStarted = true;
        this.raceStartTime = Date.now();
        
        // Create track
        this.track = new TrackGenerator(this.scene, this.world);
        this.totalCheckpoints = this.track.getCheckpoints().length;
        
        // Create player car
        this.car = new CarController(this.scene, this.world);
        
        // Create AI vehicles based on difficulty
        this.createAIVehicles();
        
        // Start game loop
        this.animate();
    }

    createAIVehicles() {
        const trackPoints = this.track.getCheckpoints().map(cp => cp.position);
        
        // Create different numbers of AI vehicles based on difficulty
        let aiCount = 0;
        switch(this.difficulty) {
            case 'easy':
                aiCount = 2;
                break;
            case 'medium':
                aiCount = 4;
                break;
            case 'hard':
                aiCount = 6;
                break;
        }
        
        this.totalPlayers = aiCount + 1; // +1 for player
        
        for (let i = 0; i < aiCount; i++) {
            // Stagger AI vehicle positions
            const offsetPosition = new THREE.Vector3(
                Math.random() * 10 - 5,
                1,
                -20 - i * 10
            );
            
            const aiVehicle = new AIVehicle(this.scene, this.world, trackPoints, this.car);
            // Set initial position for the AI
            aiVehicle.chassisBody.position.set(offsetPosition.x, offsetPosition.y, offsetPosition.z);
            this.aiVehicles.push(aiVehicle);
        }
    }

    animate() {
        if (this.gamePaused) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update physics world
        this.world.step(1/60, deltaTime, 3);
        
        // Update game objects
        if (this.car) {
            this.car.update(deltaTime);
            this.updateCamera();
            this.updateHUD();
            this.checkCollisions();
            this.updateRaceProgress();
        }
        
        // Update AI vehicles
        this.aiVehicles.forEach(ai => ai.update(deltaTime, this.difficulty));
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    updateCamera() {
        if (!this.car) return;
        
        const carPos = this.car.getPosition();
        const carRot = this.car.getRotation();
        
        switch(this.cameraMode) {
            case 'chase':
                // Chase camera behind the car
                const chaseDistance = 10;
                const chaseHeight = 5;
                
                const offsetX = Math.sin(carRot) * chaseDistance;
                const offsetZ = Math.cos(carRot) * chaseDistance;
                
                this.camera.position.set(
                    carPos.x - offsetX,
                    carPos.y + chaseHeight,
                    carPos.z - offsetZ
                );
                
                this.camera.lookAt(carPos.x, carPos.y, carPos.z);
                break;
                
            case 'hood':
                // Camera on the hood of the car
                const hoodOffsetX = Math.sin(carRot) * 2;
                const hoodOffsetZ = Math.cos(carRot) * 2;
                
                this.camera.position.set(
                    carPos.x + hoodOffsetX,
                    carPos.y + 1,
                    carPos.z + hoodOffsetZ
                );
                
                this.camera.lookAt(
                    carPos.x + Math.sin(carRot) * 100,
                    carPos.y,
                    carPos.z + Math.cos(carRot) * 100
                );
                break;
                
            case 'cockpit':
                // First-person view from driver's perspective
                const cockpitOffsetX = Math.sin(carRot) * 1;
                const cockpitOffsetZ = Math.cos(carRot) * 1;
                
                this.camera.position.set(
                    carPos.x + cockpitOffsetX,
                    carPos.y + 0.5,
                    carPos.z + cockpitOffsetZ
                );
                
                this.camera.lookAt(
                    carPos.x + Math.sin(carRot) * 100,
                    carPos.y + 0.5,
                    carPos.z + Math.cos(carRot) * 100
                );
                break;
        }
    }

    updateHUD() {
        if (!this.car) return;
        
        // Update speed display
        const speedKmh = Math.round(this.car.getSpeed() * 3.6);
        document.getElementById('speedValue').textContent = `${speedKmh} km/h`;
        
        // Update RPM gauge
        const rpmPercent = (this.car.getRPM() / 8000) * 100;
        document.getElementById('rpmBar').style.width = `${Math.min(100, rpmPercent)}%`;
        
        // Update gear indicator
        const gears = ['N', '1', '2', '3', '4', '5', '6'];
        document.getElementById('gearIndicator').textContent = 
            this.car.getSpeed() > 5 ? gears[Math.min(gears.length - 1, this.car.getGear())] : 'N';
        
        // Update damage indicator
        const damagePercent = (this.car.getDamage() / 100) * 100;
        document.getElementById('damageBar').style.height = `${damagePercent}%`;
        
        // Update lap counter
        document.getElementById('lapCounter').textContent = 
            `Lap: ${this.lapCount}/${this.totalLaps} | Sector: ${this.checkpointCount}/${this.totalCheckpoints}`;
        
        // Update race timer
        if (this.raceStartTime) {
            this.raceTime = (Date.now() - this.raceStartTime) / 1000;
            const minutes = Math.floor(this.raceTime / 60).toString().padStart(2, '0');
            const seconds = Math.floor(this.raceTime % 60).toString().padStart(2, '0');
            const milliseconds = Math.floor((this.raceTime % 1) * 100).toString().padStart(2, '0');
            
            document.querySelector('#hud').textContent = 
                `Position: ${this.playerPosition} | Time: ${minutes}:${seconds}:${milliseconds}`;
        }
    }

    checkCollisions() {
        // In a real implementation, we would check for collisions
        // between the player car and other objects
    }

    updateRaceProgress() {
        if (!this.car || !this.track) return;
        
        const carPos = this.car.getPosition();
        const checkpoints = this.track.getCheckpoints();
        
        // Check if player passed a checkpoint
        checkpoints.forEach((checkpoint, index) => {
            if (!checkpoint.passed) {
                const distance = carPos.distanceTo(checkpoint.position);
                if (distance < 15) { // Checkpoint trigger radius
                    checkpoint.passed = true;
                    this.checkpointCount++;
                    
                    // Check if completed a lap
                    if (this.checkpointCount >= this.totalCheckpoints) {
                        this.lapCount++;
                        this.checkpointCount = 0;
                        
                        // Reset checkpoint status for next lap
                        checkpoints.forEach(cp => cp.passed = false);
                        
                        if (this.lapCount > this.totalLaps) {
                            this.endRace();
                        }
                    }
                }
            }
        });
        
        // Calculate player position relative to AI vehicles
        this.calculatePlayerPosition();
    }

    calculatePlayerPosition() {
        if (this.aiVehicles.length === 0) {
            this.playerPosition = 1;
            return;
        }
        
        // Simple position calculation based on lap count and checkpoint progress
        let aheadCount = 0;
        
        // Count how many AI vehicles are ahead of player
        this.aiVehicles.forEach(ai => {
            // This is a simplified comparison - in reality, you'd need to track
            // lap counts and checkpoint progress for each vehicle
            const aiPos = ai.getPosition();
            const playerPos = this.car.getPosition();
            
            // For now, just compare distances to start (simplified)
            const playerDist = playerPos.length();
            const aiDist = aiPos.length();
            
            if (aiDist > playerDist) {
                aheadCount++;
            }
        });
        
        this.playerPosition = aheadCount + 1;
    }

    endRace() {
        alert(`Race Completed! Final Time: ${this.formatTime(this.raceTime)}`);
        this.raceStarted = false;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
        return `${minutes}:${secs}.${ms}`;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    pauseGame() {
        this.gamePaused = true;
    }

    resumeGame() {
        this.gamePaused = false;
        this.animate();
    }

    isPaused() {
        return this.gamePaused;
    }

    restartRace() {
        // Remove existing objects
        if (this.car) {
            this.scene.remove(this.car.carModel);
            this.world.remove(this.car.chassisBody);
        }
        
        this.aiVehicles.forEach(ai => {
            this.scene.remove(ai.aiModel);
            this.world.remove(ai.chassisBody);
        });
        
        // Clear arrays
        this.aiVehicles = [];
        
        // Restart race
        this.startRace();
    }

    quitToMenu() {
        this.gamePaused = true;
        this.raceStarted = false;
    }
}