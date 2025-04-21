import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Location, Coordinates, RouteOptions } from '@/hooks/use-navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Mic, 
  MapPin, 
  History, 
  Heart, 
  Route, 
  Navigation, 
  Share,
  ChevronUp,
  Settings
} from 'lucide-react';
import { formatDistance, formatDuration, calculateETA } from '@/lib/utils';
import QRCodeModal from '../ui/qr-code-modal';

interface RouteControlsProps {
  navigation: any;
  userLocation: Coordinates | null;
  onRouteCalculated: (routeData: any) => void;
}

export default function RouteControls({ navigation, userLocation, onRouteCalculated }: RouteControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(200); // Default height
  
  // Handle search input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await navigation.searchLocation(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Select destination from search results
  const selectDestination = (location: Location) => {
    navigation.setDestinationLocation(location);
    setSearchResults([]);
    setSearchQuery(location.name);
    
    // If we have both origin and destination, calculate route
    if (navigation.originLocation) {
      calculateRoute();
    } else if (userLocation) {
      // If we don't have origin but we have user's location, use it as origin
      navigation.setOriginToCurrentLocation().then(() => {
        if (navigation.originLocation) {
          calculateRoute();
        }
      });
    } else {
      toast({
        title: "Origine manquante",
        description: "Veuillez définir une origine pour votre itinéraire.",
        variant: "destructive"
      });
    }
  };
  
  // Select from recent or favorite destinations
  const selectSavedDestination = (location: any) => {
    const formattedLocation: Location = {
      name: location.name || location.destination,
      address: location.address || "",
      position: {
        lat: parseFloat(location.latitude || location.destinationLat),
        lng: parseFloat(location.longitude || location.destinationLon)
      }
    };
    
    selectDestination(formattedLocation);
  };
  
  // Calculate route
  const calculateRoute = async () => {
    if (!navigation.originLocation || !navigation.destinationLocation) {
      toast({
        title: "Informations manquantes",
        description: "L'origine et la destination sont nécessaires pour calculer un itinéraire.",
        variant: "destructive"
      });
      return;
    }
    
    const routeData = await navigation.calculateRoute(
      navigation.originLocation.position,
      navigation.destinationLocation.position,
      navigation.routeOptions
    );
    
    if (routeData) {
      onRouteCalculated(routeData);
      setShowRoutesPanel(true);
    }
  };
  
  // Update route options
  const updateRouteOption = (option: keyof RouteOptions, value: boolean) => {
    navigation.setRouteOptions({
      ...navigation.routeOptions,
      [option]: value
    });
    
    // Recalculate route with new options
    if (navigation.originLocation && navigation.destinationLocation) {
      calculateRoute();
    }
  };
  
  // Save current route
  const saveRoute = () => {
    if (!navigation.routeData) return;
    
    navigation.saveRoute(navigation.routeData);
  };
  
  // Share route
  const shareRoute = () => {
    if (!navigation.routeData) return;
    setShowQRModal(true);
  };
  
  // Start navigation
  const startNavigation = () => {
    if (!navigation.routeData) return;
    navigation.startNavigation();
  };
  
  // Handle bottom sheet interactions
  useEffect(() => {
    const bottomSheet = bottomSheetRef.current;
    if (!bottomSheet) return;
    
    let startY: number;
    let currentHeight: number;
    const minHeight = 150;
    const maxHeight = window.innerHeight * 0.8;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentHeight = bottomSheet.offsetHeight;
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = startY - e.touches[0].clientY;
      const newHeight = Math.min(Math.max(currentHeight + deltaY, minHeight), maxHeight);
      setBottomSheetHeight(newHeight);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    const handleElement = bottomSheet.querySelector('#bottom-sheet-handle');
    if (handleElement) {
      handleElement.addEventListener('touchstart', handleTouchStart);
    }
    
    return () => {
      if (handleElement) {
        handleElement.removeEventListener('touchstart', handleTouchStart);
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <>
      <div 
        ref={bottomSheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-20 transform transition-all duration-300 ease-in-out"
        style={{ height: `${bottomSheetHeight}px` }}
      >
        {/* Handle for dragging */}
        <div 
          id="bottom-sheet-handle" 
          className="w-full flex justify-center py-2 cursor-pointer"
        >
          <div className="w-10 h-1 bg-neutral-300 rounded-full"></div>
        </div>

        {/* Destination Search Bar */}
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <Input
              type="text"
              className="w-full p-3 pl-10 pr-12 bg-neutral-100 border border-neutral-200 rounded-lg"
              placeholder="Rechercher une destination"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-5 w-5" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
            >
              <Mic className="h-5 w-5" />
              <span className="sr-only">Recherche vocale</span>
            </Button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-neutral-200 rounded-lg shadow-md absolute left-4 right-4 z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 hover:bg-neutral-100 cursor-pointer transition"
                  onClick={() => selectDestination(result)}
                >
                  <MapPin className="text-neutral-500 h-5 w-5" />
                  <div>
                    <p className="font-medium text-neutral-800">{result.name}</p>
                    <p className="text-sm text-neutral-500">{result.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route Options or Recent Destinations */}
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {showRoutesPanel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-heading font-semibold text-neutral-900">Votre itinéraire</h2>
                <Button 
                  variant="ghost" 
                  className="text-primary flex items-center"
                  onClick={() => setShowRouteOptions(!showRouteOptions)}
                >
                  <Settings className="mr-1 h-4 w-4" />
                  <span className="text-sm">Options</span>
                </Button>
              </div>
              
              {/* Route Summary */}
              {navigation.routeData && navigation.routeData.routes && navigation.routeData.routes.length > 0 && (
                <div className="mt-3 p-4 bg-primary bg-opacity-5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-neutral-600">Distance</p>
                      <p className="font-medium text-neutral-900">
                        {formatDistance(navigation.routeData.routes[0].summary.lengthInMeters)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Durée</p>
                      <p className="font-medium text-neutral-900">
                        {formatDuration(navigation.routeData.routes[0].summary.travelTimeInSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Arrivée</p>
                      <p className="font-medium text-neutral-900">
                        {calculateETA(navigation.routeData.routes[0].summary.travelTimeInSeconds)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Route Options Panel */}
              {showRouteOptions && (
                <div className="p-3 bg-neutral-100 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="avoid-tolls" 
                        checked={navigation.routeOptions.avoidTolls}
                        onCheckedChange={(checked) => updateRouteOption('avoidTolls', checked as boolean)}
                      />
                      <Label htmlFor="avoid-tolls">Éviter les péages</Label>
                    </div>
                    <span className="text-sm text-neutral-500">+5 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="avoid-highways" 
                        checked={navigation.routeOptions.avoidHighways}
                        onCheckedChange={(checked) => updateRouteOption('avoidHighways', checked as boolean)}
                      />
                      <Label htmlFor="avoid-highways">Éviter les autoroutes</Label>
                    </div>
                    <span className="text-sm text-neutral-500">+10 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="avoid-traffic" 
                        checked={navigation.routeOptions.traffic}
                        onCheckedChange={(checked) => updateRouteOption('traffic', checked as boolean)}
                      />
                      <Label htmlFor="avoid-traffic">Éviter le trafic</Label>
                    </div>
                    <span className="text-sm text-neutral-500">+8 min</span>
                  </div>
                </div>
              )}
              
              {/* Alternative Routes */}
              {navigation.routeData && navigation.routeData.routes && navigation.routeData.routes.length > 1 && (
                <>
                  <h3 className="text-base font-medium text-neutral-800 mb-2">Autres itinéraires</h3>
                  
                  {navigation.routeData.routes.slice(1).map((route: any, index: number) => {
                    const mainRoute = navigation.routeData.routes[0];
                    const timeDifference = route.summary.travelTimeInSeconds - mainRoute.summary.travelTimeInSeconds;
                    
                    return (
                      <div 
                        key={index}
                        className="mb-3 p-3 border border-neutral-200 rounded-lg hover:border-primary cursor-pointer transition"
                        onClick={() => {
                          // Swap this route with the main route
                          const newRoutes = [...navigation.routeData.routes];
                          [newRoutes[0], newRoutes[index + 1]] = [newRoutes[index + 1], newRoutes[0]];
                          
                          const newRouteData = {
                            ...navigation.routeData,
                            routes: newRoutes
                          };
                          
                          navigation.setRouteData(newRouteData);
                          onRouteCalculated(newRouteData);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Route className="text-primary mr-3 h-5 w-5" />
                            <div>
                              <p className="font-medium text-neutral-800">
                                {route.guidance.instructions.find((i: any) => i.routeOffsetInMeters > 500)?.roadNumbers?.join(', ') || 'Alternative'}
                              </p>
                              <p className="text-sm text-neutral-500">
                                {formatDistance(route.summary.lengthInMeters)} · {formatDuration(route.summary.travelTimeInSeconds)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-neutral-500">+{formatDuration(timeDifference)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Actions Buttons */}
              <div className="flex flex-col space-y-3 mt-3">
                <Button 
                  className="w-full py-3 bg-primary hover:bg-primary/90" 
                  onClick={startNavigation}
                >
                  <Navigation className="mr-2 h-5 w-5" />
                  <span className="font-medium">Démarrer la navigation</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full py-3 border-primary text-primary hover:bg-primary/5"
                  onClick={shareRoute}
                >
                  <Share className="mr-2 h-5 w-5" />
                  <span className="font-medium">Partager cet itinéraire</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full py-3 text-neutral-700"
                  onClick={saveRoute}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  <span className="font-medium">Enregistrer</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-900">Destinations récentes</h2>
              
              {/* Recent Destinations */}
              {navigation.loadingRecentRoutes ? (
                <div className="p-3 text-center text-neutral-500">Chargement...</div>
              ) : navigation.recentRoutes && navigation.recentRoutes.length > 0 ? (
                navigation.recentRoutes.map((route: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 hover:bg-neutral-100 rounded-lg cursor-pointer transition"
                    onClick={() => selectSavedDestination(route)}
                  >
                    <History className="text-neutral-500 h-5 w-5" />
                    <div>
                      <p className="font-medium text-neutral-800">{route.destination}</p>
                      <p className="text-sm text-neutral-500">{formatDistance(JSON.parse(route.routeData as string).routes[0].summary.lengthInMeters)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-neutral-500">Aucun trajet récent</div>
              )}
              
              <Separator className="my-2" />
              
              <h2 className="text-lg font-heading font-semibold text-neutral-900 pt-2">Favoris</h2>
              
              {/* Favorite Destinations */}
              {navigation.loadingFavorites ? (
                <div className="p-3 text-center text-neutral-500">Chargement...</div>
              ) : navigation.favoriteLocations && navigation.favoriteLocations.length > 0 ? (
                navigation.favoriteLocations.map((favorite: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 hover:bg-neutral-100 rounded-lg cursor-pointer transition"
                    onClick={() => selectSavedDestination(favorite)}
                  >
                    <Heart className="text-primary h-5 w-5" />
                    <div>
                      <p className="font-medium text-neutral-800">{favorite.name}</p>
                      <p className="text-sm text-neutral-500">{favorite.address}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-neutral-500">Aucun favori</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* QR Code Modal */}
      {showQRModal && navigation.routeData && (
        <QRCodeModal 
          route={navigation.routeData} 
          onClose={() => setShowQRModal(false)} 
        />
      )}
    </>
  );
}
