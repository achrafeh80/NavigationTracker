import { useEffect, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { createIncidentMarker, createPopup } from "@/lib/tomtom";
import { Incident } from "@shared/schema";

interface IncidentMarkersProps {
  incidents: Incident[];
}

export default function IncidentMarkers({ incidents }: IncidentMarkersProps) {
  const { map } = useMapContext();
  const [markers, setMarkers] = useState<any[]>([]);

  // Create or update markers when incidents change
  useEffect(() => {
    if (!map || !incidents.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    
    // Create new markers for each incident
    const newMarkers = incidents.map(incident => {
      const marker = createIncidentMarker(
        map,
        [parseFloat(incident.longitude), parseFloat(incident.latitude)],
        incident.type
      );
      
      // Create and attach popup
      const popupContent = `
      <div class="p-3 w-[220px] text-sm font-sans">
        <div class="font-semibold text-base text-black dark:text-white mb-1">
          ${formatIncidentType(incident.type)}
        </div>
        <div class="text-gray-500 dark:text-gray-300 mb-2">
          ${formatTimestamp(incident.createdAt)}
        </div>
        ${incident.comment ? `
          <div class="text-gray-800 dark:text-gray-100 italic mb-2 border-l-2 pl-2 border-primary">
            "${incident.comment}"
          </div>
        ` : ''}
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center gap-1 text-green-600">
            <span class="material-icons text-sm">thumb_up</span>
            <span>${incident.confirmed}</span>
          </div>
          <div class="flex items-center gap-1 text-red-600">
            <span class="material-icons text-sm">thumb_down</span>
            <span>${incident.refuted}</span>
          </div>
        </div>
      </div>
    `;
    
      
      const popup = createPopup(popupContent);
      
      marker.setPopup(popup);
      
      // Add click event to show popup
      marker.getElement().addEventListener('click', () => {
        if (marker.isPopupOpen()) {
          marker.closePopup();
        } else {
          marker.openPopup();
        }
      });
      
      
      return marker;
    });
    
    setMarkers(newMarkers);
    
    // Cleanup function
    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, incidents]);

  // Helper function to format incident type
  function formatIncidentType(type: string): string {
    const typeMap: Record<string, string> = {
      'accident': 'Accident',
      'traffic': 'Traffic Jam',
      'closure': 'Road Closure',
      'police': 'Police Control',
      'hazard': 'Road Hazard',
      'other': 'Other Issue'
    };
    
    return typeMap[type] || 'Incident';
  }

  // Helper function to format timestamp
  function formatTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  }

  return null; // Markers are added directly to the map
}
