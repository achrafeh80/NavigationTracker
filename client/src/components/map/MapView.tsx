import { useEffect, useRef, useState } from 'react';
import { useMap, MapPosition } from '@/hooks/use-map';
import { useIncidents } from '@/hooks/use-incidents';
import { useNavigation } from '@/hooks/use-navigation';
import IncidentReport from './IncidentReport';
import RouteControls from './RouteControls';
import NavigationMode from './NavigationMode';
import AlertNotification from '../ui/alert-notification';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, Navigation, Layers } from 'lucide-react';
import { getWebSocketUrl } from '@/lib/utils';

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  interface Alert {
    type: string;
    title: string;
    description: string;
    alertType: 'warning' | 'success' | 'info';
  }

  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [coords, setCoords] = useState<MapPosition>({
    lat: 48.866667, // Paris coordinates as default
    lng: 2.333333,
    zoom: 13
  });
  const wsRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, []);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_incident':
        handleNewIncident(data.incident);
        break;
      case 'incident_update':
        handleIncidentUpdate(data.incident);
        break;
      case 'incident_status_change':
        handleIncidentStatusChange(data.incident);
        break;
    }
  };
  
  // Handle new incident from WebSocket
  const handleNewIncident = (incident: any) => {
    refetchIncidents();
    
    // If new incident is near our route, show an alert
    if (navigationState.isNavigating && isIncidentNearRoute(incident)) {
      showAlertNotification({
        type: 'Alerte trafic',
        title: `Nouveau ${getIncidentTypeInfo(incident.type).name} signalé`,
        description: `Un nouvel incident a été signalé sur votre itinéraire.`,
        alertType: 'warning'
      });
    }
  };
  
  // Handle incident update from WebSocket
  const handleIncidentUpdate = (incident: any) => {
    refetchIncidents();
  };
  
  // Handle incident status change from WebSocket
  const handleIncidentStatusChange = (incident: any) => {
    refetchIncidents();
  };
  
  // Check if an incident is near the current route
  const isIncidentNearRoute = (incident: any) => {
    // In a real implementation, we would check if the incident is on the route
    return true;
  };
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            zoom: 15
          });
        },
        (error) => {
          console.error('Error getting current position:', error);
        }
      );
    }
  }, []);
  
  const {
    map,
    userLocation,
    getUserLocation,
    addIncidents: addIncidentsToMap,
    drawRoute
  } = useMap({
    containerId: 'map',
    initialPosition: coords
  });
  
  const {
    incidents,
    loadingIncidents,
    refetchIncidents,
    getIncidentTypeInfo
  } = useIncidents();
  
  const navigationState = useNavigation();
  
  // Set map as loaded when it's available
  useEffect(() => {
    if (map) {
      setIsMapLoaded(true);
      getUserLocation();
    }
  }, [map, getUserLocation]);
  
  // Add incidents to map when they're loaded
  useEffect(() => {
    if (map && incidents && !loadingIncidents) {
      addIncidentsToMap(incidents);
    }
  }, [map, incidents, loadingIncidents, addIncidentsToMap]);
  
  // Draw route when route data is available
  useEffect(() => {
    if (map && navigationState.routeData) {
      drawRoute(navigationState.routeData);
    }
  }, [map, navigationState.routeData, drawRoute]);
  
  // Show alert notification
  const showAlertNotification = (alert: any) => {
    setCurrentAlert(alert);
    
    // Automatically hide after 5 seconds
    setTimeout(() => {
      setCurrentAlert(null);
    }, 5000);
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Container */}
      <div 
        id="map" 
        ref={mapContainerRef} 
        className="w-full h-full bg-neutral-100"
      />
      
      {/* Loading Overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-neutral-700 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      <div className="absolute right-4 top-4 flex flex-col space-y-2 z-10">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-neutral-100" 
          onClick={() => map?.setZoom(map.getZoom() + 1)}
        >
          <ZoomIn className="h-5 w-5 text-neutral-700" />
          <span className="sr-only">Zoomer</span>
        </Button>
        
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-neutral-100" 
          onClick={() => map?.setZoom(map.getZoom() - 1)}
        >
          <ZoomOut className="h-5 w-5 text-neutral-700" />
          <span className="sr-only">Dézoomer</span>
        </Button>
        
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-neutral-100" 
          onClick={getUserLocation}
        >
          <Navigation className="h-5 w-5 text-primary" />
          <span className="sr-only">Ma position</span>
        </Button>
        
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-neutral-100"
        >
          <Layers className="h-5 w-5 text-neutral-700" />
          <span className="sr-only">Couches</span>
        </Button>
      </div>
      
      {/* Route Controls (Bottom Sheet) */}
      <RouteControls 
        navigation={navigationState} 
        userLocation={userLocation}
        onRouteCalculated={(routeData) => {
          navigationState.setRouteData(routeData);
        }}
      />
      
      {/* Incident Report Button */}
      {!navigationState.isNavigating && (
        <Button 
          variant="secondary" 
          className="absolute right-4 bottom-24 z-20 w-14 h-14 rounded-full shadow-lg"
          onClick={() => setShowIncidentModal(true)}
        >
          <span className="material-icons">report_problem</span>
          <span className="sr-only">Signaler un incident</span>
        </Button>
      )}
      
      {/* Incident Report Modal */}
      {showIncidentModal && userLocation && (
        <IncidentReport 
          position={userLocation} 
          onClose={() => setShowIncidentModal(false)}
          onIncidentReported={(incident) => {
            refetchIncidents();
            showAlertNotification({
              type: 'Confirmation',
              title: 'Incident signalé',
              description: 'Merci pour votre contribution ! Votre signalement a été enregistré.',
              alertType: 'success'
            });
          }}
        />
      )}
      
      {/* Navigation Mode View */}
      {navigationState.isNavigating && navigationState.routeData && (
        <NavigationMode 
          routeData={navigationState.routeData}
          onExit={navigationState.stopNavigation}
          onReportIncident={() => setShowIncidentModal(true)}
        />
      )}
      
      {/* Alert Notification */}
      {currentAlert && (
        <AlertNotification 
          alert={currentAlert}
          onDismiss={() => setCurrentAlert(null)}
          onAction={() => {
            // Handle action like recalculate route
            if (navigationState.routeData && navigationState.isNavigating) {
              const origin = navigationState.originLocation?.position;
              const destination = navigationState.destinationLocation?.position;
              
              if (origin && destination) {
                navigationState.calculateRoute(origin, destination, navigationState.routeOptions)
                  .then((routeData) => {
                    if (routeData) {
                      navigationState.setRouteData(routeData);
                      showAlertNotification({
                        type: 'Information',
                        title: 'Itinéraire recalculé',
                        description: 'Un nouvel itinéraire a été calculé pour éviter les embouteillages.',
                        alertType: 'info'
                      });
                    }
                  });
              }
            }
          }}
        />
      )}
    </div>
  );
}
