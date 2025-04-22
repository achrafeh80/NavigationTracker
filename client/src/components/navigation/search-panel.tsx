import { useState, useEffect, useRef } from "react";
import { useNavigationContext } from "@/context/navigation-context";
import { useMapContext } from "@/context/map-context";
import { searchLocation, getCurrentLocation, calculateRoute, formatAddress } from "@/lib/tomtom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SearchPanel() {
  const [origin, setOrigin] = useState("Current Location");
  const [destination, setDestination] = useState("");
  const [searching, setSearching] = useState(false);
  const [routeOptions, setRouteOptions] = useState<string>("fastest");
  
  // Auto-suggestion state
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Debounce timers
  const originTimeoutRef = useRef<any>(null);
  const destTimeoutRef = useRef<any>(null);
  
  const { map } = useMapContext();
  const { 
    isRouteOptionsVisible,
    setRouteOptionsVisible,
    setRouteResultsVisible,
    setLoading,
    setLoadingMessage,
    calculateRoutes
  } = useNavigationContext();
  
  const { toast } = useToast();

  // Get location suggestions with debounce
  const getLocationSuggestions = async (query: string, isOrigin: boolean) => {
    if (!query || query === "Current Location") return;
    
    setIsLoadingSuggestions(true);
    try {
      const results = await searchLocation(query);
      if (isOrigin) {
        setOriginSuggestions(results || []);
        setShowOriginSuggestions(results && results.length > 0);
      } else {
        setDestinationSuggestions(results || []);
        setShowDestSuggestions(results && results.length > 0);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleOriginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrigin(value);
    
    // Clear previous timeout
    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }
    
    // Set new timeout for debounce
    if (value && value !== "Current Location") {
      originTimeoutRef.current = setTimeout(() => {
        getLocationSuggestions(value, true);
      }, 500);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);
    
    // Clear previous timeout
    if (destTimeoutRef.current) {
      clearTimeout(destTimeoutRef.current);
    }
    
    // Set new timeout for debounce
    if (value) {
      destTimeoutRef.current = setTimeout(() => {
        getLocationSuggestions(value, false);
      }, 500);
    } else {
      setShowDestSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: any, isOrigin: boolean) => {
    if (isOrigin) {
      setOrigin(suggestion.address.freeformAddress);
      setShowOriginSuggestions(false);
    } else {
      setDestination(suggestion.address.freeformAddress);
      setShowDestSuggestions(false);
    }
  };
  
  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowOriginSuggestions(false);
      setShowDestSuggestions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleRouteSearch = async () => {
    if (!map || !destination) {
      toast({
        title: "Error",
        description: "Please enter a destination",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("Calculating routes...");
    setSearching(true);

    try {
      // Get origin coordinates
      let originCoords;
      if (origin === "Current Location") {
        // Get current location
        const position = await getCurrentLocation();
        originCoords = [position.coords.longitude, position.coords.latitude];
      } else {
        // Search for origin location
        const results = await searchLocation(origin);
        if (!results || results.length === 0) {
          throw new Error("Origin location not found");
        }
        originCoords = [results[0].position.lng, results[0].position.lat];
      }

      // Search for destination location
      const destResults = await searchLocation(destination);
      if (!destResults || destResults.length === 0) {
        throw new Error("Destination not found");
      }
      const destCoords = [destResults[0].position.lng, destResults[0].position.lat];

      // Calculate route options
      await calculateRoutes(
        originCoords as [number, number], 
        destCoords as [number, number],
        {
          routeType: routeOptions as 'fastest' | 'shortest' | 'eco',
        }
      );

      // Show route options and route results panel
      setRouteOptionsVisible(true);
      setRouteResultsVisible(true);
    } catch (error: any) {
      toast({
        title: "Route Calculation Error",
        description: error.message || "Failed to calculate route",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleRouteTypeSelection = (type: string) => {
    setRouteOptions(type);
  };

  return (
    <div className="absolute top-16 left-0 right-0 px-4 z-20">
      <div className="bg-white rounded-lg shadow-md p-4 max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Origin Input */}
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary">
              <span className="material-icons">my_location</span>
            </span>
            <Input
              type="text"
              placeholder="Current Location"
              className="w-full pl-10 pr-3 py-2"
              value={origin}
              onChange={handleOriginInput}
              onClick={(e) => {
                e.stopPropagation();
                if (originSuggestions.length > 0) {
                  setShowOriginSuggestions(true);
                }
              }}
            />
            
            {/* Origin Suggestions dropdown */}
            {showOriginSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2">Recherche en cours...</span>
                  </div>
                ) : (
                  <ul className="py-1 divide-y divide-gray-200">
                    {originSuggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuggestionClick(suggestion, true);
                          }}
                        >
                          <MapPin className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {suggestion.poi?.name || suggestion.address.freeformAddress}
                            </p>
                            <p className="text-sm text-gray-500">{formatAddress(suggestion)}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Destination Input */}
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-DEFAULT">
              <span className="material-icons">place</span>
            </span>
            <Input
              type="text"
              placeholder="Enter destination"
              className="w-full pl-10 pr-3 py-2"
              value={destination}
              onChange={handleDestinationInput}
              onClick={(e) => {
                e.stopPropagation();
                if (destinationSuggestions.length > 0) {
                  setShowDestSuggestions(true);
                }
              }}
            />
            
            {/* Destination Suggestions dropdown */}
            {showDestSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2">Recherche en cours...</span>
                  </div>
                ) : (
                  <ul className="py-1 divide-y divide-gray-200">
                    {destinationSuggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuggestionClick(suggestion, false);
                          }}
                        >
                          <MapPin className="h-5 w-5 text-secondary-DEFAULT mt-1" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {suggestion.poi?.name || suggestion.address.freeformAddress}
                            </p>
                            <p className="text-sm text-gray-500">{formatAddress(suggestion)}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button
            className="py-2 px-4 flex items-center justify-center gap-1"
            onClick={handleRouteSearch}
            disabled={searching || !destination}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>Search</span>
          </Button>
        </div>

        {/* Route Options */}
        {isRouteOptionsVisible && (
          <div className="mt-4 route-options">
            <div className="flex flex-wrap gap-2 mb-4 ">
              <Button
                variant={routeOptions === "fastest" ? "default" : "outline"}
                size="sm"
                className="rounded-full px-3 py-1 text-sm"
                onClick={() => handleRouteTypeSelection("fastest")}
              >
                Fastest
              </Button>
              <Button
                variant={routeOptions === "shortest" ? "default" : "outline"}
                size="sm"
                className="rounded-full px-3 py-1 text-sm"
                onClick={() => handleRouteTypeSelection("shortest")}
              >
                Shortest
              </Button>
              <Button
                variant={routeOptions === "eco" ? "default" : "outline"}
                size="sm"
                className="rounded-full px-3 py-1 text-sm"
                onClick={() => handleRouteTypeSelection("eco")}
              >
                Eco-friendly
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
