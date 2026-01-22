class CarController {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.speed = 0;
        this.maxSpeed = 100;
        this.acceleration = 0;
        this.braking = 0;
        this.steering = 0;
        this.direction = new THREE.Vector3(0, 0, 1);
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = 0;
        this.damage = 0;
        this.rpm = 0;
        this.gear = 0;
        this.inAir = false;
        
        this.createCar();
        this.setupPhysics();
        this.setupControls();
    }

    createCar() {
        // Create a more detailed car model
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carGroup.add(this.carBody);
        
        // Wheels
        this.wheels = [];
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        wheelGeometry.rotateZ(Math.PI / 2);
        
        for (let i = 0; i < 4; i++) {
            const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            
            // Position wheels
            if (i < 2) wheel.position.y = -0.5; // Front wheels
            else wheel.position.y = -0.5; // Rear wheels
            
            if (i % 2 === 0) wheel.position.x = 1.2; // Right wheels
            else wheel.position.x = -1.2; // Left wheels
            
            if (i < 2) wheel.position.z = 1.5; // Front wheels
            else wheel.position.z = -1.5; // Rear wheels
            
            carGroup.add(wheel);
            this.wheels.push(wheel);
        }
        
        carGroup.position.copy(this.position);
        this.scene.add(carGroup);
        this.carModel = carGroup;
    }

    setupPhysics() {
        // Create physics body for the car
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 3));
        this.chassisBody = new CANNON.Body({
            mass: 1500,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z)
        });
        this.chassisBody.addShape(chassisShape);
        
        // Add damping to simulate air resistance and friction
        this.chassisBody.linearDamping = 0.01;
        this.chassisBody.angularDamping = 0.01;
        
        this.world.addBody(this.chassisBody);
    }

    setupControls() {
        this.keys = {};
        
        window.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            
            if (event.key.toLowerCase() === 'r') {
                this.resetPosition();
            }
            if (event.key.toLowerCase() === 'c') {
                this.changeCameraMode();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
    }

    update(deltaTime) {
        // Process input
        this.processInput();
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update visual representation
        this.updateVisuals();
        
        // Update game systems
        this.updateRPM();
        this.updateDamageSystem();
    }

    processInput() {
        // Acceleration
        if (this.keys['w'] || this.keys['arrowup']) {
            this.acceleration = 1;
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            this.acceleration = -1;
        } else {
            this.acceleration = 0;
        }
        
        // Steering
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.steering = -1;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.steering = 1;
        } else {
            this.steering = 0;
        }
        
        // Braking
        if (this.keys[' ']) { // Spacebar for handbrake
            this.braking = 1;
        } else {
            this.braking = 0;
        }
    }

    updatePhysics(deltaTime) {
        // Get current velocity
        const currentVelocity = this.chassisBody.velocity;
        const speed = currentVelocity.length();
        
        // Calculate forward direction
        const forward = new CANNON.Vec3();
        this.chassisBody.vectorToWorldFrame(new CANNON.Vec3(0, 0, 1), forward);
        
        // Apply forces based on input
        if (this.acceleration !== 0) {
            const forceMagnitude = this.acceleration * 2000 * (1 - speed / this.maxSpeed); // Decreasing power at higher speeds
            const force = new CANNON.Vec3(forward.x * forceMagnitude, 0, forward.z * forceMagnitude);
            this.chassisBody.applyImpulse(force, this.chassisBody.position);
        }
        
        // Apply steering
        if (this.steering !== 0 && speed > 2) {
            const steeringForce = 0.1 * this.steering * speed;
            this.chassisBody.angularVelocity.y = steeringForce;
        }
        
        // Apply braking
        if (this.braking > 0) {
            const brakeForce = new CANNON.Vec3(
                -currentVelocity.x * 0.5,
                0,
                -currentVelocity.z * 0.5
            );
            this.chassisBody.applyImpulse(brakeForce, this.chassisBody.position);
        }
        
        // Update position and rotation from physics
        this.position.set(
            this.chassisBody.position.x,
            this.chassisBody.position.y,
            this.chassisBody.position.z
        );
        
        // Update rotation from quaternion
        const quaternion = this.chassisBody.quaternion;
        this.rotation = Math.atan2(
            2 * (quaternion.y * quaternion.z + quaternion.w * quaternion.x),
            quaternion.w * quaternion.w - quaternion.x * quaternion.x - 
            quaternion.y * quaternion.y + quaternion.z * quaternion.z
        );
    }

    updateVisuals() {
        // Update car model position and rotation
        this.carModel.position.copy(this.position);
        this.carModel.rotation.y = this.rotation;
        
        // Update wheel rotations based on speed
        const wheelRotation = this.speed * 0.1;
        this.wheels.forEach((wheel, index) => {
            wheel.rotation.z = wheelRotation;
            
            // Front wheels steer
            if (index < 2) {
                wheel.rotation.y = this.steering * 0.5;
            }
        });
    }

    updateRPM() {
        // Calculate RPM based on speed (simplified)
        this.rpm = Math.min(8000, Math.abs(this.speed) * 80);
        
        // Update gear based on RPM
        if (this.rpm > 6000) {
            this.gear = Math.floor(this.rpm / 2000) + 1;
        } else if (this.rpm < 1000 && this.speed > 5) {
            this.gear = 1;
        } else if (this.speed < 5) {
            this.gear = 0; // Neutral
        }
        
        this.speed = this.chassisBody.velocity.length();
    }

    updateDamageSystem() {
        // Simple damage system based on collisions
        // In a real implementation, this would check for collision events
        if (this.damage > 100) this.damage = 100;
    }

    resetPosition() {
        this.chassisBody.position.set(0, 1, 0);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        this.chassisBody.quaternion.set(0, 0, 0, 1);
    }

    changeCameraMode() {
        // Camera mode will be handled by the main game manager
        // This method exists for key binding
    }

    getSpeed() {
        return this.speed;
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    getDamage() {
        return this.damage;
    }

    getRPM() {
        return this.rpm;
    }

    getGear() {
        return this.gear;
    }
}