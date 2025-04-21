import { useState } from "react";
import { useNavigationContext } from "@/context/navigation-context";
import { X, VolumeX, Volume2, MoreVertical, AlertTriangle } from "lucide-react";
import { formatDuration, formatDistance, getETA } from "@/lib/tomtom";
import ReportIncidentModal from "@/components/incidents/report-incident-modal";

export default function NavigationPanel() {
  const { activeRoute, stopNavigation } = useNavigationContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleStopNavigation = () => {
    stopNavigation();
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleReportIncident = () => {
    setIsReportModalOpen(true);
  };

  // Make sure we have a route to display
  if (!activeRoute) return null;

  // Get route summary and maneuver information
  const { summary } = activeRoute;
  const guidance = activeRoute.guidance?.instructions || [];
  
  // Current maneuver is the first one in the list
  const currentManeuver = guidance.length > 0 ? guidance[0] : null;
  
  // Next maneuvers are the next two in the list
  const nextManeuvers = guidance.slice(1, 3);

  // Get ETA based on travel time
  const eta = getETA(summary.travelTimeInSeconds);

  // Helper to get maneuver icon
  const getManeuverIcon = (maneuver: any) => {
    const type = maneuver.maneuverType || 'STRAIGHT';
    
    switch (type) {
      case 'LEFT':
      case 'KEEP_LEFT':
      case 'TURN_LEFT':
      case 'SHARP_LEFT':
      case 'SLIGHT_LEFT':
        return 'turn_left';
      case 'RIGHT':
      case 'KEEP_RIGHT':
      case 'TURN_RIGHT':
      case 'SHARP_RIGHT':
      case 'SLIGHT_RIGHT':
        return 'turn_right';
      case 'ROUNDABOUT':
        return 'roundabout_right';
      case 'UTURN':
        return 'u_turn_right';
      default:
        return 'arrow_upward';
    }
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl z-20">
        <div className="p-4">
          {/* Top Bar with ETA and Close Button */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="font-medium text-sm text-neutral-600">Estimated arrival</div>
              <div className="text-lg font-semibold">
                {eta} ({formatDuration(summary.travelTimeInSeconds)})
              </div>
            </div>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={handleStopNavigation}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Maneuver */}
          {currentManeuver && (
            <div className="bg-neutral-100 rounded-lg p-3 mb-4 flex items-center gap-3">
              <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center text-white">
                <span className="material-icons">{getManeuverIcon(currentManeuver)}</span>
              </div>
              <div className="flex-grow">
                <div className="font-medium">{currentManeuver.message}</div>
                <div className="text-sm text-neutral-600">{currentManeuver.street || ''}</div>
              </div>
              <div className="text-lg font-bold">
                {formatDistance(currentManeuver.distanceToNextInstruction || 0)}
              </div>
            </div>
          )}

          {/* Next Maneuvers */}
          <div className="flex flex-col gap-3">
            {nextManeuvers.map((maneuver, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-neutral-200 rounded-full w-8 h-8 flex items-center justify-center text-neutral-700">
                  <span className="material-icons text-sm">{getManeuverIcon(maneuver)}</span>
                </div>
                <div className="flex-grow">
                  <div className="text-sm">
                    {maneuver.distanceFromPreviousInstruction && 
                      `Continue for ${formatDistance(maneuver.distanceFromPreviousInstruction)}, then `}
                    {maneuver.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex justify-between items-center bg-neutral-100 p-3">
          <button 
            className="flex items-center gap-1 text-neutral-700 hover:text-primary transition-colors px-2"
          >
            <MoreVertical className="h-5 w-5" />
            <span className="text-sm">Options</span>
          </button>

          <button 
            className="flex items-center gap-1 text-neutral-700 hover:text-primary transition-colors px-2"
            onClick={handleToggleMute}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-5 w-5" />
                <span className="text-sm">Unmute</span>
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" />
                <span className="text-sm">Mute</span>
              </>
            )}
          </button>

          <button 
            className="flex items-center gap-1 text-status-alert px-2"
            onClick={handleReportIncident}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Report</span>
          </button>
        </div>
      </div>

      {isReportModalOpen && (
        <ReportIncidentModal onClose={() => setIsReportModalOpen(false)} />
      )}
    </>
  );
}
