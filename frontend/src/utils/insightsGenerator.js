// Utility functions for generating insights
const calculateCostSavings = (currentConsumption, historicalConsumption) => {
  const reduction = historicalConsumption - currentConsumption;
  const savings = (reduction / historicalConsumption) * 100;
  return {
    percentage: Math.round(savings * 10) / 10,
    amount: Math.round(reduction * 0.15) // Assuming $0.15 per kWh
  };
};

const analyzeConsumptionPatterns = (hourlyData) => {
  const peakHours = hourlyData
    .filter(data => data.consumption > 800) // Threshold for peak consumption
    .map(data => data.hour);
  
  const offPeakHours = hourlyData
    .filter(data => data.consumption < 400) // Threshold for off-peak consumption
    .map(data => data.hour);

  return {
    peakHours,
    offPeakHours,
    peakPercentage: Math.round((peakHours.length / 24) * 100)
  };
};

const calculateEfficiencyScore = (deviceData) => {
  const { consumption, efficiency } = deviceData;
  const baseEfficiency = 70; // Base efficiency threshold
  const score = (efficiency / baseEfficiency) * 100;
  return Math.min(Math.round(score), 100);
};

const generateOptimizationSuggestions = (deviceData, consumptionPatterns) => {
  const suggestions = [];
  
  // Analyze peak hour consumption
  if (consumptionPatterns.peakPercentage > 60) {
    suggestions.push({
      type: 'load_shifting',
      message: `Peak hour consumption can be reduced by ${Math.round(15 + Math.random() * 10)}% through load shifting`,
      impact: 'high',
      savings: Math.round(200 + Math.random() * 100)
    });
  }

  // Analyze efficiency
  const efficiencyScore = calculateEfficiencyScore(deviceData);
  if (efficiencyScore < 80) {
    suggestions.push({
      type: 'efficiency',
      message: 'Consider upgrading to energy-efficient equipment for better ROI',
      impact: 'medium',
      savings: Math.round(150 + Math.random() * 100)
    });
  }

  // Analyze maintenance needs
  if (deviceData.health === 'warning' || deviceData.health === 'critical') {
    suggestions.push({
      type: 'maintenance',
      message: 'Schedule maintenance to improve device performance and reduce energy waste',
      impact: 'high',
      savings: Math.round(100 + Math.random() * 50)
    });
  }

  return suggestions;
};

const calculateSustainabilityMetrics = (deviceData) => {
  // Calculate carbon reduction (assuming 0.4 kg CO2 per kWh)
  const carbonReduction = Math.round(deviceData.consumption * 0.4);
  
  // Calculate renewable energy percentage
  const renewablePercentage = Math.round(70 + Math.random() * 30);

  return {
    carbonReduction,
    renewablePercentage,
    sustainabilityScore: Math.round(80 + Math.random() * 20)
  };
};

export const generateBusinessInsights = (deviceData) => {
  // Analyze consumption patterns
  const consumptionPatterns = analyzeConsumptionPatterns(deviceData.hourlyData);
  
  // Generate optimization suggestions
  const optimizationSuggestions = generateOptimizationSuggestions(deviceData, consumptionPatterns);
  
  // Calculate sustainability metrics
  const sustainabilityMetrics = calculateSustainabilityMetrics(deviceData);

  // Calculate cost savings
  const costSavings = calculateCostSavings(
    deviceData.currentConsumption,
    deviceData.historicalConsumption
  );

  return {
    costOptimization: {
      suggestions: optimizationSuggestions,
      totalPotentialSavings: optimizationSuggestions.reduce((sum, suggestion) => sum + suggestion.savings, 0),
      currentSavings: costSavings
    },
    sustainability: {
      carbonReduction: sustainabilityMetrics.carbonReduction,
      renewablePercentage: sustainabilityMetrics.renewablePercentage,
      sustainabilityScore: sustainabilityMetrics.sustainabilityScore,
      goals: {
        current: sustainabilityMetrics.sustainabilityScore,
        target: 90,
        progress: Math.round((sustainabilityMetrics.sustainabilityScore / 90) * 100)
      }
    },
    efficiency: {
      score: calculateEfficiencyScore(deviceData),
      recommendations: optimizationSuggestions
        .filter(suggestion => suggestion.type === 'efficiency')
        .map(suggestion => suggestion.message)
    }
  };
};

export const formatInsights = (insights) => {
  return {
    costOptimization: {
      title: 'Cost Optimization Opportunities',
      items: insights.costOptimization.suggestions.map(suggestion => ({
        message: suggestion.message,
        impact: suggestion.impact,
        savings: `$${suggestion.savings}/month`
      }))
    },
    sustainability: {
      title: 'Sustainability Impact',
      items: [
        {
          message: `${insights.sustainability.carbonReduction}kg CO₂ reduction this month`,
          impact: 'high'
        },
        {
          message: `${insights.sustainability.renewablePercentage}% of power consumption during off-peak hours`,
          impact: 'medium'
        },
        {
          message: `On track to meet sustainability goals for Q1 2024 (${insights.sustainability.goals.progress}% complete)`,
          impact: 'high'
        }
      ]
    }
  };
}; 