# Contributing to Race Game

Thank you for your interest in contributing to the Race Game project! This document outlines the structure and guidelines for contributing to this repository.

## Project Structure

```
race-game/
├── index.html          # Main HTML entry point
├── script.js           # Main game logic (Three.js based)
├── style.css           # Styling for the game UI
├── README.md           # Project overview
├── CONTRIBUTING.md     # This file
├── package.json        # Project dependencies and scripts
└── .gitignore         # Files to ignore in Git
```

## Code Overview

### HTML (`index.html`)
- Contains the game UI elements (difficulty selector, tutorial, replay button)
- Includes necessary scripts and styles
- Defines the game layout

### JavaScript (`script.js`)
- Core game logic built with Three.js
- Contains the Game class managing game state
- Handles player input and vehicle physics
- Manages difficulty levels and scoring

### CSS (`style.css`)
- Responsive styling for game UI elements
- Animations for menu transitions
- Mobile-friendly layout

## How to Run Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Start a local server: `npm start`
4. Open your browser to the provided URL

## Development Guidelines

- Maintain consistent coding style
- Comment complex algorithms or business logic
- Test changes across different browsers
- Keep performance in mind when adding new features

## Reporting Issues

When reporting bugs or issues:
- Describe the problem in detail
- Provide steps to reproduce
- Mention browser and OS versions
- Include screenshots if helpful

## Pull Requests

- Keep pull requests focused on a single feature or bug fix
- Update documentation if needed
- Follow existing code style and conventions
- Test your changes before submitting

## Attribution

This game was originally created by an unknown developer. Contributions should respect the original work while improving the experience.