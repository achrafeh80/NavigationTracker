import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  onClick: () => void;
}

export default function ActionButton({ onClick }: ActionButtonProps) {
  return (
    <div className="absolute bottom-8 right-8 z-20">
      <Button
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={onClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
