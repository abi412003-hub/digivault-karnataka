import { useEffect, useState } from "react";
import { Save } from "lucide-react";

interface DraftIndicatorProps {
  lastSaved: Date | null;
  onStartFresh?: () => void;
  showStartFresh?: boolean;
}

const DraftIndicator = ({ lastSaved, onStartFresh, showStartFresh }: DraftIndicatorProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [lastSaved]);

  return (
    <div className="flex items-center justify-between min-h-[24px]">
      <div
        className={`flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Save size={12} />
        Draft saved
      </div>
      {showStartFresh && onStartFresh && (
        <button
          onClick={onStartFresh}
          className="text-xs text-primary underline"
        >
          Start fresh
        </button>
      )}
    </div>
  );
};

export default DraftIndicator;
