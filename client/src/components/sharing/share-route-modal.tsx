import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Facebook, Mail, Share2, MessageCircle } from "lucide-react";
import QRCode from "qrcode";

interface ShareRouteModalProps {
  route: any;
  onClose: () => void;
}

export default function ShareRouteModal({ route, onClose }: ShareRouteModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
  // Identifiants du trajet (coordonnées de départ et d'arrivée)
  const originCoords = route.legs[0].points[0];
  const destCoords = route.legs[0].points[route.legs[0].points.length - 1];
  const mapsUrl = `https://www.google.com/maps/dir/${originCoords.latitude},${originCoords.longitude}/${destCoords.latitude},${destCoords.longitude}`;
  setShareUrl(mapsUrl);

  // Générer le QR code pour l'URL Google Maps
  const qrCanvas = document.getElementById('qr-code') as HTMLCanvasElement;
  if (qrCanvas) {
    QRCode.toCanvas(qrCanvas, mapsUrl, { width: 200, margin: 1, color: { dark: "#000000", light: "#FFFFFF" }}, 
      (error) => {
        if (!error) setQrGenerated(true);
        else console.error('Error generating QR code:', error);
      });
  }
}, [route]);



  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Route</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center mb-4">
          {/* QR Code */}
          <div className="w-52 h-52 bg-neutral-100 flex items-center justify-center mb-4 border border-neutral-300">
            {!qrGenerated ? (
              <div className="text-center">
                <span className="material-icons text-3xl text-neutral-400">qr_code_2</span>
                <p className="text-sm text-neutral-500 mt-2">Generating QR code...</p>
              </div>
            ) : (
              <canvas id="qr-code"></canvas>
            )}
          </div>
          
          <p className="text-sm text-neutral-600 text-center">
            Scan this QR code with your mobile device to open this route in the app
          </p>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
