import { useEffect, useRef, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { useIncidentsContext } from "@/context/incidents-context";
import { useNavigationContext } from "@/context/navigation-context";
import { TTMap, initMap } from "@/lib/tomtom";
import MapControls from "./map-controls";
import IncidentMarkers from "./incident-markers";

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { map, setMap } = useMapContext();
  const { activeRoute } = useNavigationContext();
  const { incidents } = useIncidentsContext();

  // Initialize the map on component mount
  useEffect(() => {
    let ttMap: TTMap | null = null;

    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Initialize TomTom map
        ttMap = await initMap('map');
        setMap(ttMap);
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (ttMap) {
        ttMap.remove();
      }
    };
  }, [setMap]);

  return (
    <div id="map-container" className="map-container relative flex-grow bg-neutral-200">
      <div 
        id="map" 
        ref={mapRef} 
        className="w-full h-full bg-neutral-200 relative"
      />
      
      {mapLoaded && map && (
        <>
          <MapControls />
          <IncidentMarkers incidents={incidents} />
        </>
      )}
    </div>
  );
}
