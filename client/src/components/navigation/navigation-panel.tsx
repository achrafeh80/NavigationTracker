import { useState } from "react";
import { useNavigationContext } from "@/context/navigation-context";
import { formatDuration, formatDistance, getETA } from "@/lib/tomtom";
import ReportIncidentModal from "@/components/incidents/report-incident-modal";
import AllManeuversModal from "@/components/navigation/AllManeuversModal";

export default function NavigationPanel() {
  const { activeRoute, stopNavigation, setShowAllManeuvers } = useNavigationContext();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!activeRoute) return null;

  const { summary } = activeRoute;
  const guidance = activeRoute.guidance?.instructions || [];

  const currentManeuver = guidance.length > 0 ? guidance[0] : null;
  const nextManeuvers = guidance.slice(1, 3);
  const eta = getETA(summary.travelTimeInSeconds);

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
      <div className="absolute bottom-0 left-20 right-20 bg-white shadow-lg rounded-t-xl z-20">
        <div className="p-4">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="font-medium text-sm text-neutral-600">Estimated arrival</div>
              <div className="text-lg font-semibold">
                {eta} ({formatDuration(summary.travelTimeInSeconds)})
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
                onClick={stopNavigation}
              >
                Stop
              </button>
              <button
                className="px-3 py-1 text-sm text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition"
                onClick={() => setShowAllManeuvers(true)}
              >
              Navigation steps
              </button>
            </div>
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
          <div className="max-h-80 overflow-y-auto pr-2">
            <div className="flex flex-col gap-3">
              {nextManeuvers.map((maneuver: any, index: number) => (
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
        </div>
      </div>

      {isReportModalOpen && (
        <ReportIncidentModal onClose={() => setIsReportModalOpen(false)} />
      )}

      <AllManeuversModal />
    </>
  );
}
