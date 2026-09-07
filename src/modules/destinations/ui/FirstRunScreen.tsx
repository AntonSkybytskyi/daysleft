import { Button } from "@/modules/ui/Button/Button";
import { EmptyState } from "@/modules/ui/EmptyState/EmptyState";

export type FirstRunScreenProps = {
  onAddClick: () => void;
};

// A screen of its own with no list beside it — a Traveler tracking nothing (AC-10). Its single
// action opens the add picker.
export function FirstRunScreen({ onAddClick }: FirstRunScreenProps) {
  return (
    <div>
      <EmptyState heading="Nothing tracked yet" body="Add a destination to start tracking it." />
      <div className="flex justify-center">
        <Button onClick={onAddClick}>Add a destination</Button>
      </div>
    </div>
  );
}
