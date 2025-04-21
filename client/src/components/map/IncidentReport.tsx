import { useState } from 'react';
import { useIncidents, IncidentType, incidentTypes } from '@/hooks/use-incidents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface IncidentReportProps {
  readonly position: { lat: number; lng: number };
  readonly onClose: () => void;
  readonly onIncidentReported: (incident: any) => void;
}

export default function IncidentReport({ position, onClose, onIncidentReported }: IncidentReportProps) {
  const { reportIncident, isReporting } = useIncidents();
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!selectedType) return;
    
    reportIncident({
      type: selectedType,
      latitude: position.lat.toString(),
      longitude: position.lng.toString(),
      comment: comment.trim() || undefined
    });
    
    onIncidentReported({
      type: selectedType,
      latitude: position.lat,
      longitude: position.lng,
      comment: comment.trim()
    });
    
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-secondary">Signaler un incident</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-neutral-600 mb-4">Sélectionnez le type d'incident que vous souhaitez signaler:</p>
          
          <div className="grid grid-cols-2 gap-3">
            {incidentTypes.map((type) => (
              <Button
                key={type.type}
                variant="outline"
                className={cn(
                  "p-3 h-auto flex flex-col items-center border-neutral-200 hover:bg-neutral-100 transition",
                  selectedType === type.type && "border-2 border-secondary bg-opacity-5"
                )}
                onClick={() => setSelectedType(type.type)}
              >
                <span className="material-icons text-[22px] mb-1" style={{ color: type.color }}>
                  {type.icon}
                </span>
                <span className="text-sm font-medium text-neutral-800">{type.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="mt-4">
            <label htmlFor="incident-comment" className="block text-sm font-medium text-neutral-700 mb-1">
              Commentaires (optionnel):
            </label>
            <Textarea
              id="incident-comment"
              className="w-full p-3 border border-neutral-300 rounded-lg"
              rows={2}
              placeholder="Ajoutez des détails sur l'incident..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 border-neutral-300 text-neutral-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || isReporting}
            className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-white"
          >
            {isReporting ? "Envoi en cours..." : "Signaler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
