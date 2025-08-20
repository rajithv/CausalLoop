// CausalLoop - Dynamic Causal Loop Diagramming Tool

class CausalLoopDiagram {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.svg = document.getElementById('causal-diagram');
        this.graphContent = document.getElementById('graph-content');
        this.graphContainer = document.getElementById('graph-container');
        this.simulation = null;
        this.animationSpeed = 500;
        this.dampingFactor = 0.9;
        this.isRunning = false;
        this.originalValues = new Map();
        
        // Visual builder properties
        this.visualNodes = [];
        this.visualConnections = [];
        this.nextNodeId = 1;
        this.nextConnectionId = 1;
        this.syncInProgress = false;
        
        // Zoom and pan properties
        this.zoomLevel = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;
        this.zoomStep = 0.2;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initializeEventListeners();
        this.setupSVGDefinitions();
        this.initializeZoomAndPan();
    }

    initializeEventListeners() {
        document.getElementById('build-graph').addEventListener('click', () => this.buildGraphFromText());
        document.getElementById('start-simulation').addEventListener('click', () => this.startSimulation());
        document.getElementById('stop-simulation').addEventListener('click', () => this.stopSimulation());
        document.getElementById('reset-simulation').addEventListener('click', () => this.resetSimulation());
        
        // Graph builder toggle
        document.getElementById('graph-builder-toggle').addEventListener('click', () => this.toggleGraphBuilder());
        
        // Instructions toggle
        document.getElementById('instructions-toggle').addEventListener('click', () => this.toggleInstructions());
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });
        
        // Visual builder events
        document.getElementById('add-node-btn').addEventListener('click', () => this.addNode());
        document.getElementById('add-connection-btn').addEventListener('click', () => this.addConnection());
        document.getElementById('build-graph-visual').addEventListener('click', () => this.buildGraphFromVisual());
        document.getElementById('clear-graph').addEventListener('click', () => this.clearVisualBuilder());
        
        // Text definition sync
        document.getElementById('graph-input').addEventListener('input', () => this.syncFromText());
        document.getElementById('graph-input').addEventListener('paste', () => {
            setTimeout(() => this.syncFromText(), 10); // Delay to allow paste to complete
        });
        
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
        
        // Zoom and pan controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-reset').addEventListener('click', () => this.resetZoom());
        document.getElementById('fit-to-content').addEventListener('click', () => this.fitToContent());
    }
    
    toggleGraphBuilder() {
        const content = document.getElementById('graph-builder-content');
        const icon = document.querySelector('.toggle-icon');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            icon.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            icon.classList.add('expanded');
        }
    }
    
    toggleInstructions() {
        const content = document.getElementById('instructions-content');
        const icon = document.querySelector('#instructions-toggle .toggle-icon');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            icon.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            icon.classList.add('expanded');
        }
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName === 'visual' ? 'visual-builder' : 'text-builder').classList.add('active');
    }
    
    addNode() {
        const nodeId = this.nextNodeId++;
        const nodeData = {
            id: nodeId,
            label: `Node ${nodeId}`,
            value: 50,
            perturbationAmount: 5
        };
        
        this.visualNodes.push(nodeData);
        this.renderNodeList();
        this.renderConnectionsList();
        this.syncToText();
    }
    
    removeNode(nodeId) {
        // Remove the node
        this.visualNodes = this.visualNodes.filter(node => node.id !== nodeId);
        
        // Remove any connections involving this node
        this.visualConnections = this.visualConnections.filter(
            conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
        );
        
        this.renderNodeList();
        this.renderConnectionsList();
        this.syncToText();
    }
    
    addConnection() {
        if (this.visualNodes.length < 2) {
            alert('You need at least 2 nodes to create a connection.');
            return;
        }
        
        const connectionId = this.nextConnectionId++;
        const connectionData = {
            id: connectionId,
            fromNodeId: this.visualNodes[0].id,
            toNodeId: this.visualNodes.length > 1 ? this.visualNodes[1].id : this.visualNodes[0].id,
            multiplier: 0.5,
            polarity: '+'
        };
        
        this.visualConnections.push(connectionData);
        this.renderConnectionsList();
        this.syncToText();
    }
    
    removeConnection(connectionId) {
        this.visualConnections = this.visualConnections.filter(conn => conn.id !== connectionId);
        this.renderConnectionsList();
        this.syncToText();
    }
    
    renderNodeList() {
        const container = document.getElementById('node-list');
        container.innerHTML = '';
        
        this.visualNodes.forEach(node => {
            const nodeItem = document.createElement('div');
            nodeItem.classList.add('node-item');
            
            nodeItem.innerHTML = `
                <div class="node-number">${node.id}</div>
                <input type="text" class="node-input" value="${node.label}" 
                       placeholder="Node label" onchange="app.updateNodeLabel(${node.id}, this.value)">
                <input type="number" class="value-input" value="${node.value}" min="0" max="100"
                       title="Initial Value" onchange="app.updateNodeValue(${node.id}, this.value)">
                <input type="number" class="perturb-input" value="${node.perturbationAmount}" min="0.1" max="50" step="0.1"
                       title="Perturbation Amount" onchange="app.updateNodePerturbation(${node.id}, this.value)">
                <button class="remove-node-btn" onclick="app.removeNode(${node.id})">×</button>
            `;
            
            container.appendChild(nodeItem);
        });
    }
    
    renderConnectionsList() {
        const container = document.getElementById('connections-list');
        container.innerHTML = '';
        
        if (this.visualNodes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #718096;">Add nodes to create connections</p>';
            return;
        }
        
        this.visualConnections.forEach(connection => {
            const connectionItem = document.createElement('div');
            connectionItem.classList.add('connection-item');
            
            const nodeOptions = this.visualNodes.map(node => 
                `<option value="${node.id}" ${node.id === connection.fromNodeId ? 'selected' : ''}>${node.label}</option>`
            ).join('');
            
            const nodeOptionsTo = this.visualNodes.map(node => 
                `<option value="${node.id}" ${node.id === connection.toNodeId ? 'selected' : ''}>${node.label}</option>`
            ).join('');
            
            connectionItem.innerHTML = `
                <select class="connection-select" onchange="app.updateConnectionFrom(${connection.id}, this.value)">
                    ${nodeOptions}
                </select>
                <span class="connection-arrow">→</span>
                <select class="connection-select" onchange="app.updateConnectionTo(${connection.id}, this.value)">
                    ${nodeOptionsTo}
                </select>
                <input type="number" class="connection-multiplier" value="${connection.multiplier}" 
                       min="0" max="1" step="0.1" placeholder="0.5"
                       title="Multiplier" onchange="app.updateConnectionMultiplier(${connection.id}, this.value)">
                <select class="connection-polarity" onchange="app.updateConnectionPolarity(${connection.id}, this.value)">
                    <option value="+" ${connection.polarity === '+' ? 'selected' : ''}>+</option>
                    <option value="-" ${connection.polarity === '-' ? 'selected' : ''}>−</option>
                </select>
                <button class="remove-connection-btn" onclick="app.removeConnection(${connection.id})">×</button>
            `;
            
            container.appendChild(connectionItem);
        });
    }
    
    updateNodeLabel(nodeId, label) {
        const node = this.visualNodes.find(n => n.id === nodeId);
        if (node && node.label !== label) {
            const oldLabel = node.label;
            node.label = label;
            this.renderConnectionsList(); // Update connection dropdowns
            this.updateTextLabels(oldLabel, label);
        }
    }
    
    updateConnectionFrom(connectionId, fromNodeId) {
        const connection = this.visualConnections.find(c => c.id === connectionId);
        if (connection) {
            connection.fromNodeId = parseInt(fromNodeId);
            this.syncToText();
        }
    }
    
    updateConnectionTo(connectionId, toNodeId) {
        const connection = this.visualConnections.find(c => c.id === connectionId);
        if (connection) {
            connection.toNodeId = parseInt(toNodeId);
            this.syncToText();
        }
    }
    
    updateConnectionMultiplier(connectionId, multiplier) {
        const connection = this.visualConnections.find(c => c.id === connectionId);
        if (connection) {
            connection.multiplier = parseFloat(multiplier);
            this.syncToText();
        }
    }
    
    updateConnectionPolarity(connectionId, polarity) {
        const connection = this.visualConnections.find(c => c.id === connectionId);
        if (connection) {
            connection.polarity = polarity;
            this.syncToText();
        }
    }
    
    updateTextLabels(oldLabel, newLabel) {
        if (this.syncInProgress) return;
        this.syncInProgress = true;
        
        const textArea = document.getElementById('graph-input');
        let text = textArea.value;
        
        // Replace node labels in connections
        const connectionRegex = new RegExp(`\\b${oldLabel}\\b(?=\\s*->|(?:\\s*<-))`, 'g');
        const targetRegex = new RegExp(`(?<=->\\s*)\\b${oldLabel}\\b`, 'g');
        const valueRegex = new RegExp(`^${oldLabel}:`, 'gm');
        
        text = text.replace(connectionRegex, newLabel);
        text = text.replace(targetRegex, newLabel);
        text = text.replace(valueRegex, `${newLabel}:`);
        
        textArea.value = text;
        textArea.classList.remove('validation-error');
        
        this.syncInProgress = false;
    }
    
    updateNodeValue(nodeId, value) {
        const node = this.visualNodes.find(n => n.id === nodeId);
        if (node) {
            node.value = parseFloat(value);
            this.syncToText();
        }
    }
    
    updateNodePerturbation(nodeId, amount) {
        const node = this.visualNodes.find(n => n.id === nodeId);
        if (node) {
            node.perturbationAmount = parseFloat(amount);
            this.syncToText();
        }
    }
    
    buildGraphFromVisual() {
        if (this.visualNodes.length === 0) {
            alert('Please add some nodes first.');
            return;
        }
        
        // Create connections and nodeValues maps from visual data
        const connections = [];
        const nodeValues = new Map();
        const perturbationAmounts = new Map();
        
        // Add nodes
        this.visualNodes.forEach(node => {
            nodeValues.set(node.label, node.value);
            perturbationAmounts.set(node.label, node.perturbationAmount);
        });
        
        // Add connections from adjacency list
        this.visualConnections.forEach(conn => {
            const fromNode = this.visualNodes.find(n => n.id === conn.fromNodeId);
            const toNode = this.visualNodes.find(n => n.id === conn.toNodeId);
            
            if (fromNode && toNode) {
                connections.push({
                    source: fromNode.label,
                    target: toNode.label,
                    multiplier: conn.multiplier,
                    polarity: conn.polarity
                });
            }
        });
        
        // Build the graph
        this.buildGraph(connections, nodeValues, perturbationAmounts);
        
        // Collapse the builder
        this.toggleGraphBuilder();
    }
    
    clearVisualBuilder() {
        if (confirm('Are you sure you want to clear all nodes and connections?')) {
            this.visualNodes = [];
            this.visualConnections = [];
            this.nextNodeId = 1;
            this.nextConnectionId = 1;
            this.renderNodeList();
            this.renderConnectionsList();
            this.syncToText();
        }
    }
    
    syncFromText() {
        if (this.syncInProgress) return;
        this.syncInProgress = true;
        
        const textArea = document.getElementById('graph-input');
        const text = textArea.value;
        
        try {
            const { connections, nodeValues, perturbationAmounts } = this.parseGraphText(text);
            
            // Clear validation error
            textArea.classList.remove('validation-error');
            
            // Extract unique node names and create visual nodes
            const nodeNames = new Set();
            connections.forEach(conn => {
                nodeNames.add(conn.source);
                nodeNames.add(conn.target);
            });
            nodeValues.forEach((value, name) => nodeNames.add(name));
            
            // Update visual nodes (preserve existing IDs where possible)
            const oldNodes = [...this.visualNodes];
            this.visualNodes = [];
            let nodeId = 1;
            
            nodeNames.forEach(name => {
                // Try to find existing node with same label
                const existingNode = oldNodes.find(n => n.label === name);
                
                if (existingNode) {
                    // Keep existing node with same ID
                    this.visualNodes.push({
                        ...existingNode,
                        label: name,
                        value: nodeValues.get(name) || existingNode.value,
                        perturbationAmount: perturbationAmounts.get(name) || existingNode.perturbationAmount
                    });
                } else {
                    // Create new node
                    this.visualNodes.push({
                        id: nodeId,
                        label: name,
                        value: nodeValues.get(name) || 50,
                        perturbationAmount: perturbationAmounts.get(name) || 5
                    });
                }
                nodeId++;
            });
            
            // Reassign IDs to maintain order
            this.visualNodes.forEach((node, index) => {
                node.id = index + 1;
            });
            this.nextNodeId = this.visualNodes.length + 1;
            
            // Update visual connections
            this.visualConnections = [];
            let connectionId = 1;
            
            connections.forEach(conn => {
                const fromNode = this.visualNodes.find(n => n.label === conn.source);
                const toNode = this.visualNodes.find(n => n.label === conn.target);
                
                if (fromNode && toNode) {
                    this.visualConnections.push({
                        id: connectionId++,
                        fromNodeId: fromNode.id,
                        toNodeId: toNode.id,
                        multiplier: conn.multiplier,
                        polarity: conn.polarity
                    });
                }
            });
            
            this.nextConnectionId = connectionId;
            
            // Update visual interface
            this.renderNodeList();
            this.renderConnectionsList();
            
        } catch (error) {
            // Show validation error
            textArea.classList.add('validation-error');
            console.warn('Text parsing error:', error);
        }
        
        this.syncInProgress = false;
    }
    
    syncToText() {
        if (this.syncInProgress) return;
        this.syncInProgress = true;
        
        let textDefinition = '';
        
        // Generate connections from adjacency list
        const connections = this.visualConnections.map(conn => {
            const fromNode = this.visualNodes.find(n => n.id === conn.fromNodeId);
            const toNode = this.visualNodes.find(n => n.id === conn.toNodeId);
            
            if (fromNode && toNode) {
                return `${fromNode.label} -> ${toNode.label} (${conn.multiplier}, ${conn.polarity})`;
            }
            return null;
        }).filter(conn => conn !== null);
        
        // Add connections to text
        if (connections.length > 0) {
            textDefinition += connections.join('\n') + '\n\n';
        }
        
        // Add node values
        if (this.visualNodes.length > 0) {
            const nodeLines = this.visualNodes.map(node => 
                `${node.label}: ${node.value} (${node.perturbationAmount})`
            );
            textDefinition += nodeLines.join('\n');
        }
        
        // Update text area
        document.getElementById('graph-input').value = textDefinition;
        document.getElementById('graph-input').classList.remove('validation-error');
        
        this.syncInProgress = false;
    }
    
    updateTextLabels(oldLabel, newLabel) {
        if (this.syncInProgress) return;
        this.syncInProgress = true;
        
        const textArea = document.getElementById('graph-input');
        let text = textArea.value;
        
        // Replace node labels in connections
        const connectionRegex = new RegExp(`\b${oldLabel}\b(?=\s*->|(?:\s*<-))`, 'g');
        const targetRegex = new RegExp(`(?<=->\s*)\b${oldLabel}\b`, 'g');
        const valueRegex = new RegExp(`^${oldLabel}:`, 'gm');
        
        text = text.replace(connectionRegex, newLabel);
        text = text.replace(targetRegex, newLabel);
        text = text.replace(valueRegex, `${newLabel}:`);
        
        textArea.value = text;
        textArea.classList.remove('validation-error');
        
        this.syncInProgress = false;
    }
    
    restoreMatrixState(matrixState, oldNodes) {
        // Restore existing connections using the ID-based keys
        matrixState.forEach((connection, key) => {
            const [fromId, toId] = key.split('->').map(id => parseInt(id));
            const fromNode = this.visualNodes.find(n => n.id === fromId);
            const toNode = this.visualNodes.find(n => n.id === toId);
            
            if (fromNode && toNode) {
                const multiplierInput = document.querySelector(
                    `.matrix-input[data-from="${fromNode.id}"][data-to="${toNode.id}"]`
                );
                const polaritySelect = document.querySelector(
                    `.matrix-select[data-from="${fromNode.id}"][data-to="${toNode.id}"]`
                );
                
                if (multiplierInput) multiplierInput.value = connection.multiplier;
                if (polaritySelect) polaritySelect.value = connection.polarity;
            }
        });
    }
    
    applyConnectionsToMatrix(connections) {
        // Apply connections from text definition (these override existing ones)
        connections.forEach(conn => {
            const fromNode = this.visualNodes.find(n => n.label === conn.source);
            const toNode = this.visualNodes.find(n => n.label === conn.target);
            
            if (fromNode && toNode) {
                const multiplierInput = document.querySelector(
                    `.matrix-input[data-from="${fromNode.id}"][data-to="${toNode.id}"]`
                );
                const polaritySelect = document.querySelector(
                    `.matrix-select[data-from="${fromNode.id}"][data-to="${toNode.id}"]`
                );
                
                if (multiplierInput) multiplierInput.value = conn.multiplier;
                if (polaritySelect) polaritySelect.value = conn.polarity;
            }
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
            
            // Expand the graph builder to show the loaded example
            const content = document.getElementById('graph-builder-content');
            const icon = document.querySelector('.toggle-icon');
            if (!content.classList.contains('expanded')) {
                content.classList.add('expanded');
                icon.classList.add('expanded');
            }
            
            // Sync from text to visual
            this.syncFromText();
            
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

    initializeZoomAndPan() {
        // Mouse wheel zoom - less sensitive than button clicks
        this.graphContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const wheelZoomStep = this.zoomStep * 0.3; // Make wheel zoom 30% as sensitive
            const delta = e.deltaY > 0 ? -wheelZoomStep : wheelZoomStep;
            this.zoom(this.zoomLevel + delta);
        });
        
        // Pan functionality
        this.graphContainer.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.graphContainer.style.cursor = 'grabbing';
            }
        });
        
        this.graphContainer.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.graphContainer.scrollLeft -= deltaX;
                this.graphContainer.scrollTop -= deltaY;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        this.graphContainer.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.graphContainer.style.cursor = 'grab';
        });
        
        this.graphContainer.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.graphContainer.style.cursor = 'grab';
        });
    }
    
    zoomIn() {
        this.zoom(this.zoomLevel + this.zoomStep);
    }
    
    zoomOut() {
        this.zoom(this.zoomLevel - this.zoomStep);
    }
    
    zoom(newZoomLevel) {
        const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoomLevel));
        if (clampedZoom !== this.zoomLevel) {
            this.zoomLevel = clampedZoom;
            this.applyZoom();
        }
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
        // Center the content
        this.graphContainer.scrollLeft = (this.svg.clientWidth - this.graphContainer.clientWidth) / 2;
        this.graphContainer.scrollTop = (this.svg.clientHeight - this.graphContainer.clientHeight) / 2;
    }
    
    applyZoom() {
        this.graphContent.style.transform = `scale(${this.zoomLevel})`;
        
        // Adjust SVG size based on zoom to maintain scrolling
        const baseWidth = 1200;
        const baseHeight = 800;
        const newWidth = baseWidth * this.zoomLevel;
        const newHeight = baseHeight * this.zoomLevel;
        
        this.svg.setAttribute('width', newWidth);
        this.svg.setAttribute('height', newHeight);
    }
    
    fitToContent() {
        if (this.nodes.size === 0) {
            this.resetZoom();
            return;
        }
        
        // Calculate bounding box of all nodes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            const x = node.x || 400;
            const y = node.y || 300;
            const radius = 30; // Node radius + padding
            
            minX = Math.min(minX, x - radius);
            minY = Math.min(minY, y - radius);
            maxX = Math.max(maxX, x + radius);
            maxY = Math.max(maxY, y + radius);
        });
        
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const containerWidth = this.graphContainer.clientWidth;
        const containerHeight = this.graphContainer.clientHeight;
        
        // Calculate zoom to fit content with some padding
        const zoomX = (containerWidth * 0.8) / contentWidth;
        const zoomY = (containerHeight * 0.8) / contentHeight;
        const newZoom = Math.min(zoomX, zoomY, this.maxZoom);
        
        this.zoom(newZoom);
        
        // Center the content
        setTimeout(() => {
            const centerX = (minX + maxX) / 2 * this.zoomLevel;
            const centerY = (minY + maxY) / 2 * this.zoomLevel;
            
            this.graphContainer.scrollLeft = centerX - containerWidth / 2;
            this.graphContainer.scrollTop = centerY - containerHeight / 2;
        }, 100);
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
        this.graphContent.innerHTML = '';
        
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
                x: undefined, // Will be set by positionNodes
                y: undefined, // Will be set by positionNodes
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
        if (nodeArray.length === 0) return;
        
        const centerX = 400;
        const centerY = 300;
        
        // Initialize positions with proper random distribution
        nodeArray.forEach((node, index) => {
            // Always initialize positions for force-directed layout
            const angle = (2 * Math.PI * index) / nodeArray.length;
            const radius = 60 + Math.random() * 40; // Random radius between 60-100
            node.x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50;
            node.y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50;
            
            // Initialize velocity
            node.vx = 0;
            node.vy = 0;
        });
        
        // Force-directed algorithm parameters
        const iterations = 200;
        const repulsionStrength = 2000;
        const attractionStrength = 0.05;
        const dampingFactor = 0.85;
        const minDistance = 100; // Minimum distance between nodes
        const idealEdgeLength = 140;
        
        // Run force-directed simulation
        for (let iter = 0; iter < iterations; iter++) {
            // Reset forces
            nodeArray.forEach(node => {
                node.fx = 0;
                node.fy = 0;
            });
            
            // Calculate repulsive forces between all pairs of nodes
            for (let i = 0; i < nodeArray.length; i++) {
                for (let j = i + 1; j < nodeArray.length; j++) {
                    const node1 = nodeArray[i];
                    const node2 = nodeArray[j];
                    
                    const dx = node2.x - node1.x;
                    const dy = node2.y - node1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        let force;
                        if (distance < minDistance) {
                            // Strong repulsion when too close
                            force = repulsionStrength * 2 / (distance + 1);
                        } else {
                            // Normal repulsion
                            force = repulsionStrength / (distance * distance + 10);
                        }
                        
                        const fx = (dx / distance) * force;
                        const fy = (dy / distance) * force;
                        
                        node1.fx -= fx;
                        node1.fy -= fy;
                        node2.fx += fx;
                        node2.fy += fy;
                    }
                }
            }
            
            // Calculate attractive forces along edges
            this.edges.forEach(edge => {
                const sourceNode = this.nodes.get(edge.source);
                const targetNode = this.nodes.get(edge.target);
                
                if (sourceNode && targetNode) {
                    const dx = targetNode.x - sourceNode.x;
                    const dy = targetNode.y - sourceNode.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // Spring force proportional to difference from ideal length
                        const displacement = distance - idealEdgeLength;
                        const springForce = attractionStrength * displacement;
                        const fx = (dx / distance) * springForce;
                        const fy = (dy / distance) * springForce;
                        
                        sourceNode.fx += fx;
                        sourceNode.fy += fy;
                        targetNode.fx -= fx;
                        targetNode.fy -= fy;
                    }
                }
            });
            
            // Apply forces and update positions
            const timeStep = Math.max(0.1, 1 - iter / iterations); // Reduce time step over time
            nodeArray.forEach(node => {
                // Update velocity with damping
                node.vx = (node.vx + node.fx * timeStep) * dampingFactor;
                node.vy = (node.vy + node.fy * timeStep) * dampingFactor;
                
                // Update position
                node.x += node.vx;
                node.y += node.vy;
                
                // Keep nodes within reasonable bounds with soft boundaries
                const margin = 80;
                const maxX = 720;
                const maxY = 520;
                
                if (node.x < margin) {
                    node.x = margin;
                    node.vx = Math.abs(node.vx) * 0.5; // Bounce back
                } else if (node.x > maxX) {
                    node.x = maxX;
                    node.vx = -Math.abs(node.vx) * 0.5; // Bounce back
                }
                
                if (node.y < margin) {
                    node.y = margin;
                    node.vy = Math.abs(node.vy) * 0.5; // Bounce back
                } else if (node.y > maxY) {
                    node.y = maxY;
                    node.vy = -Math.abs(node.vy) * 0.5; // Bounce back
                }
            });
            
            // Early termination if system has stabilized
            if (iter % 10 === 0) { // Check every 10 iterations
                const totalKineticEnergy = nodeArray.reduce((sum, node) => {
                    return sum + (node.vx * node.vx + node.vy * node.vy);
                }, 0);
                
                if (totalKineticEnergy < 0.1) {
                    console.log(`Force-directed layout converged after ${iter} iterations`);
                    break; // System has stabilized
                }
            }
        }
        
        // Clean up physics properties
        nodeArray.forEach(node => {
            delete node.vx;
            delete node.vy;
            delete node.fx;
            delete node.fy;
        });
        
        console.log(`Positioned ${nodeArray.length} nodes using force-directed layout`);
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
        this.graphContent.appendChild(group);
        
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
        
        this.graphContent.appendChild(line);
        
        // Add edge label
        const labelX = (startX + endX) / 2;
        const labelY = (startY + endY) / 2 - 10;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.textContent = `${edge.multiplier}${edge.polarity}`;
        label.classList.add('edge-label');
        
        this.graphContent.appendChild(label);
        
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
let app; // Global reference for visual builder callbacks

document.addEventListener('DOMContentLoaded', () => {
    app = new CausalLoopDiagram();
    
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
    app.syncFromText(); // Sync the example to visual builder
    app.buildGraphFromText();
    
    // Initialize visual builder with sample nodes (remove this since we sync from text)
    // app.addNode(); // Node 1
    // app.addNode(); // Node 2  
    // app.addNode(); // Node 3
    // app.updateNodeLabel(1, 'Population');
    // app.updateNodeLabel(2, 'Resources');
    // app.updateNodeLabel(3, 'Growth Rate');
});
