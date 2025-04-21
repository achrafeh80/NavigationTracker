import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  showHandle?: boolean;
  className?: string;
}

export default function BottomSheet({ 
  children, 
  isOpen, 
  onClose, 
  initialHeight = 300,
  minHeight = 150,
  maxHeight = window.innerHeight * 0.8,
  showHandle = true,
  className
}: BottomSheetProps) {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(initialHeight);
  
  // Reset height when opened
  useEffect(() => {
    if (isOpen) {
      setHeight(initialHeight);
    }
  }, [isOpen, initialHeight]);
  
  // Touch event handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
      startHeightRef.current = height;
      setIsDragging(true);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.touches[0].clientY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeightRef.current + deltaY)
      );
      
      setHeight(newHeight);
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      
      // If dragged to less than 25% of minHeight, close the sheet
      if (height < minHeight * 0.25 && onClose) {
        onClose();
      }
    };
    
    // Mouse event handlers (for desktop)
    const handleMouseDown = (e: MouseEvent) => {
      startYRef.current = e.clientY;
      startHeightRef.current = height;
      setIsDragging(true);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeightRef.current + deltaY)
      );
      
      setHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      
      // If dragged to less than 25% of minHeight, close the sheet
      if (height < minHeight * 0.25 && onClose) {
        onClose();
      }
    };
    
    const bottomSheet = sheetRef.current;
    if (bottomSheet) {
      const handle = bottomSheet.querySelector('#bottom-sheet-handle');
      
      if (handle) {
        handle.addEventListener('touchstart', handleTouchStart);
        handle.addEventListener('mousedown', handleMouseDown);
      }
    }
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      if (bottomSheet) {
        const handle = bottomSheet.querySelector('#bottom-sheet-handle');
        
        if (handle) {
          handle.removeEventListener('touchstart', handleTouchStart);
          handle.removeEventListener('mousedown', handleMouseDown);
        }
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [height, isOpen, isDragging, minHeight, maxHeight, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-20 transform transition-transform duration-300 ease-in-out",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {showHandle && (
        <div 
          id="bottom-sheet-handle" 
          className="w-full flex justify-center py-2 cursor-pointer"
        >
          <div className="w-10 h-1 bg-neutral-300 rounded-full"></div>
        </div>
      )}
      
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
