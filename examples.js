// Example Causal Loop Diagrams

// Simple Loop Example
const simpleExample = `1 -> 2 (0.8, +)
2 -> 3 (0.6, +)
3 -> 1 (0.5, -)

1: 50 (10)
2: 30 (5)
3: 40 (8)

1: "Node A"
2: "Node B"  
3: "Node C"

1: #4a90e2
2: #50c878
3: #ff6b6b`;

// Example 1: Simple Population Growth Model
const populationGrowthExample = `Population -> BirthRate (0.7, +)
BirthRate -> Population (0.8, +)
Population -> DeathRate (0.4, +)
DeathRate -> Population (0.6, -)
Population -> Resources (0.5, -)
Resources -> DeathRate (0.3, +)

Population: 50
BirthRate: 30
DeathRate: 20
Resources: 70

Population: "Population"
BirthRate: "Birth Rate"
DeathRate: "Death Rate"
Resources: "Resources"

Population: #4a90e2
BirthRate: #50c878
DeathRate: #ff6b6b
Resources: #ffa500`;

// Example 2: Economic Feedback Loop
const economicExample = `Investment -> Jobs (0.8, +)
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
Debt: 20

Investment: "Investment"
Jobs: "Jobs"
Income: "Income"
Consumption: "Consumption"
Demand: "Demand"
Debt: "Debt"

Investment: #2e7d32
Jobs: #1976d2
Income: #f57c00
Consumption: #7b1fa2
Demand: #c2185b
Debt: #d32f2f`;

// Example 3: Climate Change Model
const climateExample = `CO2Emissions -> Temperature (0.8, +)
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
Refugees: 15

CO2Emissions: "CO2 Emissions"
Temperature: "Temperature"
IceMelting: "Ice Melting"
SeaLevel: "Sea Level"
Droughts: "Droughts"
FoodProduction: "Food Production"
CoastalAreas: "Coastal Areas"
Refugees: "Refugees"

CO2Emissions: #424242
Temperature: #ff5722
IceMelting: #00bcd4
SeaLevel: #2196f3
Droughts: #ff9800
FoodProduction: #4caf50
CoastalAreas: #009688
Refugees: #795548`;

// Example 4: Organizational Learning
const organizationExample = `Training -> Skills (0.9, +)
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
Risk: 25

Training: "Training"
Skills: "Skills"
Performance: "Performance"
Revenue: "Revenue"
Confidence: "Confidence"
Innovation: "Innovation"
Risk: "Risk"

Training: #3f51b5
Skills: #e91e63
Performance: #ff9800
Revenue: #4caf50
Confidence: #9c27b0
Innovation: #00bcd4
Risk: #f44336`;

// Function to load examples into the text area
function loadExample(exampleName) {
    const examples = {
        'simple': simpleExample,
        'population': populationGrowthExample,
        'economic': economicExample,
        'climate': climateExample,
        'organization': organizationExample
    };
    
    const textArea = document.getElementById('graph-input');
    if (textArea && examples[exampleName]) {
        textArea.value = examples[exampleName];
    }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.CausalLoopExamples = {
        loadExample,
        examples: {
            simpleExample,
            populationGrowthExample,
            economicExample,
            climateExample,
            organizationExample
        }
    };
}
