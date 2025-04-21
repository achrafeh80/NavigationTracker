import { useState } from "react";
import NavBar from "@/components/navigation/nav-bar";
import MapView from "@/components/maps/map-view";
import SearchPanel from "@/components/navigation/search-panel";
import RouteResultsPanel from "@/components/navigation/route-results-panel";
import NavigationPanel from "@/components/navigation/navigation-panel";
import IncidentAlertToast from "@/components/incidents/incident-alert-toast";
import ActionButton from "@/components/ui/action-button";
import ReportIncidentModal from "@/components/incidents/report-incident-modal";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { useNavigationContext } from "@/context/navigation-context";
import { useIncidentsContext } from "@/context/incidents-context";

export default function HomePage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [visibleAlert, setVisibleAlert] = useState<any | null>(null);
  
  const { 
    isRouteResultsVisible, 
    isNavigationActive,
    isLoading,
    loadingMessage
  } = useNavigationContext();
  
  const { incidentAlerts, dismissAlert } = useIncidentsContext();

  // Handle report button click
  const handleReportIncident = () => {
    setIsReportModalOpen(true);
  };

  // Handle close report modal
  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  // Show first pending alert
  const currentAlert = visibleAlert || (incidentAlerts.length > 0 ? incidentAlerts[0] : null);

  // Handle dismiss alert
  const handleDismissAlert = () => {
    if (currentAlert) {
      dismissAlert(currentAlert.id);
      setVisibleAlert(null);
    }
  };

  return (
    <div id="app" className="relative h-screen flex flex-col">
      {/* Map View */}
      <MapView />

      {/* Nav Bar */}
      <NavBar />

      {/* Search Panel */}
      <SearchPanel />

      {/* Route Results Panel */}
      {isRouteResultsVisible && <RouteResultsPanel />}

      {/* Navigation Panel */}
      {isNavigationActive && <NavigationPanel />}

      {/* Incident Alert Toast */}
      {currentAlert && (
        <IncidentAlertToast 
          incident={currentAlert} 
          onDismiss={handleDismissAlert}
        />
      )}

      {/* Action Button */}
      <ActionButton onClick={handleReportIncident} />

      {/* Report Incident Modal */}
      {isReportModalOpen && (
        <ReportIncidentModal onClose={handleCloseReportModal} />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </div>
  );
}
