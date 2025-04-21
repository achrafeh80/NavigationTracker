import { useEffect, useState, useRef, useCallback } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import { Incident } from '@shared/schema';

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '';

export type MapPosition = {
  lat: number;
  lng: number;
  zoom?: number;
};

export type MarkerOptions = {
  id: string;
  position: MapPosition;
  color?: string;
  icon?: string;
  popupContent?: string;
};

type UseMapProps = {
  containerId: string;
  initialPosition: MapPosition;
};

export function useMap({ containerId, initialPosition }: UseMapProps) {
  const [map, setMap] = useState<tt.Map | null>(null);
  const [userLocation, setUserLocation] = useState<MapPosition | null>(null);
  const markersRef = useRef<Record<string, tt.Marker>>({});
  const popupsRef = useRef<Record<string, tt.Popup>>({});
  const userMarkerRef = useRef<tt.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!TOMTOM_API_KEY) {
      console.error('TomTom API key is missing');
      return;
    }

    const mapInstance = tt.map({
      key: TOMTOM_API_KEY,
      container: containerId,
      center: [initialPosition.lng, initialPosition.lat],
      zoom: initialPosition.zoom || 13,
      style: 'tomtom://vector/1/basic-main',
    });

    mapInstance.addControl(new tt.NavigationControl());
    mapInstance.addControl(new tt.FullscreenControl());
    mapInstance.addControl(new tt.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }));

    setMap(mapInstance);

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [containerId, initialPosition]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);

        // Move map to user location
        if (map) {
          map.flyTo({
            center: [userPos.lng, userPos.lat],
            zoom: 15
          });

          // Add or update user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
          } else {
            const el = document.createElement('div');
            el.className = 'user-marker';
            el.innerHTML = `
              <div class="w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white animate-pulse">
                <span class="sr-only">Your location</span>
              </div>
            `;
            
            userMarkerRef.current = new tt.Marker({ element: el })
              .setLngLat([userPos.lng, userPos.lat])
              .addTo(map);
          }
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }, [map]);

  // Add marker to the map
  const addMarker = useCallback((options: MarkerOptions) => {
    if (!map) return;

    // Remove existing marker with the same ID
    if (markersRef.current[options.id]) {
      markersRef.current[options.id].remove();
      delete markersRef.current[options.id];
    }

    // Create custom element for marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    if (options.icon) {
      const color = options.color || '#F44336';
      el.innerHTML = `
        <div class="w-8 h-8 bg-[${color}] text-white rounded-full flex items-center justify-center shadow-lg">
          <span class="material-icons text-sm">${options.icon}</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center">
          <span class="material-icons text-white text-sm">location_on</span>
        </div>
      `;
    }

    // Create marker
    const marker = new tt.Marker({ element: el })
      .setLngLat([options.position.lng, options.position.lat])
      .addTo(map);

    // Add popup if content is provided
    if (options.popupContent) {
      const popup = new tt.Popup({ offset: 30 })
        .setHTML(options.popupContent);
      
      marker.setPopup(popup);
      popupsRef.current[options.id] = popup;
    }

    markersRef.current[options.id] = marker;
  }, [map]);

  // Remove marker from the map
  const removeMarker = useCallback((id: string) => {
    if (markersRef.current[id]) {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    }
    if (popupsRef.current[id]) {
      delete popupsRef.current[id];
    }
  }, []);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    Object.keys(markersRef.current).forEach(id => {
      markersRef.current[id].remove();
    });
    markersRef.current = {};
    popupsRef.current = {};
  }, []);

  // Add incidents to the map
  const addIncidents = useCallback((incidents: Incident[]) => {
    incidents.forEach(incident => {
      let icon = 'report_problem';
      let color = '#F44336'; // Default red color
      
      switch (incident.type) {
        case 'accident':
          icon = 'car_crash';
          color = '#F44336'; // Red
          break;
        case 'traffic':
          icon = 'traffic';
          color = '#FFC107'; // Yellow
          break;
        case 'police':
          icon = 'local_police';
          color = '#2196F3'; // Blue
          break;
        case 'closed_road':
          icon = 'do_not_enter';
          color = '#F44336'; // Red
          break;
        case 'construction':
          icon = 'construction';
          color = '#FF9800'; // Orange
          break;
        case 'obstacle':
          icon = 'priority_high';
          color = '#FFC107'; // Yellow
          break;
      }
      
      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold">${getIncidentTypeName(incident.type)}</h3>
          ${incident.comment ? `<p class="text-sm mt-1">${incident.comment}</p>` : ''}
          <div class="flex items-center mt-2 text-xs text-neutral-500">
            <span>Confirmé: ${incident.confirmed} fois</span>
            <span class="mx-1">•</span>
            <span>Réfuté: ${incident.refuted} fois</span>
          </div>
        </div>
      `;
      
      addMarker({
        id: `incident-${incident.id}`,
        position: {
          lat: parseFloat(incident.latitude),
          lng: parseFloat(incident.longitude)
        },
        icon,
        color,
        popupContent
      });
    });
  }, [addMarker]);
  
  // Get incident type name
  function getIncidentTypeName(type: string): string {
    switch (type) {
      case 'accident': return 'Accident';
      case 'traffic': return 'Embouteillage';
      case 'police': return 'Contrôle policier';
      case 'closed_road': return 'Route fermée';
      case 'construction': return 'Travaux';
      case 'obstacle': return 'Obstacle';
      default: return 'Incident';
    }
  }

  // Draw route on the map
  const drawRoute = useCallback((routeData: any, options: { color?: string; width?: number } = {}) => {
    if (!map || !routeData) return;

    // Check if routeData is in the TomTom format
    if (!routeData.routes || routeData.routes.length === 0) {
      console.error('Invalid route data');
      return;
    }

    // Clear any existing route layers
    if (map.getLayer('route-layer')) {
      map.removeLayer('route-layer');
    }
    if (map.getSource('route-source')) {
      map.removeSource('route-source');
    }

    // Get the coordinates of the first route
    const route = routeData.routes[0];
    const coordinates = route.legs.flatMap((leg: any) => 
      leg.points.map((point: any) => [point.longitude, point.latitude])
    );

    // Create a GeoJSON source with the route coordinates
    map.addSource('route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add a layer to display the route
    map.addLayer({
      id: 'route-layer',
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': options.color || '#1976D2',
        'line-width': options.width || 6,
        'line-opacity': 0.8
      }
    });

    // Fit the map to the route bounds
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new tt.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
    );

    map.fitBounds(bounds, {
      padding: 100,
      maxZoom: 16
    });
  }, [map]);

  return {
    map,
    userLocation,
    getUserLocation,
    addMarker,
    removeMarker,
    clearMarkers,
    addIncidents,
    drawRoute
  };
}
