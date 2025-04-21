import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigationContext } from "@/context/navigation-context";

interface IncidentAlertProps {
  readonly incident: {
    readonly id: number;
    readonly type: string;
    readonly comment?: string;
    readonly distance: number;
    readonly location: string;
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly onDismiss: () => void;
}

export default function IncidentAlertToast({ incident, onDismiss }: IncidentAlertProps) {
  const [visible, setVisible] = useState(true);
  const { recalculateRoute } = useNavigationContext();
  
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Handle reroute around incident
  const handleRerouteAround = () => {
    recalculateRoute({
      avoidCoordinates: [[incident.longitude, incident.latitude]],
      avoidRadius: 500 // 500m radius around the incident
    });
    setVisible(false);
    onDismiss();
  };
  
  // Format incident type
  const getIncidentTitle = (type: string) => {
    switch (type) {
      case 'accident': return 'Accident Ahead';
      case 'traffic': return 'Traffic Jam Ahead';
      case 'closure': return 'Road Closure Ahead';
      case 'police': return 'Police Check Ahead';
      case 'hazard': return 'Road Hazard Ahead';
      default: return 'Incident Ahead';
    }
  };
  
  // Format distance
  const formatDistance = (meters: number) => {
    return meters >= 1000 
      ? `In ${(meters / 1000).toFixed(1)} km` 
      : `In ${Math.round(meters)} m`;
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 w-11/12 max-w-md z-30">
      <div className="bg-status-alert rounded-full w-10 h-10 flex items-center justify-center text-white flex-shrink-0">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-grow">
        <h4 className="font-medium">{getIncidentTitle(incident.type)}</h4>
        <p className="text-sm text-neutral-600">
          {formatDistance(incident.distance)} on {incident.location}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full text-xs"
          onClick={handleRerouteAround}
        >
          Reroute
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-neutral-500 text-xs"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
