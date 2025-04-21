import { useMapContext } from "@/context/map-context";
import { showTrafficFlow, showTrafficIncidents, getCurrentLocation } from "@/lib/tomtom";
import { useToast } from "@/hooks/use-toast";

export default function MapControls() {
  const { map } = useMapContext();
  const { toast } = useToast();

  const handleZoomIn = () => {
    if (!map) return;
    // Use setZoom instead of zoomIn
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + 1);
  };

  const handleZoomOut = () => {
    if (!map) return;
    // Use setZoom instead of zoomOut
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom - 1);
  };

  const handleMyLocation = async () => {
    if (!map) return;
    
    try {
      const position = await getCurrentLocation();
      map.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 15
      });
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message || "Unable to get your location",
        variant: "destructive"
      });
    }
  };

  const handleRotateMap = () => {
    if (!map) return;
    const currentBearing = map.getBearing();
    map.easeTo({ bearing: currentBearing + 90 });
  };

  const handleLayerToggle = () => {
    if (!map) return;
    
    // Check if traffic layers are visible
    const trafficVisible = map.getLayoutProperty('traffic-flow', 'visibility') === 'visible';
    
    if (trafficVisible) {
      // Hide traffic layers
      map.setLayoutProperty('traffic-flow', 'visibility', 'none');
      map.setLayoutProperty('traffic-incidents', 'visibility', 'none');
      
      toast({
        title: "Traffic Layers Hidden",
        description: "Traffic flow and incidents are now hidden",
      });
    } else {
      // Show traffic layers
      showTrafficFlow(map);
      showTrafficIncidents(map);
      
      toast({
        title: "Traffic Layers Shown",
        description: "Traffic flow and incidents are now visible",
      });
    }
  };

  return (
    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-10">
      <button
        className="map-control-btn"
        onClick={handleZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <span className="material-icons">add</span>
      </button>
      <button
        className="map-control-btn"
        onClick={handleZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <span className="material-icons">remove</span>
      </button>
      <button
        className="map-control-btn"
        onClick={handleMyLocation}
        aria-label="My location"
        title="My location"
      >
        <span className="material-icons">my_location</span>
      </button>
      <button
        className="map-control-btn"
        onClick={handleRotateMap}
        aria-label="Rotate map"
        title="Rotate map"
      >
        <span className="material-icons">cached</span>
      </button>
      <button
        className="map-control-btn"
        onClick={handleLayerToggle}
        aria-label="Toggle traffic layers"
        title="Toggle traffic layers"
      >
        <span className="material-icons">layers</span>
      </button>
    </div>
  );
}
