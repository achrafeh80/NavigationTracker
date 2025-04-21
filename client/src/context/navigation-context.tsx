import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useMapContext } from './map-context';
import { calculateRoute, drawRoute, RouteOptions } from '@/lib/tomtom';
import { useToast } from '@/hooks/use-toast';

interface NavigationContextType {
  // Route visibility states
  isRouteOptionsVisible: boolean;
  setRouteOptionsVisible: (visible: boolean) => void;
  isRouteResultsVisible: boolean;
  setRouteResultsVisible: (visible: boolean) => void;
  isNavigationActive: boolean;
  
  // Route data
  routes: any[];
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (index: number) => void;
  activeRoute: any | null;
  
  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  
  // Navigation actions
  calculateRoutes: (
    origin: [number, number], 
    destination: [number, number], 
    options?: RouteOptions
  ) => Promise<void>;
  startNavigation: () => void;
  stopNavigation: () => void;
  recalculateRoute: (options: any) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  // Route visibility states
  const [isRouteOptionsVisible, setRouteOptionsVisible] = useState(false);
  const [isRouteResultsVisible, setRouteResultsVisible] = useState(false);
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  
  // Route data
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [activeRoute, setActiveRoute] = useState<any | null>(null);
  
  // Loading state
  const [isLoading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  
  const { map } = useMapContext();
  const { toast } = useToast();
  
  // Calculate routes between two points
  const calculateRoutes = useCallback(async (
    origin: [number, number],
    destination: [number, number],
    options?: RouteOptions
  ) => {
    if (!map) {
      toast({
        title: "Map Not Ready",
        description: "Please wait for the map to initialize",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      setLoadingMessage("Calculating routes...");
      
      // Calculate route using TomTom API
      const routeResponse = await calculateRoute(origin, destination, options);
      const calculatedRoutes = routeResponse.routes || [];
      
      if (calculatedRoutes.length === 0) {
        throw new Error("No routes found between these locations");
      }
      
      // Store routes and select the first one
      setRoutes(calculatedRoutes);
      setSelectedRouteIndex(0);
      
      // Draw the first route on the map
      if (map && calculatedRoutes.length > 0) {
        // Check if the route contains legs
        const routeToDraw = calculatedRoutes[0];
        console.log("Route to draw:", routeToDraw);
        
        // Draw the route
        drawRoute(map, routeToDraw);
        
        // Try to fit the map to the route bounds if viewport is available
        try {
          if (routeResponse.routes[0].viewport) {
            const bounds = routeResponse.routes[0].viewport;
            map.fitBounds([
              [bounds.topLeftPoint.lng, bounds.topLeftPoint.lat],
              [bounds.btmRightPoint.lng, bounds.btmRightPoint.lat]
            ], { padding: 100 });
          } else if (routeToDraw.legs && routeToDraw.legs[0].points) {
            // Alternative: create bounds from the route points
            const points = routeToDraw.legs[0].points;
            const minLat = Math.min(...points.map((p: any) => p.latitude));
            const maxLat = Math.max(...points.map((p: any) => p.latitude));
            const minLng = Math.min(...points.map((p: any) => p.longitude));
            const maxLng = Math.max(...points.map((p: any) => p.longitude));
            
            map.fitBounds([
              [minLng, minLat],
              [maxLng, maxLat]
            ], { padding: 100 });
          }
        } catch (error) {
          console.error("Error fitting map to route bounds:", error);
          // Fallback: just center on the route origin and destination
          if (routeToDraw.legs && routeToDraw.legs[0]) {
            const leg = routeToDraw.legs[0];
            map.setZoom(10);
            map.setCenter([origin[0], origin[1]]);
          }
        }
      }
      
      return calculatedRoutes;
    } catch (error: any) {
      toast({
        title: "Route Calculation Failed",
        description: error.message || "Failed to calculate routes",
        variant: "destructive"
      });
      setRoutes([]);
      setSelectedRouteIndex(null);
    } finally {
      setLoading(false);
    }
  }, [map, toast]);
  
  // Start navigation with the selected route
  const startNavigation = useCallback(() => {
    if (selectedRouteIndex === null || routes.length === 0) {
      toast({
        title: "Aucun itinéraire sélectionné",
        description: "Veuillez sélectionner un itinéraire",
        variant: "destructive"
      });
      return;
    }
    
    // L'itinéraire est déjà tracé sur la carte par la fonction handleSelectRoute
    const routeToNavigate = routes[selectedRouteIndex];
    setActiveRoute(routeToNavigate);
    setIsNavigationActive(true);
    setRouteResultsVisible(false);
    
    // Dessiner l'itinéraire et les marqueurs pour le mode navigation
    if (map) {
      try {
        if (routeToNavigate && routeToNavigate.legs && routeToNavigate.legs[0] && routeToNavigate.legs[0].points) {
          console.log("Starting navigation with route:", routeToNavigate);
          
          // Nettoyer d'abord tout ce qui existe déjà
          try {
            ['route', 'start-marker', 'end-marker'].forEach(id => {
              if (map.getLayer(id)) map.removeLayer(id);
              if (map.getSource(id)) map.removeSource(id);
            });
          } catch (e) {
            console.log("Nettoyage des éléments existants ignoré:", e);
          }
          
          // Récupérer tous les points de l'itinéraire
          const points = routeToNavigate.legs[0].points;
          
          // Vérifier et traiter les points pour extraire lng/lat ou longitude/latitude
          const coordinates = points.map((point: any) => {
            const lng = point.longitude || point.lng;
            const lat = point.latitude || point.lat;
            return [lng, lat];
          }).filter((coord: [number, number]) => {
            // Filtrer les coordonnées invalides
            return Array.isArray(coord) && coord.length === 2 && 
                   !isNaN(coord[0]) && !isNaN(coord[1]);
          });
          
          if (coordinates.length < 2) {
            console.error("Pas assez de points valides pour tracer l'itinéraire");
            return;
          }
          
          // Ajouter l'itinéraire avec try/catch
          try {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                }
              }
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
                'line-color': '#FF4500',
                'line-width': 6,
                'line-opacity': 0.8
              }
            });
          } catch (e) {
            console.error("Erreur lors de l'ajout de l'itinéraire:", e);
          }
          
          // Ajouter les marqueurs
          const startPoint = points[0];
          const endPoint = points[points.length - 1];
          
          // Marqueur de départ
          try {
            map.addSource('start-marker', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [startPoint.longitude || startPoint.lng, startPoint.latitude || startPoint.lat]
                }
              }
            });
            
            map.addLayer({
              id: 'start-marker',
              type: 'circle',
              source: 'start-marker',
              paint: {
                'circle-radius': 10,
                'circle-color': '#4CAF50'
              }
            });
          } catch (e) {
            console.error("Erreur lors de l'ajout du marqueur de départ:", e);
          }
          
          // Marqueur d'arrivée
          try {
            map.addSource('end-marker', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [endPoint.longitude || endPoint.lng, endPoint.latitude || endPoint.lat]
                }
              }
            });
            
            map.addLayer({
              id: 'end-marker',
              type: 'circle',
              source: 'end-marker',
              paint: {
                'circle-radius': 10,
                'circle-color': '#F44336'
              }
            });
          } catch (e) {
            console.error("Erreur lors de l'ajout du marqueur d'arrivée:", e);
          }
          
          // Centrer la carte sur les points de l'itinéraire
          try {
            if (coordinates.length > 0) {
              // Créer un nouvel objet bounds
              const bounds = new window.tt.LngLatBounds();
              
              // Ajouter chaque coordonnée au bounds
              coordinates.forEach((coord: [number, number]) => {
                if (coord && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
                  bounds.extend(new window.tt.LngLat(coord[0], coord[1]));
                }
              });
              
              // Vérifier que bounds n'est pas vide avant d'ajuster la carte
              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                  padding: 100,
                  maxZoom: 15
                });
              } else {
                console.error("Bounds vides, impossible de centrer la carte");
                // Fallback: centrer sur le premier point valide
                map.flyTo({
                  center: coordinates[0],
                  zoom: 12
                });
              }
            }
          } catch (error) {
            console.error("Erreur lors de l'ajustement de la carte:", error);
            // Fallback: essayer de centrer sur le point de départ
            try {
              const center = [
                startPoint.longitude || startPoint.lng,
                startPoint.latitude || startPoint.lat
              ];
              map.flyTo({
                center: center,
                zoom: 12
              });
            } catch (e) {
              console.error("Impossible de centrer la carte:", e);
            }
          }
        }
      } catch (error) {
        console.error("Erreur globale lors du démarrage de la navigation:", error);
        toast({
          title: "Erreur de Navigation",
          description: "Impossible de démarrer la navigation. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    }
    
    // Notification de démarrage
    if (routeToNavigate && routeToNavigate.summary && routeToNavigate.summary.arrivalTime) {
      toast({
        title: "Navigation Démarrée",
        description: `Heure d'arrivée estimée: ${new Date(routeToNavigate.summary.arrivalTime).toLocaleTimeString()}`,
      });
    } else {
      toast({
        title: "Navigation Démarrée",
        description: "Itinéraire en cours"
      });
    }
  }, [routes, selectedRouteIndex, toast, map]);
  
  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigationActive(false);
    setActiveRoute(null);
    
    // Nettoyer la carte en supprimant l'itinéraire et les marqueurs
    if (map) {
      try {
        // Supprimer les couches avant les sources pour éviter les erreurs
        const layersToRemove = ['route', 'start-marker', 'end-marker'];
        
        // Supprimer les couches
        layersToRemove.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          } catch (e) {
            console.log(`Erreur lors de la suppression de la couche '${layerId}':`, e);
          }
        });
        
        // Supprimer les sources après avoir supprimé les couches
        layersToRemove.forEach(sourceId => {
          try {
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          } catch (e) {
            console.log(`Erreur lors de la suppression de la source '${sourceId}':`, e);
          }
        });
        
        console.log("Nettoyage de la carte effectué avec succès");
      } catch (error) {
        console.error("Erreur lors du nettoyage de la carte:", error);
      }
    }
    
    toast({
      title: "Navigation Arrêtée",
      description: "Vous avez arrêté la navigation",
    });
  }, [toast, map]);
  
  // Recalculate route (e.g., to avoid incidents)
  const recalculateRoute = useCallback((options: any) => {
    if (!activeRoute || !map) {
      toast({
        title: "No Active Route",
        description: "No active navigation to recalculate",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setLoadingMessage("Recalculating route...");
    
    // In a real implementation, this would call the TomTom API to get a new route
    // For now, we'll simulate a recalculation
    setTimeout(() => {
      setLoading(false);
      
      toast({
        title: "Route Recalculated",
        description: "Your route has been updated to avoid the incident",
      });
    }, 2000);
  }, [activeRoute, map, toast]);

  return (
    <NavigationContext.Provider value={{
      isRouteOptionsVisible,
      setRouteOptionsVisible,
      isRouteResultsVisible,
      setRouteResultsVisible,
      isNavigationActive,
      routes,
      selectedRouteIndex,
      setSelectedRouteIndex,
      activeRoute,
      isLoading,
      setLoading,
      loadingMessage,
      setLoadingMessage,
      calculateRoutes,
      startNavigation,
      stopNavigation,
      recalculateRoute
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
