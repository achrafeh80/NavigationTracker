import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMapContext } from "@/context/map-context";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/tomtom";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

type IncidentType = "accident" | "traffic" | "closure" | "police" | "hazard" | "other";

interface ReportIncidentModalProps {
  readonly onClose: () => void;
}

export default function ReportIncidentModal({ onClose }: ReportIncidentModalProps) {
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { map } = useMapContext();
  const { toast } = useToast();

  const handleSelectIncidentType = (type: IncidentType) => {
    setSelectedType(type);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedType) {
      toast({
        title: "Incident Type Required",
        description: "Please select an incident type",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to report incidents",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current location
      let latitude, longitude;
      
      // Use map center if available
      if (map) {
        const center = map.getCenter();
        latitude = center.lat;
        longitude = center.lng;
      } else {
        // Fallback to device geolocation
        const position = await getCurrentLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
      
      // Create incident report
      const incidentData = {
        type: selectedType,
        latitude: String(latitude),
        longitude: String(longitude),
        comment: description.trim() || undefined,
        reportedBy: user.id
      };
      
      // Submit report
      await apiRequest("POST", "/api/incidents", incidentData);
      
      toast({
        title: "Incident Reported",
        description: "Thank you for contributing to the community!",
        variant: "default"
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Report Failed",
        description: error.message || "Failed to submit incident report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Incident</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="incident-type" className="block text-sm font-medium text-neutral-700 mb-2">Incident Type</label>
            <div id="incident-type" className="grid grid-cols-2 gap-3">
              {[
                { type: "accident", icon: "car_crash", label: "Accident", color: "text-status-alert" },
                { type: "traffic", icon: "traffic", label: "Traffic Jam", color: "text-status-warning" },
                { type: "closure", icon: "block", label: "Road Closure", color: "text-status-info" },
                { type: "police", icon: "local_police", label: "Police", color: "text-status-info" },
                { type: "hazard", icon: "warning", label: "Hazard", color: "text-status-alert" },
                { type: "other", icon: "more_horiz", label: "Other", color: "text-neutral-500" }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  className={`flex flex-col items-center p-3 border rounded-lg hover:bg-neutral-50 transition-colors ${
                    selectedType === item.type 
                      ? 'bg-primary-light bg-opacity-20 border-primary' 
                      : 'border-neutral-300'
                  }`}
                  onClick={() => handleSelectIncidentType(item.type as IncidentType)}
                >
                  <span className={`material-icons ${item.color}`}>{item.icon}</span>
                  <span className="mt-1 text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="incident-description" className="block text-sm font-medium text-neutral-700 mb-1">
              Description (Optional)
            </label>
            <Textarea
              id="incident-description"
              placeholder="Add additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter className="flex justify-end gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedType || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
