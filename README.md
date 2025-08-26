# CausalLoop

A dynamic causal loop diagramming tool for visualizing and simulating complex system relationships.

## Features

- **Dynamic Visualization**: Real-time animation of value changes propagating through the system
- **Text-Based Graph Definition**: Simple syntax for defining nodes, edges, and their relationships
- **Interactive Controls**: Adjust node values, animation speed, and damping factors in real-time
- **Visual Feedback**: Color-coded positive/negative connections with animated flow indicators
- **Simulation Controls**: Start, stop, and reset animations with customizable parameters

## Quick Start

1. Open `index.html` in a web browser
2. Use the example graph definition or create your own
3. Click "Build Graph" to visualize your system
4. Use "Start Animation" to see dynamic value propagation

## Graph Definition Syntax

### Connections
Define relationships between nodes using the format:
```
NodeA -> NodeB (multiplier, polarity)
```

- **multiplier**: 0.1 to 1.0 (strength of influence)
- **polarity**: `+` (positive influence) or `-` (negative influence)

### Node Values
Set initial values for nodes:
```
NodeName: initial_value
```

### Example
```
A -> B (0.8, +)
B -> C (0.6, -)
C -> A (0.5, +)
A -> D (0.3, +)

A: 50
B: 30
C: 40
D: 20
```

## System Dynamics

The simulation engine applies the following principles:

1. **Value Propagation**: Changes in one node influence connected nodes based on edge multipliers and polarity
2. **Damping**: A configurable damping factor prevents system oscillations from growing indefinitely
3. **Non-negative Constraint**: Node values cannot go below zero
4. **Continuous Updates**: The system updates in real-time based on the current state of all nodes

## Controls

- **Animation Speed**: Control how fast the simulation runs (100ms - 2000ms)
- **Damping Factor**: Adjust system stability (0.1 - 1.0)
- **Node Controls**: Interactive sliders to manually adjust individual node values
- **Simulation Controls**: Start, stop, and reset the animation

## Running Locally

### Option 1: Simple HTTP Server (Python)
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option 2: Node.js HTTP Server
```bash
npm install -g http-server
http-server
```

### Option 3: Direct File Access
Simply open `index.html` directly in a modern web browser.

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Graphics**: SVG for crisp vector graphics and animations
- **No Dependencies**: Runs entirely in the browser without external libraries

## Use Cases

- **Systems Thinking**: Visualize complex cause-and-effect relationships
- **Policy Analysis**: Model how changes in one area affect others
- **Business Process Modeling**: Understand organizational feedback loops
- **Educational Tool**: Teach systems dynamics and complex systems theory
- **Research**: Prototype and test dynamic system hypotheses

## Architecture

The application consists of three main components:

1. **CausalLoopDiagram Class**: Core logic for graph management and simulation
2. **SVG Renderer**: Dynamic creation and animation of graph visualizations
3. **Control Interface**: User interaction and parameter adjustment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Running

cd <location> && python3 -m http.server 8080