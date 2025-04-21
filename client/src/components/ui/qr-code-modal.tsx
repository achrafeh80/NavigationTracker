import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Mail, X } from 'lucide-react';
import { getQRCodeUrl } from '@/lib/utils';

interface QRCodeModalProps {
  route: any;
  onClose: () => void;
}

export default function QRCodeModal({ route, onClose }: QRCodeModalProps) {
  const { toast } = useToast();
  
  // Generate a route share URL
  const routeShareUrl = `${window.location.origin}/share?origin=${route.routes[0].summary.origin.lat},${route.routes[0].summary.origin.lng}&destination=${route.routes[0].summary.destination.lat},${route.routes[0].summary.destination.lng}`;
  
  // Get QR code URL
  const qrCodeUrl = getQRCodeUrl(routeShareUrl, 200);
  
  // Copy link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(routeShareUrl).then(() => {
      toast({
        title: 'Lien copié',
        description: 'Le lien a été copié dans le presse-papiers.'
      });
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien.',
        variant: 'destructive'
      });
    });
  };
  
  // Send email with route
  const emailRoute = () => {
    const subject = encodeURIComponent('Mon itinéraire SupMap');
    const body = encodeURIComponent(`Voici mon itinéraire: ${routeShareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-primary">Partager cet itinéraire</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 flex flex-col items-center">
          <p className="text-neutral-600 mb-4 text-center">
            Scannez ce code QR avec l'application SupMap sur votre téléphone pour charger cet itinéraire.
          </p>
          
          <div className="bg-white p-3 border border-neutral-200 rounded-lg my-3">
            <img 
              src={qrCodeUrl} 
              alt="QR Code pour itinéraire" 
              className="w-48 h-48 object-contain"
            />
          </div>
          
          <p className="text-sm text-neutral-500 mt-2">L'itinéraire sera disponible pendant 24 heures</p>
          
          <div className="w-full mt-4 flex flex-col space-y-3">
            <Button
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white"
              onClick={emailRoute}
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>Envoyer par e-mail</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full py-3 border-primary text-primary hover:bg-primary/5"
              onClick={copyShareLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copier le lien</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
