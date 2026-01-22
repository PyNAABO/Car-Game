# World-Class Racing Simulator

Experience the ultimate racing simulation with realistic physics, stunning visuals, and immersive gameplay. Race through challenging tracks, compete against AI opponents, and push your skills to the limit.

## Features

- **Realistic Physics Engine**: Powered by Cannon.js for authentic vehicle dynamics
- **Advanced Graphics**: Modern Three.js rendering with shadows, lighting, and post-processing
- **Multiple Camera Modes**: Chase, hood, and cockpit views for immersive experience
- **Dynamic Environment**: Procedurally generated tracks with day/night cycles
- **AI Opponents**: Challenging AI vehicles with difficulty settings
- **Professional HUD**: Speedometer, RPM gauge, gear indicator, and damage system
- **Race Management**: Lap tracking, timing, position systems
- **Damage System**: Visual feedback for vehicle damage
- **Weather Effects**: Dynamic weather conditions (implementation ready)

## Controls

- **W**: Accelerate
- **S**: Brake/Reverse
- **A/D**: Steer Left/Right
- **Space**: Handbrake
- **R**: Reset Car Position
- **C**: Change Camera Mode
- **P**: Pause Game

## Technical Specifications

- **Graphics Engine**: Three.js r128+
- **Physics Engine**: Cannon-es
- **Rendering**: WebGL with advanced lighting
- **Collision Detection**: Physics-based
- **Audio**: Spatial audio system (ready for implementation)

## Installation

1. Clone the repository
2. Open `index.html` in a modern browser
3. Or run with a local server: `npm install` then `npm start`

## System Requirements

- Modern browser with WebGL support
- Recommended: Chrome, Firefox, Edge (latest versions)
- Minimum: 4GB RAM, dedicated GPU preferred

## Development

The game is structured with modular JavaScript classes for easy expansion:
- `GameManager.js`: Core game logic and state management
- `CarController.js`: Vehicle physics and input handling
- `TrackGenerator.js`: Procedural track generation
- `AIVehicle.js`: AI opponent behavior

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Created with ❤️ by the World-Class Racing Studio team.
Special thanks to the Three.js and Cannon.js communities.
