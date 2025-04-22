import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMapContext } from './map-context';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Incident } from '@shared/schema';
import { getCurrentLocation } from '@/lib/tomtom';
import { useToast } from '@/hooks/use-toast';

interface IncidentAlert {
  id: number;
  type: string;
  comment?: string;
  distance: number;
  location: string;
  latitude: string;
  longitude: string;
}

interface IncidentsContextType {
  incidents: Incident[];
  isLoading: boolean;
  incidentAlerts: IncidentAlert[];
  dismissAlert: (id: number) => void;
  verifyIncident: (incidentId: number, isConfirmed: boolean) => void;
}

const IncidentsContext = createContext<IncidentsContextType | undefined>(undefined);

export function IncidentsProvider({ children }: { readonly children: ReactNode }) {
  const [incidentAlerts, setIncidentAlerts] = useState<IncidentAlert[]>([]);
  const { map } = useMapContext();
  const { user } = useAuth();
  const { toast } = useToast();

  // Set up WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Identify the user to the server
      if (user) {
        socket.send(JSON.stringify({ type: 'identify', userId: user.id }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle new incident notification
        if (data.type === 'incident') {
          const newIncident = data.data;
          
          // Check if it's not an incident reported by the current user
          if (newIncident.reportedBy !== user.id) {
            // Check if the incident is nearby
            checkIfIncidentIsNearby(newIncident);
          }
          
          // Update incidents list
          queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, [user]);

  // Fetch all active incidents
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Verify an incident (confirm or deny)
  const verifyMutation = useMutation({
    mutationFn: async ({ incidentId, isConfirmed }: { incidentId: number, isConfirmed: boolean }) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/verify`, { isConfirmed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Thank You",
        description: "Your verification helps the community!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Check if an incident is near the user's current location
  const checkIfIncidentIsNearby = async (incident: Incident) => {
    try {
      // Get user's current location
      const position = await getCurrentLocation();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      // Calculate distance (simple approximation)
      const distance = calculateDistance(
        userLat, userLng,
        parseFloat(incident.latitude), parseFloat(incident.longitude)
      );
      
      // If incident is within 5km, create an alert
      if (distance <= 5000) {
        const alert: IncidentAlert = {
          id: incident.id,
          type: incident.type,
          comment: incident.comment || undefined,
          distance,
          location: 'nearby road', // In a real app, this would be a reverse geocoded address
          latitude: incident.latitude,
          longitude: incident.longitude
        };
        
        setIncidentAlerts(prev => [...prev, alert]);
      }
    } catch (error) {
      console.error('Error checking if incident is nearby:', error);
    }
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Dismiss an alert
  const dismissAlert = (id: number) => {
    setIncidentAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Verify an incident
  const verifyIncident = (incidentId: number, isConfirmed: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to verify incidents",
        variant: "destructive"
      });
      return;
    }
    
    verifyMutation.mutate({ incidentId, isConfirmed });
  };

  return (
    <IncidentsContext.Provider value={{
      incidents,
      isLoading,
      incidentAlerts,
      dismissAlert,
      verifyIncident
    }}>
      {children}
    </IncidentsContext.Provider>
  );
}

export function useIncidentsContext() {
  const context = useContext(IncidentsContext);
  if (context === undefined) {
    throw new Error('useIncidentsContext must be used within an IncidentsProvider');
  }
  return context;
}
