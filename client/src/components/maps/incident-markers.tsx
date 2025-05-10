import { useEffect, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { createIncidentMarker, createPopup } from "@/lib/tomtom";
import { Incident } from "@shared/schema";
import { useIncidentsContext } from "@/context/incidents-context";

interface IncidentMarkersProps {
  incidents: Incident[];
}

export default function IncidentMarkers({ incidents }: IncidentMarkersProps) {
  const { map } = useMapContext();
  const { verifyIncident } = useIncidentsContext(); // ✅ CONTEXTE
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    if (!map || !incidents.length) return;

    markers.forEach(marker => marker.remove());

    const newMarkers = incidents.map(incident => {
      const hasResponded = localStorage.getItem(`incident_${incident.id}_responded`);

      const confirmIcon = hasResponded
        ? '✅'
        : `<span id="confirm-${incident.id}" style="cursor:pointer;">✅</span>`;

      const refuteIcon = hasResponded
        ? '❌'
        : `<span id="refute-${incident.id}" style="cursor:pointer;">❌</span>`;

      const popupContent = `
        <div class="p-3 w-[220px] text-sm font-sans">
          <div class="font-semibold text-base text-black dark:text-white mb-1">
            ${formatIncidentType(incident.type)}
          </div>
          <div class="text-gray-500 dark:text-gray-300 mb-2">
            ${formatTimestamp(incident.createdAt)}
          </div>
          ${incident.comment ? `<div class="text-gray-800 italic mb-2">"${incident.comment}"</div>` : ''}
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-1 text-green-600">
              <span id="confirm-${incident.id}" style="cursor:pointer;">✅</span>
              <span>${incident.confirmed}</span>
            </div>
            <div class="flex items-center gap-1 text-red-600">
              <span id="refute-${incident.id}" style="cursor:pointer;">❌</span>
              <span>${incident.refuted}</span>
            </div>
          </div>
        </div>
      `;

      const marker = createIncidentMarker(
        map,
        [parseFloat(incident.longitude), parseFloat(incident.latitude)],
        incident.type
      );

      const popup = createPopup(popupContent);
      marker.setPopup(popup);

      marker.getElement().addEventListener('click', () => {
        if (marker.isPopupOpen()) {
          marker.closePopup();
        } else {
          marker.openPopup();
        }
      });

      popup.on('open', () => {
        if (hasResponded) return;

        const confirmBtn = document.getElementById(`confirm-${incident.id}`);
        const refuteBtn = document.getElementById(`refute-${incident.id}`);

        confirmBtn?.addEventListener('click', () => {
          verifyIncident(incident.id, true);
          popup.setHTML(`<div class="p-2 text-center font-medium">✅ Merci pour ta contribution !</div>`);
          localStorage.setItem(`incident_${incident.id}_responded`, 'true');
        });

        refuteBtn?.addEventListener('click', () => {
          verifyIncident(incident.id, false);
          popup.setHTML(`<div class="p-2 text-center font-medium">✅ Merci pour ta contribution !</div>`);
          localStorage.setItem(`incident_${incident.id}_responded`, 'true');
        });
      });

      return marker;
    });

    setMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, incidents]);

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

  return null;
}
