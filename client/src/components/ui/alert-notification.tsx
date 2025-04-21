import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertNotificationProps {
  alert: {
    type: string;
    title: string;
    description: string;
    alertType?: 'error' | 'warning' | 'info' | 'success';
  };
  onDismiss: () => void;
  onAction?: () => void;
  actionText?: string;
}

export default function AlertNotification({ 
  alert, 
  onDismiss, 
  onAction,
  actionText = "Recalculer l'itinéraire"
}: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show with animation when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };
  
  // Get alert background color based on type
  const getAlertColor = () => {
    switch (alert.alertType) {
      case 'error':
        return 'bg-[#F44336]';
      case 'warning':
        return 'bg-[#FFC107]';
      case 'info':
        return 'bg-[#2196F3]';
      case 'success':
        return 'bg-[#4CAF50]';
      default:
        return 'bg-[#FFC107]'; // Default to warning
    }
  };
  
  // Get alert icon based on type
  const getAlertIcon = () => {
    switch (alert.alertType) {
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />; // Default to warning
    }
  };
  
  return (
    <div 
      className={cn(
        "fixed top-16 md:top-4 right-4 z-30 max-w-sm w-full bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out",
        isVisible ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className={cn(
        "p-4 text-white flex items-center justify-between",
        getAlertColor()
      )}>
        <div className="flex items-center">
          {getAlertIcon()}
          <span className="font-medium ml-2">{alert.type}</span>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </Button>
      </div>
      <div className="p-4">
        <p className="font-medium text-neutral-900 mb-1">{alert.title}</p>
        <p className="text-neutral-600 text-sm">{alert.description}</p>
        
        <div className="flex justify-between items-center mt-3">
          {onAction && (
            <div>
              <Button 
                variant="link" 
                className="text-primary font-medium text-sm p-0"
                onClick={onAction}
              >
                {actionText}
              </Button>
            </div>
          )}
          <div className="text-sm text-neutral-500">
            Il y a quelques instants
          </div>
        </div>
      </div>
    </div>
  );
}
