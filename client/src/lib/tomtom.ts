// TomTom API integration
// This file contains functions to work with TomTom Maps and Services

// Create a type for the window object with TomTom
declare global {
  interface Window {
    tt: any;
  }
}

const API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || 'G3WCiiFF89kmTHGsU4wFI4hTpNXScR7G';

// Map instance type definition
export type TTMap = any;
export type TTMarker = any;
export type TTPopup = any;
export type TTRoute = any;

// Initialize a new map
export function initMap(container: string): Promise<TTMap> {
  return new Promise((resolve, reject) => {
    try {
      if (!window.tt) {
        return reject(new Error('TomTom Maps SDK not loaded'));
      }

      const map = window.tt.map({
        key: API_KEY,
        container,
        center: [2.3522, 48.8566], // Default center (Paris)
        zoom: 13,
        stylesVisibility: {
          trafficIncidents: true,
          trafficFlow: true
        }
      });

      map.on('load', () => {
        resolve(map);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

// Create a marker on the map
export function createMarker(map: TTMap, position: [number, number], options?: any): TTMarker {
  return new window.tt.Marker({
    draggable: options?.draggable || false,
    ...options
  })
    .setLngLat(position)
    .addTo(map);
}

// Create a custom marker with icon for incidents
export function createIncidentMarker(
  map: TTMap, 
  position: [number, number], 
  incidentType: string
): TTMarker {
  // Define icon based on incident type
  let iconClass = '';
  let bgColor = '';
  
  switch(incidentType) {
    case 'accident':
      iconClass = 'car_crash';
      bgColor = 'rgb(244, 67, 54)'; // status-alert
      break;
    case 'traffic':
      iconClass = 'traffic';
      bgColor = 'rgb(255, 152, 0)'; // status-warning
      break;
    case 'police':
      iconClass = 'local_police';
      bgColor = 'rgb(33, 150, 243)'; // status-info
      break;
    case 'closure':
      iconClass = 'block';
      bgColor = 'rgb(33, 150, 243)'; // status-info
      break;
    case 'hazard':
      iconClass = 'warning';
      bgColor = 'rgb(244, 67, 54)'; // status-alert
      break;
    default:
      iconClass = 'more_horiz';
      bgColor = 'rgb(33, 150, 243)'; // status-info
  }
  
  // Create a DOM element for the marker
  const el = document.createElement('div');
  el.className = 'incident-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = bgColor;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.cursor = 'pointer';
  el.style.transition = 'transform 0.2s';
  
  // Add icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.style.fontSize = '10px';
  icon.textContent = iconClass;
  el.appendChild(icon);
  
  
  return new window.tt.Marker({ element: el })
    .setLngLat(position)
    .addTo(map);
}

// Create a popup
export function createPopup(content: string): TTPopup {
  return new window.tt.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 25,
  }).setHTML(content);
}

// Calculate route between two points
export interface RouteOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  routeType?: 'fastest' | 'shortest' | 'eco';
}

export async function calculateRoute(
  origin: [number, number], 
  destination: [number, number],
  options: RouteOptions = {}
): Promise<any> {
  try {
    const routingOptions: any = {
      key: API_KEY,
      locations: `${origin[0]},${origin[1]}:${destination[0]},${destination[1]}`,
      instructionsType: 'text',
      routeType: options.routeType || 'fastest',
      traffic: true,
      computeTravelTimeFor: 'all', // Consider traffic for all routes
      alternatives: true, // Return multiple routes
      maxAlternatives: 3 // Up to 3 alternative routes
    };
    
    // Add avoid options if specified

    
    const response = await window.tt.services.calculateRoute(routingOptions);
    return response;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

// Draw route on the map
export function drawRoute(map: TTMap, route: any, color: string = '#3F51B5'): void {
  // Remove previous route if exists
  if (map.getLayer('route')) {
    map.removeLayer('route');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }
  
  // Check if we have the route data in the correct format
  let geometry;
  if (route.legs?.[0]?.points) {
    // TomTom routing API format
    geometry = {
      type: 'LineString',
      coordinates: route.legs[0].points.map((point: any) => [point.longitude, point.latitude])
    };
  } else if (route.geometry) {
    // Already formatted geometry
    geometry = route.geometry;
  } else {
    console.error('Invalid route format:', route);
    return;
  }
  
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: geometry
  };
  
  // Add the route source and layer
  map.addSource('route', {
    type: 'geojson',
    data: geojson
  });
  
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': color,
      'line-width': 6,
      'line-opacity': 0.8
    }
  });
}

// Search for a location
export async function searchLocation(query: string): Promise<any> {
  try {
    const response = await window.tt.services.fuzzySearch({
      key: API_KEY,
      query,
      limit: 5
    });
    return response.results;
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
}

// Get user's current location
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
}

// Show traffic incidents on the map
export function showTrafficIncidents(map: TTMap): void {
  map.showTrafficIncidents();
}

// Show traffic flow on the map
export function showTrafficFlow(map: TTMap): void {
  map.showTrafficFlow();
}

// Convert search results to address string
export function formatAddress(result: any): string {
  if (!result) return '';
  
  const address = result.address;
  const parts = [];
  
  if (address.streetName) parts.push(address.streetName);
  if (address.streetNumber) parts.push(address.streetNumber);
  if (address.municipality) parts.push(address.municipality);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
}

// Format duration in seconds to human-readable string
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

// Format distance in meters to human-readable string
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Get ETA based on departure time and duration
export function getETA(durationInSeconds: number): string {
  const now = new Date();
  const eta = new Date(now.getTime() + durationInSeconds * 1000);
  
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
