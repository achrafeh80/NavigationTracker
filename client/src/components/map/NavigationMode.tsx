import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, AlertTriangle, X } from 'lucide-react';
import { formatDistance, formatDuration, calculateETA } from '@/lib/utils';

interface NavigationModeProps {
  routeData: any;
  onExit: () => void;
  onReportIncident: () => void;
}

export default function NavigationMode({ routeData, onExit, onReportIncident }: NavigationModeProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [nextDirectionIndex, setNextDirectionIndex] = useState(0);
  const [position, setPosition] = useState({ lat: 0, lng: 0 }); // Current user position
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Get route information
  const route = routeData.routes[0];
  const totalDistance = route.summary.lengthInMeters;
  const totalTime = route.summary.travelTimeInSeconds;
  const instructions = route.guidance?.instructions || [];
  
  // Current direction to display
  const nextDirection = instructions[nextDirectionIndex] || null;
  
  // Initialize values
  useEffect(() => {
    if (route) {
      setRemainingTime(totalTime);
      // Get user's current position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        });
      }
    }
    
    // Start a timer to simulate progress along the route
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        // If we've reached 0, stop navigation
        if (newTime === 0) {
          onExit();
        }
        return newTime;
      });
      
      // Simulate progress
      setDistanceCovered((prev) => {
        const newDistance = Math.min(totalDistance, prev + (totalDistance / totalTime));
        return newDistance;
      });
      
      // Update next direction based on progress
      if (instructions.length > 0) {
        const nextInstruction = instructions.findIndex(
          (instr: any) => instr.routeOffsetInMeters > distanceCovered
        );
        
        if (nextInstruction !== -1 && nextInstruction !== nextDirectionIndex) {
          setNextDirectionIndex(nextInstruction);
        }
      }
      
      // Get updated location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [route, totalDistance, totalTime, instructions, distanceCovered, nextDirectionIndex, onExit]);
  
  // Get direction icon based on the maneuver
  const getDirectionIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'TURN_RIGHT':
        return 'turn_right';
      case 'TURN_LEFT':
        return 'turn_left';
      case 'CONTINUE':
        return 'arrow_upward';
      case 'ROUNDABOUT_RIGHT':
      case 'ROUNDABOUT_LEFT':
        return 'roundabout_right';
      case 'KEEP_RIGHT':
        return 'turn_slight_right';
      case 'KEEP_LEFT':
        return 'turn_slight_left';
      case 'ARRIVE':
        return 'place';
      default:
        return 'arrow_forward';
    }
  };
  
  // Format the instruction message
  const formatInstruction = (instruction: any) => {
    if (!instruction) return "En route...";
    
    switch (instruction.maneuver) {
      case 'ARRIVE':
        return "Vous êtes arrivé à destination";
      default:
        return instruction.message || "Continuez tout droit";
    }
  };
  
  // Calculate distance to next instruction
  const distanceToNext = nextDirection
    ? nextDirection.routeOffsetInMeters - distanceCovered
    : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Return to Routes Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 left-4 z-10 bg-white shadow-md rounded-full h-10 w-10"
        onClick={onExit}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Retour</span>
      </Button>
      
      {/* Current Instruction Panel */}
      {nextDirection && (
        <div className="absolute top-16 left-0 right-0 mx-auto max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mr-4">
              <span className="material-icons text-white text-2xl">
                {getDirectionIcon(nextDirection.maneuver)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-lg text-neutral-900">
                {formatInstruction(nextDirection)}
              </p>
              <p className="text-neutral-600">
                {nextDirection.roadNumbers?.join(' ') || nextDirection.street || 'Route actuelle'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-lg text-primary">
                {formatDistance(Math.max(0, distanceToNext))}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Navigation Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-neutral-600">Distance restante</p>
            <p className="font-mono font-bold text-lg">
              {formatDistance(totalDistance - distanceCovered)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600">Durée restante</p>
            <p className="font-mono font-bold text-lg">
              {formatDuration(remainingTime)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600">Arrivée estimée</p>
            <p className="font-mono font-bold text-lg">
              {calculateETA(remainingTime)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            className="flex-1 py-2 bg-[#F44336] hover:bg-[#F44336]/90 text-white"
            onClick={onReportIncident}
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            <span>Signaler</span>
          </Button>
          <Button
            variant="secondary"
            className="flex-1 py-2"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <>
                <VolumeX className="mr-1 h-4 w-4" />
                <span>Muet</span>
              </>
            ) : (
              <>
                <Volume2 className="mr-1 h-4 w-4" />
                <span>Son</span>
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 py-2"
            onClick={onExit}
          >
            <X className="mr-1 h-4 w-4" />
            <span>Terminer</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
