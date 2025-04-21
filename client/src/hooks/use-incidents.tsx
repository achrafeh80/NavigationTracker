import { useCallback } from 'react';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Incident, InsertIncident } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';

export type IncidentType = 'accident' | 'traffic' | 'police' | 'closed_road' | 'construction' | 'obstacle';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type IncidentTypeInfo = {
  type: IncidentType;
  name: string;
  icon: string;
  color: string;
};

export const incidentTypes: IncidentTypeInfo[] = [
  { type: 'accident', name: 'Accident', icon: 'car_crash', color: '#F44336' },
  { type: 'traffic', name: 'Embouteillage', icon: 'traffic', color: '#FFC107' },
  { type: 'police', name: 'Contrôle policier', icon: 'local_police', color: '#2196F3' },
  { type: 'closed_road', name: 'Route fermée', icon: 'do_not_enter', color: '#F44336' },
  { type: 'construction', name: 'Travaux', icon: 'construction', color: '#FF9800' },
  { type: 'obstacle', name: 'Obstacle', icon: 'priority_high', color: '#FFC107' }
];

export function useIncidents() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Get all active incidents
  const { 
    data: incidents, 
    isLoading: loadingIncidents,
    refetch: refetchIncidents 
  } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
  });

  // Get incidents near a location
  const getNearbyIncidents = useCallback(async (position: Coordinates, radius = 5) => {
    try {
      const response = await fetch(
        `/api/incidents/nearby?lat=${position.lat}&lon=${position.lng}&radius=${radius}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nearby incidents: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby incidents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les incidents à proximité.',
        variant: 'destructive'
      });
      return [];
    }
  }, [toast]);

  // Report a new incident
  const reportIncidentMutation = useMutation({
    mutationFn: async (incidentData: { 
      type: IncidentType; 
      latitude: string; 
      longitude: string; 
      comment?: string 
    }) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      
      const incident: InsertIncident = {
        ...incidentData,
        reportedBy: user.id
      };
      
      const res = await apiRequest('POST', '/api/incidents', incident);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: 'Incident signalé',
        description: 'Merci pour votre contribution ! Votre signalement a été enregistré.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de signaler l'incident: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // React to an incident (confirm or deny)
  const reactToIncidentMutation = useMutation({
    mutationFn: async ({ 
      incidentId, 
      isConfirmation 
    }: { 
      incidentId: number; 
      isConfirmation: boolean 
    }) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/react`, { isConfirmation });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: 'Merci',
        description: 'Votre avis a été pris en compte.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de traiter votre avis: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Deactivate an incident
  const deactivateIncidentMutation = useMutation({
    mutationFn: async (incidentId: number) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      
      const res = await apiRequest('PUT', `/api/incidents/${incidentId}/status`, { active: false });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: 'Incident résolu',
        description: 'L\'incident a été marqué comme résolu.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de résoudre l'incident: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Get incident type info
  const getIncidentTypeInfo = useCallback((type: IncidentType): IncidentTypeInfo => {
    return incidentTypes.find(t => t.type === type) || 
      { type: 'accident', name: 'Incident', icon: 'report_problem', color: '#F44336' };
  }, []);

  return {
    incidents,
    loadingIncidents,
    refetchIncidents,
    getNearbyIncidents,
    reportIncident: reportIncidentMutation.mutate,
    isReporting: reportIncidentMutation.isPending,
    reactToIncident: reactToIncidentMutation.mutate,
    isReacting: reactToIncidentMutation.isPending,
    deactivateIncident: deactivateIncidentMutation.mutate,
    isDeactivating: deactivateIncidentMutation.isPending,
    incidentTypes,
    getIncidentTypeInfo
  };
}
