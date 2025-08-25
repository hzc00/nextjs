import { CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotItemFoundProps = {
  onClick: () => void;
};

const NoItemsFound = ({ onClick }: NotItemFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CircleOff className="text-primary mb-2" />
      <h3 className="text-2xl font-semibold">No Items Found</h3>
      <p className="text-foreground/60 mt-1 text-sm">Try add new items</p>
      <Button variant="outline" className="mt-4" onClick={() => onClick()}>
        Add new Item
      </Button>
    </div>
  );
};

export { NoItemsFound };
