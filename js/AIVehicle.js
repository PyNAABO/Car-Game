class AIVehicle {
    constructor(scene, world, trackPoints, playerCar) {
        this.scene = scene;
        this.world = world;
        this.trackPoints = trackPoints;
        this.playerCar = playerCar;
        this.speed = 0;
        this.maxSpeed = 80;
        this.position = new THREE.Vector3(0, 1, -20);
        this.targetIndex = 0;
        this.pathOffset = 0;
        
        this.createAI();
        this.setupPhysics();
    }

    createAI() {
        // Create AI car model
        const aiGroup = new THREE.Group();
        
        // Different colored AI car
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        this.aiBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        aiGroup.add(this.aiBody);
        
        // Wheels for AI car
        this.aiWheels = [];
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        wheelGeometry.rotateZ(Math.PI / 2);
        
        for (let i = 0; i < 4; i++) {
            const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            
            if (i < 2) wheel.position.y = -0.5;
            else wheel.position.y = -0.5;
            
            if (i % 2 === 0) wheel.position.x = 1.2;
            else wheel.position.x = -1.2;
            
            if (i < 2) wheel.position.z = 1.5;
            else wheel.position.z = -1.5;
            
            aiGroup.add(wheel);
            this.aiWheels.push(wheel);
        }
        
        aiGroup.position.copy(this.position);
        this.scene.add(aiGroup);
        this.aiModel = aiGroup;
    }

    setupPhysics() {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 3));
        this.chassisBody = new CANNON.Body({
            mass: 1500,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z)
        });
        this.chassisBody.addShape(chassisShape);
        
        this.chassisBody.linearDamping = 0.01;
        this.chassisBody.angularDamping = 0.01;
        
        this.world.addBody(this.chassisBody);
    }

    update(deltaTime, difficulty) {
        this.followTrack(difficulty);
        this.updatePhysics(deltaTime);
        this.updateVisuals();
    }

    followTrack(difficulty) {
        // Determine target point on track
        const targetPoint = this.trackPoints[this.targetIndex];
        if (!targetPoint) return;
        
        // Calculate distance to target
        const currentPosition = new THREE.Vector3(
            this.chassisBody.position.x,
            this.chassisBody.position.y,
            this.chassisBody.position.z
        );
        
        const distanceToTarget = currentPosition.distanceTo(targetPoint);
        
        // Move to next target point when close enough
        if (distanceToTarget < 10) {
            this.targetIndex = (this.targetIndex + 1) % this.trackPoints.length;
        }
        
        // Calculate desired direction
        const desiredDirection = new THREE.Vector3().subVectors(targetPoint, currentPosition).normalize();
        
        // Add some offset based on difficulty
        const difficultyFactor = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 1.0;
        const offset = new THREE.Vector3(-desiredDirection.z, 0, desiredDirection.x).multiplyScalar(
            (Math.random() - 0.5) * (0.5 - difficultyFactor * 0.3)
        );
        
        const finalDirection = new THREE.Vector3().addVectors(desiredDirection, offset).normalize();
        
        // Apply force in desired direction
        const forceMagnitude = this.maxSpeed * 0.5 * difficultyFactor;
        const force = new CANNON.Vec3(finalDirection.x * forceMagnitude, 0, finalDirection.z * forceMagnitude);
        this.chassisBody.applyImpulse(force, this.chassisBody.position);
        
        // Steering based on desired direction
        const currentForward = new CANNON.Vec3();
        this.chassisBody.vectorToWorldFrame(new CANNON.Vec3(0, 0, 1), currentForward);
        
        const dotProduct = currentForward.dot(new CANNON.Vec3(finalDirection.x, 0, finalDirection.z));
        const crossProduct = currentForward.cross(new CANNON.Vec3(finalDirection.x, 0, finalDirection.z)).y;
        
        this.chassisBody.angularVelocity.y = crossProduct * 0.1 * difficultyFactor;
        
        // Adjust speed based on curve
        if (Math.abs(crossProduct) > 0.1) {
            this.speed = this.maxSpeed * 0.7; // Slow down on curves
        } else {
            this.speed = this.maxSpeed;
        }
    }

    updatePhysics(deltaTime) {
        // Apply speed limits
        const currentVelocity = this.chassisBody.velocity;
        const speed = currentVelocity.length();
        
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.chassisBody.velocity.scale(scale, this.chassisBody.velocity);
        }
        
        // Update position reference
        this.position.set(
            this.chassisBody.position.x,
            this.chassisBody.position.y,
            this.chassisBody.position.z
        );
    }

    updateVisuals() {
        // Update AI model position and rotation
        this.aiModel.position.copy(this.position);
        
        // Extract rotation from quaternion
        const quaternion = this.chassisBody.quaternion;
        const rotationY = Math.atan2(
            2 * (quaternion.y * quaternion.z + quaternion.w * quaternion.x),
            quaternion.w * quaternion.w - quaternion.x * quaternion.x - 
            quaternion.y * quaternion.y + quaternion.z * quaternion.z
        );
        
        this.aiModel.rotation.y = rotationY;
        
        // Update wheel rotations
        const wheelRotation = this.speed * 0.1;
        this.aiWheels.forEach((wheel, index) => {
            wheel.rotation.z = wheelRotation;
        });
    }

    getPosition() {
        return this.position;
    }
}