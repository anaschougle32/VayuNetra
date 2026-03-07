// Global variables for map components
let map, startMarker, endMarker, directionsService, routesRenderer;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    
    // Setup transport mode selection
    setupTransportOptions();
    
    // Additional direct event handling for transport options - using event delegation
    const optionsContainer = document.getElementById('transport-options-container');
    if (optionsContainer) {
        optionsContainer.addEventListener('click', function(e) {
            // Find the closest transport option
            const option = e.target.closest('.transport-option');
            if (option) {
                const transportMode = option.getAttribute('data-mode');
                console.log("Direct click handler triggered for:", transportMode);
                
                // Clear all selections
                document.querySelectorAll('.transport-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Set this option as selected
                option.classList.add('selected');
                
                // Update form value
                const transportInput = document.getElementById('transport-mode');
                if (transportInput) {
                    transportInput.value = transportMode;
                    console.log("Set transport mode to:", transportMode);
                    
                    // Special handling for work from home
                    if (transportMode === 'work_from_home') {
                        const mapSection = document.getElementById('map-section');
                        if (mapSection) mapSection.style.display = 'none';
                        
                        const distanceInput = document.getElementById('distance-km');
                        if (distanceInput) distanceInput.value = '0';
                        
                        updateTripPreview(0, 0);
                    } else {
                        const mapSection = document.getElementById('map-section');
                        if (mapSection) mapSection.style.display = 'block';
                        
                        calculateRouteIfPossible();
                    }
                }
            }
        });
    }
});

/**
 * Setup transport options with event listeners
 */
function setupTransportOptions() {
    console.log("Setting up transport options");
    const options = document.querySelectorAll('.transport-option');
    console.log("Found", options.length, "transport options");
    
    options.forEach(option => {
        option.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            console.log("Transport option clicked:", mode);
            selectTransportMode(mode);
        });
    });
}

/**
 * Select transport mode and update UI
 */
function selectTransportMode(mode) {
    console.log("Selecting transport mode:", mode);
    
    // Clear all selections
    document.querySelectorAll('.transport-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Set selected option
    const selectedOption = document.querySelector(`[data-mode="${mode}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Update form value
    const transportInput = document.getElementById('transport-mode');
    if (transportInput) {
        transportInput.value = mode;
    }
    
    // Special handling for work from home
    if (mode === 'work_from_home') {
        const mapSection = document.getElementById('map-section');
        if (mapSection) mapSection.style.display = 'none';
        
        const distanceInput = document.getElementById('distance-km');
        if (distanceInput) distanceInput.value = '0';
        
        updateTripPreview(0, 0);
    } else {
        const mapSection = document.getElementById('map-section');
        if (mapSection) mapSection.style.display = 'block';
        
        calculateRouteIfPossible();
    }
}

/**
 * Initialize Google Map
 */
function initializeMap() {
    console.log("initializeMap called");
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("Map element not found");
        return;
    }
    
    // Create map centered on Thane, Maharashtra, India
    map = new google.maps.Map(mapElement, {
        center: { lat: 19.2183, lng: 72.9781 },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            {
                featureType: "poi.business",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                featureType: "poi.medical",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ]
    });
    
    console.log("Map created successfully");
    
    // Setup markers
    startMarker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: 19.2183, lng: 72.9781 },
        map: map,
        title: "Start Location",
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    endMarker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: 19.2183, lng: 72.9781 },
        map: map,
        title: "End Location",
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    // Initialize routes service (new API)
    routesRenderer = new google.maps.routes.RouteRenderer();
    directionsService = new google.maps.DirectionsService();
    
    console.log("Google Maps services initialized");
    
    // Setup search box with autocomplete
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        // Check if Places API is available
        if (typeof google.maps.places !== 'undefined' && google.maps.places.PlaceAutocompleteElement) {
            // Use new PlaceAutocompleteElement
            const autocomplete = new google.maps.places.PlaceAutocompleteElement({
                inputElement: searchInput,
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'in' }
            });
            
            // Bias search results to current map view
            map.addListener('bounds_changed', function() {
                autocomplete.setBounds(map.getBounds());
            });
            
            const handlePlaceSelect = function() {
                const place = autocomplete.getPlace();
                if (!place || !place.geometry) {
                    console.warn('No place geometry available');
                    return;
                }
                
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || place.name || 'Selected location';
                
                // Update form fields
                document.getElementById('start-lat').value = lat;
                document.getElementById('start-lng').value = lng;
                document.getElementById('start-location').value = address;
                
                // Add marker
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: lat, lng: lng },
                    map: map,
                    title: address,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
                
                // Center map on selected location
                map.setCenter({ lat: lat, lng: lng });
                map.setZoom(15);
                
                // Clear search input
                searchInput.value = '';
                
                // Trigger location selection
                handleLocationSelection('start', { lat: lat, lng: lng }, address);
            };
            
            autocomplete.addListener('place_changed', handlePlaceSelect);
            
            // Also handle Enter key
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePlaceSelect();
                }
            });
        } else {
            console.warn('Places API not available, using manual location entry');
            // Fallback to manual location selection
            searchInput.placeholder = 'Click on map to select location';
            
            // Add click handler to map for manual selection
            map.addListener('click', function(event) {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                
                // Update form fields
                document.getElementById('start-lat').value = lat;
                document.getElementById('start-lng').value = lng;
                document.getElementById('start-location').value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                
                // Add marker
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: lat, lng: lng },
                    map: map,
                    title: 'Selected Location',
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
                
                // Trigger location selection
                handleLocationSelection('start', { lat: lat, lng: lng }, document.getElementById('start-location').value);
            });
        }
    }
    
    // Setup location selectors with search integration
    setupLocationSelectors();
    
    console.log("Map initialization complete");
}

/**
 * Setup location selectors with search integration
 */
function setupLocationSelectors() {
    const startSelect = document.getElementById('start-location');
    const endSelect = document.getElementById('end-location');
    
    if (startSelect) {
        startSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                // Focus search box when "Other" is selected
                const searchInput = document.getElementById('map-search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.placeholder = 'Search for start location...';
                }
            }
        });
    }
    
    if (endSelect) {
        endSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                // Focus search box when "Other" is selected
                const searchInput = document.getElementById('map-search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.placeholder = 'Search for end location...';
                }
            }
        });
    }
}

/**
 * Handle location selection
 */
function handleLocationSelection(locationType, location, address) {
    console.log("Handling location selection:", locationType, location);
    
    if (locationType === 'start') {
        // Set start location
        startMarker.setPosition(location);
        startMarker.setMap(map);
        
        const startSelect = document.getElementById('start-location');
        if (startSelect) {
            startSelect.value = 'other';
            // Create option if it doesn't exist
            if (!startSelect.querySelector('option[value="other"]')) {
                const option = document.createElement('option');
                option.value = 'other';
                option.textContent = address.substring(0, 50);
                startSelect.appendChild(option);
            }
        }
        
        // Update hidden fields
        const startLat = document.getElementById('start-lat');
        const startLng = document.getElementById('start-lng');
        const startAddr = document.getElementById('start-location');
        if (startLat) startLat.value = location.lat;
        if (startLng) startLng.value = location.lng;
        if (startAddr) startAddr.value = address;
        
    } else if (locationType === 'end') {
        // Set end location
        endMarker.setPosition(location);
        endMarker.setMap(map);
        
        const endSelect = document.getElementById('end-location');
        if (endSelect) {
            endSelect.value = 'other';
            // Create option if it doesn't exist
            if (!endSelect.querySelector('option[value="other"]')) {
                const option = document.createElement('option');
                option.value = 'other';
                option.textContent = address.substring(0, 50);
                endSelect.appendChild(option);
            }
        }
        
        // Update hidden fields
        const endLat = document.getElementById('end-lat');
        const endLng = document.getElementById('end-lng');
        const endAddr = document.getElementById('end-location');
        if (endLat) endLat.value = location.lat;
        if (endLng) endLng.value = location.lng;
        if (endAddr) endAddr.value = address;
    } else {
        // Default: center map on location
        map.setCenter(location);
        map.setZoom(15);
    }
    
    // Clear search input
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) searchInput.value = '';
    
    // Try to calculate route if both locations are set
    setTimeout(calculateRouteIfPossible, 500);
}

/**
 * Calculate route if both start and end locations are available
 */
function calculateRouteIfPossible() {
    console.log("Calculating route if possible");
    
    const startLat = parseFloat(document.getElementById('start-lat')?.value);
    const startLng = parseFloat(document.getElementById('start-lng')?.value);
    const endLat = parseFloat(document.getElementById('end-lat')?.value);
    const endLng = parseFloat(document.getElementById('end-lng')?.value);
    
    if (!startLat || !startLng || !endLat || !endLng) {
        console.log("Missing location data for route calculation");
        return;
    }
    
    const startLocation = { lat: startLat, lng: startLng };
    const endLocation = { lat: endLat, lng: endLng };
    
    // Use new Routes API
    const request = {
        origin: startLocation,
        destination: endLocation,
        travelMode: google.maps.TravelMode.DRIVING,
        routingPreference: google.maps.RoutingPreference.TRAFFIC_AWARE
    };
    
    directionsService.route(request)
        .then(response => {
            console.log("Route calculated successfully");
            
            // Clear existing routes
            routesRenderer.setDirections({ routes: [] });
            
            if (response.routes && response.routes.length > 0) {
                const route = response.routes[0];
                
                // Display route on map
                routesRenderer.setDirections({ routes: [route] });
                
                // Calculate distance
                let totalDistance = 0;
                if (route.legs && route.legs.length > 0) {
                    route.legs.forEach(leg => {
                        totalDistance += leg.distance?.value || 0;
                    });
                }
                
                // Update distance field
                const distanceKm = totalDistance / 1000; // Convert meters to km
                const distanceInput = document.getElementById('distance-km');
                if (distanceInput) {
                    distanceInput.value = distanceKm.toFixed(2);
                }
                
                // Update trip preview
                updateTripPreview(distanceKm, totalDistance);
                
                console.log("Route distance:", distanceKm, "km");
            } else {
                console.warn("No route found");
            }
        })
        .catch(error => {
            console.error("Error calculating route:", error);
            
            // Fallback to Haversine distance calculation
            const distance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
            const distanceKm = distance / 1000;
            
            const distanceInput = document.getElementById('distance-km');
            if (distanceInput) {
                distanceInput.value = distanceKm.toFixed(2);
            }
            
            updateTripPreview(distanceKm, distance);
            
            // Show simple straight line on map
            const path = new google.maps.Polyline({
                path: [startLocation, endLocation],
                geodesic: true,
                strokeColor: '#10B981',
                strokeWeight: 5,
                strokeOpacity: 0.7
            });
            
            path.setMap(map);
        });
}

/**
 * Calculate Haversine distance between two points
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 63710; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLon / 2);
    const c = Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const d = 2 * Math.atan2(Math.sqrt(a * a + c * c));
    const distance = R * d;
    
    return distance; // in meters
}

/**
 * Update trip preview with distance and route info
 */
function updateTripPreview(distance, routeDistance) {
    const previewDistance = document.getElementById('preview-distance');
    if (previewDistance) {
        previewDistance.textContent = distance.toFixed(1) + ' km';
    }
    
    const previewRoute = document.getElementById('preview-route');
    if (previewRoute && routeDistance) {
        previewRoute.textContent = (routeDistance / 1000).toFixed(1) + ' km';
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.initializeMap = initializeMap;
    window.calculateRouteIfPossible = calculateRouteIfPossible;
    window.handleLocationSelection = handleLocationSelection;
    window.calculateHaversineDistance = calculateHaversineDistance;
    window.updateTripPreview = updateTripPreview;
}
