class TrackGenerator {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.trackWidth = 20;
        this.segments = [];
        this.checkpoints = [];
        this.obstacles = [];
        this.generateTrack();
    }

    generateTrack() {
        // Create track segments using procedural generation
        const trackPoints = this.createTrackPath();
        
        // Create road geometry
        this.createRoad(trackPoints);
        
        // Add track boundaries
        this.addBoundaries(trackPoints);
        
        // Place checkpoints
        this.placeCheckpoints(trackPoints);
        
        // Add environmental elements
        this.addEnvironment();
    }

    createTrackPath() {
        const points = [];
        const centerX = 0, centerY = 0;
        const radius = 100;
        
        // Generate a complex oval-shaped track
        for (let i = 0; i <= 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            // Create a figure-8 pattern for complexity
            const x = Math.cos(angle) * radius + Math.sin(angle * 2) * 30;
            const y = Math.sin(angle) * radius + Math.cos(angle * 2) * 20;
            points.push(new THREE.Vector3(x, 0, y));
        }
        
        return points;
    }

    createRoad(points) {
        // Create road surface
        const roadGeometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            // Calculate perpendicular vector for road width
            const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
            const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(this.trackWidth / 2);
            
            // Add four vertices for each segment (two for each side)
            vertices.push(
                p1.clone().add(perp).toArray(),
                p1.clone().sub(perp).toArray(),
                p2.clone().add(perp).toArray(),
                p2.clone().sub(perp).toArray()
            );
        }
        
        roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
        roadGeometry.computeVertexNormals();
        
        // Road material with realistic properties
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
        this.scene.add(roadMesh);
        
        // Create physics body for road collision
        const roadShape = new CANNON.Plane();
        const roadBody = new CANNON.Body({ mass: 0 });
        roadBody.addShape(roadShape);
        roadBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(roadBody);
    }

    addBoundaries(points) {
        // Create barriers on both sides of the track
        for (let i = 0; i < points.length - 1; i += 5) {
            const p = points[i];
            const nextP = points[(i + 1) % points.length];
            
            const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
            const perp = new THREE.Vector3(-dir.z, 0, dir.x);
            
            // Left barrier
            const leftBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0xff0000 })
            );
            leftBarrier.position.copy(p.clone().add(perp.clone().multiplyScalar(this.trackWidth / 2 + 1)));
            this.scene.add(leftBarrier);
            
            // Right barrier
            const rightBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0x0000ff })
            );
            rightBarrier.position.copy(p.clone().add(perp.clone().multiplyScalar(-this.trackWidth / 2 - 1)));
            this.scene.add(rightBarrier);
        }
    }

    placeCheckpoints(points) {
        // Place checkpoints along the track
        for (let i = 0; i < points.length; i += 20) {
            const checkpoint = new THREE.Mesh(
                new THREE.RingGeometry(8, 10, 8),
                new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide })
            );
            checkpoint.position.copy(points[i]);
            checkpoint.rotation.x = -Math.PI / 2;
            this.scene.add(checkpoint);
            
            this.checkpoints.push({
                position: points[i],
                mesh: checkpoint,
                passed: false
            });
        }
    }

    addEnvironment() {
        // Add skybox
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Add decorative elements
        for (let i = 0; i < 20; i++) {
            const tree = new THREE.Mesh(
                new THREE.ConeGeometry(2, 6, 8),
                new THREE.MeshStandardMaterial({ color: 0x228B22 })
            );
            tree.position.set(
                (Math.random() - 0.5) * 300,
                3,
                (Math.random() - 0.5) * 300
            );
            this.scene.add(tree);
        }
    }

    getCheckpoints() {
        return this.checkpoints;
    }
}