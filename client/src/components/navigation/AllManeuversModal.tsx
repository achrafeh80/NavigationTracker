import { useNavigationContext } from "@/context/navigation-context";
import { formatDistance } from "@/lib/tomtom";
import { X } from "lucide-react";

export default function AllManeuversModal() {
  const { activeRoute, showAllManeuvers, setShowAllManeuvers } = useNavigationContext();

  if (!showAllManeuvers || !activeRoute) return null;

  const guidance = activeRoute.guidance?.instructions || [];

  const getManeuverIcon = (maneuver: any) => {
    const type = maneuver.maneuverType ;
    switch (type) {
      case "LEFT":
      case "KEEP_LEFT":
      case "TURN_LEFT":
      case "SHARP_LEFT":
      case "SLIGHT_LEFT":
        return "turn_left";
      case "RIGHT":
      case "KEEP_RIGHT":
      case "TURN_RIGHT":
      case "SHARP_RIGHT":
      case "SLIGHT_RIGHT":
        return "turn_right";
      case "ROUNDABOUT":
        return "roundabout_right";
      case "UTURN":
        return "u_turn_right";
      default:
        return "arrow_upward";
    }
  };

  return (
    <div className="absolute right-12 top-32 bottom-24 w-80 bg-white rounded-lg shadow-md z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">All Steps</h2>
        <button onClick={() => setShowAllManeuvers(false)}>
            <X className="w-5 h-5 text-red-500 hover:text-red-700 transition-colors duration-200" />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="custom-scrollbar overflow-y-auto flex-grow p-4">
        {guidance.map((maneuver: any, index: number) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center text-blue-700 mt-1 shadow-sm">
              <span className="material-icons text-base">{getManeuverIcon(maneuver)}</span>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-800">{maneuver.message}</p>
              {maneuver.street && (
                <p className="text-xs text-gray-500">{maneuver.street}</p>
              )}
              {maneuver.distanceFromPreviousInstruction && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistance(maneuver.distanceFromPreviousInstruction)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
