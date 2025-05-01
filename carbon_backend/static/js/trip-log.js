// Global variables for map components
let map, startMarker, endMarker, directionsService, directionsRenderer;

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
    
    // Set up location change handlers
    const startLocationSelect = document.getElementById('start-location');
    const endLocationSelect = document.getElementById('end-location');
    
    if (startLocationSelect) {
        startLocationSelect.addEventListener('change', function() {
            handleLocationSelection(this.value, 'start');
        });
        
        // Default to home for start location
        if (document.querySelector('#start-location option[value="home"]')) {
            startLocationSelect.value = 'home';
            // Trigger change event after map is loaded
        }
    }
    
    if (endLocationSelect) {
        endLocationSelect.addEventListener('change', function() {
            handleLocationSelection(this.value, 'end');
        });
        
        // Look for the first employer location (likely FAU)
        const firstEmployerOption = document.querySelector('#end-location option:not([value="home"]):not([value="other"]):not([value=""])');
        if (firstEmployerOption) {
            endLocationSelect.value = firstEmployerOption.value;
            // Will be triggered after map load
        }
    }
});

// Set up transport option clicks
function setupTransportOptions() {
    console.log("Setting up transport options");
    const transportOptions = document.querySelectorAll('.transport-option');
    
    if (transportOptions.length === 0) {
        console.warn("No transport options found");
        return;
    }
    
    console.log(`Found ${transportOptions.length} transport options`);
    
    transportOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Transport option clicked:", this.getAttribute('data-mode'));
            
            // Remove selected class from all options
            transportOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input with selected transport mode
            const transportMode = this.getAttribute('data-mode');
            const transportModeInput = document.getElementById('transport-mode');
            
            if (!transportModeInput) {
                console.error("Transport mode input not found");
                return;
            }
            
            transportModeInput.value = transportMode;
            console.log("Selected transport mode:", transportMode);
            
            // Special handling for work from home
            const mapSection = document.getElementById('map-section');
            const distanceInput = document.getElementById('distance-km');
            
            if (transportMode === 'work_from_home') {
                if (mapSection) mapSection.style.display = 'none';
                if (distanceInput) distanceInput.value = '0';
                updateTripPreview(0, 0);
            } else {
                if (mapSection) mapSection.style.display = 'block';
                calculateRouteIfPossible();
            }
        });
    });
}

// Add a temporary notification
function addNotification(message, type = 'info') {
    const container = document.createElement('div');
    container.className = `p-4 rounded-lg mb-4 ${
        type === 'success' ? 'bg-green-100 text-green-800' : 
        type === 'error' ? 'bg-red-100 text-red-800' : 
        'bg-blue-100 text-blue-800'
    }`;
    container.textContent = message;
    
    // Find the messages section or create one
    let messagesSection = document.querySelector('.messages-section');
    if (!messagesSection) {
        messagesSection = document.createElement('div');
        messagesSection.className = 'messages-section mb-6';
        
        // Insert after the header section
        const header = document.querySelector('.relative.mb-8');
        header.parentNode.insertBefore(messagesSection, header.nextSibling);
    }
    
    // Add the notification
    messagesSection.appendChild(container);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 500);
    }, 5000);
}

// Initialize Google Maps when API is loaded
function initMap() {
    console.log("Google Maps API loaded");
    
    // Hide all map loading indicators
    document.querySelectorAll('.map-loading').forEach(loading => {
        loading.style.display = 'none';
    });
    
    // Create map
    const mapElement = document.getElementById('trip-map');
    if (!mapElement) {
        console.error("Map element not found");
        return;
    }
    
    // Define Boca Raton coordinates
    var bocaRatonLocation = { lat: 26.351915, lng: -80.138568 }; // Exact Boca Raton coordinates
    
    map = new google.maps.Map(mapElement, {
        zoom: 12,
        center: bocaRatonLocation, // Center on Boca Raton
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
    });
    
    // Create markers for start and end locations
    startMarker = new google.maps.Marker({
        position: bocaRatonLocation,
        map: map,
        draggable: true,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.DROP,
        title: 'Start Location'
    });
    
    // Define FAU location
    var fauLocation = { lat: 26.368322, lng: -80.097404 }; // Exact FAU coordinates
    
    endMarker = new google.maps.Marker({
        map: map,
        position: fauLocation,
        draggable: true,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.DROP,
        title: 'End Location'
    });
    
    // Hide markers initially
    startMarker.setMap(null);
    endMarker.setMap(null);
    
    // Create directions service and renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#10B981',
            strokeWeight: 5,
            strokeOpacity: 0.7
        }
    });
    
    // Set up search box
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        const searchBox = new google.maps.places.SearchBox(searchInput);
        
        // Bias search results to current map view
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });
        
        // Handle search results
        searchBox.addListener('places_changed', function() {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;
            
            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;
            
            // Get location coordinates
            const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address || place.name
            };
            
            // Determine if we're setting start or end location
            const activeSelect = document.activeElement;
            if (activeSelect && activeSelect.id === 'start-location') {
                // Set start location
                startMarker.setPosition(location);
                startMarker.setMap(map);
                activeSelect.value = 'other';
                
                // Update hidden fields
                document.getElementById('custom-lat').value = location.lat;
                document.getElementById('custom-lng').value = location.lng;
                document.getElementById('custom-address').value = location.address;
            } else if (activeSelect && activeSelect.id === 'end-location') {
                // Set end location
                endMarker.setPosition(location);
                endMarker.setMap(map);
                activeSelect.value = 'other';
                
                // Update hidden fields
                document.getElementById('custom-lat').value = location.lat;
                document.getElementById('custom-lng').value = location.lng;
                document.getElementById('custom-address').value = location.address;
            } else {
                // Default to setting center of map
                map.setCenter(location);
            }
            
            // Try to calculate route
            calculateRouteIfPossible();
        });
    }
    
    // Set up location selectors
    const startSelect = document.getElementById('start-location');
    const endSelect = document.getElementById('end-location');
    
    if (startSelect) {
        startSelect.addEventListener('change', function() {
            handleLocationSelection(this.value, 'start');
        });
        
        // Trigger change for initial selection
        if (startSelect.value) {
            handleLocationSelection(startSelect.value, 'start');
        }
    }
    
    if (endSelect) {
        endSelect.addEventListener('change', function() {
            handleLocationSelection(this.value, 'end');
        });
        
        // Trigger change for initial selection
        if (endSelect.value) {
            handleLocationSelection(endSelect.value, 'end');
        }
    }
}

// Handle location selection for start or end points
function handleLocationSelection(locationValue, locationType) {
    console.log(`Handling ${locationType} location selection: ${locationValue}`);
    
    // Define default locations
    var bocaRatonLocation = { lat: 26.351915, lng: -80.138568 }; // Exact Boca Raton coordinates
    var fauLocation = { lat: 26.368322, lng: -80.097404 }; // Exact FAU coordinates
    
    // Get the appropriate marker based on location type
    let marker = locationType === 'start' ? startMarker : endMarker;
    
    // Show marker by default
    marker.setMap(map);
    
    // Handle different location types
    if (locationValue === 'home') {
        // Use home location
        marker.setPosition(bocaRatonLocation);
        marker.setDraggable(false);
        
        // Store location in data attribute for later retrieval
        if (locationType === 'start') {
            document.getElementById('start-location').setAttribute('data-location', JSON.stringify(bocaRatonLocation));
        } else {
            document.getElementById('end-location').setAttribute('data-location', JSON.stringify(bocaRatonLocation));
        }
    } else if (locationValue === 'other') {
        // Custom location - allow dragging
        marker.setDraggable(true);
        
        // Position the marker in the center of the current map view if not already placed
        const currentPosition = marker.getPosition();
        if (!currentPosition) {
            marker.setPosition(map.getCenter());
        }
        
        // Focus on the search input to encourage user to search
        document.getElementById('map-search-input').focus();
    } else {
        // Check if this is a location ID (from employer locations)
        if (!isNaN(parseInt(locationValue))) {
            // Try to get lat/lng from the option
            const select = document.getElementById(`${locationType}-location`);
            const option = select.querySelector(`option[value="${locationValue}"]`);
            
            if (option) {
                const lat = parseFloat(option.getAttribute('data-lat'));
                const lng = parseFloat(option.getAttribute('data-lng'));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    const position = { lat, lng };
                    marker.setPosition(position);
                    marker.setDraggable(false);
                    
                    // Store location
                    if (locationType === 'start') {
                        document.getElementById('start-location').setAttribute('data-location', JSON.stringify(position));
                    } else {
                        document.getElementById('end-location').setAttribute('data-location', JSON.stringify(position));
                    }
                } else {
                    // Fallback to FAU if for some reason coordinates aren't available
                    marker.setPosition(fauLocation);
                    marker.setDraggable(false);
                }
            } else {
                // Fallback to FAU if option not found
                marker.setPosition(fauLocation);
                marker.setDraggable(false);
            }
        }
    }
    
    // Calculate route if both locations are set
    calculateRouteIfPossible();
}

// Calculate route if possible
function calculateRouteIfPossible() {
    // Check if both locations are selected and visible
    if (startMarker && endMarker) {
        // Ensure markers are visible
        startMarker.setMap(map);
        endMarker.setMap(map);
        
        // Get marker positions
        const start = startMarker.getPosition();
        const end = endMarker.getPosition();
        
        // Make sure both positions exist
        if (start && end) {
            // Initialize directions service if needed
            if (!directionsService) {
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '#2B9348',
                        strokeWeight: 5
                    }
                });
            }
            
            // Calculate and display route
            directionsService.route({
                origin: start,
                destination: end,
                travelMode: getTravelMode()
            }, function(response, status) {
                if (status === 'OK') {
                    directionsRenderer.setDirections(response);
                    
                    // Get distance and duration
                    const route = response.routes[0];
                    if (route && route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        const distance = leg.distance.value / 1000; // Convert to km
                        const duration = leg.duration.value / 60; // Convert to minutes
                        
                        // Update form field with distance
                        document.getElementById('distance-km').value = distance.toFixed(2);
                        
                        // Update preview
                        updateTripPreview(distance, duration);
                        
                        // Show preview section
                        document.getElementById('trip-preview').classList.remove('hidden');
                    }
                } else {
                    console.error('Directions request failed:', status);
                    addNotification('Could not calculate route. Please try different locations.', 'error');
                }
            });
        } else {
            console.warn('Missing start or end position');
        }
    } else {
        console.warn('Missing markers');
    }
}

// Update trip preview with calculated values
function updateTripPreview(distance, duration) {
    const previewSection = document.getElementById('trip-preview');
    if (!previewSection) return;
    
    // Show preview section
    previewSection.classList.remove('hidden');
    
    // Get selected transport mode
    const transportMode = document.getElementById('transport-mode').value;
    
    // Set mode name and credit rate
    let modeName = 'Unknown';
    let creditsPerKm = 0.5;
    
    switch (transportMode) {
        case 'walking':
            modeName = 'Walking';
            creditsPerKm = 6;
            break;
        case 'bicycle':
            modeName = 'Bicycle';
            creditsPerKm = 5;
            break;
        case 'public_transport':
            modeName = 'Public Transport';
            creditsPerKm = 3;
            break;
        case 'carpool':
            modeName = 'Carpool';
            creditsPerKm = 2;
            break;
        case 'car':
            modeName = 'Car (Single)';
            creditsPerKm = 0.5;
            break;
        case 'work_from_home':
            modeName = 'Work from Home';
            creditsPerKm = 0;
            break;
    }
    
    // Calculate credits
    let totalCredits = 0;
    if (transportMode === 'work_from_home') {
        totalCredits = 10; // Fixed amount for WFH
    } else {
        totalCredits = Math.round(distance * creditsPerKm * 10) / 10;
    }
    
    // Update preview elements
    document.getElementById('preview-transport').textContent = modeName;
    document.getElementById('preview-distance').textContent = distance.toFixed(2) + ' km';
    document.getElementById('preview-duration').textContent = Math.round(duration) + ' min';
    document.getElementById('preview-credits').textContent = totalCredits.toFixed(1) + ' credits';
}

// Get the Google Maps travel mode based on selected transport mode
function getTravelMode() {
    const transportMode = document.getElementById('transport-mode').value;
    
    // Map our transport modes to Google Maps travel modes
    switch(transportMode) {
        case 'walking':
            return google.maps.TravelMode.WALKING;
        case 'bicycle':
            return google.maps.TravelMode.BICYCLING;
        case 'public_transport':
            return google.maps.TravelMode.TRANSIT;
        case 'carpool':
        case 'car':
        default:
            return google.maps.TravelMode.DRIVING;
    }
}

// Make sure initMap is available globally for Google Maps API callback
window.initMap = initMap;