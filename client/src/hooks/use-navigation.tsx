import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Location = {
  name: string;
  address: string;
  position: Coordinates;
};

export type RouteOptions = {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  traffic?: boolean;
};

export function useNavigation() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOptions>({
    avoidTolls: false,
    avoidHighways: false,
    traffic: true
  });
  const [routeData, setRouteData] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Search for a location using TomTom's search API
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(`/api/navigation/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Format the results
      return data.results.map((result: any) => ({
        name: result.poi?.name || result.address.freeformAddress,
        address: result.address.freeformAddress,
        position: {
          lat: result.position.lat,
          lng: result.position.lon
        }
      }));
    } catch (error) {
      console.error('Error searching for location:', error);
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible de rechercher cet emplacement.',
        variant: 'destructive'
      });
      return [];
    }
  }, [toast]);

  // Get a route between origin and destination
  const calculateRoute = useCallback(async (origin: Coordinates, destination: Coordinates, options: RouteOptions = {}) => {
    try {
      const queryParams = new URLSearchParams({
        originLat: origin.lat.toString(),
        originLon: origin.lng.toString(),
        destLat: destination.lat.toString(),
        destLon: destination.lng.toString(),
        avoidTolls: options.avoidTolls ? 'true' : 'false',
        avoidHighways: options.avoidHighways ? 'true' : 'false'
      });
      
      const response = await fetch(`/api/navigation/route?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Route calculation failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRouteData(data);
      return data;
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: 'Erreur de calcul d\'itinéraire',
        description: 'Impossible de calculer l\'itinéraire entre ces deux points.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  // Get the user's current location
  const getCurrentLocation = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  }, []);

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = useCallback(async (coords: Coordinates): Promise<Location | null> => {
    try {
      const response = await fetch(`/api/navigation/reverse-geocode?lat=${coords.lat}&lon=${coords.lng}`);
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.addresses && data.addresses.length > 0) {
        const address = data.addresses[0];
        return {
          name: address.address.freeformAddress,
          address: address.address.freeformAddress,
          position: {
            lat: coords.lat,
            lng: coords.lng
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }, []);

  // Set origin to current location
  const setOriginToCurrentLocation = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      const location = await getAddressFromCoordinates(coords);
      
      if (location) {
        setOriginLocation(location);
        return location;
      }
      
      // If we couldn't get the address, at least set the coordinates
      setOriginLocation({
        name: 'Ma position',
        address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        position: coords
      });
      
      return null;
    } catch (error) {
      console.error('Error setting origin to current location:', error);
      toast({
        title: 'Erreur de localisation',
        description: 'Impossible d\'obtenir votre position actuelle.',
        variant: 'destructive'
      });
      return null;
    }
  }, [getCurrentLocation, getAddressFromCoordinates, toast]);

  // Save route
  const saveRouteMutation = useMutation({
    mutationFn: async (routeData: any) => {
      if (!user || !originLocation || !destinationLocation) {
        throw new Error('Missing user or location data');
      }
      
      const routeToSave = {
        userId: user.id,
        origin: originLocation.name,
        destination: destinationLocation.name,
        originLat: originLocation.position.lat.toString(),
        originLon: originLocation.position.lng.toString(),
        destinationLat: destinationLocation.position.lat.toString(),
        destinationLon: destinationLocation.position.lng.toString(),
        routeData,
        avoidTolls: routeOptions.avoidTolls,
        avoidHighways: routeOptions.avoidHighways
      };
      
      const res = await apiRequest('POST', '/api/navigation/routes', routeToSave);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/routes/recent'] });
      toast({
        title: 'Itinéraire sauvegardé',
        description: 'Votre itinéraire a été sauvegardé avec succès.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de sauvegarde',
        description: `Impossible de sauvegarder l'itinéraire: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Get recent routes
  const { data: recentRoutes, isLoading: loadingRecentRoutes } = useQuery({
    queryKey: ['/api/navigation/routes/recent'],
    enabled: !!user
  });

  // Get favorite locations
  const { data: favoriteLocations, isLoading: loadingFavorites } = useQuery({
    queryKey: ['/api/navigation/favorites'],
    enabled: !!user
  });

  // Add favorite location
  const addFavoriteMutation = useMutation({
    mutationFn: async (location: { name: string; address: string; latitude: string; longitude: string }) => {
      const res = await apiRequest('POST', '/api/navigation/favorites', location);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/favorites'] });
      toast({
        title: 'Emplacement favori ajouté',
        description: 'L\'emplacement a été ajouté à vos favoris.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Impossible d'ajouter aux favoris: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Remove favorite location
  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/navigation/favorites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/favorites'] });
      toast({
        title: 'Favori supprimé',
        description: 'L\'emplacement a été retiré de vos favoris.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer le favori: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Start navigation
  const startNavigation = useCallback(() => {
    if (!routeData) {
      toast({
        title: 'Erreur',
        description: 'Aucun itinéraire à suivre.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsNavigating(true);
  }, [routeData, toast]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return {
    originLocation,
    setOriginLocation,
    destinationLocation,
    setDestinationLocation,
    routeOptions,
    setRouteOptions,
    routeData,
    setRouteData,
    isNavigating,
    searchLocation,
    calculateRoute,
    getCurrentLocation,
    getAddressFromCoordinates,
    setOriginToCurrentLocation,
    saveRoute: saveRouteMutation.mutate,
    isSavingRoute: saveRouteMutation.isPending,
    recentRoutes,
    loadingRecentRoutes,
    favoriteLocations,
    loadingFavorites,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    startNavigation,
    stopNavigation
  };
}
