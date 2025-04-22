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
        <div class="p-2">
          <div class="font-bold">${formatIncidentType(incident.type)}</div>
          <div class="text-sm text-gray-600">${formatTimestamp(incident.createdAt)}</div>
          ${incident.comment ? `<div class="mt-1">${incident.comment}</div>` : ''}
          <div class="mt-2 flex items-center gap-2 text-sm">
            <span class="material-icons text-green-500 text-xs">thumb_up</span>
            <span>${incident.confirmed}</span>
            <span class="material-icons text-red-500 text-xs">thumb_down</span>
            <span>${incident.refuted}</span>
          </div>
        </div>
      `;
      
      const popup = createPopup(popupContent);
      
      marker.setPopup(popup);
      
      // Add click event to show popup
      marker.getElement().addEventListener('click', () => {
        marker.togglePopup();
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
