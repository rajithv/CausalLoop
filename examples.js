// Example Causal Loop Diagrams

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
Resources: 70`;

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
Debt: 20`;

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
Refugees: 15`;

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
Risk: 25`;

// Function to load examples into the text area
function loadExample(exampleName) {
    const examples = {
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
            populationGrowthExample,
            economicExample,
            climateExample,
            organizationExample
        }
    };
}
