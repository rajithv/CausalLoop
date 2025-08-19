// CausalLoop - Dynamic Causal Loop Diagramming Tool

class CausalLoopDiagram {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.svg = document.getElementById('causal-diagram');
        this.simulation = null;
        this.animationSpeed = 500;
        this.dampingFactor = 0.9;
        this.isRunning = false;
        this.originalValues = new Map();
        
        this.initializeEventListeners();
        this.setupSVGDefinitions();
    }

    initializeEventListeners() {
        document.getElementById('build-graph').addEventListener('click', () => this.buildGraphFromText());
        document.getElementById('start-simulation').addEventListener('click', () => this.startSimulation());
        document.getElementById('stop-simulation').addEventListener('click', () => this.stopSimulation());
        document.getElementById('reset-simulation').addEventListener('click', () => this.resetSimulation());
        
        // Example selector
        document.getElementById('example-select').addEventListener('change', (e) => {
            this.loadExample(e.target.value);
        });
        
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.animationSpeed}ms`;
        });
        
        const dampingSlider = document.getElementById('damping-slider');
        dampingSlider.addEventListener('input', (e) => {
            this.dampingFactor = parseFloat(e.target.value);
            document.getElementById('damping-value').textContent = this.dampingFactor;
        });
    }

    loadExample(exampleType) {
        const examples = {
            'simple': `A -> B (0.8, +)
B -> C (0.6, -)
C -> A (0.5, +)
A -> D (0.3, +)
D -> B (0.4, -)

A: 50
B: 30
C: 40
D: 20`,
            'population': `Population -> BirthRate (0.7, +)
BirthRate -> Population (0.8, +)
Population -> DeathRate (0.4, +)
DeathRate -> Population (0.6, -)
Population -> Resources (0.5, -)
Resources -> DeathRate (0.3, +)

Population: 50
BirthRate: 30
DeathRate: 20
Resources: 70`,
            'economic': `Investment -> Jobs (0.8, +)
Jobs -> Income (0.9, +)
Income -> Consumption (0.7, +)
Consumption -> Demand (0.8, +)
Demand -> Investment (0.6, +)
Investment -> Debt (0.4, +)
Debt -> Investment (0.3, -)

Investment: 60
Jobs: 40
Income: 45
Consumption: 50
Demand: 55
Debt: 20`,
            'climate': `CO2Emissions -> Temperature (0.8, +)
Temperature -> IceMelting (0.9, +)
IceMelting -> SeaLevel (0.7, +)
Temperature -> Droughts (0.6, +)
Droughts -> FoodProduction (0.8, -)
FoodProduction -> CO2Emissions (0.4, +)
SeaLevel -> CoastalAreas (0.9, -)
CoastalAreas -> Refugees (0.7, +)

CO2Emissions: 70
Temperature: 45
IceMelting: 30
SeaLevel: 25
Droughts: 35
FoodProduction: 60
CoastalAreas: 80
Refugees: 15`,
            'organization': `Training -> Skills (0.9, +)
Skills -> Performance (0.8, +)
Performance -> Revenue (0.7, +)
Revenue -> Training (0.5, +)
Performance -> Confidence (0.6, +)
Confidence -> Innovation (0.7, +)
Innovation -> Performance (0.8, +)
Innovation -> Risk (0.4, +)
Risk -> Confidence (0.3, -)

Training: 40
Skills: 35
Performance: 50
Revenue: 45
Confidence: 60
Innovation: 30
Risk: 25`
        };

        if (examples[exampleType]) {
            document.getElementById('graph-input').value = examples[exampleType];
            this.buildGraphFromText();
        }
    }

    setupSVGDefinitions() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Positive arrow marker
        const positiveMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        positiveMarker.setAttribute('id', 'arrowhead-positive');
        positiveMarker.setAttribute('markerWidth', '10');
        positiveMarker.setAttribute('markerHeight', '7');
        positiveMarker.setAttribute('refX', '9');
        positiveMarker.setAttribute('refY', '3.5');
        positiveMarker.setAttribute('orient', 'auto');
        
        const positivePath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        positivePath.setAttribute('points', '0 0, 10 3.5, 0 7');
        positivePath.setAttribute('fill', '#48bb78');
        positiveMarker.appendChild(positivePath);
        
        // Negative arrow marker
        const negativeMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        negativeMarker.setAttribute('id', 'arrowhead-negative');
        negativeMarker.setAttribute('markerWidth', '10');
        negativeMarker.setAttribute('markerHeight', '7');
        negativeMarker.setAttribute('refX', '9');
        negativeMarker.setAttribute('refY', '3.5');
        negativeMarker.setAttribute('orient', 'auto');
        
        const negativePath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        negativePath.setAttribute('points', '0 0, 10 3.5, 0 7');
        negativePath.setAttribute('fill', '#f56565');
        negativeMarker.appendChild(negativePath);
        
        defs.appendChild(positiveMarker);
        defs.appendChild(negativeMarker);
        this.svg.appendChild(defs);
    }

    parseGraphText(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const connections = [];
        const nodeValues = new Map();
        const perturbationAmounts = new Map();
        
        lines.forEach(line => {
            // Parse connections: A -> B (0.8, +)
            const connectionMatch = line.match(/(\w+)\s*->\s*(\w+)\s*\(([0-9.]+),\s*([+-])\)/);
            if (connectionMatch) {
                const [, source, target, multiplier, polarity] = connectionMatch;
                connections.push({
                    source: source,
                    target: target,
                    multiplier: parseFloat(multiplier),
                    polarity: polarity
                });
                return;
            }
            
            // Parse node values with optional perturbation: A: 50 (5) or A: 50
            const valueMatch = line.match(/(\w+):\s*([0-9.]+)(?:\s*\(([0-9.]+)\))?/);
            if (valueMatch) {
                const [, node, value, perturbAmount] = valueMatch;
                nodeValues.set(node, parseFloat(value));
                perturbationAmounts.set(node, perturbAmount ? parseFloat(perturbAmount) : 5); // Default to 5
                return;
            }
        });
        
        return { connections, nodeValues, perturbationAmounts };
    }

    buildGraphFromText() {
        const input = document.getElementById('graph-input').value;
        if (!input.trim()) {
            alert('Please enter a graph definition.');
            return;
        }

        try {
            const { connections, nodeValues, perturbationAmounts } = this.parseGraphText(input);
            this.buildGraph(connections, nodeValues, perturbationAmounts);
        } catch (error) {
            alert('Error parsing graph definition: ' + error.message);
        }
    }

    buildGraph(connections, nodeValues, perturbationAmounts = new Map()) {
        // Clear existing graph
        this.nodes.clear();
        this.edges = [];
        this.svg.innerHTML = '';
        this.setupSVGDefinitions();
        
        // Extract unique node names
        const nodeNames = new Set();
        connections.forEach(conn => {
            nodeNames.add(conn.source);
            nodeNames.add(conn.target);
        });
        nodeValues.forEach((value, name) => nodeNames.add(name));
        
        // Create nodes
        nodeNames.forEach(name => {
            const value = nodeValues.get(name) || 50; // Default value
            const perturbAmount = perturbationAmounts.get(name) || 5; // Default perturbation
            this.nodes.set(name, {
                name: name,
                value: value,
                perturbationAmount: perturbAmount,
                x: 0,
                y: 0,
                element: null
            });
            this.originalValues.set(name, value);
        });
        
        // Store connections as edges
        this.edges = connections;
        
        // Position nodes in a circle
        this.positionNodes();
        
        // Render the graph
        this.renderGraph();
        
        // Generate node controls
        this.generateNodeControls();
    }

    positionNodes() {
        const nodeArray = Array.from(this.nodes.values());
        const centerX = 400;
        const centerY = 300;
        const radius = 150;
        
        nodeArray.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodeArray.length;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
    }

    renderGraph() {
        // Render edges first (so they appear behind nodes)
        this.edges.forEach(edge => this.renderEdge(edge));
        
        // Render nodes
        this.nodes.forEach(node => this.renderNode(node));
    }

    renderNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('node');
        group.setAttribute('data-node', node.name);
        
        // Node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 25);
        group.appendChild(circle);
        
        // Increase arrow (above node)
        const increaseArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        increaseArrow.setAttribute('points', `${node.x-8},${node.y-35} ${node.x+8},${node.y-35} ${node.x},${node.y-45}`);
        increaseArrow.classList.add('control-arrow', 'increase-arrow');
        increaseArrow.setAttribute('data-node', node.name);
        increaseArrow.setAttribute('data-action', 'increase');
        group.appendChild(increaseArrow);
        
        // Decrease arrow (below node)
        const decreaseArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        decreaseArrow.setAttribute('points', `${node.x-8},${node.y+35} ${node.x+8},${node.y+35} ${node.x},${node.y+45}`);
        decreaseArrow.classList.add('control-arrow', 'decrease-arrow');
        decreaseArrow.setAttribute('data-node', node.name);
        decreaseArrow.setAttribute('data-action', 'decrease');
        group.appendChild(decreaseArrow);
        
        // Node label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', node.x);
        label.setAttribute('y', node.y - 5);
        label.textContent = node.name;
        label.classList.add('node-text');
        group.appendChild(label);
        
        // Node value
        const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        value.setAttribute('x', node.x);
        value.setAttribute('y', node.y + 8);
        value.textContent = Math.round(node.value);
        value.classList.add('node-value');
        group.appendChild(value);
        
        node.element = group;
        node.valueElement = value;
        this.svg.appendChild(group);
        
        // Add event listeners for the arrows
        increaseArrow.addEventListener('click', () => this.perturbNode(node.name, 'increase'));
        decreaseArrow.addEventListener('click', () => this.perturbNode(node.name, 'decrease'));
    }

    renderEdge(edge) {
        const sourceNode = this.nodes.get(edge.source);
        const targetNode = this.nodes.get(edge.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Calculate edge positions (from circle edge to circle edge)
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        const startX = sourceNode.x + 25 * unitX;
        const startY = sourceNode.y + 25 * unitY;
        const endX = targetNode.x - 25 * unitX;
        const endY = targetNode.y - 25 * unitY;
        
        // Create edge line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.classList.add('edge');
        line.classList.add(edge.polarity === '+' ? 'positive' : 'negative');
        
        this.svg.appendChild(line);
        
        // Add edge label
        const labelX = (startX + endX) / 2;
        const labelY = (startY + endY) / 2 - 10;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.textContent = `${edge.multiplier}${edge.polarity}`;
        label.classList.add('edge-label');
        
        this.svg.appendChild(label);
        
        edge.element = line;
    }

    generateNodeControls() {
        const container = document.getElementById('node-controls-container');
        container.innerHTML = '';
        
        this.nodes.forEach((node, name) => {
            const controlDiv = document.createElement('div');
            controlDiv.classList.add('node-control');
            
            const label = document.createElement('label');
            label.textContent = name + ':';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = node.value;
            slider.addEventListener('input', (e) => {
                node.value = parseFloat(e.target.value);
                valueDisplay.textContent = Math.round(node.value);
                if (node.valueElement) {
                    node.valueElement.textContent = Math.round(node.value);
                }
            });
            
            const valueDisplay = document.createElement('span');
            valueDisplay.classList.add('node-value-display');
            valueDisplay.textContent = Math.round(node.value);
            
            // Perturbation amount control
            const perturbLabel = document.createElement('label');
            perturbLabel.textContent = 'Δ:';
            perturbLabel.classList.add('perturb-label');
            
            const perturbSpinner = document.createElement('input');
            perturbSpinner.type = 'number';
            perturbSpinner.min = '0.1';
            perturbSpinner.max = '50';
            perturbSpinner.step = '0.1';
            perturbSpinner.value = node.perturbationAmount || 5;
            perturbSpinner.classList.add('perturb-spinner');
            perturbSpinner.addEventListener('change', (e) => {
                const newAmount = parseFloat(e.target.value);
                if (newAmount > 0) {
                    node.perturbationAmount = newAmount;
                }
            });
            
            controlDiv.appendChild(label);
            controlDiv.appendChild(slider);
            controlDiv.appendChild(valueDisplay);
            controlDiv.appendChild(perturbLabel);
            controlDiv.appendChild(perturbSpinner);
            container.appendChild(controlDiv);
        });
    }
    
    perturbNode(nodeName, action) {
        const node = this.nodes.get(nodeName);
        if (!node) return;
        
        const perturbationAmount = node.perturbationAmount || 5; // Use node-specific amount
        const oldValue = node.value;
        
        if (action === 'increase') {
            node.value = Math.min(100, node.value + perturbationAmount);
        } else if (action === 'decrease') {
            node.value = Math.max(0, node.value - perturbationAmount);
        }
        
        // Update visual elements
        if (node.valueElement) {
            node.valueElement.textContent = Math.round(node.value);
        }
        
        // Update corresponding slider
        const nodeControls = document.querySelectorAll('.node-control');
        nodeControls.forEach(control => {
            const label = control.querySelector('label');
            if (label && label.textContent === nodeName + ':') {
                const slider = control.querySelector('input[type="range"]');
                const display = control.querySelector('.node-value-display');
                if (slider) slider.value = node.value;
                if (display) display.textContent = Math.round(node.value);
            }
        });
    }

    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.runSimulationStep();
    }

    stopSimulation() {
        this.isRunning = false;
    }

    resetSimulation() {
        this.stopSimulation();
        
        // Reset all node values to original values
        this.nodes.forEach((node, name) => {
            const originalValue = this.originalValues.get(name) || 50;
            node.value = originalValue;
            if (node.valueElement) {
                node.valueElement.textContent = Math.round(node.value);
            }
        });
        
        // Update sliders
        this.generateNodeControls();
    }

    runSimulationStep() {
        if (!this.isRunning) return;
        
        // Calculate new values based on current state
        const newValues = new Map();
        
        this.nodes.forEach((node, name) => {
            newValues.set(name, node.value);
        });
        
        // Apply edge influences
        this.edges.forEach(edge => {
            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);
            
            if (!sourceNode || !targetNode) return;
            
            // Calculate influence
            const influence = sourceNode.value * edge.multiplier * (edge.polarity === '+' ? 1 : -1);
            const dampedInfluence = influence * (1 - this.dampingFactor);
            
            // Apply influence
            const currentValue = newValues.get(edge.target);
            newValues.set(edge.target, Math.max(0, currentValue + dampedInfluence * 0.1));
            
            // Visual feedback for active edges
            if (Math.abs(dampedInfluence) > 0.1) {
                edge.element?.classList.add('pulse');
                setTimeout(() => edge.element?.classList.remove('pulse'), 300);
            }
        });
        
        // Update node values and visuals
        let hasChanges = false;
        newValues.forEach((newValue, name) => {
            const node = this.nodes.get(name);
            const oldValue = node.value;
            
            if (Math.abs(newValue - oldValue) > 0.1) {
                hasChanges = true;
                node.value = newValue;
                
                if (node.valueElement) {
                    node.valueElement.textContent = Math.round(newValue);
                    node.valueElement.classList.add('value-change');
                    setTimeout(() => node.valueElement.classList.remove('value-change'), 500);
                }
                
                // Update corresponding slider
                const slider = document.querySelector(`.node-control input[value="${Math.round(oldValue)}"]`);
                if (slider && Math.abs(slider.value - newValue) > 1) {
                    slider.value = newValue;
                    const display = slider.parentElement.querySelector('.node-value-display');
                    if (display) display.textContent = Math.round(newValue);
                }
            }
        });
        
        // Continue simulation
        if (hasChanges && this.isRunning) {
            setTimeout(() => this.runSimulationStep(), this.animationSpeed);
        } else {
            this.isRunning = false;
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CausalLoopDiagram();
    
    // Load example graph
    const exampleGraph = `A -> B (0.8, +)
B -> C (0.6, -)
C -> A (0.5, +)
A -> D (0.3, +)
D -> B (0.4, -)

A: 50 (10)
B: 30 (5)
C: 40 (3)
D: 20 (7)`;
    
    document.getElementById('graph-input').value = exampleGraph;
    app.buildGraphFromText();
});
