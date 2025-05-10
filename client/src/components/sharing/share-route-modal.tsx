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
    // Generate share URL
    const routeId = route?.id || Math.random().toString(36).substring(2, 10);
    const url = `${window.location.origin}/routes/share/${routeId}`;
    setShareUrl(url);
    
    // Generate QR code
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
      QRCode.toCanvas(qrContainer, url, {
        width: 200,
        margin: 1,
        color: {
          dark: "#3F51B5",
          light: "#FFFFFF"
        }
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
          return;
        }
        setQrGenerated(true);
      });
    }
  }, [route]);

  const handleCopyRouteLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Share link has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive"
        });
      });
  };

  // Social sharing functions
  const handleShareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareViaTwitter = () => {
    const text = `Check out this route on SupMap!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareViaWhatsapp = () => {
    const text = `Check out this route on SupMap: ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareViaEmail = () => {
    const subject = 'Check out this route on SupMap';
    const body = `I've found a route you might be interested in:\n\n${shareUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

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
        
        <div className="mb-4">
          <label htmlFor="route-link" className="block text-sm font-medium text-neutral-700 mb-1">Share Link</label>
          <div className="flex">
            <Input
              id="route-link"
              value={shareUrl}
              className="flex-grow rounded-r-none"
              readOnly
            />
            <Button
              className="rounded-l-none"
              onClick={handleCopyRouteLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-neutral-700">Share via</h4>
          <div className="flex gap-3">
            <button 
              className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleShareViaFacebook}
              title="Share on Facebook"
            >
              <Facebook className="h-4 w-4" />
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleShareViaTwitter}
              title="Share on Twitter"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleShareViaWhatsapp}
              title="Share via WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-[#0077B5] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleShareViaEmail}
              title="Share via Email"
            >
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
