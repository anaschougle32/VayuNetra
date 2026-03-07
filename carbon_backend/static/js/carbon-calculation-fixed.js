// Carbon calculation engine for Carbon Credits system
// WRI India 2015 emission factors with dynamic adjustments

// Initialize global emission factors to prevent conflicts
if (typeof window.CARBON_EMISSION_FACTORS === 'undefined') {
    window.CARBON_EMISSION_FACTORS = {
        'car': { baseline: 0.130, actual: 0.130 },
        'carpool': { baseline: 0.130, actual: 0.071 },
        'two_wheeler_single': { baseline: 0.130, actual: 0.029 },
        'two_wheeler_double': { baseline: 0.130, actual: 0.0145 },
        'public_transport': { baseline: 0.130, actual: 0.015161 },
        'bicycle': { baseline: 0.120, actual: 0.000 },
        'walking': { baseline: 0.150, actual: 0.000 },
        'work_from_home': { baseline: 0.130, actual: 0.000 }
    };
}

/**
 * Calculate time weight factor based on time period
 */
function calculateTimeWeight(timePeriod, trafficCondition) {
    let timeWeight = 1.0;
    
    // Time period adjustments
    switch(timePeriod) {
        case 'peak_morning':
            timeWeight = 1.3; // Higher emissions during peak hours
            break;
        case 'peak_evening':
            timeWeight = 1.3; // Higher emissions during peak hours
            break;
        case 'off_peak':
            timeWeight = 1.0; // Standard weight
            break;
        case 'late_night':
            timeWeight = 0.8; // Lower emissions during late night
            break;
    }
    
    // Traffic condition adjustments
    switch(trafficCondition) {
        case 'heavy':
            timeWeight *= 1.2; // Increase emissions in heavy traffic
            break;
        case 'moderate':
            timeWeight *= 1.0; // Standard traffic
            break;
        case 'light':
            timeWeight *= 0.9; // Slightly lower emissions in light traffic
            break;
    }
    
    return timeWeight;
}

/**
 * Calculate context factor based on multiple environmental conditions
 */
function calculateContextFactor(weather, routeType, aqiLevel, season, mode) {
    let contextFactor = 1.0;
    
    // Weather condition adjustments
    switch(weather) {
        case 'rain':
            contextFactor *= 1.15; // Higher emissions in rain (harder cycling/walking)
            break;
        case 'snow':
            contextFactor *= 1.25; // Much higher emissions in snow
            break;
        case 'normal':
            contextFactor *= 1.0; // Standard weather
            break;
    }
    
    // Route type adjustments
    switch(routeType) {
        case 'highway':
            contextFactor *= 0.9; // Better efficiency on highways
            break;
        case 'urban':
            contextFactor *= 1.1; // Slightly higher in urban areas
            break;
        case 'suburban':
            contextFactor *= 1.0; // Standard suburban routes
            break;
    }
    
    // AQI level adjustments
    switch(aqiLevel) {
        case 'hazardous':
            contextFactor *= 1.3; // Higher emissions in poor air quality
            break;
        case 'very_unhealthy':
            contextFactor *= 1.2; // Higher emissions
            break;
        case 'unhealthy':
            contextFactor *= 1.1; // Slightly higher emissions
            break;
        case 'moderate':
            contextFactor *= 1.0; // Standard air quality
            break;
        case 'good':
            contextFactor *= 0.95; // Slightly lower emissions in good air
            break;
    }
    
    // Seasonal adjustments
    switch(season) {
        case 'winter':
            contextFactor *= 1.1; // Higher emissions in winter
            break;
        case 'summer':
            contextFactor *= 1.05; // Slightly higher in summer
            break;
        case 'monsoon':
            contextFactor *= 1.0; // Standard during monsoon
            break;
        case 'normal':
            contextFactor *= 1.0; // Standard conditions
            break;
    }
    
    // Mode-specific adjustments
    if (mode === 'bicycle' || mode === 'walking') {
        contextFactor *= 0.8; // Lower impact for eco-friendly modes
    }
    
    return contextFactor;
}

/**
 * Calculate carbon credits based on distance, mode, and environmental factors
 */
function calculateCarbonCredits(distance, mode, timePeriod, trafficCondition, weather, routeType, aqiLevel, season) {
    // Get base emission factors
    const factors = window.CARBON_EMISSION_FACTORS[mode] || { baseline: 0.130, actual: 0.130 };
    
    // Calculate adjusted emissions
    const baseEmission = factors.baseline * distance;
    const actualEmission = factors.actual * distance;
    
    // Apply environmental factors
    const timeWeight = calculateTimeWeight(timePeriod, trafficCondition);
    const contextFactor = calculateContextFactor(weather, routeType, aqiLevel, season, mode);
    
    // Calculate final emissions with all adjustments
    const adjustedEmission = actualEmission * timeWeight * contextFactor;
    
    // Calculate credits saved (difference between baseline and actual)
    const creditsSaved = (baseEmission - adjustedEmission) * 10; // Convert to credits
    
    return {
        baseEmission: baseEmission,
        actualEmission: actualEmission,
        adjustedEmission: adjustedEmission,
        creditsSaved: creditsSaved,
        timeWeight: timeWeight,
        contextFactor: contextFactor
    };
}

/**
 * Update credit preview in real-time
 */
function updateCreditPreview() {
    // Get current form values
    const mode = document.getElementById('transport-mode')?.value;
    const distance = parseFloat(document.getElementById('distance')?.value) || 0;
    const timePeriod = document.getElementById('time-period')?.value;
    const trafficCondition = document.getElementById('traffic-condition')?.value;
    const weather = document.getElementById('weather-condition')?.value;
    const routeType = document.getElementById('route-type')?.value;
    const aqiLevel = document.getElementById('aqi-level')?.value;
    const season = document.getElementById('season')?.value;
    
    if (!mode || !distance) return;
    
    // Calculate credits
    const result = calculateCarbonCredits(distance, mode, timePeriod, trafficCondition, weather, routeType, aqiLevel, season);
    
    // Update preview elements
    const previewCredits = document.getElementById('preview-credits');
    const previewSavings = document.getElementById('preview-savings');
    const previewTimeWeight = document.getElementById('preview-time-weight');
    const previewContext = document.getElementById('preview-context');
    const previewDistance = document.getElementById('preview-distance');
    
    if (previewCredits) previewCredits.textContent = result.creditsSaved.toFixed(4);
    if (previewSavings) previewSavings.textContent = result.adjustedEmission.toFixed(4) + ' kg/km';
    if (previewTimeWeight) previewTimeWeight.textContent = result.timeWeight.toFixed(2) + 'x';
    if (previewContext) previewContext.textContent = result.contextFactor.toFixed(2) + 'x';
    if (previewDistance) previewDistance.textContent = distance.toFixed(1) + ' km';
}

/**
 * Update credit display for each transport mode (example for 1 km)
 */
function updateModeCredits() {
    Object.keys(window.CARBON_EMISSION_FACTORS).forEach(mode => {
        const creditElement = document.getElementById(`credits-${mode}`);
        if (creditElement && mode !== 'work_from_home') {
            const defaultTimePeriod = 'off_peak';
            const defaultTraffic = 'moderate';
            const defaultWeather = 'normal';
            const defaultRoute = 'suburban';
            const defaultAQI = 'moderate';
            const defaultSeason = 'normal';
            const exampleDistance = 1.0; // 1 km example
            
            const result = calculateCarbonCredits(
                exampleDistance, 
                mode, 
                defaultTimePeriod, 
                defaultTraffic, 
                defaultWeather, 
                defaultRoute, 
                defaultAQI, 
                defaultSeason
            );
            
            if (creditElement) {
                creditElement.textContent = result.creditsSaved.toFixed(2);
            }
        }
    });
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Carbon calculation engine initialized');
    updateModeCredits();
    
    // Set up real-time updates
    const formElements = [
        'transport-mode',
        'distance',
        'time-period',
        'traffic-condition',
        'weather-condition',
        'route-type',
        'aqi-level',
        'season'
    ];
    
    formElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateCreditPreview);
            element.addEventListener('input', updateCreditPreview);
        }
    });
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.calculateCarbonCredits = calculateCarbonCredits;
    window.updateCreditPreview = updateCreditPreview;
    window.updateModeCredits = updateModeCredits;
    window.calculateTimeWeight = calculateTimeWeight;
    window.calculateContextFactor = calculateContextFactor;
}
