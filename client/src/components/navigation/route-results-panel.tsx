import { useNavigationContext } from "@/context/navigation-context";
import { useMapContext } from "@/context/map-context";
import { formatDuration, formatDistance } from "@/lib/tomtom";
import { Button } from "@/components/ui/button";
import { X, Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import ShareRouteModal from "@/components/sharing/share-route-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function RouteResultsPanel() {
  const { user } = useAuth();
  const { 
    routes, 
    selectedRouteIndex, 
    setSelectedRouteIndex,
    setRouteResultsVisible,
    startNavigation
  } = useNavigationContext();
  const { map } = useMapContext();
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleCloseRoutePanel = () => {
    setRouteResultsVisible(false);
  };

  const handleSelectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    
    // Afficher l'itinéraire sélectionné sur la carte
    const selectedRoute = routes[index];
    if (selectedRoute && map) {
      try {
        console.log("Route to draw:", selectedRoute);
        
        // Nettoyer les tracés précédents
        try {
          if (map.getLayer('route')) map.removeLayer('route');
          if (map.getSource('route')) map.removeSource('route');
        } catch (e) {
          console.error("Éléments de carte précédents non trouvés, continuons...",e);
        }
        
        // Créer les coordonnées pour le tracé
        const coordinates = selectedRoute.legs[0].points.map((point: any) => {
          // Vérifier si nous avons longitude/latitude ou lng/lat
          const lng = point.longitude || point.lng;
          const lat = point.latitude || point.lat;
          return [lng, lat];
        });
        
        if (coordinates.length < 2) {
          console.error("Pas assez de points pour tracer un itinéraire");
          return;
        }
        
        // Afficher le nouvel itinéraire
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
            'line-color': '#3F51B5',
            'line-width': 6,
            'line-opacity': 0.8
          }
        });
        
        // Centrer la carte sur l'itinéraire
        try {
          const bounds = new window.tt.LngLatBounds();
          
          coordinates.forEach((point: [number, number]) => {
            // Vérifier que les coordonnées sont valides avant de les ajouter
            if (point && point.length === 2 && !isNaN(point[0]) && !isNaN(point[1])) {
              bounds.extend(new window.tt.LngLat(point[0], point[1]));
            }
          });
          
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: 15
            });
          } else {
            console.error("Bounds vides, impossible de centrer la carte");
          }
        } catch (e) {
          console.error("Error fitting map to route bounds:", e);
          
          // Fallback: centrer sur le premier point avec un zoom prédéfini
          if (coordinates.length > 0) {
            map.flyTo({
              center: coordinates[0],
              zoom: 10
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'affichage de l'itinéraire sélectionné:", error);
      }
    }
  };

  const handleStartNavigation = async () => {
    // Save the route before starting navigation
    if (user && routes.length > 0 && selectedRouteIndex !== null) {
      setIsSaving(true);
      
      try {
        const selectedRoute = routes[selectedRouteIndex];
        
        // Simplifier l'objet routeData pour éviter les problèmes de taille
        const simplifiedRouteData = {
          summary: {
            lengthInMeters: selectedRoute.summary.lengthInMeters,
            travelTimeInSeconds: selectedRoute.summary.travelTimeInSeconds,
            departureTime: selectedRoute.summary.departureTime,
            arrivalTime: selectedRoute.summary.arrivalTime
          },
          // Conserver uniquement les points de départ et d'arrivée au lieu de tous les points de l'itinéraire
          legs: [{
            points: [
              selectedRoute.legs[0].points[0], // Point de départ
              selectedRoute.legs[0].points[selectedRoute.legs[0].points.length - 1] // Point d'arrivée
            ]
          }]
        };
        
        // Créer un objet avec l'origine et la destination au format texte
        const origin = `${selectedRoute.legs[0].points[0].latitude},${selectedRoute.legs[0].points[0].longitude}`;
        const destination = `${selectedRoute.legs[0].points[selectedRoute.legs[0].points.length - 1].latitude},${selectedRoute.legs[0].points[selectedRoute.legs[0].points.length - 1].longitude}`;
        
        // Générer un code de partage aléatoire (12 caractères hexadécimaux)
        const generateShareCode = () => {
          const chars = '0123456789abcdef';
          let result = '';
          for (let i = 0; i < 12; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
          return result;
        };
        
        const routeToSave = {
          userId: user.id,
          origin: origin,
          destination: destination,
          routeData: simplifiedRouteData,
          avoidTolls: false,
          avoidHighways: false,
          shareCode: generateShareCode()
        };
        
        await apiRequest('POST', '/api/routes', routeToSave);
        
        // Start navigation after saving
        startNavigation();
      } catch (error: any) {
        toast({
          title: "Error Saving Route",
          description: error.message || "Failed to save route",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Just start navigation without saving
      startNavigation();
    }
  };

  const handleShareRoute = () => {
    setIsShareModalOpen(true);
  };

  return (
    <>
      <div className="absolute left-4 top-52 bottom-28 w-80 bg-white rounded-lg shadow-md z-20 flex flex-col overflow-hidden">
        <div className="bg-primary text-white py-3 px-4 flex justify-between items-center">
          <h2 className="font-medium">Routes</h2>
          <button onClick={handleCloseRoutePanel}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto flex-grow p-4">
          {/* Route Options List */}
          {routes.map((route, index) => {
            const summary = route.summary;
            const isSelected = selectedRouteIndex === index;
            
            return (
              <div 
                key={index}
                className={`bg-white border ${isSelected ? 'border-primary' : 'border-neutral-200'} rounded-md p-3 mb-3 hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleSelectRoute(index)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-primary">directions_car</span>
                    <span className="font-medium">Route {index + 1}</span>
                  </div>
                  <span className="text-sm font-medium bg-neutral-100 text-neutral-800 py-1 px-2 rounded-full">
                    {formatDuration(summary.travelTimeInSeconds)}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 mb-2">
                  Via {summary.routeSummary || 'Best route'} - {formatDistance(summary.lengthInMeters)}
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span className="material-icons text-xs">euro</span>
                  <span>Tolls: {summary.hasTolls ? `Yes${summary.tollCost ? ` (€${summary.tollCost.toFixed(2)})` : ''}` : 'None'}</span>
                </div>
              </div>
            );
          })}

          {routes.length === 0 && (
            <div className="text-center text-neutral-500 py-6">
              No routes found. Try different route options.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-neutral-200">
          <div className="flex gap-2">
            <Button
              className="flex-1 py-2 flex items-center justify-center gap-1"
              onClick={handleStartNavigation}
              disabled={routes.length === 0 || selectedRouteIndex === null || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="material-icons">hourglass_empty</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Start</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-2 flex items-center justify-center gap-1 border-primary text-primary"
              onClick={handleShareRoute}
              disabled={routes.length === 0 || selectedRouteIndex === null}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </div>

      {isShareModalOpen && (
        <ShareRouteModal 
          route={routes[selectedRouteIndex!]} 
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
}